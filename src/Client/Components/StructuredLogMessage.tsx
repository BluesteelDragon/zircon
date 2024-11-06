import Flipper, { Instant } from "@rbxts/flipper";
import type { LogEvent } from "@rbxts/log";
import { LogLevel } from "@rbxts/log";
import { MessageTemplateParser, PlainTextMessageTemplateRenderer } from "@rbxts/message-templates";
import Roact from "@rbxts/roact";
import { connect } from "@rbxts/roact-rodux";

import type { ConsoleReducer } from "Client/BuiltInConsole/Store/_reducers/console-reducer";
import { formatRichText } from "Client/Format";
import { ZirconStructuredMessageTemplateRenderer } from "Client/Format/ZirconStructuredMessageTemplate";
import { ZirconContext } from "Client/Types";
import ThemeContext, { getRichTextColor3, italicize } from "Client/UIKit/ThemeContext";

import Padding from "./Padding";

function sanitize(input: string): string {
	return input.gsub("[<>]", {
		"<": "&lt;",
		">": "&gt;",
	})[0];
}

export interface StructuredLogMessageProps extends MappedProps {
	readonly Context: ZirconContext;
	readonly DetailedView?: boolean;
	readonly LogEvent: LogEvent;
}
export interface StructuredLogMessageState {
	minHeight: number;
	viewDetails: boolean;
}

const keys = new Set<keyof LogEvent>(["Level", "Template", "Timestamp"]);

export function getNonEventProps(logEvent: LogEvent): Array<[string, unknown]> {
	const props = new Array<[string, unknown]>();
	for (const [key, value] of pairs(logEvent)) {
		if (!keys.has(key)) {
			props.push([key as string, value]);
		}
	}

	return props;
}

class StructuredLogMessageComponent extends Roact.Component<
	StructuredLogMessageProps,
	StructuredLogMessageState
> {
	private readonly height: Roact.Binding<number>;
	private readonly heightMotor: Flipper.SingleMotor;
	private readonly setHeight: Roact.BindingFunction<number>;

	constructor(props: StructuredLogMessageProps) {
		super(props);
		this.state = {
			minHeight: 25,
			viewDetails: false,
		};

		[this.height, this.setHeight] = Roact.createBinding(this.state.minHeight);
		this.heightMotor = new Flipper.SingleMotor(this.height.getValue());
		this.heightMotor.onStep(value => {
			this.setHeight(value);
		});
	}

	public didMount(): void {
		const logEvent = this.props.LogEvent;
		const tokens = MessageTemplateParser.GetTokens(logEvent.Template);
		const plainText = new PlainTextMessageTemplateRenderer(tokens);
		const result = plainText.Render(logEvent);

		this.setState({ minHeight: result.split("\n").size() * 25 });
	}

	public didUpdate(_: object, previousState: StructuredLogMessageState): void {
		if (previousState.minHeight !== this.state.minHeight) {
			this.heightMotor.setGoal(new Instant(this.state.minHeight));
		}
	}

	public willUnmount(): void {
		this.heightMotor.destroy();
	}

	// eslint-disable-next-line max-lines-per-function -- a 30
	public render(): Roact.Element {
		const { Context, logDetailsPaneEnabled, LogEvent, showTagsInOutput } = this.props;
		const { Level, SourceContext, Template } = LogEvent;
		const messages = new Array<string>();

		const tokens = MessageTemplateParser.GetTokens(sanitize(Template));
		const eventProps = getNonEventProps(LogEvent);

		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a 31
				render={theme => {
					const highlightRenderer = new ZirconStructuredMessageTemplateRenderer(
						tokens,
						theme,
					);
					const text = highlightRenderer
						.Render(LogEvent)
						.split("\n")
						.map((line, index) => (index > 0 ? `${" ".rep(6)}${line}` : line))
						.join("\n");

					switch (Level) {
						case LogLevel.Information: {
							messages.push(
								getRichTextColor3(theme, "Cyan", "INFO "),
								getRichTextColor3(theme, "White", text),
							);
							break;
						}
						case LogLevel.Debugging: {
							messages.push(
								getRichTextColor3(theme, "Green", "DEBUG"),
								getRichTextColor3(theme, "White", text),
							);
							break;
						}
						case LogLevel.Verbose: {
							messages.push(
								getRichTextColor3(theme, "Grey", "VERBOSE"),
								getRichTextColor3(theme, "White", text),
							);
							break;
						}
						case LogLevel.Warning: {
							messages.push(
								getRichTextColor3(theme, "Yellow", "WARN "),
								getRichTextColor3(theme, "White", text),
							);
							break;
						}
						case LogLevel.Error: {
							messages.push(
								getRichTextColor3(theme, "Red", "ERROR "),
								getRichTextColor3(theme, "Yellow", text),
							);
							break;
						}
						case LogLevel.Fatal: {
							messages.push(
								getRichTextColor3(theme, "Red", "FATAL "),
								getRichTextColor3(theme, "Red", text),
							);
							break;
						}
					}

					if (SourceContext !== undefined && showTagsInOutput) {
						messages.push(
							"- " +
								italicize(
									getRichTextColor3(theme, "Grey", tostring(SourceContext)),
								),
						);
					}

					return (
						<imagebutton
							AutoButtonColor={logDetailsPaneEnabled}
							Size={this.height.map(value => new UDim2(1, 0, 0, value))}
							BackgroundTransparency={0.5}
							BackgroundColor3={theme.SecondaryBackgroundColor3}
							BorderSizePixel={0}
							Event={{
								MouseButton1Click: () => {
									if (!logDetailsPaneEnabled) {
										return;
									}

									if (this.state.viewDetails) {
										this.heightMotor.setGoal(
											new Flipper.Spring(this.state.minHeight),
										);
									} else {
										this.heightMotor.setGoal(
											new Flipper.Spring(
												this.state.minHeight + eventProps.size() * 30 + 5,
											),
										);
									}

									this.setState({ viewDetails: !this.state.viewDetails });
								},
							}}
						>
							<frame
								Size={new UDim2(0, 5, 1, 0)}
								BackgroundColor3={
									Context === ZirconContext.Server
										? theme.ServerContextColor
										: theme.ClientContextColor
								}
								BorderSizePixel={0}
							/>
							<textlabel
								RichText
								Position={new UDim2(0, 10, 0, 0)}
								Size={new UDim2(1, -15, 0, this.state.minHeight)}
								Text={messages.join(" ")}
								BackgroundTransparency={1}
								Font={theme.ConsoleFont}
								TextColor3={theme.PrimaryTextColor3}
								TextXAlignment="Left"
								TextSize={20}
							/>
							<frame
								Position={new UDim2(0, 30, 0, this.state.minHeight)}
								ClipsDescendants
								BorderSizePixel={0}
								BackgroundTransparency={1}
								Size={this.height.map(value => new UDim2(1, -35, 0, value - 25))}
							>
								<uilistlayout Padding={new UDim(0, 5)} />
								{logDetailsPaneEnabled &&
									this.state.viewDetails &&
									// eslint-disable-next-line max-lines-per-function -- a 32
									eventProps.map(([key, value]) => {
										return (
											<frame
												BackgroundTransparency={1}
												Size={new UDim2(1, 0, 0, 25)}
												BorderSizePixel={0}
											>
												<Padding Padding={{ Horizontal: 5 }} />
												<uilistlayout
													FillDirection="Horizontal"
													Padding={new UDim(0, 10)}
												/>
												<textlabel
													Text={key}
													Font={theme.ConsoleFont}
													TextSize={16}
													BackgroundTransparency={1}
													Size={new UDim2(0.25, 0, 1, 0)}
													TextColor3={theme.PrimaryTextColor3}
													TextXAlignment="Left"
												/>
												<textlabel
													Text={formatRichText(value, undefined, theme)}
													Font={theme.ConsoleFont}
													TextSize={16}
													RichText
													BackgroundTransparency={1}
													Size={new UDim2(0.75, 0, 1, 0)}
													TextColor3={theme.PrimaryTextColor3}
													TextXAlignment="Left"
												/>
											</frame>
										);
									})}
							</frame>
						</imagebutton>
					);
				}}
			/>
		);
	}
}

export interface MappedProps {
	readonly logDetailsPaneEnabled: boolean;
	readonly showTagsInOutput: boolean;
}

function mapStateToProps(props: ConsoleReducer): MappedProps {
	return {
		logDetailsPaneEnabled: props.logDetailsPaneEnabled,
		showTagsInOutput: props.showTagsInOutput,
	};
}

export const StructuredLogMessage = connect(mapStateToProps)(StructuredLogMessageComponent);

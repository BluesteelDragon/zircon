/* eslint-disable max-lines -- we'll work it out */
import { ZrRichTextHighlighter } from "@cwyvern/zirconium/out/ast";
import Roact from "@rbxts/roact";
import { LocalizationService } from "@rbxts/services";

import { formatParse, formatTokens } from "Client/Format";

import type {
	ConsoleMessage,
	ZirconLogError,
	ZirconLogMessage,
	ZirconStructuredLogMessage,
	ZrErrorMessage,
	ZrOutputMessage,
} from "../../Client/Types";
import { ZirconContext, ZirconLogLevel, ZirconMessageType } from "../../Client/Types";
import type { ZirconThemeDefinition } from "../../Client/UIKit/ThemeContext";
import ThemeContext, {
	getRichTextColor3,
	getThemeRichTextColor,
	italicize,
} from "../../Client/UIKit/ThemeContext";
import type { ZirconDebugInformation } from "../../Shared/remotes";
import { ZirconNetworkMessageType } from "../../Shared/remotes";
import { StructuredLogMessage } from "./StructuredLogMessage";

interface OutputMessageProps {
	Message: ZirconLogMessage | ZirconStructuredLogMessage | ZrOutputMessage;
	ShowTags?: boolean;
}
// eslint-disable-next-line max-lines-per-function -- a 50
function OutputMessage(props: OutputMessageProps): Roact.Element {
	const output = props.Message;

	if (output.type === ZirconMessageType.StructuredLog) {
		return (
			<StructuredLogMessage LogEvent={output.data} Context={output.context} DetailedView />
		);
	}

	return (
		<ThemeContext.Consumer
			// eslint-disable-next-line max-lines-per-function -- a 51
			render={theme => {
				const messages = new Array<string>();

				if (output.type === ZirconMessageType.ZirconiumOutput) {
					const { message } = output;
					messages.push(
						getRichTextColor3(
							theme,
							"Grey",
							`[${DateTime.fromUnixTimestamp(message.time).FormatLocalTime(
								"LT",
								LocalizationService.SystemLocaleId,
							)}]`,
						),
						message.message,
					);
				} else if (output.type === ZirconMessageType.ZirconLogOutputMessage) {
					const { message } = output;
					messages.push(
						getRichTextColor3(
							theme,
							"Grey",
							`[${DateTime.fromUnixTimestamp(message.time).FormatLocalTime(
								"LT",
								LocalizationService.SystemLocaleId,
							)}]`,
						),
					);

					const text =
						(message.data.Variables.size() ?? 0) > 0
							? formatTokens(formatParse(message.message), message.data.Variables)
							: message.message;

					switch (message.level) {
						case ZirconLogLevel.Info: {
							messages.push(
								getRichTextColor3(theme, "Cyan", "INFO "),
								getRichTextColor3(theme, "White", text),
							);
							break;
						}
						case ZirconLogLevel.Debug: {
							messages.push(
								getRichTextColor3(theme, "Green", "DEBUG"),
								getRichTextColor3(theme, "White", text),
							);
							break;
						}
						case ZirconLogLevel.Warning: {
							messages.push(
								getRichTextColor3(theme, "Yellow", "WARN "),
								getRichTextColor3(theme, "White", text),
							);
							break;
						}
						// No default
					}

					if (props.ShowTags && message.tag) {
						// const toAppend = padEnd(message.tag ?? "", 20, " ");
						messages.push(
							"- " + italicize(getRichTextColor3(theme, "Grey", message.tag)),
						);
					}
				}

				return (
					<frame
						Size={new UDim2(1, 0, 0, 25)}
						BackgroundTransparency={0.5}
						BackgroundColor3={theme.PrimaryBackgroundColor3}
						BorderSizePixel={0}
					>
						<frame
							Size={new UDim2(0, 5, 1, 0)}
							BackgroundColor3={
								props.Message.context === ZirconContext.Server
									? theme.ServerContextColor
									: theme.ClientContextColor
							}
							BorderSizePixel={0}
						/>
						<textlabel
							RichText
							Position={new UDim2(0, 10, 0, 0)}
							Size={new UDim2(1, -15, 0, 25)}
							Text={messages.join(" ")}
							BackgroundTransparency={1}
							Font={theme.ConsoleFont}
							TextColor3={theme.PrimaryTextColor3}
							TextXAlignment="Left"
							TextSize={20}
						/>
					</frame>
				);
			}}
		/>
	);
}

// eslint-disable-next-line max-lines-per-function -- a 52
function OutputError(props: {
	Message: ZirconLogError | ZrErrorMessage;
	ShowTags: boolean;
}): Roact.Element {
	const output = props.Message;

	return (
		<ThemeContext.Consumer
			// eslint-disable-next-line max-lines-per-function -- a 53
			render={theme => {
				const messages = new Array<string>();

				if (output.type === ZirconMessageType.ZirconiumError) {
					const { error: zrError } = output;
					messages.push(
						getRichTextColor3(
							theme,
							"Grey",
							`[${DateTime.fromUnixTimestamp(zrError.time).FormatLocalTime(
								"LT",
								LocalizationService.SystemLocaleId,
							)}]`,
						),
					);

					if (zrError.script !== undefined) {
						let inner = getRichTextColor3(theme, "Cyan", zrError.script);
						if (zrError.source !== undefined) {
							inner += `:${getRichTextColor3(
								theme,
								"Yellow",
								tostring(zrError.source[0]),
							)}:${getRichTextColor3(theme, "Yellow", tostring(zrError.source[1]))}`;
						}

						messages.push(getRichTextColor3(theme, "White", inner + " -"));
					}

					messages.push(
						getRichTextColor3(theme, "Red", "error"),
						getRichTextColor3(theme, "Grey", `ZR${"%.4d".format(zrError.code)}:`),
						getRichTextColor3(theme, "White", zrError.message),
					);
				} else if (output.type === ZirconMessageType.ZirconLogErrorMessage) {
					const { error: zrError } = output;
					messages.push(
						getRichTextColor3(
							theme,
							"Grey",
							`[${DateTime.fromUnixTimestamp(zrError.time).FormatLocalTime(
								"LT",
								LocalizationService.SystemLocaleId,
							)}]`,
						),
					);

					if (zrError.level === ZirconLogLevel.Error) {
						messages.push(
							getRichTextColor3(theme, "Red", "ERROR"),
							getRichTextColor3(theme, "Yellow", zrError.message),
						);
					} else if (zrError.level === ZirconLogLevel.Wtf) {
						messages.push(
							getRichTextColor3(theme, "Red", "FAIL "),
							getRichTextColor3(theme, "Yellow", zrError.message),
						);
					}

					if (props.ShowTags && zrError.tag) {
						// const toAppend = padEnd(zrError.tag ?? "", 20, " ");
						messages.push(
							"- " + italicize(getRichTextColor3(theme, "Grey", zrError.tag)),
						);
					}
				}

				return (
					<frame
						Size={new UDim2(1, 0, 0, 25)}
						BackgroundTransparency={0.5}
						BackgroundColor3={theme.PrimaryBackgroundColor3}
						BorderSizePixel={0}
					>
						<frame
							Size={new UDim2(0, 5, 1, 0)}
							BackgroundColor3={
								props.Message.context === ZirconContext.Server
									? theme.ServerContextColor
									: theme.ClientContextColor
							}
							BorderSizePixel={0}
						/>
						<textlabel
							RichText
							Position={new UDim2(0, 10, 0, 0)}
							Size={new UDim2(1, -15, 0, 25)}
							Text={messages.join(" ")}
							BackgroundTransparency={1}
							Font={theme.ConsoleFont}
							TextColor3={theme.PrimaryTextColor3}
							TextXAlignment="Left"
							TextSize={20}
						/>
					</frame>
				);
			}}
		/>
	);
}

// eslint-disable-next-line max-lines-per-function -- a 54
function ErrorLine({
	Highlight = true,
	TokenInfo,
}: {
	Highlight?: boolean;
	TokenInfo: ZirconDebugInformation;
}): Roact.Element {
	return (
		<ThemeContext.Consumer
			// eslint-disable-next-line max-lines-per-function -- a 55
			render={theme => {
				return (
					<frame
						Size={new UDim2(1, 0, 0, 30)}
						Position={new UDim2(0.1, 0, 0, 0)}
						BackgroundTransparency={1}
					>
						<textlabel
							Text={tostring(TokenInfo.LineAndColumn[0])}
							TextColor3={theme.PrimaryBackgroundColor3}
							BackgroundColor3={theme.PrimaryTextColor3}
							Size={new UDim2(0, 20, 1, 0)}
							Position={new UDim2(0, 20, 0, 0)}
							Font={theme.ConsoleFont}
							TextSize={20}
							TextXAlignment="Center"
						/>
						<textlabel
							RichText
							BackgroundTransparency={1}
							Size={new UDim2(1, 0, 0, 30)}
							Position={new UDim2(0, 20 + 25, 0, 0)}
							Text={
								Highlight
									? new ZrRichTextHighlighter(TokenInfo.Line).parse()
									: TokenInfo.Line
							}
							Font={theme.ConsoleFont}
							TextSize={20}
							TextXAlignment="Left"
							TextColor3={theme.PrimaryTextColor3}
						/>
						<textlabel
							BackgroundTransparency={1}
							TextXAlignment="Left"
							RichText
							Font={theme.ConsoleFont}
							TextSize={20}
							TextColor3={theme.PrimaryTextColor3}
							Text={getErrorLine(theme, TokenInfo).ErrorLine}
							Size={new UDim2(1, 0, 0, 30)}
							Position={new UDim2(0, 20 + 25, 0, 0)}
						/>
					</frame>
				);
			}}
		/>
	);
}

function getErrorLine(
	theme: ZirconThemeDefinition,
	{ Line, TokenLinePosition }: ZirconDebugInformation,
): { ErrorLine: string } {
	const red = getThemeRichTextColor(theme, "Red");
	let resultingString = "";
	let errorArrows = "";
	for (let index = 1; index <= Line.size(); index++) {
		/** Line.sub(i, i);. */
		const char = " ";
		if (index === TokenLinePosition[0] && index === TokenLinePosition[1]) {
			resultingString += '<font color="' + red + '"><u>' + char + "</u></font>";
			errorArrows += '<font color="' + red + '"><u>^</u></font>';
		} else if (index === TokenLinePosition[0]) {
			resultingString += '<font color="' + red + '"><u>' + char;
			errorArrows += '<font color="' + red + '"><u>^';
		} else if (index > TokenLinePosition[0] && index < TokenLinePosition[1]) {
			resultingString += " ";
			errorArrows += "^";
		} else if (index === TokenLinePosition[1]) {
			resultingString += char + "</u></font>";
			errorArrows += char + "^</u></font>";
		} else {
			resultingString += char;
		}
	}

	return {
		ErrorLine: resultingString,
	};
}

interface ZirconOutputMessageProps {
	Message: ConsoleMessage;
	ShowTags: boolean;
}
export default class ZirconOutputMessage extends Roact.PureComponent<ZirconOutputMessageProps> {
	public render(): Roact.Element | undefined {
		const { Message, ShowTags } = this.props;

		if (
			Message.type === ZirconMessageType.ZirconiumError ||
			Message.type === ZirconMessageType.ZirconLogErrorMessage
		) {
			const { error: zrError } = Message;

			if (
				(zrError.type === ZirconNetworkMessageType.ZirconiumParserError ||
					zrError.type === ZirconNetworkMessageType.ZirconiumRuntimeError) &&
				zrError.debug !== undefined
			) {
				return (
					<Roact.Fragment>
						<OutputError ShowTags={ShowTags} Message={Message} />
						<ErrorLine Highlight TokenInfo={zrError.debug} />
					</Roact.Fragment>
				);
			}

			return <OutputError ShowTags={ShowTags} Message={Message} />;
		} else if (
			Message.type === ZirconMessageType.ZirconiumOutput ||
			Message.type === ZirconMessageType.ZirconLogOutputMessage ||
			Message.type === ZirconMessageType.StructuredLog
		) {
			return <OutputMessage ShowTags={ShowTags} Message={Message} />;
		}
	}
}

import { ZrRichTextHighlighter } from "@cwyvern/zirconium/out/ast";
import Roact from "@rbxts/roact";
import { connect } from "@rbxts/roact-rodux";
import StringUtils from "@rbxts/string-utils";

import { last } from "Shared/Collections";

import type { ConsoleMessage, ConsolePlainMessage, ConsoleSyntaxMessage } from "../../Client/Types";
import {
	getLogLevel,
	getMessageText,
	isContextMessage,
	ZirconMessageType,
} from "../../Client/Types";
import ThemeContext from "../../Client/UIKit/ThemeContext";
import type { ConsoleReducer } from "../BuiltInConsole/Store/_reducers/console-reducer";
import ZirconIcon from "./Icon";
import ZirconOutputMessage from "./OutputMessage";
import ScrollView from "./ScrollView";

// eslint-disable-next-line max-lines-per-function -- a 57
function OutputPlain(props: {
	Message: ConsolePlainMessage | ConsoleSyntaxMessage;
}): Roact.Element {
	const message = props.Message;
	if (message.type === ZirconMessageType.ZirconiumExecutionMessage) {
		return (
			<ThemeContext.Consumer
				render={theme => {
					return (
						<frame Size={new UDim2(1, 0, 0, 25)} BackgroundTransparency={1}>
							<ZirconIcon Icon="RightArrow" Position={new UDim2(0, -3, 0, 6)} />
							<textlabel
								RichText
								Position={new UDim2(0, 20, 0, 0)}
								Size={new UDim2(1, -20, 1, 0)}
								Text={new ZrRichTextHighlighter(message.source).parse()}
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

	return (
		<ThemeContext.Consumer
			render={theme => {
				return (
					<textlabel
						RichText
						Size={new UDim2(1, 0, 0, 25)}
						Text={message.message}
						BackgroundTransparency={1}
						Font={theme.ConsoleFont}
						TextColor3={theme.PrimaryTextColor3}
						TextXAlignment="Left"
						TextSize={20}
					/>
				);
			}}
		/>
	);
}

interface OutputProps extends MappedProps {}
interface OutputState {
	output: Array<ConsoleMessage>;
}
class OutputComponent extends Roact.Component<OutputProps, OutputState> {
	constructor(props: OutputProps) {
		super(props);
		this.state = {
			output: props.output,
		};
	}

	public didUpdate(previousProps: OutputProps): void {
		if (previousProps.output !== this.props.output) {
			this.setState({ output: this.props.output });
		}
	}

	// eslint-disable-next-line max-lines-per-function -- a 58
	public render(): Roact.Element {
		return (
			<ThemeContext.Consumer
				render={() => {
					return (
						<ScrollView
							AutoScrollToEnd
							Padding={{ PaddingHorizontal: 5, PaddingVertical: 5 }}
							ItemPadding={new UDim(0, 5)}
						>
							{this.state.output.map(output => {
								if (
									output.type === ZirconMessageType.ZirconiumError ||
									output.type === "luau:error" ||
									output.type === ZirconMessageType.ZirconLogErrorMessage ||
									output.type === ZirconMessageType.ZirconLogOutputMessage ||
									output.type === ZirconMessageType.ZirconiumOutput ||
									output.type === ZirconMessageType.StructuredLog
								) {
									return (
										<ZirconOutputMessage
											ShowTags={this.props.showTags}
											Message={output}
										/>
									);
								}

								return <OutputPlain Message={output} />;
							})}
						</ScrollView>
					);
				}}
			/>
		);
	}
}

interface MappedProps {
	readonly output: Array<ConsoleMessage>;
	readonly showTags: boolean;
}
function mapStateToProps(state: ConsoleReducer): MappedProps {
	const { filter } = state;

	let { output } = state;

	if (filter) {
		if (filter.Context !== undefined) {
			output = output.filter(
				message => isContextMessage(message) && message.context === filter.Context,
			);
		}

		if (typeIs(filter.SearchQuery, "string")) {
			const { SearchQuery } = filter;
			output = output.filter(message =>
				StringUtils.includes(getMessageText(message), SearchQuery),
			);
		}

		output = output.filter(message => filter.Levels.has(getLogLevel(message)));
	}

	return {
		output: filter.Tail ? last(output, 25) : last(output, 100),
		showTags: state.showTagsInOutput,
	};
}

/** A docked console. */
const ZirconOutput = connect(mapStateToProps)(OutputComponent);
export default ZirconOutput;

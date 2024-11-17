import { ZrRichTextHighlighter } from "@cwyvern/zirconium/out/ast";
import Maid from "@rbxts/maid";
import Roact from "@rbxts/roact";
import { UserInputService } from "@rbxts/services";

import type { ThemeSyntaxColors } from "../../Client/UIKit/ThemeContext";
import ThemeContext, { convertColorObjectToHex } from "../../Client/UIKit/ThemeContext";
import ZirconIcon from "./Icon";

export const enum HistoryTraversalDirection {
	Back = -1,
	Forward = 1,
}

interface SyntaxTextBoxState {
	cursorPosition: number;
	focused?: boolean;
	source: string;
	virtualCursorPosition: number;
}
interface SyntaxTextBoxProps {
	/** Whether or not to auto focus this text box. */
	AutoFocus?: boolean;

	CancelKeyCodes?: Array<Enum.KeyCode>;

	/** Whether or not this textbox is focused. */
	Focused?: boolean;

	/** Whether or not this textbox is multi lined. */
	MultiLine?: boolean;

	OnCancel?: () => void;

	OnControlKey?: (keyCode: Enum.KeyCode, io: InputObject) => void;

	/** When this text box is submitted (if not `MultiLine`). */
	OnEnterSubmit?: (input: string) => void;

	OnHistoryTraversal?: (direction: HistoryTraversalDirection) => void;

	/** The placeholder text. */
	PlaceholderText?: string;

	/** The position of this textbox. */
	Position?: UDim2;

	/** Whether or not to refocus this text box on submit. */
	RefocusOnSubmit?: boolean;

	/** The size of this textbox. */
	Size?: UDim2;

	/** The source string. */
	Source: string;
}

/** A basic syntax text box. */
export default class ZirconSyntaxTextBox extends Roact.Component<
	SyntaxTextBoxProps,
	SyntaxTextBoxState
> {
	private readonly focusMaid = new Maid();
	private readonly maid = new Maid();
	private readonly ref = Roact.createRef<TextBox>();

	constructor(props: SyntaxTextBoxProps) {
		super(props);
		this.state = {
			cursorPosition: 0,
			source: props.Source,
			virtualCursorPosition: 0,
		};
	}

	public didMount(): void {
		const textBox = this.ref.getValue();
		if (textBox) {
			this.maid.GiveTask(
				UserInputService.InputEnded.Connect(io => {
					if (this.state.focused) {
						if (io.KeyCode === Enum.KeyCode.Up) {
							this.props.OnHistoryTraversal?.(HistoryTraversalDirection.Back);
						} else if (io.KeyCode === Enum.KeyCode.Down) {
							this.props.OnHistoryTraversal?.(HistoryTraversalDirection.Forward);
						}
					}
				}),
			);
		}
	}

	public willUnmount(): void {
		this.maid.DoCleaning();
		this.focusMaid.DoCleaning();
	}

	public didUpdate(previousProps: SyntaxTextBoxProps): void {
		const textBox = this.ref.getValue();
		if (previousProps.Focused !== this.props.Focused && this.props.AutoFocus && textBox) {
			if (this.props.Focused) {
				textBox.CaptureFocus();
			} else {
				textBox.ReleaseFocus();
			}
		}

		if (this.props.Source !== previousProps.Source) {
			this.setState({ source: this.props.Source });
			task.defer(() => {
				this.setState({ cursorPosition: this.props.Source.size() + 1 });
			});
		}
	}

	// eslint-disable-next-line max-lines-per-function -- a 23
	public render(): Roact.Element {
		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a 24
				render={theme => {
					const highlighter = new ZrRichTextHighlighter(
						this.state.source,
						theme.SyntaxHighlighter
							? convertColorObjectToHex<ThemeSyntaxColors>(theme.SyntaxHighlighter)
							: undefined,
					);
					return (
						<frame
							Size={this.props.Size ?? new UDim2(1, 0, 1, 0)}
							Position={this.props.Position}
							BackgroundColor3={theme.SecondaryBackgroundColor3}
							BorderSizePixel={0}
						>
							<uipadding
								PaddingLeft={new UDim(0, 5)}
								PaddingRight={new UDim(0, 5)}
								PaddingBottom={new UDim(0, 5)}
								PaddingTop={new UDim(0, 5)}
							/>
							<textbox
								Ref={this.ref}
								BackgroundTransparency={1}
								Font="Code"
								TextSize={18}
								TextXAlignment="Left"
								TextYAlignment="Top"
								ClearTextOnFocus
								PlaceholderColor3={theme.SecondaryTextColor3}
								PlaceholderText={this.props.PlaceholderText}
								CursorPosition={this.state.cursorPosition}
								MultiLine={this.props.MultiLine}
								Size={new UDim2(1, 0, 1, 0)}
								Text={this.state.source}
								Change={{
									CursorPosition: rbx => {
										this.setState({
											virtualCursorPosition: rbx.CursorPosition,
										});
									},
									Text: rbx => {
										this.setState({ source: rbx.Text.gsub("\t", " ")[0] });
									},
								}}
								TextTransparency={0.75}
								Event={{
									Focused: rbx => {
										this.setState({ focused: true, source: "" });

										this.focusMaid.GiveTask(
											UserInputService.InputBegan.Connect(io => {
												if (
													io.UserInputState ===
														Enum.UserInputState.Begin &&
													io.UserInputType === Enum.UserInputType.Keyboard
												) {
													if (
														this.props.CancelKeyCodes?.includes(
															io.KeyCode,
														)
													) {
														this.props.OnCancel?.();
														rbx.ReleaseFocus();
														rbx.Text = "";
													} else if (
														io.IsModifierKeyDown(Enum.ModifierKey.Ctrl)
													) {
														this.props.OnControlKey?.(io.KeyCode, io);
													}
												}
											}),
										);
									},
									FocusLost: (textBox, enterPressed) => {
										if (enterPressed && !this.props.MultiLine) {
											this.props.OnEnterSubmit?.(textBox.Text);
										}

										this.setState({ focused: false });

										if (enterPressed && this.props.RefocusOnSubmit) {
											// Needs to be deferred, otherwise roblox keeps the enter key there.
											task.defer(() => {
												textBox.CaptureFocus();
											});
										}

										this.focusMaid.DoCleaning();
									},
									InputChanged: (rbx, io) => {
										if (
											io.UserInputType === Enum.UserInputType.Keyboard &&
											this.props.CancelKeyCodes?.includes(io.KeyCode)
										) {
											rbx.ReleaseFocus();
										}
									},
								}}
								TextColor3={theme.PrimaryTextColor3}
							/>
							<textlabel
								TextXAlignment="Left"
								TextYAlignment="Top"
								Font="Code"
								Size={new UDim2(1, 0, 1, 0)}
								TextSize={18}
								RichText
								BackgroundTransparency={1}
								Text={highlighter.parse()}
								TextColor3={Color3.fromRGB(198, 204, 215)}
							/>
							{this.state.source !== "" && (
								<textbutton
									BackgroundTransparency={1}
									Text=""
									Size={new UDim2(0, 20, 0, 20)}
									Position={new UDim2(1, -25, 0, 0)}
									Event={{
										MouseButton1Click: () => {
											this.setState({ source: "" });
										},
									}}
								>
									<uilistlayout
										VerticalAlignment="Center"
										HorizontalAlignment="Center"
									/>
									<ZirconIcon Icon="Close" />
								</textbutton>
							)}
						</frame>
					);
				}}
			/>
		);
	}
}

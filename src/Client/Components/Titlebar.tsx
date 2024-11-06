import Maid from "@rbxts/maid";
import Roact from "@rbxts/roact";
import type { SnapProps } from "@rbxts/snapdragon";
import Snapdragon from "@rbxts/snapdragon";

import ThemeContext from "../UIKit/ThemeContext";
import type { IconEnum } from "./Icon";
import ZirconIcon from "./Icon";

export interface ButtonProps {
	Alignment: "left" | "right";
	Color?: Color3;
	HoverColor?: Color3;
	Icon: IconEnum;
	OnClick?: () => void;
	Size?: UDim2;
}

interface TitlebarProps extends SnapProps {
	Buttons?: Array<ButtonProps>;
	DragBegan?: (position: Vector3) => void;
	DragEnded?: (position: Vector3) => void;
	Draggable?: boolean;
	RenderContent?: () => Roact.Element;
	Size?: UDim2;
	Text?: string;
	TextColor?: Color3;
	TextSize?: number;
}

export const TITLEBAR_SIZE = 30;

export default class ZirconTitlebar extends Roact.Component<TitlebarProps> {
	private readonly dragRef = Snapdragon.createRef();
	private readonly frameRef = Roact.createRef<Frame>();
	private readonly maid = new Maid();

	private dragController: Snapdragon.SnapdragonController | undefined;

	constructor(props: TitlebarProps) {
		super(props);
		this.state = {};
	}

	public didMount(): void {
		const frameRef = this.frameRef.getValue();
		const { Draggable } = this.props;
		if (frameRef && Draggable === true) {
			const { SnapEnabled, SnapMargin, SnapThresholdMargin: SnapThreshold } = this.props;
			this.dragRef.Update(frameRef);
			this.dragController = Snapdragon.createDragController(this.dragRef, {
				DragGui: frameRef.Parent! as GuiObject,
				SnapEnabled,
				SnapMargin,
				SnapThreshold,
			});
			this.dragController.Connect();

			this.maid.GiveTask(this.dragController);

			if (this.props.DragBegan !== undefined) {
				this.maid.GiveTask(
					this.dragController.DragEnded.Connect(ended => {
						this.props.DragEnded?.(ended.InputPosition);
					}),
				);
			}

			if (this.props.DragEnded !== undefined) {
				this.maid.GiveTask(
					this.dragController.DragEnded.Connect(ended => {
						this.props.DragEnded?.(ended.InputPosition);
					}),
				);
			}
		}
	}

	public willUnmount(): void {
		this.maid.DoCleaning();
	}

	// eslint-disable-next-line max-lines-per-function -- a 21
	public render(): Roact.Element {
		const { Buttons } = this.props;
		const leftButtons = new Array<Roact.Element>();
		const rightButtons = new Array<Roact.Element>();

		const LeftButtons = (): Roact.Element => {
			if (leftButtons.size() > 0) {
				return (
					<frame
						Size={new UDim2(0.25, 0, 1, 0)}
						Position={new UDim2(0, 0, 0, 0)}
						BackgroundTransparency={1}
					>
						<uilistlayout
							HorizontalAlignment={Enum.HorizontalAlignment.Left}
							FillDirection={Enum.FillDirection.Horizontal}
						/>
						{leftButtons}
					</frame>
				);
			}

			return Roact.createFragment({});
		};

		const RightButtons = (): Roact.Element => {
			if (rightButtons.size() > 0) {
				return (
					<frame
						Size={new UDim2(0.25, 0, 1, 0)}
						Position={new UDim2(0.75, 0, 0, 0)}
						BackgroundTransparency={1}
					>
						<uilistlayout
							HorizontalAlignment={Enum.HorizontalAlignment.Right}
							FillDirection={Enum.FillDirection.Horizontal}
						/>
						{rightButtons}
					</frame>
				);
			}

			return Roact.createFragment({});
		};

		if (Buttons) {
			for (const button of Buttons) {
				const button_ = (
					<textbutton
						Text=""
						BackgroundTransparency={1}
						Size={button.Size ?? new UDim2(0, TITLEBAR_SIZE, 0, TITLEBAR_SIZE)}
						Event={{ MouseButton1Click: button.OnClick }}
					>
						<uilistlayout VerticalAlignment="Center" HorizontalAlignment="Center" />
						<ZirconIcon Icon={button.Icon} />
					</textbutton>
				);

				if (button.Alignment === "right") {
					rightButtons.push(button_);
				} else {
					leftButtons.push(button_);
				}
			}
		}

		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a 22
				render={value => {
					return (
						<frame
							// BackgroundTransparency={1}
							BackgroundColor3={Color3.fromRGB(33, 37, 43)}
							BorderColor3={Color3.fromRGB(33, 37, 43)}
							Size={this.props.Size ?? new UDim2(1, 0, 0, TITLEBAR_SIZE)}
							Ref={this.frameRef}
						>
							<textlabel
								Text={this.props.Text ?? ""}
								BackgroundTransparency={1}
								Font={value.Font}
								Size={
									leftButtons.size() > 0
										? new UDim2(0.5, -10, 1, 0)
										: new UDim2(1, -10, 1, 0)
								}
								TextColor3={this.props.TextColor ?? Color3.fromRGB(220, 220, 220)}
								TextXAlignment={
									leftButtons.size() > 0
										? Enum.TextXAlignment.Center
										: Enum.TextXAlignment.Left
								}
								Position={
									leftButtons.size() > 0
										? new UDim2(0.25, 10, 0, 0)
										: new UDim2(0, 10, 0, 0)
								}
								TextSize={this.props.TextSize ?? 18}
							/>
							<LeftButtons />
							<RightButtons />
						</frame>
					);
				}}
			/>
		);
	}
}

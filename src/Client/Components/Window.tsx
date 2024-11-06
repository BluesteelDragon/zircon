import Maid from "@rbxts/maid";
import Roact from "@rbxts/roact";
import type { SnapMargin } from "@rbxts/snapdragon";
import Snapdragon, { SnapdragonController } from "@rbxts/snapdragon";

import type { ButtonProps } from "./Titlebar";
import ZirconTitlebar, { TITLEBAR_SIZE } from "./Titlebar";

interface WindowProps {
	/** @deprecated Just nest a `ScrollView` in this component. */
	ContentType?: "Fixed" | "Scrollable";

	/** The display order of this window. */
	DisplayOrder?: number;

	/** Event called when the window begins dragging. */
	DragBegan?: (position: Vector3) => void;

	/** Event called when the window finishes dragging. */
	DragEnded?: (position: Vector3) => void;

	/** @deprecated Use `SnapIgnoresOffset`. */
	IgnoreGuiInset?: boolean;

	/** Whether or not this window is draggable. */
	IsDraggable?: boolean;

	/**
	 * Whether or not to wrap this in a ScreenGui.
	 *
	 * Defaults to `true`.
	 */
	NativeWindow?: boolean;

	/** The position of this window. */
	Position?: UDim2;

	/** Event called when the position is changed. */
	PositionChanged?: (position: UDim2) => void;

	/** The size of this window. */
	Size?: UDim2;

	/** Whether or not snapping is enabled for this window. */
	SnapEnabled?: boolean;

	/** If true, the snap will ignore the offset set by GuiService. */
	SnapIgnoresOffset?: boolean;
	/** The margin of the screen the snap adheres to. */
	SnapMargin?: SnapMargin;

	/**
	 * The threshold margin for snapping.
	 *
	 * The bigger it is, the more snappy the snapping gets.
	 *
	 * The value for each axis is added onto the `SnapMargin`.
	 *
	 * So a SnapMargin of {Vertical: 50, Horizontal: 50} plus a
	 * SnapThresholdMargin of {Vertical: 25, Horizontal: 25}, will cause the
	 * snap to occur at {Vertical: 75, Horizontal: 75}.
	 */
	SnapThresholdMargin?: SnapMargin;

	TitlebarButtons?: Array<ButtonProps>;

	TitlebarCloseAction?: () => void;

	/** Whether or not the titlebar is enabled. */
	TitlebarEnabled?: boolean;

	/**
	 * The title text.
	 *
	 * Only shows if `TitlebarEnabled` is true.
	 */
	TitleText?: string;

	/** The background transparency of this window. */
	Transparency?: number;

	// /**
	//  * @experimental
	//  * Save the position of the window
	//  */
	// SavePosition?: boolean;

	/**
	 * The ZIndexBehaviour of this window, only works if `NativeWindow` is true
	 * (which it is by default).
	 */
	ZIndexBehaviour?: Enum.ZIndexBehavior;
}
interface WindowState {}

export default class ZirconWindow extends Roact.Component<WindowProps, WindowState> {
	private readonly dragRef = Snapdragon.createRef();
	private readonly maid = new Maid();
	private readonly windowRef = Roact.createRef<Frame>();
	private dragController: SnapdragonController | undefined;

	// eslint-disable-next-line max-lines-per-function -- a 20
	public didMount(): void {
		const {
			IsDraggable = false,
			SnapEnabled = true,
			SnapMargin,
			SnapThresholdMargin: SnapThreshold,
			TitlebarEnabled = false,
		} = this.props;
		const windowRef = this.windowRef.getValue();
		if (windowRef !== undefined) {
			this.dragRef.Update(windowRef);

			this.dragController = new SnapdragonController(this.dragRef, {
				SnapEnabled,
				SnapMargin,
				SnapThreshold,
			});

			if (!TitlebarEnabled && IsDraggable) {
				this.dragController.Connect();

				if (this.props.DragBegan !== undefined) {
					this.maid.GiveTask(
						this.dragController.DragBegan.Connect((began) => {
							this.props.DragBegan?.(began.InputPosition);
						}),
					);
				}

				if (this.props.DragEnded !== undefined) {
					this.maid.GiveTask(
						this.dragController.DragBegan.Connect((ended) => {
							this.props.DragEnded?.(ended.InputPosition);
						}),
					);
				}
			}

			this.maid.GiveTask(this.dragController);

			this.maid.GiveTask(
				windowRef.GetPropertyChangedSignal("Position").Connect(() => {
					this.props.PositionChanged?.(windowRef.Position);
				}),
			);
		}
	}

	public willUnmount(): void {
		this.maid.DoCleaning();
	}

	// eslint-disable-next-line max-lines-per-function -- a 19
	public render(): Roact.Element {
		const { props } = this;
		const {
			DragBegan,
			DragEnded,
			IsDraggable = false,
			NativeWindow = true,
			SnapEnabled,
			SnapIgnoresOffset,
			SnapMargin,
			SnapThresholdMargin,
			TitlebarButtons = [],
			TitlebarCloseAction,
			TitlebarEnabled = false,
			ZIndexBehaviour = Enum.ZIndexBehavior.Global,
		} = props;

		if (TitlebarCloseAction !== undefined) {
			TitlebarButtons.push({
				Alignment: "right",
				Color: Color3.fromRGB(170, 0, 0),
				Icon: "Close",
				OnClick: TitlebarCloseAction,
			});
		}

		const childComponents = new Array<Roact.Element>();
		const children = this.props[Roact.Children];
		if (children && next(children)[0] !== undefined) {
			const frame = (
				<frame
					Size={new UDim2(1, 0, 1, TitlebarEnabled ? -TITLEBAR_SIZE : 0)}
					Position={new UDim2(0, 0, 0, TitlebarEnabled ? TITLEBAR_SIZE : 0)}
					BackgroundTransparency={1}
				>
					{children}
				</frame>
			);

			childComponents.push(frame);
		}

		if (TitlebarEnabled) {
			childComponents.push(
				<ZirconTitlebar
					SnapThresholdMargin={SnapThresholdMargin}
					SnapEnabled={SnapEnabled}
					SnapIgnoresOffset={SnapIgnoresOffset}
					SnapMargin={SnapMargin}
					Draggable={IsDraggable}
					DragBegan={DragBegan}
					DragEnded={DragEnded}
					Text={props.TitleText}
					Buttons={TitlebarButtons}
				/>,
			);
		}

		const hostFrame = (
			<frame
				Active={true}
				Size={this.props.Size ?? new UDim2(0, 200, 0, 200)}
				Position={this.props.Position}
				// BackgroundTransparency={1}
				BorderColor3={Color3.fromRGB(33, 37, 43)}
				BackgroundColor3={Color3.fromRGB(24, 26, 31)}
				Ref={this.windowRef}
			>
				{childComponents}
			</frame>
		);

		return NativeWindow ? (
			<screengui
				ZIndexBehavior={ZIndexBehaviour}
				DisplayOrder={props.DisplayOrder}
				IgnoreGuiInset={SnapIgnoresOffset}
			>
				{hostFrame}
			</screengui>
		) : (
			hostFrame
		);
	}
}

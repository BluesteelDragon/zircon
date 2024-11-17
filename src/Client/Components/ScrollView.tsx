import Maid from "@rbxts/maid";
import Roact from "@rbxts/roact";

import ThemeContext from "../../Client/UIKit/ThemeContext";
import delayAsync from "../BuiltInConsole/DelayAsync";
import ZirconIcon from "./Icon";
import type { WidgetAxisPadding, WidgetPadding } from "./Padding";
import { CalculatePadding, CalculatePaddingUDim2 } from "./Padding";

interface ScrollViewEvents {
	CanvasPositionChanged?: (position: Vector2, view: ScrollView<never>) => void;
	ContentSizeChanged?: (size: Vector2, view: ScrollView<never>) => void;
}

export type InferEnumNames<T> = T extends { EnumType: Enum; Name: infer A } ? A : never;

interface ScrollViewProps extends ScrollViewEvents {
	AutoScrollToEnd?: boolean;

	/** Percentage scroll for the auto scroll feature. */
	AutoScrollToEndThreshold?: number;

	Bordered?: boolean;

	/**
	 * Enables GridLayout mode.
	 *
	 * Note: Will require a `ItemSize` prop.
	 */
	GridLayout?: boolean;

	Padding?: WidgetPadding;

	Position?: UDim2;

	Size?: UDim2;

	SortOrder?: Enum.SortOrder | Enum.SortOrder["Name"];

	Style?: "Buttons" | "ButtonsOnBar" | "NoButtons";
	ViewRef?: (view: ScrollView<never>) => void;
}

interface GridContent {
	GridLayout: true;
	ItemPadding?: WidgetAxisPadding;
	ItemSize: UDim2;
}

interface ListContent {
	ItemAlignment?: Enum.VerticalAlignment | InferEnumNames<Enum.VerticalAlignment>;
	ItemPadding?: number | UDim;
}

interface ScrollViewState {
	barPos: number;
	barScale: number;
	barShown: boolean;
	loaded: boolean;

	size: Vector2;
}

type ScrollViewInfer<T> = T extends { GridLayout: true }
	? GridContent & ScrollViewProps
	: ListContent & ScrollViewProps;

export type ScrollViewLike = ScrollView<ScrollViewProps>;
export type GridScrollViewProps = GridContent & ScrollViewProps;

export default class ScrollView<T extends ScrollViewProps> extends Roact.Component<
	ScrollViewInfer<T>,
	ScrollViewState
> {
	private readonly maid: Maid;
	/** Weird hack for AutoScrollToEnd with frames that start not scrollable. */
	private initScrollToBottom = false;
	private scrollFrame!: ScrollingFrame;
	private scrollListLayout!: UIGridLayout | UIListLayout;

	// ? AbsoluteContentSize changed handler
	// eslint-disable-next-line max-lines-per-function -- a
	public absoluteContentSizeChanged = (): void => {
		const { AutoScrollToEnd, AutoScrollToEndThreshold = 0.8 } = this.props;

		const padding = CalculatePadding(this.props.Padding ?? {});
		const paddingBottomOffset = padding.PaddingBottom?.Offset ?? 0;
		const paddingTopOffset = padding.PaddingTop?.Offset ?? 0;

		const size = this.scrollListLayout.AbsoluteContentSize.add(
			new Vector2(0, paddingBottomOffset + paddingTopOffset),
		);

		this.setState({
			size,
		});

		const scale = this.scrollFrame.AbsoluteSize.Y / size.Y;

		const canvasPosition = this.scrollFrame.CanvasPosition;
		const canvasSize = this.scrollFrame.AbsoluteSize;
		const canvasAbsoluteSize = this.scrollListLayout.AbsoluteContentSize;

		this.setState({
			barPos: canvasPosition.Y / (size.Y - canvasSize.Y),
			barScale: scale,
			barShown: scale < 1,
		});

		if (this.props.ContentSizeChanged !== undefined) {
			// since AbsoluteContentSize doesn't calculate X?
			const contentSize = new Vector2(canvasSize.X - 20, size.Y);
			this.props.ContentSizeChanged(contentSize, this);
		}

		const calculatedSize =
			canvasAbsoluteSize.Y - this.scrollFrame.AbsoluteWindowSize.Y + paddingBottomOffset;

		if (
			AutoScrollToEnd &&
			(canvasPosition.Y / calculatedSize >= AutoScrollToEndThreshold ||
				this.initScrollToBottom)
		) {
			this.scrollToEnd();
		}
	};

	/** ? CanvasPosition changed handler. */
	public canvasPositionUpdated = (): void => {
		const canvasPosition = this.scrollFrame.CanvasPosition;
		const padding = CalculatePadding(this.props.Padding ?? {});
		const paddingBottomOffset = padding.PaddingBottom?.Offset ?? 0;
		const paddingTopOffset = padding.PaddingTop?.Offset ?? 0;

		const size = this.scrollListLayout.AbsoluteContentSize.add(
			new Vector2(0, paddingBottomOffset + paddingTopOffset),
		);

		this.setState({
			barPos: canvasPosition.Y / (size.Y - this.scrollFrame.AbsoluteSize.Y),
		});
		this.initScrollToBottom = false;

		this.props.CanvasPositionChanged !== undefined &&
			this.props.CanvasPositionChanged(canvasPosition, this);
	};

	public invokeUpdate = (): void => {
		const size = this.scrollListLayout.AbsoluteContentSize;
		if (this.props.ContentSizeChanged !== undefined) {
			const canvasSize = this.scrollFrame.AbsoluteSize;
			// since AbsoluteContentSize doesn't calculate X?
			const contentSize = new Vector2(canvasSize.X - 20, size.Y);
			this.props.ContentSizeChanged(contentSize, this);
		}
	};

	constructor(props: ScrollViewInfer<T>) {
		super(props);
		this.state = {
			barPos: 0,
			barScale: 1,
			barShown: false,
			loaded: false,
			size: new Vector2(),
		};

		this.maid = new Maid();
	}

	public didMount(): void {
		const { AutoScrollToEnd } = this.props;

		if (AutoScrollToEnd) {
			this.initScrollToBottom = true;
		}

		if (this.scrollFrame === undefined) {
			warn("Missing ScrollFrame to ScrollView");
			return;
		}

		if (this.scrollListLayout === undefined) {
			warn("Missing UIListLayout to ScrollView");
			return;
		}

		const size = this.scrollListLayout.AbsoluteContentSize;

		// Have to wait a frame because of ROBLOX's quirkiness.
		delayAsync().then(() => {
			this.absoluteContentSizeChanged();
		});

		this.setState({ size });

		if (this.props.ViewRef) {
			this.props.ViewRef(this);
		}
	}

	public willUnmount(): void {
		this.maid.DoCleaning();
	}

	// eslint-disable-next-line max-lines-per-function -- a
	public renderBar(): Roact.Element | undefined {
		if (this.state.barShown) {
			return (
				<ThemeContext.Consumer
					render={theme => {
						const scale = this.state.barScale;
						return (
							<frame
								BorderSizePixel={0}
								BackgroundTransparency={0}
								BackgroundColor3={theme.SecondaryBackgroundColor3}
								Size={new UDim2(1, 0, this.state.barScale, 0)}
								Position={
									new UDim2(
										0,
										0,
										this.state.barPos * (1 - this.state.barScale),
										0,
									)
								}
							>
								{scale >= 0.1 && (
									<ZirconIcon Icon="UpArrow" Position={UDim2.fromOffset(2, 0)} />
								)}
								{scale >= 0.1 && (
									<ZirconIcon
										Icon="DownArrow"
										Position={new UDim2(0, 2, 1, -16)}
									/>
								)}
							</frame>
						);
					}}
				/>
			);
		}

		return undefined;
	}

	public scrollToPositionY(position: number): void {
		this.scrollFrame.CanvasPosition = new Vector2(0, position);
	}

	public scrollToEnd(): void {
		this.scrollFrame.CanvasPosition = new Vector2(0, this.scrollFrame.CanvasSize.Height.Offset);
		this.initScrollToBottom = true;
	}

	public getScrollFrame(): ScrollingFrame {
		return this.scrollFrame;
	}

	// eslint-disable-next-line max-lines-per-function -- a
	public renderContentHandler(): Roact.Element {
		const { ItemPadding } = this.props;

		let computedPadding: UDim | undefined;
		if (typeIs(ItemPadding, "UDim")) {
			computedPadding = ItemPadding;
		} else if (typeIs(ItemPadding, "number")) {
			computedPadding = new UDim(0, ItemPadding);
		}

		if (this.props.GridLayout === true) {
			const { ItemPadding = 0, ItemSize } = this.props as unknown as GridContent;
			return (
				<uigridlayout
					Key="ScrollViewGrid"
					CellSize={ItemSize}
					Change={{ AbsoluteContentSize: this.absoluteContentSizeChanged }}
					CellPadding={CalculatePaddingUDim2(ItemPadding)}
					Ref={ref => (this.scrollListLayout = ref)}
					SortOrder={this.props.SortOrder ?? Enum.SortOrder.LayoutOrder}
				/>
			);
		}

		return (
			<uilistlayout
				Key="ScrollViewList"
				VerticalAlignment={this.props.ItemAlignment}
				Change={{ AbsoluteContentSize: this.absoluteContentSizeChanged }}
				Padding={computedPadding}
				SortOrder={this.props.SortOrder ?? Enum.SortOrder.LayoutOrder}
				Ref={ref => (this.scrollListLayout = ref)}
			/>
		);
	}

	// eslint-disable-next-line max-lines-per-function -- a
	public render(): Roact.Element {
		const { Padding = 0, Style = "NoButtons" } = this.props;
		const padding = CalculatePadding(Padding);
		// Include the scrollbar in the equation
		padding.PaddingRight = (padding.PaddingRight ?? new UDim(0, 0)).add(new UDim(0, 20));

		const useButtons = Style === "Buttons";
		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a
				render={theme => {
					return (
						<frame
							Size={this.props.Size ?? new UDim2(1, 0, 1, 0)}
							BackgroundTransparency={1}
						>
							<scrollingframe
								Ref={frame => (this.scrollFrame = frame)}
								Key="ScrollFrameHost"
								Size={new UDim2(1, 0, 1, 0)}
								Position={this.props.Position}
								BackgroundTransparency={1}
								BorderSizePixel={0}
								CanvasSize={new UDim2(0, this.state.size.X, 0, this.state.size.Y)}
								BottomImage=""
								MidImage=""
								ScrollingDirection="Y"
								TopImage=""
								Change={{
									AbsoluteSize: this.absoluteContentSizeChanged,
									CanvasPosition: this.canvasPositionUpdated,
								}}
								ScrollBarThickness={20}
							>
								{this.renderContentHandler()}
								<uipadding Key="ScrollPadding" {...padding} />
								{this.props[Roact.Children]}
							</scrollingframe>
							<frame
								Key="ScrollFrameBar"
								BackgroundTransparency={1}
								Size={true ? new UDim2(0, 20, 1, 0) : new UDim2(0, 0, 1, 0)}
								Position={new UDim2(1, -20, 0, 0)}
							>
								<frame
									Key="ScrollFrameBarTrackUpButtonContainer"
									Size={new UDim2(0, 20, 0, 20)}
									BackgroundTransparency={1}
								/>
								<frame
									Key="ScrollFrameBarTrack"
									Size={
										useButtons ? new UDim2(1, 0, 1, -40) : new UDim2(1, 0, 1, 0)
									}
									Position={new UDim2(0, 0, 0, useButtons ? 20 : 0)}
									BackgroundTransparency={0}
									BackgroundColor3={theme.PrimaryBackgroundColor3}
									BorderColor3={theme.SecondaryBackgroundColor3}
									BorderSizePixel={1}
								>
									{this.renderBar()}
								</frame>
								<frame
									Key="ScrollFrameBarTrackDnButtonContainer"
									Size={new UDim2(0, 20, 0, 20)}
									Position={new UDim2(0, 0, 1, -20)}
									BackgroundTransparency={1}
								/>
							</frame>
						</frame>
					);
				}}
			/>
		);
	}
}

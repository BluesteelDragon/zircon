import Maid from "@rbxts/maid";
import Roact from "@rbxts/roact";
import { Players } from "@rbxts/services";

import ThemeContext from "Client/UIKit/ThemeContext";

import type { IconEnum } from "./Icon";
import ZirconIcon from "./Icon";
import Padding from "./Padding";
import ScrollView from "./ScrollView";

interface ItemData<T> {
	Icon?: IconEnum;
	Id: T;
	SelectedText?: string;
	Text: string;
	TextColor3?: Color3;
}

interface DropdownProps<T = string> {
	Disabled?: boolean;
	readonly Items: Array<ItemData<T>>;
	ItemSelected?: (item: ItemData<T>) => void;
	Position?: UDim2;
	readonly SelectedItemId?: T;
	readonly SelectedItemIndex?: number;
	Size?: UDim2;
}
interface DropdownState {
	active: boolean;
	selectedItemIndex: number;
}

export default class Dropdown<T = string> extends Roact.Component<DropdownProps<T>, DropdownState> {
	private readonly dropdownRef = Roact.createRef<Frame>();
	private readonly maid = new Maid();

	private readonly portalPosition: Roact.RoactBinding<UDim2>;
	private readonly portalSizeX: Roact.RoactBinding<number>;

	private readonly setPortalPosition: Roact.RoactBindingFunc<UDim2>;
	private readonly setPortalSizeX: Roact.RoactBindingFunc<number>;

	constructor(props: DropdownProps<T>) {
		super(props);
		this.state = {
			active: false,
			selectedItemIndex: props.SelectedItemIndex !== undefined ? props.SelectedItemIndex : 0,
		};

		if (props.SelectedItemId !== undefined) {
			const selectedItemIndex = props.Items.findIndex((f) => f.Id === props.SelectedItemId);
			if (selectedItemIndex !== -1) {
				this.setState({ selectedItemIndex });
			}
		}

		[this.portalPosition, this.setPortalPosition] = Roact.createBinding(new UDim2());
		[this.portalSizeX, this.setPortalSizeX] = Roact.createBinding(0);
	}

	public setPortalPositionRelativeTo(frame: Frame): void {
		const { AbsolutePosition, AbsoluteSize } = frame;
		this.setPortalPosition(
			new UDim2(0, AbsolutePosition.X, 0, AbsolutePosition.Y + AbsoluteSize.Y),
		);
		this.setPortalSizeX(AbsoluteSize.X);
	}

	public didUpdate(previousProps: DropdownProps<T>): void {
		if (previousProps.SelectedItemId === this.props.SelectedItemId) {
			return;
		}

		const selectedItemIndex = this.props.Items.findIndex((f) => f.Id === this.props.SelectedItemId);
		if (selectedItemIndex !== -1) {
			this.setState({ selectedItemIndex });
		}
	}

	public didMount(): void {
		const frame = this.dropdownRef.getValue();
		if (frame) {
			this.maid.GiveTask(
				frame.GetPropertyChangedSignal("AbsoluteSize").Connect(() => {
					this.setPortalPositionRelativeTo(frame);
				}),
			);

			this.maid.GiveTask(
				frame.GetPropertyChangedSignal("AbsolutePosition").Connect(() => {
					this.setPortalPositionRelativeTo(frame);
				}),
			);

			this.setPortalPositionRelativeTo(frame);
		}
	}

	public willUnmount(): void {
		this.maid.DoCleaning();
	}

	// eslint-disable-next-line max-lines-per-function -- a 15
	public renderDropdownItems(): Array<Roact.Element> {
		const { selectedItemIndex } = this.state;
		// eslint-disable-next-line max-lines-per-function -- a 16
		return this.props.Items.map((item, index) => {
			return (
				<ThemeContext.Consumer
					// eslint-disable-next-line max-lines-per-function -- a 17
					render={theme => {
						return (
							<frame
								Size={new UDim2(1, 0, 0, 30)}
								BackgroundColor3={
									selectedItemIndex === index
										? theme.PrimarySelectColor3
										: theme.SecondaryBackgroundColor3
								}
								BorderSizePixel={0}
							>
								<frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
									<Padding Padding={{ Horizontal: 5, Right: 20 }} />
									{item.Icon && (
										<ZirconIcon
											Icon={item.Icon}
											Position={new UDim2(0, 0, 0.5, -8)}
										/>
									)}
									<textbutton
										Font={theme.Font}
										TextXAlignment="Left"
										TextSize={15}
										BackgroundTransparency={1}
										Size={new UDim2(1, 0, 1, 0)}
										Position={item.Icon ? new UDim2(0, 20, 0, 0) : new UDim2()}
										TextColor3={theme.PrimaryTextColor3}
										Text={item.Text}
										Event={{
											MouseButton1Click: () => {
												this.setState({
													active: false,
													selectedItemIndex: index,
												});
												if (this.props.ItemSelected !== undefined) {
													this.props.ItemSelected(item);
												}
											},
										}}
									/>
								</frame>
							</frame>
						);
					}}
				/>
			);
		});
	}

	// eslint-disable-next-line max-lines-per-function -- a 17
	public renderDropdown(): Roact.Element {
		const { active } = this.state;
		if (!active) {
			return <Roact.Fragment />;
		}

		const activeSizeY = math.min(this.props.Items.size() * 30, 30 * 4);

		const portal = (
			<ThemeContext.Consumer
				render={theme => {
					return (
						<frame
							Key="DropdownPortal"
							// BackgroundTransparency={1}
							BackgroundColor3={theme.PrimaryBackgroundColor3}
							BorderColor3={theme.SecondaryBackgroundColor3}
							Position={this.portalPosition}
							Size={this.portalSizeX.map(x => new UDim2(0, x, 0, activeSizeY))}
							Event={{
								MouseLeave: () => {
									this.setState({ active: false });
								},
							}}
						>
							<ScrollView>{this.renderDropdownItems()}</ScrollView>
						</frame>
					);
				}}
			/>
		);

		return (
			<Roact.Portal target={Players.LocalPlayer.FindFirstChildOfClass("PlayerGui")!}>
				<screengui DisplayOrder={10500} Key="HostedDropdownPortal">
					{portal}
				</screengui>
			</Roact.Portal>
		);
	}

	// eslint-disable-next-line max-lines-per-function -- a 18
	public render(): Roact.Element {
		const { Disabled, Items, Position, Size = new UDim2(0, 150, 0, 30) } = this.props;
		const { selectedItemIndex } = this.state;

		const item = Items[selectedItemIndex];
		assert(item, `Invalid Item Index ${selectedItemIndex}`);

		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a 19
				render={theme => {
					return (
						<frame
							BackgroundColor3={theme.SecondaryBackgroundColor3}
							BorderColor3={theme.PrimaryBackgroundColor3}
							Size={Size}
							Position={Position}
							Ref={this.dropdownRef}
						>
							<frame Key="Content" Size={new UDim2(1, -25, 1, 0)} BackgroundTransparency={1}>
								<Padding Padding={{ Horizontal: 10 }} />
								{item.Icon && <ZirconIcon Icon={item.Icon} Position={new UDim2(0, 0, 0.5, -8)} />}
								<textbutton
									Size={new UDim2(1, 0, 1, 0)}
									Position={item.Icon ? new UDim2(0, 20, 0, 0) : new UDim2()}
									BackgroundTransparency={1}
									Font={theme.Font}
									TextSize={15}
									TextXAlignment="Left"
									TextColor3={
										Disabled
											? theme.PrimaryDisabledColor3
											: item.TextColor3
											? item.TextColor3
											: theme.PrimaryTextColor3
									}
									// TextStrokeTransparency={0.5}
									Text={item.SelectedText ?? item.Text}
									Event={{
										MouseButton1Click: () => !Disabled && this.setState({ active: !this.state.active }),
									}}
								/>
							</frame>
							<imagelabel
								Image="rbxassetid://2657038128"
								ImageColor3={
									Disabled ? theme.PrimaryDisabledColor3 : theme.PrimaryTextColor3
								}
								Position={new UDim2(1, -25, 0, 5)}
								BackgroundTransparency={1}
								Rotation={this.state.active ? 0 : 180}
								Size={new UDim2(0, 20, 0, 20)}
							/>
							{this.renderDropdown()}
						</frame>
					);
				}}
			/>
		);
	}
}

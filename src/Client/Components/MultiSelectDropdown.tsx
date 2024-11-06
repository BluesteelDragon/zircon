import Maid from "@rbxts/maid";
import Roact from "@rbxts/roact";
import { Players, UserInputService } from "@rbxts/services";

import ThemeContext from "Client/UIKit/ThemeContext";
import { setsEqual, toArray } from "Shared/Collections";

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
	ItemsSelected?: (item: Set<T>) => void;
	readonly Label: string;
	/** Readonly SelectedItemIndexes?: Set<number>;. */
	readonly SelectedItemIds?: ReadonlySet<T>;
	Size?: UDim2;
}
interface DropdownState<T = string> {
	active: boolean;
	selectedItemIds: ReadonlySet<T>;
	selectedItems: ReadonlySet<ItemData<T>>;
}

export default class MultiSelectDropdown<T = string> extends Roact.Component<
	DropdownProps<T>,
	DropdownState<T>
> {
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
			selectedItemIds: props.SelectedItemIds ?? new Set(),
			selectedItems: new Set(),
		};

		this.updateSelectedIndexes();

		[this.portalPosition, this.setPortalPosition] = Roact.createBinding(new UDim2());
		[this.portalSizeX, this.setPortalSizeX] = Roact.createBinding(0);
	}

	private getItemSet(): Set<ItemData<T>> {
		const {
			props: { Items },
		} = this;
		const { selectedItemIds } = this.state;

		return Items.reduce((accumulator, current) => {
			if (selectedItemIds.has(current.Id)) {
				accumulator.add(current);
			}

			return accumulator;
		}, new Set<ItemData<T>>());
	}

	private updateSelectedIndexes(): void {
		this.setState({ selectedItems: this.getItemSet() });
	}

	public setPortalPositionRelativeTo(frame: Frame): void {
		const { AbsolutePosition, AbsoluteSize } = frame;
		this.setPortalPosition(
			new UDim2(0, AbsolutePosition.X, 0, AbsolutePosition.Y + AbsoluteSize.Y),
		);
		this.setPortalSizeX(AbsoluteSize.X);
	}

	public didUpdate(previousProps: DropdownProps<T>): void {
		if (!setsEqual(previousProps.SelectedItemIds, this.props.SelectedItemIds)) {
			this.setState({
				selectedItemIds: this.props.SelectedItemIds ?? new Set(),
				selectedItems: this.getItemSet(),
			});
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

		// Hack to re-render it
		this.setState({ selectedItems: this.getItemSet() });
	}

	public willUnmount(): void {
		this.maid.DoCleaning();
	}

	// eslint-disable-next-line max-lines-per-function -- a 38
	public renderDropdownItems(): Array<Roact.Element> {
		const { selectedItemIds, selectedItems } = this.state;

		// eslint-disable-next-line max-lines-per-function -- a 39
		return this.props.Items.map(item => {
			return (
				<ThemeContext.Consumer
					// eslint-disable-next-line max-lines-per-function -- a 40
					render={theme => {
						return (
							<frame
								Size={new UDim2(1, 0, 0, 30)}
								BackgroundColor3={
									selectedItemIds.has(item.Id)
										? theme.PrimarySelectColor3
										: theme.SecondaryBackgroundColor3
								}
								BorderSizePixel={1}
								BorderColor3={theme.PrimaryBackgroundColor3}
							>
								<frame Size={new UDim2(1, 0, 1, 0)} BackgroundTransparency={1}>
									<Padding Padding={{ Horizontal: 5, Right: 20 }} />
									{selectedItemIds.has(item.Id) && (
										<ZirconIcon
											Icon="CheckmarkHeavy"
											Position={new UDim2(0, 0, 0.5, -8)}
										/>
									)}
									<textbutton
										Font={theme.Font}
										TextXAlignment="Left"
										TextSize={15}
										BackgroundTransparency={1}
										Size={new UDim2(1, 0, 1, 0)}
										Position={new UDim2(0, 20, 0, 0)}
										TextColor3={theme.PrimaryTextColor3}
										Text={item.Text}
										Event={{
											// eslint-disable-next-line max-lines-per-function -- a 41
											MouseButton1Click: () => {
												const selectedSet = new Set<ItemData<T>>();
												const newSet = new Set<T>();
												for (const existingItem of selectedItems) {
													newSet.add(existingItem.Id);
													selectedSet.add(existingItem);
												}

												if (newSet.has(item.Id)) {
													newSet.delete(item.Id);
													selectedSet.delete(item);
												} else {
													newSet.add(item.Id);
													selectedSet.add(item);
												}

												if (
													UserInputService.IsKeyDown(
														Enum.KeyCode.LeftControl,
													)
												) {
													newSet.clear();
													selectedSet.clear();
													newSet.add(item.Id);
													selectedSet.add(item);
												}

												this.setState({
													selectedItemIds: newSet,
													selectedItems: selectedSet,
												});
												if (this.props.ItemsSelected !== undefined) {
													this.props.ItemsSelected(newSet);
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

	// eslint-disable-next-line max-lines-per-function -- a 43
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
			// eslint-disable-next-line ts/no-non-null-assertion -- Will exist when used.
			<Roact.Portal target={Players.LocalPlayer.FindFirstChildOfClass("PlayerGui")!}>
				<screengui DisplayOrder={10500} Key="HostedDropdownPortal">
					{portal}
				</screengui>
			</Roact.Portal>
		);
	}

	// eslint-disable-next-line max-lines-per-function -- a 44
	public render(): Roact.Element {
		const { Disabled, Items, Label, Size = new UDim2(0, 150, 0, 30) } = this.props;
		const { active, selectedItems } = this.state;

		const values = toArray(selectedItems);

		return (
			<ThemeContext.Consumer
				// eslint-disable-next-line max-lines-per-function -- a 45
				render={theme => {
					return (
						<frame
							BackgroundColor3={theme.SecondaryBackgroundColor3}
							BorderColor3={theme.PrimaryBackgroundColor3}
							Size={Size}
							Ref={this.dropdownRef}
						>
							<frame
								Key="Content"
								Size={new UDim2(1, -25, 1, 0)}
								BackgroundTransparency={1}
							>
								<Padding Padding={{ Horizontal: 10 }} />
								<textbutton
									Size={new UDim2(1, 0, 1, 0)}
									BackgroundTransparency={1}
									Font={theme.Font}
									TextSize={15}
									TextXAlignment="Left"
									TextColor3={
										Disabled
											? theme.PrimaryDisabledColor3
											: theme.PrimaryTextColor3
									}
									// TextStrokeTransparency={0.5}
									Text={Label.format(values.size())}
									Event={{
										MouseButton1Click: () => {
											return (
												!Disabled &&
												this.setState({ active: !this.state.active })
											);
										},
									}}
								/>
							</frame>
							<imagelabel
								Image="rbxassetid://2657038128"
								ImageColor3={
									Disabled
										? theme.PrimaryDisabledColor3
										: Color3.fromRGB(255, 255, 255)
								}
								Position={new UDim2(1, -25, 0, 5)}
								BackgroundTransparency={1}
								Rotation={active ? 0 : 180}
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

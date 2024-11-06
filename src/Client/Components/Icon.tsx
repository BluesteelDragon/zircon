import Roact from "@rbxts/roact";

import ThemeContext from "../../Client/UIKit/ThemeContext";

interface IconDefinition {
	NoOverrideColor?: boolean;
	Offset: Vector2;
	TintColor?: Color3;
}

function icon(x: number, y: number): IconDefinition {
	return identity<IconDefinition>({
		Offset: new Vector2(-16 + 16 * x, -16 + 16 * y),
	});
}

function tintedIcon(x: number, y: number, _defaultTint: Color3): IconDefinition {
	return identity<IconDefinition>({
		Offset: new Vector2(-16 + 16 * x, -16 + 16 * y),
	});
}

const IconsV2 = {
	ActionAdd: identity<IconDefinition>({ Offset: new Vector2(16 * 3, 16 * 2) }),
	ActionContextClient: identity<IconDefinition>({ Offset: new Vector2(16 * 2, 16 * 3) }),
	ActionContextServer: identity<IconDefinition>({ Offset: new Vector2(16 * 3, 16 * 3) }),
	ActionElipsisMenu: identity<IconDefinition>({ Offset: new Vector2(16, 16 * 2) }),
	ActionExecute: identity<IconDefinition>({ Offset: new Vector2(0, 16 * 2) }),
	ActionTrash: identity<IconDefinition>({ Offset: new Vector2(16 * 2, 16 * 2) }),
	Checkmark: identity<IconDefinition>({ Offset: new Vector2(16 * 5, 16 * 2) }),
	CheckmarkHeavy: icon(1, 9),
	Circle: icon(5, 9),
	Close: identity<IconDefinition>({ Offset: new Vector2(16 * 4, 0) }),
	ContextClient: identity<IconDefinition>({ Offset: new Vector2(0, 16 * 3) }),
	ContextServer: identity<IconDefinition>({ Offset: new Vector2(16, 16 * 3) }),
	CrossHeavy: icon(2, 9),
	Diamond: icon(4, 9),
	DownArrow: identity<IconDefinition>({ Offset: new Vector2(0, 0) }),
	DownDoubleArrow: icon(8, 5),
	FloppyDisk: icon(4, 5),
	Folder: icon(3, 5),
	Funnel: icon(8, 3),

	Gear: icon(9, 5),
	Infinity: icon(1, 5),
	LeftArrow: identity<IconDefinition>({ Offset: new Vector2(16 * 3, 0) }),
	LeftDoubleArrow: icon(6, 5),
	ListClear: icon(9, 3),

	MaximizeDown: identity<IconDefinition>({ Offset: new Vector2(16 * 5, 0) }),
	MaximizeUp: identity<IconDefinition>({ Offset: new Vector2(16 * 6, 0) }),
	Minimize: identity<IconDefinition>({ Offset: new Vector2(16 * 7, 0) }),
	OuterSquare: icon(6, 9),
	Paper: icon(1, 6),
	RightArrow: identity<IconDefinition>({ Offset: new Vector2(16 * 2, 0) }),
	RightDoubleArrow: icon(5, 5),
	SplitPanels: identity<IconDefinition>({ Offset: new Vector2(16 * 4, 16 * 2) }),
	Square: icon(3, 9),
	Sun: icon(2, 5),

	TypeClass: tintedIcon(1, 2, Color3.fromRGB(255, 165, 0)),
	TypeFunction: tintedIcon(3, 2, Color3.fromRGB(233, 0, 255)),

	TypeKeyword: tintedIcon(5, 2, Color3.fromRGB(216, 216, 216)),
	TypeMember: tintedIcon(2, 2, Color3.fromRGB(0, 148, 255)),
	TypeProperty: tintedIcon(4, 2, Color3.fromRGB(216, 216, 216)),
	UpArrow: identity<IconDefinition>({ Offset: new Vector2(16, 0) }),
	UpDoubleArrow: icon(7, 5),
	Zirconium: identity<IconDefinition>({ Offset: new Vector2(16 * 8, 0) }),
};

export type IconEnum = keyof typeof IconsV2;

interface IconProps {
	Icon: IconEnum;
	Position?: UDim2;
	Size?: UDim2;
	ZIndex?: number;
}

export default class ZirconIcon extends Roact.PureComponent<IconProps> {
	// eslint-disable-next-line ts/no-useless-constructor -- Roact component.
	constructor(props: IconProps) {
		super(props);
	}

	// eslint-disable-next-line max-lines-per-function -- Component logic
	public render(): Roact.Element {
		const icon = IconsV2[this.props.Icon];

		if (this.props.Size) {
			return (
				<ThemeContext.Consumer
					render={theme => {
						return (
							<imagebutton
								Image=""
								BackgroundTransparency={1}
								BackgroundColor3={theme.PrimaryBackgroundColor3}
								BorderColor3={theme.SecondaryBackgroundColor3}
								Size={this.props.Size}
								ZIndex={this.props.ZIndex}
								Position={this.props.Position}
							>
								<uilistlayout
									VerticalAlignment="Center"
									HorizontalAlignment="Center"
								/>
								<imagelabel
									Size={new UDim2(0, 16, 0, 16)}
									BackgroundTransparency={1}
									Image={theme.IconAssetUri}
									ImageColor3={theme.IconColor3}
									ImageRectOffset={icon.Offset}
									ZIndex={this.props.ZIndex}
									ImageRectSize={new Vector2(16, 16)}
								/>
							</imagebutton>
						);
					}}
				/>
			);
		}

		return (
			<ThemeContext.Consumer
				render={theme => {
					return (
						<imagelabel
							Size={new UDim2(0, 16, 0, 16)}
							BackgroundTransparency={1}
							Image={theme.IconAssetUri}
							ImageColor3={theme.IconColor3}
							ImageRectOffset={icon.Offset}
							Position={this.props.Position}
							ZIndex={this.props.ZIndex}
							ImageRectSize={new Vector2(16, 16)}
						/>
					);
				}}
			/>
		);
	}
}

interface IconButtonProps extends IconProps {
	Floating?: boolean;
	OnClick: () => void;
	Position?: UDim2;
	Size?: UDim2;
	ZIndex?: number;
}
export function ZirconIconButton({
	Floating,
	Icon,
	OnClick,
	Position,
	Size,
	ZIndex,
}: IconButtonProps): Roact.Element {
	return (
		<ThemeContext.Consumer
			render={theme => {
				return (
					<imagebutton
						Image=""
						ZIndex={ZIndex}
						Position={Position}
						Event={{ MouseButton1Down: OnClick }}
						BackgroundTransparency={Floating ? 0 : 1}
						BackgroundColor3={theme.PrimaryBackgroundColor3}
						BorderColor3={theme.SecondaryBackgroundColor3}
						Size={Size ?? new UDim2(0, 20, 0, 20)}
					>
						<uilistlayout VerticalAlignment="Center" HorizontalAlignment="Center" />
						<ZirconIcon Icon={Icon} ZIndex={ZIndex} />
					</imagebutton>
				);
			}}
		/>
	);
}

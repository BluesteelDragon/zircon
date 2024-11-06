/* eslint-disable ts/no-magic-numbers -- Color constructors */
import type { InferEnumNames } from "@rbxts/roact";
import Roact from "@rbxts/roact";

interface ConsoleColors {
	readonly Cyan: Color3;
	readonly Green: Color3;
	readonly Grey: Color3;
	readonly Orange: Color3;
	readonly Red: Color3;
	readonly White: Color3;
	readonly Yellow: Color3;
}

export interface ThemeSyntaxColors {
	BooleanLiteral?: Color3 | string;
	CommentColor?: Color3 | string;
	ControlCharacters: Color3 | string;
	KeywordColor: Color3 | string;
	NumberColor: Color3 | string;
	OperatorColor: Color3 | string;
	StringColor: Color3 | string;
	VariableColor: Color3 | string;
}

interface DockOptions {
	Transparency?: number;
}

export interface ZirconThemeDefinition {
	readonly ClientContextColor: Color3;
	readonly ConsoleColors: ConsoleColors;
	readonly ConsoleFont: Enum.Font | InferEnumNames<Enum.Font>;
	readonly Dock: DockOptions;
	readonly ErrorTextColor3: Color3;
	readonly Font: Enum.Font | InferEnumNames<Enum.Font>;
	readonly IconAssetUri: string;
	readonly IconColor3?: Color3;
	readonly PrimaryBackgroundColor3: Color3;
	readonly PrimaryDisabledColor3: Color3;
	readonly PrimarySelectColor3: Color3;
	readonly PrimaryTextColor3: Color3;
	readonly SecondaryBackgroundColor3: Color3;
	readonly SecondaryTextColor3: Color3;
	readonly ServerContextColor: Color3;
	readonly SyntaxHighlighter?: ThemeSyntaxColors;
}

export const ZirconDarkPlastic = identity<ZirconThemeDefinition>({
	ClientContextColor: Color3.fromRGB(0, 148, 255),
	ConsoleColors: {
		Cyan: Color3.fromRGB(86, 182, 194),
		Green: Color3.fromRGB(152, 195, 121),
		Grey: Color3.fromRGB(90, 99, 116),
		Orange: Color3.fromRGB(255, 135, 0),
		Red: Color3.fromRGB(224, 108, 117),
		White: Color3.fromRGB(220, 223, 228),
		Yellow: Color3.fromRGB(229, 192, 123),
	},
	ConsoleFont: "RobotoMono",
	Dock: {},
	ErrorTextColor3: Color3.fromRGB(224, 108, 117),
	Font: "Ubuntu",
	IconAssetUri: "rbxassetid://6413958171",
	PrimaryBackgroundColor3: Color3.fromRGB(33, 37, 43),
	PrimaryDisabledColor3: Color3.fromRGB(100, 100, 100),
	PrimarySelectColor3: Color3.fromRGB(53, 57, 64),
	PrimaryTextColor3: Color3.fromRGB(255, 255, 255),
	SecondaryBackgroundColor3: Color3.fromRGB(24, 26, 31),
	SecondaryTextColor3: Color3.fromRGB(170, 170, 170),

	ServerContextColor: Color3.fromRGB(0, 255, 144),
});

export const ZirconFrost = identity<ZirconThemeDefinition>({
	ClientContextColor: Color3.fromRGB(0, 148, 255),
	ConsoleColors: {
		Cyan: new Color3(0.19, 0.51, 0.55),
		Green: Color3.fromRGB(102, 148, 69),
		Grey: Color3.fromRGB(90, 99, 116),
		Orange: Color3.fromRGB(255, 135, 0),
		Red: Color3.fromRGB(224, 108, 117),
		White: Color3.fromRGB(41, 43, 43),
		Yellow: Color3.fromRGB(232, 179, 77),
	},
	ConsoleFont: "RobotoMono",
	Dock: {},
	ErrorTextColor3: Color3.fromRGB(224, 108, 117),
	Font: "Ubuntu",
	IconAssetUri: "rbxassetid://6413958171",
	IconColor3: Color3.fromRGB(33, 33, 33),
	PrimaryBackgroundColor3: Color3.fromRGB(212, 218, 212),
	PrimaryDisabledColor3: Color3.fromRGB(100, 100, 100),
	PrimarySelectColor3: new Color3(0.68, 0.73, 0.82),
	PrimaryTextColor3: Color3.fromRGB(33, 33, 33),
	SecondaryBackgroundColor3: Color3.fromRGB(231, 229, 224),
	SecondaryTextColor3: Color3.fromRGB(46, 46, 46),

	ServerContextColor: Color3.fromRGB(0, 255, 144),
});

export const BuiltInThemes = {
	Frost: ZirconFrost,
	Plastic: ZirconDarkPlastic,
};
export type BuiltInThemes = typeof BuiltInThemes;

type Color3Keys<T> = { [P in keyof T]: T[P] extends Color3 ? P & string : never }[keyof T];
type Color3ToHex<T> = {
	[P in keyof T]: T[P] extends Color3 | string
		? string
		: T[P] extends Color3 | string | undefined
			? string | undefined
			: T[P];
};
export function getThemeRichTextColor(
	theme: ZirconThemeDefinition,
	color3: Color3Keys<ZirconThemeDefinition["ConsoleColors"]>,
): string {
	const color = theme.ConsoleColors[color3];
	const numeric = ((color.R * 255) << 16) | ((color.G * 255) << 8) | ((color.B * 255) << 0);
	return "#%.6X".format(numeric);
}

export function convertColorObjectToHex<T>(values: T): Color3ToHex<T> {
	const newArray: Partial<Record<keyof T, unknown>> = {};
	for (const [key, value] of pairs<typeof newArray>(values)) {
		if (typeIs(value, "Color3")) {
			const numeric =
				((value.R * 255) << 16) | ((value.G * 255) << 8) | ((value.B * 255) << 0);
			newArray[key as keyof T] = "#%.6X".format(numeric);
		}
	}

	return newArray as Color3ToHex<T>;
}

export function getRichTextColor3(
	theme: ZirconThemeDefinition,
	color3: Color3Keys<ZirconThemeDefinition["ConsoleColors"]>,
	text: string,
): string {
	return `<font color="${getThemeRichTextColor(theme, color3)}">${text}</font>`;
}

export function italicize(text: string): string {
	return `<i>${text}</i>`;
}

export function makeTheme(theme: Partial<ZirconThemeDefinition>): ZirconThemeDefinition {
	return identity<ZirconThemeDefinition>({ ...ZirconDarkPlastic, ...theme });
}

/** @deprecated */
export const ZirconTheme = makeTheme({
	ConsoleFont: "Code",
	Font: "Sarpanch",
	PrimaryBackgroundColor3: Color3.fromRGB(33, 37, 43),
	SecondaryBackgroundColor3: Color3.fromRGB(24, 26, 31),
});

const ThemeContext = Roact.createContext<ZirconThemeDefinition>(ZirconDarkPlastic);

export default ThemeContext;

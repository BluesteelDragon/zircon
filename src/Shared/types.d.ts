import type ZrContext from "@rbxts/zirconium/out/Data/Context";
import type { ZrValue } from "@rbxts/zirconium/out/Data/Locals";
import type { ZrLuauArgument } from "@rbxts/zirconium/out/Data/LuauFunction";

export interface ZirconFunctionDeclaration<
	T extends Array<ZrLuauArgument> = Array<ZrLuauArgument>,
	R extends undefined | void | ZrValue = void,
> {
	Function: (context: ZrContext, ...args: T) => R;
	Name: string;
}

import type ZrContext from "@cwyvern/zirconium/out/data/context";
import type { ZrValue } from "@cwyvern/zirconium/out/data/locals";
import type { ZrLuauArgument } from "@cwyvern/zirconium/out/data/luau-function";

export interface ZirconFunctionDeclaration<
	T extends Array<ZrLuauArgument> = Array<ZrLuauArgument>,
	R extends undefined | void | ZrValue = void,
> {
	Function: (context: ZrContext, ...args: T) => R;
	Name: string;
}

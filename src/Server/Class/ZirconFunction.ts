import type ZrContext from "@rbxts/zirconium/out/Data/Context";
import type { ZrValue } from "@rbxts/zirconium/out/Data/Locals";
import ZrLuauFunction from "@rbxts/zirconium/out/Data/LuauFunction";
import ZrObject from "@rbxts/zirconium/out/Data/Object";
import type ZrUndefined from "@rbxts/zirconium/out/Data/Undefined";

export type ZrTypeCheck = (value: ZrUndefined | ZrValue) => value is ZrUndefined | ZrValue;

type ZrInferValue<T> = T extends (value: unknown) => value is infer A ? A : never;
type InferArguments<T> = { readonly [P in keyof T]: ZrInferValue<T[P]> };

export interface CommandDeclaration<A extends ReadonlyArray<ZrTypeCheck>, R> {
	Arguments: A;
	Execute: (this: void, context: ZrContext, ...args: InferArguments<A>) => R;
	Groups: Array<string>;
}

/** @deprecated */
export default class ZirconFunction<
	A extends ReadonlyArray<ZrTypeCheck>,
	R = unknown,
> extends ZrLuauFunction {
	private constructor(private readonly declaration: CommandDeclaration<A, R>) {
		super((context, ...args) => {
			for (let index = 0; index < args.size(); index++) {
				const argumentCheck = declaration.Arguments[index];
				if (!argumentCheck(args[index])) {
					return false;
				}
			}

			declaration.Execute(context, ...(args as InferArguments<A>));
		});
	}

	public static create<A extends ReadonlyArray<ZrTypeCheck>, R>(
		declaration: CommandDeclaration<A, R>,
	): ZirconFunction<A, R> {
		return new ZirconFunction<A, R>(declaration);
	}

	public static readonly string = (value: unknown): value is string => typeIs(value, "string");

	public static readonly number = (value: unknown): value is number => {
		return typeIs(value, "number");
	};

	public static readonly boolean = (value: unknown): value is boolean => {
		return typeIs(value, "number");
	};

	public static readonly array = (value: unknown): value is ZrValue[] => {
		return typeIs(value, "table");
	};

	public static readonly object = (value: unknown): value is ZrObject => {
		return value instanceof ZrObject;
	};
}

ZirconFunction.create({
	Arguments: [ZirconFunction.string, ZirconFunction.number] as const,
	Execute(context, argument0) {},
	Groups: [],
});

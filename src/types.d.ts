interface ValidationSuccessResult {
	success: true;
}
interface ValidationFailResult {
	reason: string;
	success: false;
}

export type ValidationResult = ValidationFailResult | ValidationSuccessResult;

export interface CustomCommandType<T = string, R = T> {
	displayName?: string;

	parse(value: T): R;

	/**
	 * @param value - The string representation.
	 * @returns The transformed representation.
	 */
	transform?(value: string, executor: Player): T;

	validate?(value: T, executor: Player): ValidationResult;
}

export const enum CommandType {
	Boolean = "boolean",
	Number = "number",
	String = "string",
	Switch = "switch",
}

interface CommandArgumentType<T> {
	alias?: Array<string>;
	type: T;
}

interface StringCommandArgument extends CommandArgumentType<"string"> {
	default?: string;
}

interface NumberCommandArgument extends CommandArgumentType<"number"> {
	default?: number;
}

interface BooleanCommandArgument extends CommandArgumentType<"boolean"> {
	default?: boolean;
}

interface SwitchCommandArgument extends CommandArgumentType<"switch"> {
	default?: never;
}

export interface CustomTypeArgument<T, U> extends CommandArgumentType<CustomCommandType<T, U>> {
	default?: defined;
	required?: boolean;
}

interface UnionType<T extends ReadonlyArray<CommandArgumentTypeId>> {
	alias?: Array<string>;
	default?: InferTypeWithUnion<T>;
	type: T;
}

type _CommandArgument =
	| ({ default?: Player } & CommandArgumentType<"player">)
	| BooleanCommandArgument
	| CustomTypeArgument<defined, defined>
	| NumberCommandArgument
	| StringCommandArgument;

export type CommandArgument = (
	| _CommandArgument
	| UnionType<ReadonlyArray<CommandArgumentTypeId>>
) & {
	variadic?: true;
};

export type CommandArgumentTypeId = _CommandArgument["type"];

export type CommandOptionArgument = CommandArgument | SwitchCommandArgument;

export type CommandOptions = Record<string, CommandOptionArgument>;

// const _isCmdTypeDefinition = t.interface({
// 	parse: t.callback,
// 	transform: t.optional(t.callback),
// 	validate: t.optional(t.callback),
// 	displayName: t.optional(t.string),
// });

// // eslint-disable-next-line @typescript-eslint/no-explicit-any
// export function isCmdTypeDefinition(value: unknown): value is CustomCommandType<any, any> {
// 	return _isCmdTypeDefinition(value);
// }

type InferTypeName<T> = T extends "string"
	? string
	: T extends "number"
		? number
		: T extends "boolean"
			? boolean
			: T extends "player"
				? Player
				: T extends CustomCommandType<infer _, infer R>
					? R
					: never;

type GetResultingType<T, U> = U extends { default: T }
	? T
	: U extends { required: true }
		? T
		: T | undefined;
type InferType<T> = T extends { type: "string" | CommandType.String }
	? GetResultingType<string, T>
	: T extends { type: "number" | CommandType.Number }
		? GetResultingType<number, T>
		: T extends { type: "switch" | CommandType.Switch }
			? boolean
			: T extends { type: "boolean" | CommandType.Boolean }
				? GetResultingType<boolean, T>
				: T extends { type: "player" }
					? GetResultingType<Player, T>
					: T extends { type: "players" }
						? GetResultingType<Array<Player>, T>
						: T extends { type: CustomCommandType<infer _, infer A> }
							? GetResultingType<A, T>
							: unknown;

type InferTypeWithUnion<T> = T extends { type: ReadonlyArray<CommandArgumentTypeId> }
	? InferTypeName<T["type"][number]> | undefined
	: InferType<T>;

// eslint-disable-next-line ts/no-explicit-any -- Will return a value, but not known, thus unknown does not fit.
export type DropFirstInTuple<T extends ReadonlyArray<defined>> = ((...args: T) => any) extends (
	argument: any,
	...rest: infer U
) => any
	? U
	: T;
export type LastInTuple<T extends ReadonlyArray<defined>> = T[LengthOfTuple<DropFirstInTuple<T>>];

type LengthOfTuple<T extends ReadonlyArray<defined>> = T extends { length: infer L } ? L : -1;

type ArgumentTypes<T> = { readonly [P in keyof T]: InferTypeWithUnion<T[P]> };

// once 4.0 is out.
// type WithVariadic<T extends Array<unknown> = Array<unknown>> = [
// 	...ArgTypes<T>,
// 	...InferTypeWithUnion<LastInTuple<T>>[]
// ];
type WithVariadic<T extends ReadonlyArray<defined>> = [
	...Array<InferTypeWithUnion<LastInTuple<T>>>,
] &
	ArgumentTypes<T>;
type HasVariadic<T extends ReadonlyArray<defined>> =
	LastInTuple<T> extends { variadic: true } ? true : false;

export type MappedOptionsReadonly<T extends ReadonlyArray<defined>> =
	T extends Array<never>
		? Array<unknown>
		: HasVariadic<T> extends true
			? WithVariadic<T>
			: ArgumentTypes<T>;

export type MappedOptions<T> = { [P in keyof T]: InferTypeWithUnion<T[P]> };
export type MappedArgs<T> = T extends [infer A]
	? [InferType<A>]
	: T extends [infer A, infer B]
		? [InferType<A>, InferType<B>]
		: unknown;

export interface ExecutionOptions {
	args: Array<defined>;
	executor: Player;
	mappedOptions: Map<string, defined>;
	piped: boolean;
	stdin: Array<string>;
	stdout: Array<string>;
	variables: Record<string, defined>;
}

export interface ExecuteBinaryExpressionResult {
	result: defined;
	stdout: Array<string>;
}

import { ZrEnum } from "@rbxts/zirconium/out/Data/Enum";
import { ZrEnumItem } from "@rbxts/zirconium/out/Data/EnumItem";
import type { ZrValue } from "@rbxts/zirconium/out/Data/Locals";
import ZrObject from "@rbxts/zirconium/out/Data/Object";
import ZrRange from "@rbxts/zirconium/out/Data/Range";
import ZrUndefined from "@rbxts/zirconium/out/Data/Undefined";
import { ZrInstanceUserdata } from "@rbxts/zirconium/out/Data/Userdata";

import { zirconTypeOf } from "Shared/type-id";

import { ZirconFuzzyPlayers } from "./Validators/ZirconFuzzyPlayersValidator";
import { ZirconFuzzyPlayer } from "./Validators/ZirconFuzzyPlayerValidator";
import type { ZirconEnum, ZirconEnumValidator } from "./ZirconEnum";
import type { ZirconFunction } from "./ZirconFunction";

type PickFrom<T, U> = U extends never ? T : U;
export interface ZirconValidator<T, U = never> {
	ErrorMessage?:
		| ((
				argument: ZrUndefined | ZrValue,
				index: number,
				func: ZirconFunction<any, any>,
		  ) => string)
		| string;
	Transform?(value: T, player?: Player): U;
	/** The type label. */
	readonly Type: string;
	/** The validator. */
	Validate(value: unknown, player?: Player): value is T;
}

export interface ZirconArgument<T extends Validator> {
	Label?: string;
	Optional?: boolean;
	Type: T;
}

export type InferValidatorFromArgument<T extends ZirconArgument<any>> = T["Type"] extends Validator
	? InferValidator<T["Type"]>
	: never;

type test = InferValidatorFromArgument<{ Type: typeof ZirconFuzzyPlayer }>;

export const ZirconString: ZirconValidator<string> = {
	ErrorMessage: value => `Expected string, got ${zirconTypeOf(value)}`,
	Type: "string",
	Validate(value): value is string {
		return typeIs(value, "string");
	},
};

export const ZirconNumber: ZirconValidator<number> = {
	ErrorMessage: value => `Expected number, got ${zirconTypeOf(value)}`,
	Type: "number",
	Validate(value): value is number {
		return typeIs(value, "number");
	},
};

export const ZirconBoolean: ZirconValidator<boolean> = {
	ErrorMessage: value => `Expected boolean, got ${zirconTypeOf(value)}`,
	Type: "boolean",
	Validate(value): value is boolean {
		return typeIs(value, "boolean");
	},
};

export const ZirconObject: ZirconValidator<ZrObject> = {
	ErrorMessage: value => `Expected object, got ${zirconTypeOf(value)}`,
	Type: "object",
	Validate(value): value is ZrObject {
		return value instanceof ZrObject;
	},
};

export const NativeEnum: ZirconValidator<ZrEnum> = {
	ErrorMessage: value => `Expected enum, got ${zirconTypeOf(value)}`,
	Type: "ZrEnum",
	Validate(value: unknown): value is ZrEnum {
		return value instanceof ZrEnum;
	},
};

export const NativeEnumItem: ZirconValidator<ZrEnumItem> = {
	ErrorMessage: value => `Expected enum item, got ${zirconTypeOf(value)}`,
	Type: "ZrEnumItem",
	Validate(value: unknown): value is ZrEnumItem {
		return value instanceof ZrEnumItem;
	},
};

export interface ZirconOptionalValidator<T, U = T>
	extends ZirconValidator<T | ZrUndefined, U | undefined> {}
export function ZirconOptionalValidator<I, O>(validator: ZirconValidator<I, O>) {
	return {
		Transform(value: unknown, player?: Player) {
			if (validator.Validate(value, player)) {
				if (validator.Transform !== undefined) {
					return value !== ZrUndefined
						? ((validator.Transform(value, player) ?? undefined) as O)
						: undefined;
				}

				return value as unknown as O | undefined;
			}

			return undefined;
		},
		Type: validator.Type + "?",
		Validate(value: unknown, player?: Player): value is I | ZrUndefined {
			return validator.Validate(value, player) || value === ZrUndefined;
		},
	} as ZirconOptionalValidator<I, InferOptionalOutput<I, O>>;
}

type InferOptionalOutput<I, O> = [O] extends [undefined] ? I : O;

export const ZirconUnknown: ZirconValidator<ZrUndefined | ZrValue> = {
	Type: "unknown",
	Validate(value: unknown): value is ZrUndefined | ZrValue {
		return true;
	},
};

export const ZirconDefined: ZirconValidator<ZrValue> = {
	ErrorMessage: value => `Expected defined, got ${zirconTypeOf(value)}`,
	Type: "defined",
	Validate(value: unknown): value is ZrValue {
		return value !== ZrUndefined && value !== undefined;
	},
};

export const ZirconRange: ZirconValidator<number | ZrRange, ZrRange> = {
	ErrorMessage: value => `Expected range, got ${zirconTypeOf(value)}`,
	Transform(value: number | ZrRange) {
		return typeIs(value, "number") ? new ZrRange(new NumberRange(value)) : value;
	},
	Type: "range",
	Validate(value: unknown): value is number | ZrRange {
		return typeIs(value, "number") || value instanceof ZrRange;
	},
};

export function ZirconInstanceIsA<K extends keyof Instances>(
	typeName: K,
): ZirconValidator<ZrInstanceUserdata, Instances[K]> {
	return identity<ZirconValidator<ZrInstanceUserdata, Instances[K]>>({
		ErrorMessage: value => `Expected Instance, got ${zirconTypeOf(value)}`,
		Transform(value) {
			return value.value() as Instances[K];
		},
		Type: `RBX${typeName}`,
		Validate(value: unknown): value is ZrInstanceUserdata<Instances[K]> {
			return value instanceof ZrInstanceUserdata && value.isA(typeName);
		},
	});
}

export const ZirconPlayer = ZirconInstanceIsA("Player");

export const BuiltInValidators = {
	boolean: ZirconBoolean,
	["boolean?"]: ZirconOptionalValidator(ZirconBoolean),
	defined: ZirconDefined,
	number: ZirconNumber,
	["number?"]: ZirconOptionalValidator(ZirconNumber),
	object: ZirconObject,
	["object?"]: ZirconOptionalValidator(ZirconObject),
	player: ZirconFuzzyPlayer,
	["player?"]: ZirconOptionalValidator(ZirconFuzzyPlayer),
	players: ZirconFuzzyPlayers,
	["players?"]: ZirconOptionalValidator(ZirconFuzzyPlayers),
	range: ZirconRange,
	["range?"]: ZirconOptionalValidator(ZirconRange),
	string: ZirconString,
	["string?"]: ZirconOptionalValidator(ZirconString),
	// primitive: ZirconUnionValidator([ZirconString, ZirconNumber, ZirconBoolean]),
	unknown: ZirconUnknown,
	/** @internal */
	ZrEnum: NativeEnum,
	/** @internal */
	ZrEnumItem: NativeEnumItem,
};
export type BuiltInValidators = typeof BuiltInValidators;

export type Validator =
	| keyof typeof BuiltInValidators
	| ZirconEnum<any>
	| ZirconValidator<any, any>;

export type InferValidators<T extends ReadonlyArray<Validator>> = {
	readonly [P in keyof T]: T[P] extends Validator ? InferValidator<T[P]> : never;
};

// export type InferArguments<T extends ReadonlyArray<Validator>> = {
// 	readonly [P in keyof T]: InferTypeFromValidator<T[P]>;
// } & { length: T["length"] };

export type ExtractValidators<T extends ReadonlyArray<Validator>> = {
	[P in keyof T]: T[P] extends keyof BuiltInValidators ? BuiltInValidators[T[P] & string] : T[P];
};

export type IWantToStabMyselfWithAFuckingFork<T> = T extends keyof BuiltInValidators
	? BuiltInValidators[T]
	: T;

export type InferArguments<T extends ReadonlyArray<ZirconValidator<any, any>>> = T extends []
	? [...ReadonlyArray<ZrUndefined | ZrValue>]
	: {
			readonly [P in keyof T]: T[P] extends ZirconValidator<any, any>
				? InferTypeFromValidator2<T[P]>
				: never;
		};

export type InferValidator<T extends Validator> = T extends keyof BuiltInValidators
	? BuiltInValidators[T]
	: T extends ZirconEnum<infer K>
		? ZirconEnumValidator<K>
		: T;
export type InferTypeFromValidator<T extends Validator> = T extends keyof BuiltInValidators
	? InferTypeFromValidator<BuiltInValidators[T] & Validator>
	: T extends ZirconValidator<infer A>
		? A
		: T extends ZirconValidator<infer _, infer U>
			? U
			: T extends ZirconEnum<infer K>
				? ZirconEnumValidator<K>
				: never;

export type InferTypeFromValidator2<T extends ZirconValidator<any, any>> =
	T extends ZirconValidator<infer A>
		? A
		: T extends ZirconValidator<infer _, infer U>
			? U
			: never;

export interface ValidatorArgument {
	type: Validator;
}

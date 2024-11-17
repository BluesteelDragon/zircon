import { t } from "@rbxts/t";

import { ZirconEnum } from "./ZirconEnum";
import type {
	InferTypeFromValidator2,
	InferValidator,
	InferValidators,
	Validator,
	ZirconValidator,
} from "./ZirconTypeValidator";
import { BuiltInValidators } from "./ZirconTypeValidator";

const isArray = t.array(t.any);
type ArrayType<T> = T extends ReadonlyArray<infer U> ? U : never;

export function ZirconGetValidatorType<V extends Validator>(
	validatorLike: V,
): ZirconValidator<unknown, unknown> {
	let validator: ZirconValidator<unknown, unknown>;
	if (typeIs(validatorLike, "string")) {
		// eslint-disable-next-line ts/no-unnecessary-type-assertion -- Apparently is necessary.
		validator = BuiltInValidators[validatorLike as keyof BuiltInValidators];
	} else if (validatorLike instanceof ZirconEnum) {
		validator = validatorLike.getValidator();
	} else {
		validator = validatorLike;
	}

	return validator;
}

export function ZirconTypeUnion<V extends ReadonlyArray<Validator>>(...validators: V) {
	const result = validators.map(ZirconGetValidatorType) as unknown as InferValidators<V>;
	return ZirconUnionValidator(result);
}

export function ZirconArrayType<T extends Validator>(
	validator: T,
): ZirconValidator<Array<InferTypeFromValidator2<InferValidator<T>>>> {
	const arrayType = ZirconGetValidatorType(validator);
	return identity<ZirconValidator<Array<InferTypeFromValidator2<InferValidator<T>>>>>({
		Type: arrayType.Type + "[]",
		Validate(value, player): value is Array<InferTypeFromValidator2<InferValidator<T>>> {
			return isArray(value) && value.every(value => arrayType.Validate(value, player));
		},
	});
}

export interface ZirconUnionValidator<
	T extends ReadonlyArray<unknown>,
	U extends ReadonlyArray<unknown>,
> extends ZirconValidator<T[number], U[number]> {}
export function ZirconUnionValidator<T extends ReadonlyArray<ZirconValidator<any, any>>>(
	validators: T,
): ZirconValidator<InferTypeFromValidator2<ArrayType<T>>> {
	return {
		Transform(value: unknown, player?: Player): ArrayType<T> {
			for (const validator of validators) {
				if (validator.Validate(value)) {
					return validator.Transform !== undefined
						? validator.Transform(value, player)
						: value;
				}
			}

			return undefined!;
		},
		Type: validators.map(validator => validator.Type).join(" | "),
		Validate(value: unknown, player?: Player): value is ArrayType<T> {
			return validators.some(validator => validator.Validate(value, player));
		},
	} as ZirconValidator<InferTypeFromValidator2<ArrayType<T>>>;
}

import t from "@rbxts/t";
import type { ZrValue } from "@rbxts/zirconium/out/Data/Locals";

import { ZirconArrayType, ZirconTypeUnion } from "./TypeUtilities";
import type { ZirconContext } from "./ZirconContext";
import { ZirconEnum } from "./ZirconEnum";
import { ZirconFunction } from "./ZirconFunction";
import type {
	InferArguments,
	InferTypeFromValidator2,
	InferValidator,
	Validator,
	ZirconValidator,
} from "./ZirconTypeValidator";
import { BuiltInValidators } from "./ZirconTypeValidator";

const isArray = t.array(t.any);

export class ZirconFunctionBuilder<V extends Array<ZirconValidator<unknown, unknown>> = []> {
	private readonly validators = new Array<ZirconValidator<unknown, unknown>>();
	private description?: string;
	private hasVariadic = false;
	private variadicValidator?: ZirconValidator<unknown, unknown>;

	constructor(private readonly name: string) {}

	private GetValidator<TValidation extends Validator>(
		argumentValidator: TValidation,
	): ZirconValidator<unknown, unknown> {
		let validator: ZirconValidator<unknown, unknown>;
		if (typeIs(argumentValidator, "string")) {
			validator = BuiltInValidators[argumentValidator as keyof BuiltInValidators];
		} else if (argumentValidator instanceof ZirconEnum) {
			validator = argumentValidator.getValidator();
		} else {
			validator = argumentValidator;
		}

		return validator;
	}

	private GetUnionableValidator<TValidation extends Validator>(
		argumentValidator: Array<TValidation> | TValidation,
	): ZirconValidator<unknown, unknown> {
		return isArray(argumentValidator)
			? this.GetValidator(ZirconTypeUnion(...argumentValidator))
			: this.GetValidator(argumentValidator);
	}

	/**
	 * Adds an argument to this zircon function.
	 *
	 * @param argumentValidator - The argument type/validator.
	 * @param description - The description for this argument.
	 * @returns The containing builder.
	 */
	public AddArgument<TValidation extends Validator>(
		argumentValidator: Array<TValidation> | TValidation,
		description?: string,
	): ZirconFunctionBuilder<[...V, InferValidator<TValidation>]> {
		const validator = this.GetUnionableValidator(argumentValidator);
		this.validators.push(validator);
		return this as unknown as ZirconFunctionBuilder<[...V, InferValidator<TValidation>]>;
	}

	/**
	 * Adds an array argument to this zircon function.
	 *
	 * @param argumentValidator - The argument type/validator.
	 * @param description - The description for this argument.
	 * @returns The containing builder.
	 */
	public AddArrayArgument<TValidation extends Validator>(
		argumentValidator: Array<TValidation> | TValidation,
		description?: string,
	): ZirconFunctionBuilder<
		[...V, ZirconValidator<Array<InferTypeFromValidator2<InferValidator<TValidation>>>>]
	> {
		const validator = ZirconArrayType(this.GetUnionableValidator(argumentValidator));
		this.validators.push(validator);
		return this as unknown as ZirconFunctionBuilder<
			[...V, ZirconValidator<Array<InferTypeFromValidator2<InferValidator<TValidation>>>>]
		>;
	}

	/**
	 * Adds a variadic argument to this zircon function.
	 *
	 * @param argument
	 * @returns
	 */
	public AddVariadicArgument<TValidation extends Validator>(
		argument: Array<TValidation> | TValidation,
	): Omit<
		ZirconFunctionBuilder<[...V, ...Array<InferValidator<TValidation>>]>,
		"AddArgument" | "AddVariadicArgument"
	> {
		this.hasVariadic = true;
		const validator = this.GetUnionableValidator(argument);
		this.variadicValidator = validator;

		return this as unknown as Omit<
			ZirconFunctionBuilder<[...V, ...Array<InferValidator<TValidation>>]>,
			"AddArgument" | "AddVariadicArgument"
		>;
	}

	/**
	 * Adds a description to the function.
	 *
	 * @param description - The description of this function.
	 * @returns
	 */
	public AddDescription(description: string): Omit<this, "AddDescription"> {
		this.description = description;
		return this as Omit<this, "AddDescription">;
	}

	public Bind<R extends void | ZrValue>(
		func: (context: ZirconContext, ...args: InferArguments<V>) => R,
	): ZirconFunction<V, R> {
		return new ZirconFunction(this.name, func, {
			ArgumentValidators: this.validators,
			Description: this.description,
			HasVariadic: this.hasVariadic,
			VariadicValidator: this.variadicValidator,
		});
	}
}

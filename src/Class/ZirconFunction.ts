import { LogLevel } from "@rbxts/log";
import { RunService } from "@rbxts/services";
import type ZrContext from "@rbxts/zirconium/out/Data/Context";
import type { ZrValue } from "@rbxts/zirconium/out/Data/Locals";
import type { ZrLuauArgument } from "@rbxts/zirconium/out/Data/LuauFunction";
import ZrLuauFunction from "@rbxts/zirconium/out/Data/LuauFunction";
import type ZrUndefined from "@rbxts/zirconium/out/Data/Undefined";
import type ZrPlayerScriptContext from "@rbxts/zirconium/out/Runtime/PlayerScriptContext";

import { $print } from "rbxts-transform-debug";

import Server from "../Server";
import { ZirconContext } from "./ZirconContext";
import type { InferArguments, ZirconValidator } from "./ZirconTypeValidator";

let zirconTypeOf: (typeof import("Shared/type-id"))["zirconTypeOf"] | undefined;

export function emitArgumentError(
	func: ZirconFunction<any, any>,
	context: ZrContext,
	argument: ZrUndefined | ZrValue,
	index: number,
	validator: ZirconValidator<unknown, unknown>,
): void {
	const err = typeIs(validator.ErrorMessage, "function")
		? validator.ErrorMessage(argument, index, func)
		: validator.ErrorMessage;

	// Have to dynamically import
	if (zirconTypeOf === undefined) {
		zirconTypeOf = import("Shared/type-id").expect().zirconTypeOf;
	}

	Server.Log.WriteStructured({
		ArgIndex: index + 1,
		ArgType: zirconTypeOf(argument),
		FunctionArgs: func.GetArgumentTypes(),
		FunctionName: func.GetName(),
		FunctionVariadicArg: func.GetVariadicType(),
		Level: LogLevel.Error,
		LogToPlayer: context.getExecutor(),
		SourceContext: `(function '${func.GetName()}')`,
		Template: `Argument #{ArgIndex} to '{FunctionName}': ${err ?? "Expected {ValidatorType}, got {ArgType}"}`,
		Timestamp: DateTime.now().ToIsoDate(),
		ValidatorType: validator.Type,
	});
}

export interface ZirconFunctionMetadata {
	readonly ArgumentValidators: Array<ZirconValidator<unknown, unknown>>;
	readonly Description?: string;
	readonly HasVariadic: boolean;
	readonly VariadicValidator?: ZirconValidator<unknown, unknown>;
}
export class ZirconFunction<
	V extends ReadonlyArray<ZirconValidator<unknown, unknown>>,
	R extends void | ZrValue,
> extends ZrLuauFunction {
	// eslint-disable-next-line max-lines-per-function -- a 5
	constructor(
		private readonly name: string,
		private readonly zirconCallback: (context: ZirconContext, ...args: InferArguments<V>) => R,
		private readonly metadata: ZirconFunctionMetadata,
	) {
		const { ArgumentValidators, VariadicValidator } = metadata;
		// eslint-disable-next-line max-lines-per-function -- a 6
		super((context, ...args) => {
			// We'll need to type check all the arguments to ensure they're valid
			// and transform as appropriate for the user side

			const executor = context.getExecutor();

			let transformedArguments = new Array<defined>();
			if (ArgumentValidators.size() > 0) {
				for (let index = 0; index < ArgumentValidators.size(); index++) {
					const validator = ArgumentValidators[index];
					const argument = args[index];
					if (validator && validator.Validate(argument, executor)) {
						if (validator.Transform !== undefined) {
							transformedArguments[index] = validator.Transform(argument, executor) as defined;
						} else {
							transformedArguments[index] = argument;
						}
					} else {
						if (RunService.IsServer()) {
							emitArgumentError(this, context, argument, index, validator);
							$print("Got", argument);
						}
						return;
					}
				}
			} else if (!VariadicValidator) {
				transformedArguments = args as Array<ZrLuauArgument>;
			}

			if (args.size() > ArgumentValidators.size() && VariadicValidator) {
				for (let index = ArgumentValidators.size(); index < args.size(); index++) {
					const argument = args[index];
					if (VariadicValidator.Validate(argument, executor)) {
						if (VariadicValidator.Transform !== undefined) {
							transformedArguments[index] = VariadicValidator.Transform(argument, executor) as defined;
						} else {
							transformedArguments[index] = argument;
						}
					} else {
						if (RunService.IsServer()) {
							emitArgumentError(this, context, argument, index, VariadicValidator);
							$print("Got", argument);
						}
						return;
					}
				}
			}

			/// This is not pretty, I know.
			return this.zirconCallback(
				new ZirconContext(context, this),
				...(transformedArguments as unknown as InferArguments<V>),
			);
		});
	}

	public GetName(): string {
		return this.name;
	}

	public GetArgumentTypes(): Array<string> {
		const { ArgumentValidators } = this.metadata;
		return ArgumentValidators.map(validator => validator.Type);
	}

	public GetVariadicType(): string | undefined {
		const { VariadicValidator } = this.metadata;
		return VariadicValidator?.Type;
	}

	/** @internal */
	public RegisterToContext(context: ZrPlayerScriptContext): void {
		context.registerGlobal(this.name, this);
	}

	public GetDescription(): string | undefined {
		return this.metadata.Description;
	}

	public toString(): string {
		const argumentTypes = this.GetArgumentTypes().map(typeName => tostring(typeName));
		const variadicType = this.GetVariadicType();
		if (variadicType !== undefined) {
			argumentTypes.push("..." + variadicType);
		}

		return (
			`${this.metadata.Description !== undefined ? `/* ${this.metadata.Description} */` : ""} function ${
				this.name
			}(` +
			argumentTypes.join(", ") +
			") { [ZirconFunction] }"
		);
	}
}

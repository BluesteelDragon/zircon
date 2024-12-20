import { LogLevel } from "@rbxts/log";

import type { ZirconFunction } from "./ZirconFunction";
import { ZirconFunctionBuilder } from "./ZirconFunctionBuilder";
import { ZirconNamespace } from "./ZirconNamespace";

type HelpFunc = (
	name: string,
	argumentTypes: Array<string>,
	description: string | undefined,
) => void;
export class ZirconNamespaceBuilder {
	private readonly functions = new Array<ZirconFunction<any, any>>();

	constructor(private readonly name: string) {}

	public AddFunction(func: ZirconFunction<any, any>): this {
		const existingFunc = this.functions.find(
			registeredFunc => registeredFunc.GetName() === func.GetName(),
		);
		if (existingFunc) {
			warn("Duplicate function: '" + func.GetName() + "' in namespace '" + this.name + "'");
		} else {
			this.functions.push(func);
		}

		return this;
	}

	/**
	 * @param callback
	 * @param functionName
	 * @param functionDescription
	 * @internal
	 */
	// eslint-disable-next-line max-lines-per-function -- a 4
	public AddHelpFunction(
		callback: HelpFunc = (name, args, desc) => {
			void import("Services/LogService").then(({ ZirconLogService }) => {
				ZirconLogService.WriteStructured({
					Args: args,
					Description: desc,
					Level: LogLevel.Information,
					Name: name,
					SourceContext: `${this.name}.${functionName}`,
					Template:
						desc !== undefined
							? "function {Name} {Args}: '{Description}'"
							: "function {Name} {Args}",
					Timestamp: DateTime.now().ToIsoDate(),
				});
			});
		},
		functionName = "help",
		functionDescription = "Lists all members in this namespace",
	): this {
		this.functions.push(
			new ZirconFunctionBuilder(functionName)
				.AddArgument("string?")
				.AddDescription(functionDescription)
				// eslint-disable-next-line max-lines-per-function -- Namespace help func setup.
				.Bind((_, memberName) => {
					const matchingMember =
						memberName !== undefined
							? this.functions.find(
									// eslint-disable-next-line arrow-style/arrow-return-style -- FIXME: AntFu's Newline rule and arrow-style conflicts after a couple fixes, fix this up somehow!
									func =>
										func
											.GetName()
											.lower()
											.find(memberName.lower(), 1, true)[0] !== undefined,
								)
							: undefined;
					if (matchingMember) {
						const args = matchingMember.GetArgumentTypes();
						const variadicType = matchingMember.GetVariadicType();
						if (variadicType !== undefined) {
							args.push(`...${variadicType}`);
						}

						callback(matchingMember.GetName(), args, matchingMember.GetDescription());
					} else {
						this.functions
							.map(func => {
								const args = func.GetArgumentTypes();
								const variadicType = func.GetVariadicType();
								if (variadicType !== undefined) {
									args.push(`...${variadicType}`);
								}

								return [func.GetName(), args, func.GetDescription()] as const;
							})
							.forEach(argument => {
								callback(...argument);
							});
					}
				}),
		);
		return this;
	}

	public Build(): ZirconNamespace {
		return new ZirconNamespace(this.name, this.functions);
	}
}

import { ZrObjectUserdata } from "@cwyvern/zirconium/out/data/userdata";
import type ZrPlayerScriptContext from "@cwyvern/zirconium/out/runtime/player-script-context";

import type { ZirconFunction } from "./ZirconFunction";

export class ZirconNamespace {
	constructor(
		private readonly name: string,
		private readonly functions: Array<ZirconFunction<any, any>>,
	) {}

	/**
	 * Registers the Namespace as a global exposed to the provided context.
	 *
	 * @param context - The ZrPlayerScriptContext to register this Namespace
	 *   against.
	 * @internal
	 */
	public RegisterToContext(context: ZrPlayerScriptContext): void {
		const functionMap = new Map<string, ZirconFunction<any, any>>();
		for (const func of this.functions) {
			functionMap.set(func.GetName(), func);
		}

		const namespaceObject = ZrObjectUserdata.fromObject(functionMap);
		context.registerGlobal(this.name, namespaceObject);
	}

	/**
	 * Returns a ReadonlyArray of the members registered to this namespace.
	 *
	 * @returns ReadonlyArray of the functions registered to this namespace.
	 */
	public GetMembers(): ReadonlyArray<ZirconFunction<any, any>> {
		return this.functions as ReadonlyArray<ZirconFunction<any, any>>;
	}

	/**
	 * Gets the name of this namespace that was specified in the constructor.
	 *
	 * @returns The name of this namespace.
	 */
	public GetName(): string {
		return this.name;
	}

	/** @internal */
	public ToUserdata(): ZrObjectUserdata<Map<string, ZirconFunction<any, any>>> {
		const functionMap = new Map<string, ZirconFunction<any, any>>();
		for (const func of this.functions) {
			functionMap.set(func.GetName(), func);
		}

		return ZrObjectUserdata.fromObject(functionMap);
	}
}

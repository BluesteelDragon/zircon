import { ZrObjectUserdata } from "@rbxts/zirconium/out/Data/Userdata";
import type ZrPlayerScriptContext from "@rbxts/zirconium/out/Runtime/PlayerScriptContext";

import type { ZirconFunction } from "./ZirconFunction";

export class ZirconNamespace {
	constructor(
		private readonly name: string,
		private readonly functions: Array<ZirconFunction<any, any>>,
	) {}

	/** @internal */
	public RegisterToContext(context: ZrPlayerScriptContext) {
		const functionMap = new Map<string, ZirconFunction<any, any>>();
		for (const func of this.functions) {
			functionMap.set(func.GetName(), func);
		}

		const namespaceObject = ZrObjectUserdata.fromObject(functionMap);
		context.registerGlobal(this.name, namespaceObject);
	}

	public GetMembers(): ReadonlyArray<ZirconFunction<any, any>> {
		return this.functions as ReadonlyArray<ZirconFunction<any, any>>;
	}

	public GetName(): string {
		return this.name;
	}

	/** @internal */
	public ToUserdata() {
		const functionMap = new Map<string, ZirconFunction<any, any>>();
		for (const func of this.functions) {
			functionMap.set(func.GetName(), func);
		}

		return ZrObjectUserdata.fromObject(functionMap);
	}
}

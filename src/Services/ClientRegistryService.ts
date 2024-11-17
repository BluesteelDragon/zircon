import ZrPlayerScriptContext from "@cwyvern/zirconium/out/runtime/player-script-context";
import { Players } from "@rbxts/services";

import type {
	ZirconClientConfiguration,
	ZirconClientScopedGlobal,
} from "Class/ZirconClientConfigurationBuilder";
import { ZirconEnum } from "Class/ZirconEnum";
import { ZirconFunction } from "Class/ZirconFunction";
import ZirconClientStore from "Client/BuiltInConsole/Store";
import { ConsoleActionName } from "Client/BuiltInConsole/Store/_reducers/console-reducer";

export namespace ZirconClientRegistryService {
	const globals = new Array<ZirconClientScopedGlobal>();
	let initialized = false;
	/**
	 * Creates a scripting environment on the client for Zircon.
	 *
	 * NOTE: This is 100% insecure because it's on the client, and thus
	 * shouldn't use any elevated functions (WIP client).
	 *
	 * @ignore
	 * @param configuration
	 */
	export function Init(configuration: ZirconClientConfiguration): void {
		for (const global of configuration.Registry) {
			globals.push(global);
		}

		initialized = true;

		if (globals.size() > 0) {
			ZirconClientStore.dispatch({
				enabled: true,
				type: ConsoleActionName.SetClientExecutionEnabled,
			});
		}
	}

	/** @internal */
	export function GetScriptContextsForLocalPlayer(): ZrPlayerScriptContext {
		const context = new ZrPlayerScriptContext(Players.LocalPlayer);
		for (const global of globals) {
			if (global instanceof ZirconFunction) {
				context.registerGlobal(global.GetName(), global);
			} else if (global instanceof ZirconEnum) {
				context.registerGlobal(global.getEnumName(), global);
			}
		}

		return context;
	}
}
export type ZirconClientRegistryService = typeof ZirconClientRegistryService;

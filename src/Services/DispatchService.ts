import Zr from "@cwyvern/zirconium";
import { ZrScriptVersion } from "@cwyvern/zirconium/out/ast/parser";
import type ZrScript from "@cwyvern/zirconium/out/runtime/script";

import { GetCommandService } from "../Services";

// eslint-disable-next-line ts/naming-convention -- Refers to the standard io (std io), it's common to name it this way.
interface stdio {
	stdin: Array<string>;
	stdout: Array<string>;
}

export interface ExecutionParameters extends stdio {
	pipedOutput: boolean;
}

export namespace ZirconDispatchService {
	const globalContext = Zr.createContext("global");

	/**
	 * @param text
	 * @internal
	 */
	export async function ExecuteScriptGlobal(text: string): Promise<ZrScript> {
		return Promise.defer<ZrScript>((resolve, reject) => {
			// const source = globalContext.parseSource(text);
			// // const execution = globalContext.createScript()
			// // const execution = globalContext.createScriptFromSource(text);
			// // if (execution.result === ZrScriptCreateResult.OK) {
			// // 	resolve(execution.current);
			// // } else {
			// // 	reject(execution.errors);
			// // }
		});
	}

	export async function ExecuteScript(player: Player, text: string): Promise<ZrScript> {
		const Registry = GetCommandService("RegistryService");
		return Promise.defer<ZrScript>((resolve, reject) => {
			const [mainScript] = Registry.GetScriptContextsForPlayer(player);
			const source = mainScript.parseSource(text, ZrScriptVersion.Zr2022);
			if (source.isOk()) {
				const sourceFile = source.unwrap();
				resolve(mainScript.createScript(sourceFile));
			} else {
				reject(source.unwrapErr().errors);
			}
		});
	}
}
export type ZirconDispatchService = typeof ZirconDispatchService;

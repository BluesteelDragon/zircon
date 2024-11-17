import type { ZrParserError } from "@cwyvern/zirconium/out/ast/parser";
import { ZrScriptMode, ZrScriptVersion } from "@cwyvern/zirconium/out/ast/parser";
import type { ZrRuntimeError } from "@cwyvern/zirconium/out/runtime/runtime";
import type ZrScript from "@cwyvern/zirconium/out/runtime/script";
import type { LogEvent } from "@rbxts/log";
import { LogLevel } from "@rbxts/log";

import ZirconClientStore from "Client/BuiltInConsole/Store";
import { ConsoleActionName } from "Client/BuiltInConsole/Store/_reducers/console-reducer";
import { ZirconContext, ZirconMessageType } from "Client/Types";
import { ZirconClient } from "index";
import { GetCommandService } from "Services";
import { ZirconDebug } from "Shared/Debugging";

import Remotes, { RemoteId } from "../Shared/remotes";
import type { ZirconClientRegistryService } from "./ClientRegistryService";

export enum DispatchContext {
	Server,

	/** @internal */
	Client,
}

export namespace ZirconClientDispatchService {
	let Registry!: ZirconClientRegistryService;

	/** @internal */
	export const dependencies = ["ClientRegistryService"];

	const DispatchToServer = Remotes.Client.WaitFor(RemoteId.DispatchToServer).expect();
	export function Dispatch(input: string): void {
		DispatchToServer.SendToServer(input);
	}

	function Log(data: LogEvent): void {
		ZirconClientStore.dispatch({
			message: {
				context: ZirconContext.Client,
				data,
				type: ZirconMessageType.StructuredLog,
			},
			type: ConsoleActionName.AddOutput,
		});
	}

	/**
	 * @param text
	 * @internal
	 */
	// eslint-disable-next-line max-lines-per-function -- a 8
	export async function ExecuteScript(text: string): Promise<void> {
		const Registry = GetCommandService("ClientRegistryService");
		return Promise.defer<ZrScript>((resolve, reject) => {
			const mainScript = Registry.GetScriptContextsForLocalPlayer();
			const source = mainScript.parseSource(
				text,
				ZrScriptVersion.Zr2022,
				ZrScriptMode.CommandLike,
			);
			if (source.isOk()) {
				const sourceFile = source.unwrap();
				resolve(mainScript.createScript(sourceFile));
			} else {
				reject(source.unwrapErr().errors);
			}
		})
			.then(async scr => scr.execute())
			.then(output => {
				output.forEach(message => {
					Log({
						Level: LogLevel.Information,
						SourceContext: "Client Script",
						Template: message.gsub("{(.-)}", "{{%1}}")[0],
						Timestamp: DateTime.now().ToIsoDate(),
					});
				});
			})
			.catch((err: unknown) => {
				if (typeIs(err, "table")) {
					const messages = err as Array<ZrParserError | ZrRuntimeError>;
					for (const message of messages) {
						const errMessage = ZirconDebug.GetMessageForError(text, message);
						ZirconClient.ZirconErrorLog(errMessage);
					}
				}
			});
	}
}
export type ZirconClientDispatchService = typeof ZirconClientDispatchService;

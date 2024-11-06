import { RunService } from "@rbxts/services";
import type { ZrParserError } from "@rbxts/zirconium/out/Ast/Parser";
import type { ZrRuntimeError } from "@rbxts/zirconium/out/Runtime/Runtime";

import { $print } from "rbxts-transform-debug";
import { ZirconDebug } from "Shared/Debugging";

import { ZirconLogLevel } from "../Client/Types";
import { GetCommandService } from "../Services";
import Lazy from "../Shared/Lazy";
import Remotes, { RemoteId, ZirconNetworkMessageType } from "../Shared/Remotes";
import type { ReadonlyZirconPermissionSet } from "./Class/ZirconGroup";

const IsServer = RunService.IsServer();

namespace ZirconServer {
	/** The server registry for Zircon. */
	export const Registry = Lazy(() => {
		assert(IsServer, "Zircon Service only accessible on server");
		return GetCommandService("RegistryService");
	});

	/** The server dispatch for Zircon. */
	export const Dispatch = Lazy(() => {
		assert(IsServer, "Zircon Service only accessible on server");
		return GetCommandService("DispatchService");
	});

	export const Log = Lazy(() => {
		assert(IsServer, "Zircon Service only accessible on server");
		return GetCommandService("LogService");
	});

	if (RunService.IsServer()) {
		const StandardOutput = Remotes.Server.Create(RemoteId.StandardOutput);
		const StandardError = Remotes.Server.Create(RemoteId.StandardError);
		const DispatchToServer = Remotes.Server.Create(RemoteId.DispatchToServer);

		async function dispatch(player: Player, text: string): Promise<ReadonlyArray<string>> {
			return Dispatch.ExecuteScript(player, text).then(result => result.execute());
		}

		DispatchToServer.Connect((player, message) => {
			$print(player, message);
			dispatch(player, message)
				.then(output => {
					for (const message of output) {
						StandardOutput.SendToPlayer(player, {
							message,
							script: "zr",
							time: DateTime.now().UnixTimestamp,
							type: ZirconNetworkMessageType.ZirconiumOutput,
						});
					}
				})
				.catch((err: Array<ZrParserError | ZrRuntimeError>) => {
					for (const zrError of err) {
						const errStruct = ZirconDebug.GetMessageForError(message, zrError);
						StandardError.SendToPlayer(player, errStruct);
					}
				});
		});

		const GetPlayerOptions = Remotes.Server.Create(RemoteId.GetPlayerPermissions);
		GetPlayerOptions.SetCallback(player => {
			const group = Registry.GetHighestPlayerGroup(player);
			if (group) {
				return group.GetPermissions();
			}

			Log.Write(
				ZirconLogLevel.Wtf,
				"GetPlayerPermissions",
				`Could not fetch permissions for player {}`,
				{
					Variables: [player],
				},
			);
			return new ReadonlySet() as ReadonlyZirconPermissionSet;
		});
	}
}
export default ZirconServer;

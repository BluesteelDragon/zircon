import type { LogEvent } from "@rbxts/log";

import { $print } from "rbxts-transform-debug";

import type { ZirconLogData } from "../Client/Types";
import { ZirconLogLevel } from "../Client/Types";
import { GetCommandService } from "../Services";
import Lazy from "../Shared/Lazy";
import type {
	ZirconErrorOutput,
	ZirconStandardOutput,
	ZirconStructuredLogOutput,
} from "../Shared/remotes";
import Remotes, { RemoteId, ZirconNetworkMessageType } from "../Shared/remotes";

const StandardOutput = Remotes.Server.Create(RemoteId.StandardOutput);
const StandardError = Remotes.Server.Create(RemoteId.StandardError);
export namespace ZirconLogService {
	const outputMessages = new Array<ZirconErrorOutput | ZirconStandardOutput>();
	const Registry = Lazy(() => GetCommandService("RegistryService"));

	/**
	 * @param level
	 * @param tag
	 * @param message
	 * @param data
	 * @internal
	 */
	function writeServerLogMessage(
		level: ZirconLogLevel.Debug | ZirconLogLevel.Info | ZirconLogLevel.Warning,
		tag: string,
		message: string,
		data: ZirconLogData,
	): void {
		const outputMessage = identity<ZirconStandardOutput>({
			data,
			level,
			message,
			tag,
			time: DateTime.now().UnixTimestamp,
			type: ZirconNetworkMessageType.ZirconStandardOutputMessage,
		});
		outputMessages.push(outputMessage);
		const loggablePlayers = Registry.InternalGetPlayersWithPermission(
			"CanReceiveServerLogMessages",
		);
		StandardOutput.SendToPlayers(loggablePlayers, outputMessage);
	}

	/**
	 * @param level
	 * @param tag
	 * @param message
	 * @param data
	 * @internal
	 */
	function writeServerErrorMessage(
		level: ZirconLogLevel.Error | ZirconLogLevel.Wtf,
		tag: string,
		message: string,
		data: ZirconLogData,
	): void {
		const outputError = identity<ZirconErrorOutput>({
			data,
			level,
			message,
			tag,
			time: DateTime.now().UnixTimestamp,
			type: ZirconNetworkMessageType.ZirconStandardErrorMessage,
		});
		outputMessages.push(outputError);
		const loggablePlayers = Registry.InternalGetPlayersWithPermission(
			"CanReceiveServerLogMessages",
		);
		StandardError.SendToPlayers(loggablePlayers, outputError);
	}

	/** @internal */
	export function GetCurrentOutput(): Array<ZirconErrorOutput | ZirconStandardOutput> {
		return outputMessages;
	}

	export function WriteStructured(data: LogEvent): void {
		const outputError = identity<ZirconStructuredLogOutput>({
			data,
			message: "",
			time: 0,
			type: ZirconNetworkMessageType.ZirconSerilogMessage,
		});
		outputMessages.push(outputError);

		if (typeIs(data.LogToPlayer, "Instance") && data.LogToPlayer.IsA("Player")) {
			$print("Log to player", data.LogToPlayer);
			StandardOutput.SendToPlayer(data.LogToPlayer, outputError);
		} else {
			const loggablePlayers = Registry.InternalGetPlayersWithPermission(
				"CanReceiveServerLogMessages",
			);
			StandardOutput.SendToPlayers(loggablePlayers, outputError);
		}
	}

	/**
	 * Writes a message to either the output stream or input stream of Zircon.
	 *
	 * @param level
	 * @param tag
	 * @param message
	 * @param data
	 */
	export function Write(
		level: ZirconLogLevel,
		tag: string,
		message: string,
		data: ZirconLogData,
	): void {
		switch (level) {
			case ZirconLogLevel.Debug:
			case ZirconLogLevel.Info:
			case ZirconLogLevel.Warning: {
				writeServerLogMessage(level, tag, message, data);
				break;
			}
			case ZirconLogLevel.Error:
			case ZirconLogLevel.Wtf: {
				writeServerErrorMessage(level, tag, message, data);
				break;
			}
		}
	}
}
export type ZirconLogService = typeof ZirconLogService;

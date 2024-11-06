import type { LogEvent } from "@rbxts/log";
import Net from "@rbxts/net";
import type { ZrParserErrorCode } from "@rbxts/zirconium/out/Ast/Parser";
import type { ZrRuntimeErrorCode } from "@rbxts/zirconium/out/Runtime/Runtime";

import type { ReadonlyZirconPermissionSet } from "Server/Class/ZirconGroup";

import type { ZirconLogData, ZirconLogLevel } from "../Client/Types";
import createPermissionMiddleware from "./NetPermissionMiddleware";

export interface ZirconiumRuntimeErrorMessage {
	code: ZrRuntimeErrorCode;
	debug?: ZirconDebugInformation;
	message: string;
	script?: string;
	source?: readonly [number, number];
	time: number;
	type: ZirconNetworkMessageType.ZirconiumRuntimeError;
}

export interface ZirconDebugInformation {
	CodeLine: readonly [number, number];
	Line: string;
	LineAndColumn: readonly [number, number];
	TokenLinePosition: readonly [number, number];
	TokenPosition: readonly [number, number];
}

export const enum ZirconNetworkMessageType {
	ZirconiumOutput = "ZrStandardOutput",
	ZirconiumParserError = "ZrParserError",
	ZirconiumRuntimeError = "ZrRuntimeError",
	ZirconSerilogError = "ZirconStructuredError",
	ZirconSerilogMessage = "ZirconStructuredOutput",
	ZirconStandardErrorMessage = "ZirconStandardError",
	ZirconStandardOutputMessage = "ZirconStandardOutput",
}

export interface ZirconiumParserErrorMessage {
	code: ZrParserErrorCode;
	debug?: ZirconDebugInformation;
	message: string;
	script?: string;
	source?: readonly [number, number];
	time: number;
	type: ZirconNetworkMessageType.ZirconiumParserError;
}

export interface ZirconExecutionOutput {
	message: string;
	script?: string;
	time: number;
	type: ZirconNetworkMessageType.ZirconiumOutput;
}

export interface ZirconLogOutput {
	data: ZirconLogData;
	level:
		| ZirconLogLevel.Debug
		| ZirconLogLevel.Info
		| ZirconLogLevel.Verbose
		| ZirconLogLevel.Warning;
	message: string;
	tag: string;
	time: number;
	type: ZirconNetworkMessageType.ZirconStandardOutputMessage;
}

export interface ZirconLogErrorOutput {
	data: ZirconLogData;
	level: ZirconLogLevel.Error | ZirconLogLevel.Wtf;
	message: string;
	tag: string;
	time: number;
	type: ZirconNetworkMessageType.ZirconStandardErrorMessage;
}

export interface ZirconStructuredLogOutput {
	data: LogEvent;
	message: string;
	time: number;
	type: ZirconNetworkMessageType.ZirconSerilogMessage;
}

export const enum RemoteId {
	DispatchToServer = "ZrSiO4/DispatchToServer",
	GetPlayerPermissions = "ZrSiO4/GetPlayerPermissions",
	GetServerLogMessages = "ZrSOi4/GetServerLogMessages",
	GetZirconInitialized = "ZrSOi4/GetZirconInit",
	PlayerPermissionsUpdated = "ZrSOi4/PlayerPermissionsUpdated",
	StandardError = "ZrSiO4/StandardError",
	StandardOutput = "ZrSiO4/StandardOutput",
	ZirconInitialized = "ZrSOi4/ZirconInit",
}

export interface ZirconPermissionsEvent {
	readonlyPermissions: ReadonlyZirconPermissionSet;
}

export type ZirconStandardOutput =
	| ZirconExecutionOutput
	| ZirconLogOutput
	| ZirconStructuredLogOutput;
export type ZirconErrorOutput =
	| ZirconiumParserErrorMessage
	| ZirconiumRuntimeErrorMessage
	| ZirconLogErrorOutput;

const Remotes = Net.CreateDefinitions({
	[RemoteId.DispatchToServer]: Net.Definitions.ClientToServerEvent<[message: string]>([
		createPermissionMiddleware("CanExecuteZirconiumScripts"),
		Net.Middleware.RateLimit({ MaxRequestsPerMinute: 25 }),
		Net.Middleware.TypeChecking((value: unknown): value is string => typeIs(value, "string")),
	]),
	[RemoteId.GetPlayerPermissions]: Net.Definitions.ServerAsyncFunction<
		() => ReadonlyZirconPermissionSet
	>([Net.Middleware.RateLimit({ MaxRequestsPerMinute: 1 })]),
	[RemoteId.GetServerLogMessages]: Net.Definitions.ServerAsyncFunction<
		() => Array<ZirconErrorOutput | ZirconStandardOutput>
	>([createPermissionMiddleware("CanReceiveServerLogMessages")]),
	[RemoteId.GetZirconInitialized]: Net.Definitions.ServerAsyncFunction<() => boolean>(),
	[RemoteId.PlayerPermissionsUpdated]:
		Net.Definitions.ServerToClientEvent<[event: ZirconPermissionsEvent]>(),
	[RemoteId.StandardError]: Net.Definitions.ServerToClientEvent<[output: ZirconErrorOutput]>(),
	[RemoteId.StandardOutput]:
		Net.Definitions.ServerToClientEvent<[output: ZirconStandardOutput]>(),
	[RemoteId.ZirconInitialized]: Net.Definitions.ServerToClientEvent<[]>(),
});
export default Remotes;

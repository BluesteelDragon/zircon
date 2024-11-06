import type { LogEvent } from "@rbxts/log";

import type {
	ZirconiumParserErrorMessage,
	ZirconiumRuntimeErrorMessage,
	ZirconLogErrorOutput,
	ZirconLogOutput,
	ZirconStandardOutput,
} from "Shared/Remotes";

import { formatParse, formatTokensPlain } from "./Format";

export const enum ZirconContext {
	Server,
	Client,
}

export type ZirconTag = { toString(): string } | Instance | string;
export interface ZirconLoggable {
	toString(): string;
}

export interface ZirconDebugInfo {
	LineNumber: number;
	Name: string;
	Source: string;
}

/** Extra logging data relating to the specified log message. */
export interface ZirconLogData {
	/**
	 * Key value pairs of metadata set by the developer. This will show in the
	 * detailed log view.
	 *
	 * Will layout like:
	 *
	 * ```
	 * KEY1		VALUE1
	 * KEY2		VALUE2
	 * KEY3		VALUE3
	 * ```
	 */
	Attributes?: Record<string, defined>;
	CallDebugInfo?: ZirconDebugInfo;

	/** Function stack details. */
	FunctionStack?: Array<ZirconDebugInfo>;

	/** The player this message relates to. */
	Player?: Player;

	/**
	 * The stack trace of this message.
	 *
	 * This is populated by default via Zircon.
	 */
	StackTrace?: Array<string>;

	Variables: Array<unknown>;
}

export enum ZirconLogLevel {
	Verbose = 0,
	Debug,
	Info,
	Warning,
	Error,
	Wtf,
}

export const enum ZirconMessageType {
	LogOutputMessage = "log:output",
	PlainText = "plain",
	StructuredError = "slog:err",
	StructuredLog = "slog:output",
	ZirconiumError = "zr:error",
	ZirconiumExecutionMessage = "zr:execute",
	ZirconiumOutput = "zr:output",
	/** @deprecated */
	ZirconLogErrorMessage = "zirclog:error",
	/** @deprecated */
	ZirconLogOutputMessage = "zirclog:message",
}

export function isContextMessage(
	message: ConsoleMessage,
): message is
	| ZirconLogError
	| ZirconLogMessage
	| ZirconStructuredLogMessage
	| ZrErrorMessage
	| ZrOutputMessage {
	return (
		message.type === ZirconMessageType.ZirconLogErrorMessage ||
		message.type === ZirconMessageType.ZirconLogOutputMessage ||
		message.type === ZirconMessageType.ZirconiumOutput ||
		message.type === ZirconMessageType.ZirconiumError ||
		message.type === ZirconMessageType.StructuredLog
	);
}

// eslint-disable-next-line max-lines-per-function -- a 9
export function getMessageText(message: ConsoleMessage): string {
	switch (message.type) {
		case ZirconMessageType.ZirconLogOutputMessage: {
			const { data, message: outputMessage } = message.message;

			return (data.Variables?.size() ?? 0) > 0
				? formatTokensPlain(formatParse(outputMessage), data.Variables)
				: outputMessage;
		}
		case ZirconMessageType.ZirconLogErrorMessage: {
			const { data, message: outputMessage } = message.error;
			return (data.Variables?.size() ?? 0) > 0
				? formatTokensPlain(formatParse(outputMessage), data.Variables)
				: outputMessage;
		}
		case ZirconMessageType.ZirconiumOutput: {
			return message.message.message;
		}
		case ZirconMessageType.ZirconiumError: {
			return message.error.message;
		}
		case ZirconMessageType.ZirconiumExecutionMessage: {
			return message.source;
		}
		case ZirconMessageType.PlainText: {
			return message.message;
		}
		case ZirconMessageType.StructuredLog: {
			return message.data.Template;
		}
		default: {
			return "";
		}
	}
}

export function isLogMessage(
	message: ConsoleMessage,
): message is ZirconLogError | ZirconLogMessage | ZirconStructuredLogMessage {
	return (
		message.type === ZirconMessageType.ZirconLogErrorMessage ||
		message.type === ZirconMessageType.ZirconLogOutputMessage ||
		message.type === ZirconMessageType.StructuredLog
	);
}

export function getLogLevel(message: ConsoleMessage): ZirconLogLevel {
	switch (message.type) {
		case ZirconMessageType.ZirconLogOutputMessage: {
			return message.message.level;
		}
		case ZirconMessageType.StructuredLog: {
			return message.data.Level as unknown as ZirconLogLevel;
		}
		case ZirconMessageType.ZirconLogErrorMessage: {
			return message.error.level;
		}
		case ZirconMessageType.ZirconiumError: {
			return ZirconLogLevel.Error;
		}
		case ZirconMessageType.ZirconiumOutput: {
			return ZirconLogLevel.Info;
		}
		default: {
			return ZirconLogLevel.Info;
		}
	}
}

interface ZirconContextMessage {
	readonly context: ZirconContext;
}

export interface ZrOutputMessage extends ZirconContextMessage {
	readonly message: ZirconStandardOutput;
	readonly script?: string;
	readonly type: ZirconMessageType.ZirconiumOutput;
}
export interface ConsolePlainMessage {
	readonly message: string;
	readonly type: ZirconMessageType.PlainText;
}

export interface ConsoleSyntaxMessage {
	readonly source: string;
	readonly type: ZirconMessageType.ZirconiumExecutionMessage;
}

export interface ZrErrorMessage extends ZirconContextMessage {
	readonly error: ZirconiumParserErrorMessage | ZirconiumRuntimeErrorMessage;
	readonly script?: string;
	readonly type: ZirconMessageType.ZirconiumError;
}
export interface ConsoleLuauError extends ZirconContextMessage {
	readonly error: string;
	readonly stackTrace?: Array<string>;
	readonly type: "luau:error";
}

/** @deprecated */
export interface ZirconLogMessage extends ZirconContextMessage {
	readonly message: ZirconLogOutput;
	readonly type: ZirconMessageType.ZirconLogOutputMessage;
}

export interface ZirconStructuredLogMessage extends ZirconContextMessage {
	readonly data: LogEvent;
	readonly type: ZirconMessageType.StructuredLog;
}

export interface ZirconLogErrorData {}

/** @deprecated */
export interface ZirconLogError extends ZirconContextMessage {
	readonly error: ZirconLogErrorOutput;
	readonly type: ZirconMessageType.ZirconLogErrorMessage;
}

export type ConsoleMessage =
	| ConsoleLuauError
	| ConsolePlainMessage
	| ConsoleSyntaxMessage
	| ZirconLogError
	| ZirconLogMessage
	| ZirconStructuredLogMessage
	| ZrErrorMessage
	| ZrOutputMessage;

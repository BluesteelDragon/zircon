import type { LogEvent } from "@rbxts/log";
import { LogLevel } from "@rbxts/log";
import type { PropertyToken } from "@rbxts/message-templates";
import { MessageTemplateParser } from "@rbxts/message-templates";
import {
	DestructureMode,
	TemplateTokenKind,
} from "@rbxts/message-templates/out/MessageTemplateToken";
import { RbxSerializer } from "@rbxts/message-templates/out/RbxSerializer";
import { RunService } from "@rbxts/services";
import type ZrContext from "@rbxts/zirconium/out/Data/Context";
import type { ZrInputStream, ZrOutputStream } from "@rbxts/zirconium/out/Data/Stream";

import type { ZirconFunction } from "./ZirconFunction";

export interface ReadonlyZirconContext {
	GetExecutor(): Player;
	GetFunctionName(): string;
}

export interface ZirconBeforeContext extends ReadonlyZirconContext {
	GetInput(): ZrInputStream;
}
export interface ZirconAfterContext extends ReadonlyZirconContext {
	GetInput(): ZrInputStream;
	GetLogs(): ReadonlyArray<LogEvent>;
	GetOutput(): ZrOutputStream;
}

export class ZirconContext
	implements ReadonlyZirconContext, ZirconBeforeContext, ZirconAfterContext
{
	private readonly logs = new Array<LogEvent>();

	constructor(
		private readonly innerContext: ZrContext,
		private readonly executingFunction: ZirconFunction<any, any>,
	) {}

	public GetExecutor(): Player {
		const executor = this.innerContext.getExecutor();
		assert(executor);
		return executor;
	}

	/**
	 * Writes a log response to the executing player.
	 *
	 * @param level - The log level to emit.
	 * @param template - The template string.
	 * @param args - The arguments to the template string.
	 */
	// eslint-disable-next-line max-lines-per-function -- a 6
	private Log(level: LogLevel, template: string, ...args: Array<unknown>): void {
		if (RunService.IsServer()) {
			void import("../Services/LogService").then(log => {
				const message: Writable<LogEvent> = {
					Level: level,
					LogToPlayer: this.GetExecutor(),
					SourceContext: `(function '${this.executingFunction.GetName()}')`,
					Template: template,
					Timestamp: DateTime.now().ToIsoDate(),
				};

				const tokens = MessageTemplateParser.GetTokens(template);
				const propertyTokens = tokens.filter(
					(token): token is PropertyToken => token.kind === TemplateTokenKind.Property,
				);

				let index = 0;
				for (const token of propertyTokens) {
					const argument = args[index++];

					if (index <= args.size()) {
						if (argument !== undefined) {
							if (token.destructureMode === DestructureMode.ToString) {
								message[token.propertyName] = tostring(argument);
							} else {
								message[token.propertyName] = typeIs(argument, "table") ? argument : RbxSerializer.Serialize(argument);
							}
						}
					}
				}

				log.ZirconLogService.WriteStructured(message);
				this.logs.push(message);
			});
		} else {
			void import("../Client/index").then(({ default: client }) => {
				const log: LogEvent = {
					Level: level,
					LogToPlayer: this.GetExecutor(),
					SourceContext: `(function '${this.executingFunction.GetName()}')`,
					Template: template,
					Timestamp: DateTime.now().ToIsoDate(),
				};
				client.StructuredLog(log);
				this.logs.push(log);
			});
		}
	}

	/**
	 * Logs an information message to the calling player.
	 *
	 * @param template - The template string.
	 * @param args - The template string args.
	 */
	public LogInfo(template: string, ...args: Array<unknown>): void {
		this.Log(LogLevel.Information, template, ...args);
	}

	/**
	 * Logs a warning message to the calling player.
	 *
	 * @param template - The template string.
	 * @param args - The template string args.
	 */
	public LogWarning(template: string, ...args: Array<unknown>): void {
		this.Log(LogLevel.Warning, template, ...args);
	}

	/**
	 * Logs an error message to the calling player.
	 *
	 * @param template - The template string.
	 * @param args - The template string args.
	 */
	public LogError(template: string, ...args: Array<unknown>): void {
		this.Log(LogLevel.Error, template, ...args);
	}

	public GetLogs(): ReadonlyArray<LogEvent> {
		return this.logs;
	}

	/**
	 * Gets the output stream for the `|` pipe operator.
	 *
	 * @returns The output stream.
	 */
	public GetOutput(): ZrOutputStream {
		return this.innerContext.getOutput();
	}

	/**
	 * Gets the input stream for the `|` pipe operator.
	 *
	 * @returns The input stream.
	 */
	public GetInput(): ZrInputStream {
		return this.innerContext.getInput();
	}

	/**
	 * Gets the name of the calling function.
	 *
	 * @returns The name of the calling function.
	 */
	public GetFunctionName(): string {
		return this.executingFunction.GetName();
	}
}

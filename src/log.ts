import type { LogEvent } from "@rbxts/log";
import type { ILogEventSink } from "@rbxts/log/out/Core";
import { RunService } from "@rbxts/services";

import Client from "./Client";
import Server from "./Server";

export namespace Logging {
	class LogEventConsoleSink implements ILogEventSink {
		public Emit(message: LogEvent): void {
			if (RunService.IsServer()) {
				Server.Log.WriteStructured(message);
			} else {
				Client.StructuredLog(message);
			}
		}
	}

	export function Console(): LogEventConsoleSink {
		return new LogEventConsoleSink();
	}
}

import type { LogEvent } from "@rbxts/log";
import { MessageTemplateParser, PlainTextMessageTemplateRenderer } from "@rbxts/message-templates";

export { default as ZirconClient } from "./Client";
export { default as ZirconServer } from "./Server";
export { ZirconConfigurationBuilder, ZirconDefaultGroup } from "Class/zircon-configuration-builder";
export { ZirconEnumBuilder } from "Class/ZirconEnumBuilder";
export { ZirconFunctionBuilder } from "Class/ZirconFunctionBuilder";
export { ZirconNamespaceBuilder } from "Class/ZirconNamespaceBuilder";
export { Logging as Log } from "log";
export { zirconTypeIs as TypeIs, zirconTypeOf as TypeOf } from "Shared/type-id";

/** The Zircon console framework. */
namespace Zircon {
	/**
	 * Converts a log event to a plain text string.
	 *
	 * @param event - The log event to convert.
	 * @returns A string representation of the log event.
	 */
	export function LogEventToString(event: LogEvent): string {
		const plainTextRenderer = new PlainTextMessageTemplateRenderer(
			MessageTemplateParser.GetTokens(event.Template),
		);
		return plainTextRenderer.Render(event);
	}
}

export default Zircon;

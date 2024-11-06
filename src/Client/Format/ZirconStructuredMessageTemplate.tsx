import type { PropertyToken, TextToken } from "@rbxts/message-templates";
import { MessageTemplateRenderer } from "@rbxts/message-templates";
import type { Token } from "@rbxts/message-templates/out/MessageTemplateToken";
import { DestructureMode } from "@rbxts/message-templates/out/MessageTemplateToken";

import type { ZirconThemeDefinition } from "Client/UIKit/ThemeContext";

import { formatRichText } from ".";

export class ZirconStructuredMessageTemplateRenderer extends MessageTemplateRenderer {
	constructor(
		tokens: Array<Token>,
		private readonly theme: ZirconThemeDefinition,
	) {
		super(tokens);
	}

	protected RenderPropertyToken(propertyToken: PropertyToken, value: unknown): string {
		if (propertyToken.destructureMode === DestructureMode.Destructure) {
			return formatRichText(value, undefined, this.theme);
		} else if (propertyToken.destructureMode === DestructureMode.ToString) {
			return tostring(value);
		}

		return formatRichText(value, undefined, this.theme);
	}

	protected RenderTextToken(textToken: TextToken): string {
		return textToken.text;
	}
}

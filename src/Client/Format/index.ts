import { MessageTemplateParser, TemplateTokenKind } from "@rbxts/message-templates";
import t from "@rbxts/t";
import ZrTextStream from "@rbxts/zirconium/out/Ast/TextStream";

import type { ZirconThemeDefinition } from "Client/UIKit/ThemeContext";
import { getRichTextColor3, ZirconTheme } from "Client/UIKit/ThemeContext";

interface PlainTextToken {
	Type: "Text";
	Value: string;
}
interface VariableToken {
	Type: "Variable";
	Value: string;
}
type FormatToken = PlainTextToken | VariableToken;
// eslint-disable-next-line max-lines-per-function -- a 14
export function formatParse(formatString: string): Array<FormatToken> {
	const tokens = new Array<FormatToken>();
	const stream = new ZrTextStream(formatString);
	const isNotEndVariableBracket = (char: string): boolean => char !== "}";

	/** Reads while the specified condition is met, or the end of stream. */
	function readWhile(condition: (str: string) => boolean): string {
		let source = "";
		while (stream.hasNext() && condition(stream.peek())) {
			source += stream.next();
		}

		return source;
	}

	let str = "";
	while (stream.hasNext()) {
		const char = stream.next();
		if (char === "{") {
			tokens.push(
				identity<PlainTextToken>({
					Type: "Text",
					Value: str,
				}),
			);
			str = "";
			const variable = readWhile(isNotEndVariableBracket);
			tokens.push(
				identity<VariableToken>({
					Type: "Variable",
					Value: variable,
				}),
			);
			stream.next();
		} else {
			str += char;
		}
	}

	if (str !== "") {
		tokens.push(
			identity<PlainTextToken>({
				Type: "Text",
				Value: str,
			}),
		);
	}

	return tokens;
}

const isArray = t.array(t.any);
const isMap = t.map(t.string, t.any);

// eslint-disable-next-line max-lines-per-function, ts/default-param-last -- a 13
export function formatRichText(value: unknown, level = 1, theme: ZirconThemeDefinition): string {
	if (typeIs(value, "string")) {
		return getRichTextColor3(theme, "Green", value);
	} else if (typeIs(value, "number") || typeIs(value, "boolean")) {
		return getRichTextColor3(theme, "Cyan", tostring(value));
	} else if (isArray(value)) {
		if (level > 1) {
			return getRichTextColor3(theme, "Grey", `[...]`);
		}

		return getRichTextColor3(
			ZirconTheme,
			"Grey",
			`[${value.map(value_ => formatRichText(value_, level + 1, theme)).join(", ")}]`,
		);
	} else if (isMap(value)) {
		if (level > 1) {
			return getRichTextColor3(theme, "Grey", `{...}`);
		}

		const array = new Array<string>();
		for (const [key, value_] of value) {
			array.push(
				`${getRichTextColor3(theme, "White", key)}: ${formatRichText(value_, level + 1, theme)}`,
			);
		}

		return getRichTextColor3(theme, "Grey", `{${array.join(", ")}}`);
	} else if (typeIs(value, "Instance")) {
		return getRichTextColor3(theme, "Orange", value.GetFullName());
	} else if (value === undefined) {
		return getRichTextColor3(theme, "Cyan", "undefined");
	}

	return getRichTextColor3(theme, "Yellow", `<${tostring(value)}>`);
}

function formatPlainText(value: unknown, level = 1): string {
	if (typeIs(value, "string") || typeIs(value, "number") || typeIs(value, "boolean")) {
		return tostring(value);
	} else if (isArray(value)) {
		return level > 1
			? `[...]`
			: `[${value.map(value_ => formatPlainText(value_, level + 1)).join(", ")}]`;
	} else if (isMap(value)) {
		if (level > 1) {
			return `{...}`;
		}

		const array = new Array<string>();
		for (const [key, value_] of value) {
			array.push(`${key}: ${formatPlainText(value_, level + 1)}`);
		}

		return `{${array.join(", ")}}`;
	} else if (typeIs(value, "Instance")) {
		return value.GetFullName();
	} else if (value === undefined) {
		return "undefined";
	}

	return tostring(value);
}

export function formatTokensPlain(
	tokens: ReadonlyArray<FormatToken>,
	variables: Array<unknown>,
): string {
	let resultingStr = "";
	let indexOffset = 0;
	for (const token of tokens) {
		if (token.Type === "Text") {
			resultingStr += token.Value;
		} else if (token.Value === "") {
			if (indexOffset > variables.size()) {
				resultingStr += `{${token.Value}}`;
			} else {
				resultingStr += formatPlainText(variables[indexOffset]);
				indexOffset += 1;
			}
		}
	}

	return resultingStr;
}

export function formatMessageTemplate(
	template: string,
	values: Record<string, defined>,
): string | undefined {
	const tokens = MessageTemplateParser.GetTokens(template);
	for (const token of tokens) {
		if (token.kind === TemplateTokenKind.Property) {
			const value = values[token.propertyName];
			return formatRichText(value, undefined, ZirconTheme);
		}
	}
}

export function formatTokens(
	tokens: ReadonlyArray<FormatToken>,
	variables: Array<unknown>,
): string {
	let resultingStr = "";
	let indexOffset = 0;
	for (const token of tokens) {
		if (token.Type === "Text") {
			resultingStr += token.Value;
		} else if (token.Value === "") {
			if (indexOffset > variables.size()) {
				resultingStr += getRichTextColor3(ZirconTheme, "Red", `{${token.Value}}`);
			} else {
				resultingStr += formatRichText(variables[indexOffset], undefined, ZirconTheme);
				indexOffset += 1;
			}
		}
	}

	return resultingStr;
}

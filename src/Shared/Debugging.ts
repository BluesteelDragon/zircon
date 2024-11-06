import type { Node } from "@rbxts/zirconium/out/Ast/Nodes/NodeTypes";
import type { ZrParserError } from "@rbxts/zirconium/out/Ast/Parser";
import type { Token } from "@rbxts/zirconium/out/Ast/Tokens/Tokens";
import type { ZrRuntimeError } from "@rbxts/zirconium/out/Runtime/Runtime";

import { $dbg } from "rbxts-transform-debug";

import type {
	ZirconDebugInformation,
	ZirconiumParserErrorMessage,
	ZirconiumRuntimeErrorMessage,
} from "./remotes";
import { ZirconNetworkMessageType } from "./remotes";

/** @internal */
export namespace ZirconDebug {
	/** @internal */
	export function IsParserError(err: ZrParserError | ZrRuntimeError): err is ZrParserError {
		return err.code >= 1000;
	}

	/** @internal */
	// eslint-disable-next-line max-lines-per-function -- a
	export function GetDebugInformationForNode(
		source: string,
		node: Node,
	): undefined | ZirconDebugInformation {
		const startPosition = node.startPos ?? 0;
		const endPosition = node.endPos ?? startPosition;

		let col = 0;
		let row = 1;
		let lineStart = 0;
		let lineEnd = source.size();
		let reachedToken = false;
		let reachedEndToken = false;
		for (let i = 0; i < source.size(); i++) {
			const char = source.sub(i + 1, i + 1);

			if (i === startPosition) {
				reachedToken = true;
			}

			if (i === endPosition) {
				reachedEndToken = true;
			}

			if (char === "\n") {
				lineEnd = i;
				if (!reachedToken) {
					lineStart = i + 1;
				} else if (reachedEndToken) {
					break;
				}

				row += 1;
				col = 1;
			} else {
				col += 1;
			}
		}

		if (reachedToken) {
			return $dbg(
				identity<ZirconDebugInformation>({
					CodeLine: [lineStart, lineEnd],
					Line: source.sub(lineStart + 1, lineEnd + 1),
					LineAndColumn: [row, col],
					TokenLinePosition: [startPosition - lineStart, endPosition - lineStart],
					TokenPosition: [startPosition, endPosition],
				}),
			);
		}
	}

	/** @internal */
	// eslint-disable-next-line max-lines-per-function -- a 2
	export function GetDebugInformationForToken(
		source: string,
		token: Token,
	): undefined | ZirconDebugInformation {
		let col = 0;
		let row = 1;
		let lineStart = 0;
		let lineEnd = source.size();
		let reachedToken = false;
		for (let i = 0; i < source.size(); i++) {
			const char = source.sub(i + 1, i + 1);

			if (i === token.startPos) {
				reachedToken = true;
			}

			if (char === "\n") {
				lineEnd = i;
				if (reachedToken) {
					break;
				}

				lineStart = i + 1;
				row += 1;
				col = 1;
			} else {
				col += 1;
			}
		}

		if (reachedToken) {
			return $dbg(
				identity<ZirconDebugInformation>({
					CodeLine: [lineStart, lineEnd],
					Line: source.sub(lineStart + 1, lineEnd + 1),
					LineAndColumn: [row, col],
					TokenLinePosition: [token.startPos - lineStart, token.endPos - lineStart],
					TokenPosition: [token.startPos, token.endPos],
				}),
			);
		}
	}

	/** @internal */
	export function GetMessageForError(
		source: string,
		zrError: ZrParserError | ZrRuntimeError,
	): ZirconiumParserErrorMessage | ZirconiumRuntimeErrorMessage {
		if (IsParserError(zrError)) {
			const debug = zrError.token
				? GetDebugInformationForToken(source, zrError.token)
				: undefined;

			return {
				code: zrError.code,
				debug,
				message: zrError.message,
				script: "zr",
				source: debug ? debug.LineAndColumn : undefined,
				time: DateTime.now().UnixTimestamp,
				type: ZirconNetworkMessageType.ZirconiumParserError,
			};
		}

		const debug = zrError.node ? GetDebugInformationForNode(source, zrError.node) : undefined;

		return {
			code: zrError.code,
			debug,
			message: zrError.message,
			script: "zr",
			time: DateTime.now().UnixTimestamp,
			type: ZirconNetworkMessageType.ZirconiumRuntimeError,
		};
	}
}

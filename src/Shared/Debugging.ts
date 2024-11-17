import type { Node } from "@cwyvern/zirconium/out/ast/nodes/node-types";
import type { ZrParserError } from "@cwyvern/zirconium/out/ast/parser";
import type { Token } from "@cwyvern/zirconium/out/ast/tokens/tokens";
import type { ZrRuntimeError } from "@cwyvern/zirconium/out/runtime/runtime";

import { $dbg } from "rbxts-transform-debug";

import type {
	ZirconDebugInformation,
	ZirconiumParserErrorMessage,
	ZirconiumRuntimeErrorMessage,
} from "./remotes";
import { ZirconNetworkMessageType } from "./remotes";

/** @internal */
export namespace ZirconDebug {
	/**
	 * @param err
	 * @internal
	 */
	export function IsParserError(err: ZrParserError | ZrRuntimeError): err is ZrParserError {
		return err.code >= 1000;
	}

	/**
	 * @param source
	 * @param node
	 * @internal
	 */
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
		for (let index = 0; index < source.size(); index++) {
			const char = source.sub(index + 1, index + 1);

			if (index === startPosition) {
				reachedToken = true;
			}

			if (index === endPosition) {
				reachedEndToken = true;
			}

			if (char === "\n") {
				lineEnd = index;
				if (!reachedToken) {
					lineStart = index + 1;
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

	/**
	 * @param source
	 * @param token
	 * @internal
	 */
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
		for (let index = 0; index < source.size(); index++) {
			const char = source.sub(index + 1, index + 1);

			if (index === token.startPos) {
				reachedToken = true;
			}

			if (char === "\n") {
				lineEnd = index;
				if (reachedToken) {
					break;
				}

				lineStart = index + 1;
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

	/**
	 * @param source
	 * @param zrError
	 * @internal
	 */
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

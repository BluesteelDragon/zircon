import type { Action } from "@rbxts/rodux";
import type Rodux from "@rbxts/rodux";
import { createReducer } from "@rbxts/rodux";

import { $dbg } from "rbxts-transform-debug";

import type { ConsoleMessage, ZirconContext } from "../../../Types";
import { ZirconLogLevel } from "../../../Types";

export const enum ConsoleActionName {
	AddHistory = "AddHistory",
	AddOutput = "AddOutput",
	RemoveFilter = "RemoveFilter",
	SetClientExecutionEnabled = "SetClientExecutionEnabled",
	SetConfiguration = "SetConsoleConfiguration",
	SetConsoleVisible = "SetConsoleVisible",
	SetFilter = "SetFilter",
	UpdateFilter = "UpdateFilter",
}

export interface ActionSetConsoleVisible extends Action<ConsoleActionName.SetConsoleVisible> {
	visible: boolean;
}
export interface ActionSetConsoleConfiguration extends Action<ConsoleActionName.SetConfiguration> {
	autoFocusTextBox: boolean;
	bindKeys: Array<Enum.KeyCode>;
	executionEnabled: boolean;
	hotkeyEnabled: boolean;
	logDetailsPaneEnabled: boolean;
	showTagsInOutput: boolean;
}

export interface ActionAddOutput extends Action<ConsoleActionName.AddOutput> {
	message: ConsoleMessage;
}

export interface ActionSetClientExecutionEnabled
	extends Action<ConsoleActionName.SetClientExecutionEnabled> {
	enabled: boolean;
}

export interface ActionAddHistory extends Action<ConsoleActionName.AddHistory> {
	message: string;
}

export interface ActionSetFilter extends Action<ConsoleActionName.SetFilter> {
	filter: ConsoleFilter;
}

export interface ActionRemoveFilter extends Action<ConsoleActionName.RemoveFilter> {
	filter: keyof ConsoleFilter;
}

export interface ActionUpdateFilter
	extends Action<ConsoleActionName.UpdateFilter>,
		Partial<ConsoleFilter> {}

export type ConsoleActions =
	| ActionAddHistory
	| ActionAddOutput
	| ActionRemoveFilter
	| ActionSetClientExecutionEnabled
	| ActionSetConsoleConfiguration
	| ActionSetConsoleVisible
	| ActionSetFilter
	| ActionUpdateFilter;

export interface ConsoleFilter {
	Context?: ZirconContext;
	Level?: ZirconLogLevel;
	Levels: Set<ZirconLogLevel>;
	SearchQuery?: string;
	Tail?: boolean;
}

export interface ConsoleReducer {
	autoFocusTextBox: boolean;
	bindingKeys: Array<Enum.KeyCode>;
	canExecuteLocalScripts: boolean;
	executionEnabled: boolean;
	filter: ConsoleFilter;
	history: Array<string>;
	hotkeyEnabled: boolean;
	logDetailsPaneEnabled: boolean;
	output: Array<ConsoleMessage>;
	showTagsInOutput: boolean;
	visible: boolean;
}

export const DEFAULT_FILTER = new Set([
	ZirconLogLevel.Error,
	ZirconLogLevel.Info,
	ZirconLogLevel.Warning,
	ZirconLogLevel.Wtf,
]);

const INITIAL_STATE: ConsoleReducer = {
	autoFocusTextBox: true,
	bindingKeys: [],
	canExecuteLocalScripts: false,
	executionEnabled: false,
	filter: {
		Levels: new Set([
			ZirconLogLevel.Error,
			ZirconLogLevel.Info,
			ZirconLogLevel.Warning,
			ZirconLogLevel.Wtf,
		]),
	},
	history: [],
	hotkeyEnabled: false,
	logDetailsPaneEnabled: false,
	output: [],
	showTagsInOutput: true,
	visible: false,
};

const actions: Rodux.ActionHandlers<ConsoleReducer, ConsoleActions> = {
	[ConsoleActionName.AddHistory]: (state, { message }) => {
		return {
			...state,
			history: [...state.history, message],
		};
	},
	[ConsoleActionName.AddOutput]: (state, { message }) => {
		return $dbg({
			...state,
			output: [...state.output, message],
		});
	},
	[ConsoleActionName.RemoveFilter]: (state, { filter }) => {
		return {
			...state,
			filter: { ...state.filter, [filter]: undefined },
		};
	},
	[ConsoleActionName.SetClientExecutionEnabled]: (state, { enabled }) => {
		return { ...state, canExecuteLocalScripts: enabled };
	},
	[ConsoleActionName.SetConfiguration]: (
		state,
		{
			autoFocusTextBox,
			bindKeys,
			executionEnabled,
			hotkeyEnabled,
			logDetailsPaneEnabled,
			showTagsInOutput,
		},
	) => {
		return {
			...state,
			autoFocusTextBox,
			bindingKeys: bindKeys,
			executionEnabled,
			hotkeyEnabled,
			logDetailsPaneEnabled,
			showTagsInOutput,
		};
	},
	[ConsoleActionName.SetConsoleVisible]: (state, { visible }) => ({ ...state, visible }),
	[ConsoleActionName.SetFilter]: (state, { filter }) => {
		return {
			...state,
			filter,
		};
	},
	[ConsoleActionName.UpdateFilter]: (state, options) => {
		return {
			...state,
			filter: { ...state.filter, ...options },
		};
	},
};

const consoleReducer = createReducer(INITIAL_STATE, actions);
export default consoleReducer;

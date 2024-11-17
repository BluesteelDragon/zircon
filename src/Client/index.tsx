import type { LogEvent } from "@rbxts/log";
import type { ComponentInstanceHandle } from "@rbxts/roact";
import Roact from "@rbxts/roact";
import RoactRodux from "@rbxts/roact-rodux";
import { ContextActionService, Players, RunService, StarterGui } from "@rbxts/services";

import { $dbg, $package } from "rbxts-transform-debug";

import { GetCommandService } from "../Services";
import Lazy from "../Shared/Lazy";
import type { ZirconiumParserErrorMessage, ZirconiumRuntimeErrorMessage } from "../Shared/remotes";
import Remotes, { RemoteId, ZirconNetworkMessageType } from "../Shared/remotes";
import ZirconClientStore from "./BuiltInConsole/Store";
import { ConsoleActionName } from "./BuiltInConsole/Store/_reducers/console-reducer";
import ZirconDockedConsole from "./BuiltInConsole/UI/DockedConsole";
import ZirconTopBar from "./BuiltInConsole/UI/TopbarMenu";
import { ZirconContext, ZirconLogLevel, ZirconMessageType } from "./Types";
import ThemeContext, { BuiltInThemes } from "./UIKit/ThemeContext";

const IsClient = RunService.IsClient();

const enum Const {
	ActionId = "ZirconConsoleActivate",
}

export enum ConsoleType {
	DockedConsole,
}

interface ConsoleOptions {
	AutoFocusTextBox?: boolean;
	ConsoleComponent?: ((props: defined) => Roact.Element) | typeof Roact.Component;
	EnableTags?: boolean;
	Keys?: Array<Enum.KeyCode>;
	/** @internal */
	Theme?: keyof BuiltInThemes;
}

namespace ZirconClient {
	let handle: ComponentInstanceHandle | undefined;
	let isVisible = false;

	export const Registry = Lazy(() => {
		assert(IsClient, "Zircon Service only accessible on client");
		return GetCommandService("ClientRegistryService");
	});

	export const Dispatch = Lazy(() => {
		assert(IsClient, "Zircon Service only accessible on client");
		return GetCommandService("ClientDispatchService");
	});

	/**
	 * @param data
	 * @internal
	 */
	export function StructuredLog(data: LogEvent): void {
		ZirconClientStore.dispatch({
			message: {
				context: ZirconContext.Client,
				data,
				type: ZirconMessageType.StructuredLog,
			},
			type: ConsoleActionName.AddOutput,
		});
	}

	/**
	 * @param data
	 * @internal
	 */
	export function ZirconErrorLog(
		data: ZirconiumParserErrorMessage | ZirconiumRuntimeErrorMessage,
	): void {
		ZirconClientStore.dispatch({
			message: {
				context: ZirconContext.Client,
				error: data,
				type: ZirconMessageType.ZirconiumError,
			},
			type: ConsoleActionName.AddOutput,
		});
	}

	let topbarEnabledState = false;

	function activateBuiltInConsole(
		_: string,
		state: Enum.UserInputState,
	): Enum.ContextActionResult.Sink {
		const { hotkeyEnabled } = ZirconClientStore.getState();

		print("test", state);

		if (state === Enum.UserInputState.End && $dbg(hotkeyEnabled)) {
			SetVisible(!isVisible);
		}

		return Enum.ContextActionResult.Sink;
	}

	export function SetVisible(visible: boolean): void {
		const isTopbarEnabled = StarterGui.GetCore("TopbarEnabled");

		if (visible) {
			if (isTopbarEnabled) {
				topbarEnabledState = true;
				StarterGui.SetCore("TopbarEnabled", false);
			}
		} else if (topbarEnabledState) {
			StarterGui.SetCore("TopbarEnabled", true);
		}

		ZirconClientStore.dispatch({ type: ConsoleActionName.SetConsoleVisible, visible });

		isVisible = visible;
	}

	let consoleBound = false;

	// eslint-disable-next-line max-lines-per-function -- a 9
	function BindConsoleIntl(options: ConsoleOptions): void {
		const {
			AutoFocusTextBox = true,
			ConsoleComponent = ZirconDockedConsole,
			EnableTags = true,
			Keys = [Enum.KeyCode.F10],
			Theme = "Plastic",
		} = options;

		const GetPlayerOptions = Remotes.Client.WaitFor(RemoteId.GetPlayerPermissions).expect();
		GetPlayerOptions.CallServerAsync()
			// eslint-disable-next-line max-lines-per-function -- a 10
			.then(permissions => {
				if (permissions.has("CanAccessConsole")) {
					ContextActionService.UnbindAction(Const.ActionId);
					ContextActionService.BindActionAtPriority(
						Const.ActionId,
						(_, state) => {
							if (state === Enum.UserInputState.End) {
								SetVisible(!isVisible);
							}

							return Enum.ContextActionResult.Sink;
						},
						false,
						Enum.ContextActionPriority.High.Value,
						...Keys,
					);

					handle = Roact.mount(
						<ThemeContext.Provider value={BuiltInThemes[Theme]}>
							<RoactRodux.StoreProvider store={ZirconClientStore}>
								<>
									<ZirconTopBar />
									<ConsoleComponent />
								</>
							</RoactRodux.StoreProvider>
						</ThemeContext.Provider>,
						Players.LocalPlayer.FindFirstChildOfClass("PlayerGui"),
					);
				}

				ZirconClientStore.dispatch({
					autoFocusTextBox: AutoFocusTextBox,
					bindKeys: Keys,
					executionEnabled: permissions.has("CanExecuteZirconiumScripts"),
					hotkeyEnabled: permissions.has("CanAccessConsole"),
					logDetailsPaneEnabled: permissions.has("CanViewLogMetadata"),
					showTagsInOutput: EnableTags,
					type: ConsoleActionName.SetConfiguration,
				});
			})
			.catch(err => {
				print(err);
			});
	}

	/**
	 * Binds the built-in Zircon console. Default Key-bind: F10.
	 *
	 * @param options - The console options.
	 *
	 *   _This is not required, you can use your own console solution!_.
	 */
	export function Init(options: ConsoleOptions = {}): void {
		if (consoleBound) {
			return;
		}

		const initialized = Remotes.Client.Get(RemoteId.GetZirconInitialized)
			.CallServerAsync()
			.expect();

		consoleBound = true;
		if (!initialized) {
			Remotes.Client.WaitFor(RemoteId.ZirconInitialized)
				.then(remote => {
					const connection = remote.Connect(() => {
						BindConsoleIntl(options);
						connection.Disconnect();
					});
				})
				.catch(err => {
					print(err);
				});
		} else {
			BindConsoleIntl(options);
		}
	}

	if (IsClient) {
		Remotes.Client.WaitFor(RemoteId.StandardOutput)
			// eslint-disable-next-line max-lines-per-function -- a 11
			.then(StandardOutput => {
				// eslint-disable-next-line max-lines-per-function -- a 12
				StandardOutput.Connect(message => {
					switch (message.type) {
						case ZirconNetworkMessageType.ZirconiumOutput: {
							ZirconClientStore.dispatch({
								message: {
									context: ZirconContext.Server,
									message,
									type: ZirconMessageType.ZirconiumOutput,
								},
								type: ConsoleActionName.AddOutput,
							});
							break;
						}
						case ZirconNetworkMessageType.ZirconSerilogMessage: {
							ZirconClientStore.dispatch({
								message: {
									context: ZirconContext.Server,
									data: message.data,
									type: ZirconMessageType.StructuredLog,
								},
								type: ConsoleActionName.AddOutput,
							});
							break;
						}
						case ZirconNetworkMessageType.ZirconStandardOutputMessage: {
							ZirconClientStore.dispatch({
								message: {
									context: ZirconContext.Server,
									message,
									type: ZirconMessageType.ZirconLogOutputMessage,
								},
								type: ConsoleActionName.AddOutput,
							});
							break;
						}
					}
				});

				ZirconClientStore.dispatch({
					message: {
						context: ZirconContext.Client,
						message: {
							data: {
								Variables: [],
							},
							level: ZirconLogLevel.Debug,
							message: `Loaded Zircon v${$package.version}`,
							tag: "INIT",
							time: DateTime.now().UnixTimestamp,
							type: ZirconNetworkMessageType.ZirconStandardOutputMessage,
						},
						type: ZirconMessageType.ZirconLogOutputMessage,
					},
					type: ConsoleActionName.AddOutput,
				});
			})
			.catch(err => {
				print(err);
			});

		Remotes.Client.WaitFor(RemoteId.StandardError)
			.then(StandardError => {
				StandardError.Connect(err => {
					switch (err.type) {
						case ZirconNetworkMessageType.ZirconiumParserError:
						case ZirconNetworkMessageType.ZirconiumRuntimeError: {
							ZirconClientStore.dispatch({
								message: {
									context: ZirconContext.Server,
									error: err,
									type: ZirconMessageType.ZirconiumError,
								},
								type: ConsoleActionName.AddOutput,
							});
							break;
						}
						case ZirconNetworkMessageType.ZirconStandardErrorMessage: {
							ZirconClientStore.dispatch({
								message: {
									context: ZirconContext.Server,
									error: err,
									type: ZirconMessageType.ZirconLogErrorMessage,
								},
								type: ConsoleActionName.AddOutput,
							});
							break;
						}
					}
				});
			})
			.catch(err => {
				print(err);
			});
	}
}
export default ZirconClient;

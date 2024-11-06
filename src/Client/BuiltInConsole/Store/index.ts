import Rodux from "@rbxts/rodux";

import type { ConsoleActions, ConsoleReducer } from "./_reducers/console-reducer";
import consoleReducer from "./_reducers/console-reducer";

/**
 * The Rodux client store for Zircon.
 *
 * @internal
 */
const ZirconClientStore = new Rodux.Store<ConsoleReducer, ConsoleActions>(consoleReducer);
type ZirconClientStore = Rodux.Store<ConsoleReducer, ConsoleActions>;
export default ZirconClientStore;

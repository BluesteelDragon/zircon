import type { ZrValue } from "@rbxts/zirconium/out/Data/Locals";

import type { ZirconEnum } from "./ZirconEnum";
import type { ZirconFunction } from "./ZirconFunction";
import type { ZirconGroupConfiguration } from "./ZirconGroupBuilder";
import type { ZirconNamespace } from "./ZirconNamespace";
import type { ZirconValidator } from "./ZirconTypeValidator";

export type ZirconClientScopedGlobal = ZirconEnum<any> | ZirconFunction<any, any> | ZirconNamespace;

export interface ZirconClientConfiguration {
	readonly Groups: ReadonlyArray<ZirconGroupConfiguration>;
	readonly Registry: Array<ZirconClientScopedGlobal>;
}

export interface DefaultAdminGroupOptions {
	readonly GroupId?: number;
	readonly GroupRank: number;
}

export interface DefaultUserGroupOptions {
	readonly CanAccessConsole: boolean;
}

export class ZirconClientConfigurationBuilder {
	public configuration: Writable<ZirconClientConfiguration> = {
		Groups: [],
		Registry: [],
	};

	/**
	 * Adds the specified function to Zircon.
	 *
	 * Note: This function is available to all users who can access this
	 * console, therefore is considered insecure.
	 *
	 * Do not use it for anything important. Important stuff should be a server
	 * function.
	 *
	 * @param functionType - The function to add.
	 * @returns This client configuration builder.
	 */
	public AddFunction<A extends readonly ZirconValidator<unknown, unknown>[], R extends void | ZrValue>(
		functionType: ZirconFunction<A, R>,
	): this {
		this.configuration.Registry = [...this.configuration.Registry, functionType];
		return this;
	}

	public Build(): ZirconClientConfiguration {
		return this.configuration;
	}
}

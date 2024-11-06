import { LogLevel } from "@rbxts/log";
import type { ZrValue } from "@rbxts/zirconium/out/Data/Locals";

import ZirconServer from "Server";

import type { ZirconAfterContext, ZirconBeforeContext } from "./ZirconContext";
import type { ZirconEnum } from "./ZirconEnum";
import type { ZirconFunction } from "./ZirconFunction";
import type { ZirconGroupConfiguration } from "./ZirconGroupBuilder";
import { ZirconGroupBuilder } from "./ZirconGroupBuilder";
import type { ZirconNamespace } from "./ZirconNamespace";
import type { ZirconValidator } from "./ZirconTypeValidator";

export type ZirconGlobal = ZirconEnum<any> | ZirconFunction<any, any> | ZirconNamespace;

export type ZirconScopedGlobal = readonly [
	type: ZirconEnum<any> | ZirconFunction<any, any> | ZirconNamespace,
	groups: ReadonlyArray<string>,
];

export enum ExecutionAction {
	Execute,
	Skip,
}

export interface Hooks {
	AfterExecute: (context: ZirconAfterContext) => void;
	BeforeExecute: (context: ZirconBeforeContext) => ExecutionAction;
}

type MappedArray<T> = { [P in keyof T]: ReadonlyArray<T[P]> };

export interface ZirconConfiguration {
	readonly GroupGlobalsMap: ReadonlyMap<string, ZirconGlobal>;
	readonly Groups: ReadonlyArray<ZirconGroupConfiguration>;
	readonly Hooks: MappedArray<Hooks>;
	/** @deprecated */
	readonly Registry: Array<ZirconScopedGlobal>;
}

export const enum ZirconDefaultGroup {
	Admin = "admin",
	Creator = "creator",
	User = "user",
}

export interface DefaultAdminGroupOptions {
	readonly GroupId?: number;
	readonly GroupRank: number;
}

export interface DefaultUserGroupOptions {
	readonly CanAccessConsole: boolean;
}

export class ZirconConfigurationBuilder {
	public configuration: Writable<ZirconConfiguration> = {
		GroupGlobalsMap: new Map(),
		Groups: [],
		Hooks: {
			AfterExecute: [],
			BeforeExecute: [],
		},
		Registry: [],
	};

	/**
	 * Creates a group, given the specified configuration.
	 *
	 * @param rank - The rank. This is used for group priority.
	 * @param id - The id of the group to create.
	 * @param configurator - The configurator function to mutate the config.
	 * @returns The configuration builder for chaining.
	 */
	public CreateGroup(
		rank: number,
		id: string,
		configurator: (group: ZirconGroupBuilder) => ZirconGroupBuilder,
	): this {
		const group = new ZirconGroupBuilder(this, rank, id);
		configurator(group).Add();
		return this;
	}

	/**
	 * Creates a default `creator` group. This will refer to either the game
	 * creator, or group creator.
	 *
	 * @returns
	 */
	public CreateDefaultCreatorGroup(): ZirconConfigurationBuilder {
		return new ZirconGroupBuilder(this, 255, ZirconDefaultGroup.Creator)
			.BindToCreator()
			.SetPermissions({
				CanAccessFullZirconEditor: true,
				CanExecuteZirconiumScripts: true,
				CanReceiveServerLogMessages: true,
				CanViewLogMetadata: true,
			})
			.Add();
	}

	/**
	 * Creates a default `admin` group.
	 *
	 * If this place is a group-owned place, and no arguments are provided
	 * anyone in the group with a rank equal or higher to `254` is considered an
	 * administrator.
	 *
	 * If this isn't a group game, or you want a custom rule for `admin` you
	 * need to provide a configuration callback.
	 *
	 * @returns
	 */
	public CreateDefaultAdminGroup(): ZirconConfigurationBuilder;
	public CreateDefaultAdminGroup(
		builder: (group: ZirconGroupBuilder) => ZirconGroupBuilder,
	): ZirconConfigurationBuilder;
	public CreateDefaultAdminGroup(options: DefaultAdminGroupOptions): ZirconConfigurationBuilder;
	public CreateDefaultAdminGroup(
		builderOrOptions?:
			| ((group: ZirconGroupBuilder) => ZirconGroupBuilder)
			| DefaultAdminGroupOptions,
	): ZirconConfigurationBuilder {
		const group = new ZirconGroupBuilder(this, 254, ZirconDefaultGroup.Admin).SetPermissions({
			CanAccessFullZirconEditor: true,
			CanExecuteZirconiumScripts: true,
			CanReceiveServerLogMessages: true,
			CanViewLogMetadata: true,
		});
		if (typeIs(builderOrOptions, "function")) {
			builderOrOptions(group);
		} else {
			const { GroupId = game.CreatorId, GroupRank = 254 } = builderOrOptions ?? {};

			if (game.CreatorType === Enum.CreatorType.Group || GroupId !== game.CreatorId) {
				group.BindToGroupRank(GroupId, GroupRank);
			} else {
				ZirconServer.Log.WriteStructured({
					Level: LogLevel.Warning,
					SourceContext: "CreateDefaultAdminGroup",
					Template:
						"Implicit administrator groups only work in group places, try explicitly setting the admin group config",
					Timestamp: DateTime.now().ToIsoDate(),
				});
			}
		}

		return group.Add();
	}

	/**
	 * Creates a default `user` group, this refers to _anyone_ and shouldn't be
	 * used for more sensitive things.
	 *
	 * @param options - The permissions options for the default user group.
	 * @returns This configuration builder.
	 */
	public CreateDefaultUserGroup(options?: DefaultUserGroupOptions): ZirconConfigurationBuilder {
		return new ZirconGroupBuilder(this, 1, ZirconDefaultGroup.User)
			.SetPermissions({
				CanAccessConsole: options?.CanAccessConsole ?? false,
			})
			.BindToEveryone()
			.Add();
	}

	/**
	 * Adds the specified namespace to Zircon.
	 *
	 * @param namespace - The namespace to add.
	 * @param groups - The groups this namespace is available to.
	 * @returns This configuration builder.
	 */
	public AddNamespace(namespace: ZirconNamespace, groups: ReadonlyArray<string>): this {
		this.configuration.Registry = [...this.configuration.Registry, [namespace, groups]];
		return this;
	}

	/**
	 * Adds the specified enum to Zircon.
	 *
	 * @param enumType - The enum to add.
	 * @param groups - The groups this enum is available to.
	 * @returns This configuration builder.
	 */
	public AddEnum<K extends string>(enumType: ZirconEnum<K>, groups: ReadonlyArray<string>): this {
		this.configuration.Registry = [...this.configuration.Registry, [enumType, groups]];
		return this;
	}

	/**
	 * Adds the specified function to Zircon.
	 *
	 * @param functionType - The function to add.
	 * @param groups - The groups this function is available to.
	 * @returns This configuration builder.
	 */
	public AddFunction<A extends ReadonlyArray<ZirconValidator<any, any>>, R extends void | ZrValue = void>(functionType: ZirconFunction<A, R>, groups: ReadonlyArray<string>): this {
		this.configuration.Registry = [...this.configuration.Registry, [functionType, groups]];
		return this;
	}

	/**
	 * Adds the specified function to Zircon.
	 *
	 * @deprecated
	 * @param functions - The functions to add to this config.
	 * @param groupIds - The groups this function is available to.
	 * @returns This configuration builder.
	 */
	public AddFunctionsToGroups(
		functions: ReadonlyArray<ZirconFunction<any, any>>,
		groupIds: ReadonlyArray<string>,
	): this {
		const registry = [...this.configuration.Registry];
		for (const func of functions) {
			registry.push([func, groupIds]);
		}

		this.configuration.Registry = registry;
		return this;
	}

	/**
	 * @param hookName
	 * @param hookCallback
	 * @param hookName
	 * @param hookCallback
	 * @returns This configuration builder.
	 * @internal
	 */
	public AddHook<K extends keyof Hooks>(hookName: K, hookCallback: Hooks[K]): this {
		const hooks = [...this.configuration.Hooks[hookName], hookCallback];
		this.configuration.Hooks[hookName] = hooks as MappedArray<Hooks>[K];
		return this;
	}

	/**
	 * Returns a logging configuration, which creates a `creator` group with the
	 * permission to read server output, and a `user` group.
	 *
	 * @returns A built configuration object with a logging creator group, and a
	 *   default user group.
	 */
	public static logging(): ZirconConfiguration {
		return new ZirconConfigurationBuilder()
			.CreateGroup(255, ZirconDefaultGroup.Creator, (group) =>
				group.BindToCreator().SetPermissions({
					CanAccessFullZirconEditor: false,
					CanExecuteZirconiumScripts: false,
					CanRecieveServerLogMessages: true,
				}),
			)
			.CreateDefaultUserGroup()
			.Build();
	}

	/**
	 * Returns a default configuration, which includes the `creator`, `admin`,
	 * and `user` groups.
	 *
	 * @returns The default configuration builder that can be mutated.
	 */
	public static default(): ZirconConfigurationBuilder {
		if (game.CreatorType === Enum.CreatorType.Group) {
			return new ZirconConfigurationBuilder()
				.CreateDefaultCreatorGroup()
				.CreateDefaultAdminGroup()
				.CreateDefaultUserGroup();
		}

		return new ZirconConfigurationBuilder()
			.CreateDefaultCreatorGroup()
			.CreateDefaultUserGroup();
	}

	public Build(): ZirconConfiguration {
		return this.configuration;
	}
}

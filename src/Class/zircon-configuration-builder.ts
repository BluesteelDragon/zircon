import type { ZrValue } from "@cwyvern/zirconium/out/data/locals";
import { LogLevel } from "@rbxts/log";

import ZirconServer from "Server";

import type { ZirconGroupConfiguration } from "./zircon-group-builder";
import { ZirconGroupBuilder } from "./zircon-group-builder";
import type { ZirconAfterContext, ZirconBeforeContext } from "./ZirconContext";
import type { ZirconEnum } from "./ZirconEnum";
import type { ZirconFunction } from "./ZirconFunction";
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

const DEFAULT_ADMIN_ZR_RANK = 254;
const DEFAULT_ADMIN_RANK = 254;
const DEFAULT_CREATOR_ZR_RANK = 255;
const DEFAULT_USER_ZR_RANK = 1;

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
	private readonly groups = new Array<ZirconGroupConfiguration>();
	private readonly hooks: MappedArray<Hooks> = {
		AfterExecute: [],
		BeforeExecute: [],
	};

	private registry = new Array<ZirconScopedGlobal>();

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
		const groupConfig = configurator(new ZirconGroupBuilder(rank, id)).Build();
		this.groups.push(groupConfig);
		return this;
	}

	/**
	 * Creates a default `creator` group. This will refer to either the game
	 * creator, or group creator.
	 *
	 * @returns The configuration builder for chaining.
	 */
	public CreateDefaultCreatorGroup(): this {
		const groupConfig = new ZirconGroupBuilder(
			DEFAULT_CREATOR_ZR_RANK,
			ZirconDefaultGroup.Creator,
		)
			.BindToCreator()
			.SetPermissions({
				CanAccessFullZirconEditor: true,
				CanExecuteZirconiumScripts: true,
				CanReceiveServerLogMessages: true,
				CanViewLogMetadata: true,
			})
			.Build();
		this.groups.push(groupConfig);
		return this;
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
	public CreateDefaultAdminGroup(): this;
	public CreateDefaultAdminGroup(
		builder: (group: ZirconGroupBuilder) => ZirconGroupBuilder,
	): ZirconConfigurationBuilder;
	public CreateDefaultAdminGroup(options: DefaultAdminGroupOptions): this;
	// eslint-disable-next-line max-lines-per-function -- FIXME: Maybe I'll make this smaller eventually.
	public CreateDefaultAdminGroup(
		builderOrOptions?:
			| ((group: ZirconGroupBuilder) => ZirconGroupBuilder)
			| DefaultAdminGroupOptions,
	): this {
		let group = new ZirconGroupBuilder(
			DEFAULT_ADMIN_ZR_RANK,
			ZirconDefaultGroup.Admin,
		).SetPermissions({
			CanAccessFullZirconEditor: true,
			CanExecuteZirconiumScripts: true,
			CanReceiveServerLogMessages: true,
			CanViewLogMetadata: true,
		});
		if (typeIs(builderOrOptions, "function")) {
			group = builderOrOptions(group);
		} else {
			const { GroupId = game.CreatorId, GroupRank = DEFAULT_ADMIN_RANK } =
				builderOrOptions ?? {};

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

		const groupConfig = group.Build();
		this.groups.push(groupConfig);

		return this;
	}

	/**
	 * Creates a default `user` group, this refers to _anyone_ and shouldn't be
	 * used for more sensitive things.
	 *
	 * @param options - The permissions options for the default user group.
	 * @returns The configuration builder for chaining.
	 */
	public CreateDefaultUserGroup(options?: DefaultUserGroupOptions): this {
		const groupConfig = new ZirconGroupBuilder(DEFAULT_USER_ZR_RANK, ZirconDefaultGroup.User)
			.SetPermissions({
				CanAccessConsole: options?.CanAccessConsole ?? false,
			})
			.BindToEveryone()
			.Build();
		this.groups.push(groupConfig);
		return this;
	}

	/**
	 * Adds the specified namespace to Zircon.
	 *
	 * @param namespace - The namespace to add.
	 * @param groups - The groups this namespace is available to.
	 * @returns The configuration builder for chaining.
	 */
	public AddNamespace(namespace: ZirconNamespace, groups: ReadonlyArray<string>): this {
		this.registry.push([namespace, groups]);
		return this;
	}

	/**
	 * Adds the specified enum to Zircon.
	 *
	 * @param enumType - The enum to add.
	 * @param groups - The groups this enum is available to.
	 * @returns The configuration builder for chaining.
	 */
	public AddEnum<K extends string>(enumType: ZirconEnum<K>, groups: ReadonlyArray<string>): this {
		this.registry.push([enumType, groups]);
		return this;
	}

	/**
	 * Adds the specified function to Zircon.
	 *
	 * @param functionType - The function to add.
	 * @param groups - The groups this function is available to.
	 * @returns The configuration builder for chaining.
	 */
	public AddFunction<
		A extends ReadonlyArray<ZirconValidator<any, any>>,
		R extends void | ZrValue = void,
		// eslint-disable-next-line antfu/consistent-list-newline -- Shush too
	>(functionType: ZirconFunction<A, R>, groups: ReadonlyArray<string>): this {
		this.registry.push([functionType, groups]);
		return this;
	}

	/**
	 * Adds the specified function to Zircon.
	 *
	 * @deprecated
	 * @param functions - The functions to add to this config.
	 * @param groupIds - The groups this function is available to.
	 * @returns The configuration builder for chaining.
	 */
	public AddFunctionsToGroups(
		functions: ReadonlyArray<ZirconFunction<any, any>>,
		groupIds: ReadonlyArray<string>,
	): this {
		const registry = [...this.registry];
		for (const func of functions) {
			registry.push([func, groupIds]);
		}

		this.registry = registry;
		return this;
	}

	/**
	 * Adds a hook to the configuration that will be called before or after a
	 * script is executed in the console, depending on the type.
	 *
	 * @param hookName - What type of hook this is.
	 * @param hookCallback - The callback to run when this hook is invoked.
	 * @returns The configuration builder for chaining.
	 * @internal
	 */
	public AddHook<K extends keyof Hooks>(hookName: K, hookCallback: Hooks[K]): this {
		const hooks = [...this.hooks[hookName], hookCallback];
		this.hooks[hookName] = hooks as MappedArray<Hooks>[K];
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
			.CreateGroup(DEFAULT_CREATOR_ZR_RANK, ZirconDefaultGroup.Creator, group => {
				return group.BindToCreator().SetPermissions({
					CanAccessFullZirconEditor: false,
					CanExecuteZirconiumScripts: false,
					CanReceiveServerLogMessages: true,
				});
			})
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
		return {
			GroupGlobalsMap: new Map(),
			Groups: this.groups,
			Hooks: this.hooks,
			Registry: this.registry,
		};
	}
}

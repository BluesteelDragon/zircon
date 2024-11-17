import type { ZrEnum } from "@cwyvern/zirconium/out/data/enum";
import type { ZrValue } from "@cwyvern/zirconium/out/data/locals";
import type ZrLuauFunction from "@cwyvern/zirconium/out/data/luau-function";
import type { ZrObjectUserdata } from "@cwyvern/zirconium/out/data/userdata";
import { RunService } from "@rbxts/services";

import type { ZirconEnum } from "Class/ZirconEnum";
import type { ZirconFunction } from "Class/ZirconFunction";
import type { ZirconGroupConfiguration } from "Class/zircon-group-builder";
import { ZirconBindingType } from "Class/zircon-group-builder";
import type { ZirconNamespace } from "Class/ZirconNamespace";

export interface ZirconRobloxGroupBinding {
	GroupId: number;
	GroupRank: number;
}

export type ZirconPermissionSet = Set<keyof ZirconPermissions>;
export type ReadonlyZirconPermissionSet = ReadonlySet<keyof ZirconPermissions>;

export interface ZirconPermissions {
	/** Whether or not this group can access the console using the shortcut key. */
	readonly CanAccessConsole: boolean;

	/**
	 * Whether or not this group has full access to the Zircon Editor for
	 * Zirconium.
	 *
	 * @deprecated @hidden.
	 */
	readonly CanAccessFullZirconEditor: boolean;
	/** Whether or not this group is allowed to execute Zirconium scripts. */
	readonly CanExecuteZirconiumScripts: boolean;

	/**
	 * Whether or not this group can receive `Zircon.Log*` messages from the
	 * server.
	 */
	readonly CanReceiveServerLogMessages: boolean;

	/**
	 * Whether or not this user can view more information about a log message by
	 * clicking on it.
	 */
	readonly CanViewLogMetadata: boolean;
}

export enum ZirconGroupType {
	User,
	Moderator,
	Administrator,
}

export default class ZirconUserGroup {
	private readonly enums = new Map<string, ZrEnum>();
	private readonly functions = new Map<string, ZrLuauFunction>();
	private readonly members = new WeakSet<Player>();

	private readonly namespaces = new Map<string, ZrObjectUserdata<defined>>();
	private readonly permissions: ZirconPermissionSet;

	constructor(
		private readonly id: number,
		private readonly name: string,
		private readonly configuration: ZirconGroupConfiguration,
	) {
		const permissionSet = new Set<keyof ZirconPermissions>();
		for (const [name, enabled] of pairs(configuration.Permissions)) {
			if (typeIs(enabled, "boolean") && enabled) {
				permissionSet.add(name);
			}
		}

		this.permissions = permissionSet;
	}

	public AddMember(player: Player): void {
		this.members.add(player);
	}

	public GetMembers(): ReadonlySet<Player> {
		return this.members;
	}

	public HasMember(player: Player): boolean {
		return this.members.has(player);
	}

	public GetConfiguration(): ZirconGroupConfiguration {
		return this.configuration;
	}

	public CanJoinGroup(player: Player): boolean {
		const group = this.configuration;
		let canJoinGroup = false;

		if ((group.BindType & ZirconBindingType.Group) !== 0) {
			const matchesGroup = group.Groups;
			for (const group of matchesGroup) {
				canJoinGroup ||= typeIs(group.GroupRoleOrRank, "string")
					? player.GetRoleInGroup(group.GroupId) === group.GroupRoleOrRank
					: player.GetRankInGroup(group.GroupId) >= group.GroupRoleOrRank;
			}
		}

		if ((group.BindType & ZirconBindingType.UserIds) !== 0) {
			canJoinGroup ||= group.UserIds.includes(player.UserId);
		}

		if ((group.BindType & ZirconBindingType.Everyone) !== 0) {
			canJoinGroup = true;
		}

		if ((group.BindType & ZirconBindingType.Creator) !== 0) {
			if (RunService.IsStudio()) {
				canJoinGroup = true;
			}

			canJoinGroup ||=
				game.CreatorType === Enum.CreatorType.Group
					? player.GetRankInGroup(game.CreatorId) >= 255
					: game.CreatorId === player.UserId;
		}

		return canJoinGroup;
	}

	public GetName(): string {
		return this.name;
	}

	public GetRank(): number {
		return this.id;
	}

	public GetPermissions(): ReadonlyZirconPermissionSet {
		return this.permissions;
	}

	public GetPermission<K extends keyof ZirconPermissions>(name: K): ZirconPermissions[K] {
		return this.configuration.Permissions[name];
	}

	/**
	 * @param func
	 * @internal
	 */
	public RegisterFunction(func: ZirconFunction<any, any>): void {
		this.functions.set(func.GetName(), func);
	}

	/**
	 * @param enumerable
	 * @internal
	 */
	public RegisterEnum(enumerable: ZirconEnum<any>): void {
		this.enums.set(enumerable.getEnumName(), enumerable);
	}

	/**
	 * @param namespace
	 * @internal
	 */
	public RegisterNamespace(namespace: ZirconNamespace): void {
		this.namespaces.set(namespace.GetName(), namespace.ToUserdata());
	}

	/** @internal */
	public _getFunctions(): ReadonlyMap<string, ZrLuauFunction> {
		return this.functions;
	}

	/** @internal */
	public _getNamespaces(): ReadonlyMap<string, ZrValue> {
		return this.namespaces;
	}

	/** @internal */
	public _getEnums(): ReadonlyMap<string, ZrValue> {
		return this.enums;
	}
}

import type { ZirconPermissions } from "Server/Class/ZirconGroup";

import type { ZirconConfigurationBuilder } from "./ZirconConfigurationBuilder";

export interface ZirconGroupLink {
	readonly GroupId: number;
	readonly GroupRoleOrRank: number | string;
}

export enum ZirconBindingType {
	Creator = 1 << 0,
	Group = 1 << 1,
	UserIds = 1 << 2,
	Everyone = 1 << 30,
}

export interface ZirconGroupConfiguration {
	readonly BindType: ZirconBindingType;
	readonly Groups: ReadonlyArray<ZirconGroupLink>;
	readonly Id: string;
	readonly Permissions: ZirconPermissions;
	readonly Rank: number;
	readonly UserIds: Array<number>;
}

export class ZirconGroupBuilder {
	public bindType: ZirconBindingType = 0;
	public groupLink = new Array<ZirconGroupLink>();

	public permissions: ZirconPermissions = {
		CanAccessConsole: true,
		CanAccessFullZirconEditor: false,
		CanExecuteZirconiumScripts: false,
		CanReceiveServerLogMessages: false,
		CanViewLogMetadata: false,
	};

	public userIds = new Array<number>();

	constructor(
		private parent: ZirconConfigurationBuilder,
		private rank: number,
		private id: string,
	) {}

	/** @deprecated @hidden */
	public SetPermission<K extends keyof ZirconPermissions>(
		key: K,
		value: ZirconPermissions[K],
	): this {
		this.permissions[key] = value;
		return this;
	}

	/**
	 * Sets the permissions applicable to this group.
	 *
	 * @param permissions The permissions to override
	 */
	public SetPermissions(permissions: Partial<ZirconPermissions>): this {
		this.permissions = {
			CanAccessConsole: permissions.CanAccessConsole ?? this.permissions.CanAccessConsole,
			CanAccessFullZirconEditor:
				permissions.CanAccessFullZirconEditor ?? this.permissions.CanAccessFullZirconEditor,
			CanExecuteZirconiumScripts:
				permissions.CanExecuteZirconiumScripts ??
				this.permissions.CanExecuteZirconiumScripts,
			CanReceiveServerLogMessages:
				permissions.CanReceiveServerLogMessages ??
				this.permissions.CanReceiveServerLogMessages,
			CanViewLogMetadata:
				permissions.CanViewLogMetadata ??
				permissions.CanReceiveServerLogMessages ??
				this.permissions.CanViewLogMetadata,
		};
		return this;
	}

	/**
	 * Binds this group to the specified group, and the role.
	 *
	 * @param groupId The group id
	 * @param groupRole The role (string)
	 */
	public BindToGroupRole(groupId: number, groupRole: string): this {
		this.groupLink.push({
			GroupId: groupId,
			GroupRoleOrRank: groupRole,
		});
		return this;
	}

	/**
	 * Binds this group to the specified user ids
	 * @param userIds The user ids
	 */
	public BindToUserIds(userIds: readonly number[]) {
		this.bindType |= ZirconBindingType.UserIds;
		for (const userId of userIds) {
			this.userIds.push(userId);
		}
		return this;
	}

	/**
	 * Binds this group to _all players_.
	 */
	public BindToEveryone() {
		this.bindType |= ZirconBindingType.Everyone;
		return this;
	}

	/**
	 * Binds the group to the creator of this game - either the group owner (if a group game) or the place owner.
	 */
	public BindToCreator(): this {
		this.bindType |= ZirconBindingType.Creator;
		return this;
	}

	/**
	 * Binds this group to the specified group role and rank.
	 *
	 * @param groupId The group id
	 * @param groupRank The group rank (number)
	 */
	public BindToGroupRank(groupId: number, groupRank: number): this {
		this.bindType |= ZirconBindingType.Group;
		this.groupLink.push({
			GroupId: groupId,
			GroupRoleOrRank: groupRank,
		});
		return this;
	}

	/** @internal */
	public Add(): ZirconConfigurationBuilder {
		const { configuration } = this.parent;
		configuration.Groups = [
			...configuration.Groups,
			{
				BindType: this.bindType,
				Groups: this.groupLink,
				Id: this.id,
				Permissions: this.permissions,
				Rank: this.rank,
				UserIds: this.userIds,
			},
		];

		return this.parent;
	}
}

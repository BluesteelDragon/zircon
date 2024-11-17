import type { ZirconPermissions } from "Server/Class/ZirconGroup";

export interface ZirconGroupLink {
	readonly GroupId: number;
	readonly GroupRoleOrRank: number | string;
}

/* eslint-disable ts/prefer-literal-enum-member, ts/no-magic-numbers -- A bitwise flag pack is used for the binding type. */
export enum ZirconBindingType {
	Creator = 1 << 0,
	Everyone = 1 << 30,
	Group = 1 << 1,
	/** Do not use this enum value outside of initializing the builder. */
	None = 0,
	UserIds = 1 << 2,
}
/* eslint-enable ts/prefer-literal-enum-member, ts/no-magic-numbers */

export interface ZirconGroupConfiguration {
	readonly BindType: ZirconBindingType;
	readonly Groups: ReadonlyArray<ZirconGroupLink>;
	readonly Id: string;
	readonly Permissions: ZirconPermissions;
	readonly Rank: number;
	readonly UserIds: Array<number>;
}

export class ZirconGroupBuilder {
	private readonly groupLink = new Array<ZirconGroupLink>();
	private readonly userIds = new Array<number>();

	private bindType: ZirconBindingType = ZirconBindingType.None;

	private permissions: ZirconPermissions = {
		CanAccessConsole: true,
		CanAccessFullZirconEditor: false,
		CanExecuteZirconiumScripts: false,
		CanReceiveServerLogMessages: false,
		CanViewLogMetadata: false,
	};

	constructor(
		private readonly rank: number,
		private readonly id: string,
	) {}

	/**
	 * Sets the permissions applicable to this group.
	 *
	 * @param permissions - The permissions to override.
	 * @returns This group builder.
	 */
	public SetPermissions(permissions: Partial<ZirconPermissions>): this {
		this.permissions = { ...this.permissions, ...permissions };
		// TODO: Remove me if this works fine.
		// this.permissions = {
		// 	CanAccessConsole: permissions.CanAccessConsole ?? this.permissions.CanAccessConsole,
		// 	CanAccessFullZirconEditor:
		// 		permissions.CanAccessFullZirconEditor ?? this.permissions.CanAccessFullZirconEditor,
		// 	CanExecuteZirconiumScripts:
		// 		permissions.CanExecuteZirconiumScripts ??
		// 		this.permissions.CanExecuteZirconiumScripts,
		// 	CanReceiveServerLogMessages:
		// 		permissions.CanReceiveServerLogMessages ??
		// 		this.permissions.CanReceiveServerLogMessages,
		// 	CanViewLogMetadata:
		// 		permissions.CanViewLogMetadata ??
		// 		permissions.CanReceiveServerLogMessages ??
		// 		this.permissions.CanViewLogMetadata,
		// };

		return this;
	}

	/**
	 * Binds this group to the specified group, and the role.
	 *
	 * @param groupId - The group id to check the role from.
	 * @param groupRole - The role (string).
	 * @returns This group builder.
	 */
	public BindToGroupRole(groupId: number, groupRole: string): this {
		this.groupLink.push({
			GroupId: groupId,
			GroupRoleOrRank: groupRole,
		});

		return this;
	}

	/**
	 * Binds this group to the specified user ids.
	 *
	 * @param userIds - A list of the user ids to bind this group to.
	 * @returns This group builder.
	 */
	public BindToUserIds(userIds: ReadonlyArray<number>): this {
		this.bindType |= ZirconBindingType.UserIds;
		for (const userId of userIds) {
			this.userIds.push(userId);
		}

		return this;
	}

	/**
	 * Binds this group to _all players_.
	 *
	 * @returns This group builder.
	 */
	public BindToEveryone(): this {
		this.bindType |= ZirconBindingType.Everyone;
		return this;
	}

	/**
	 * Binds the group to the creator of this game - either the group owner (if
	 * a group game) or the place owner.
	 *
	 * @returns This group builder.
	 */
	public BindToCreator(): this {
		this.bindType |= ZirconBindingType.Creator;
		return this;
	}

	/**
	 * Binds this group to the specified group role and rank.
	 *
	 * @param groupId - The group id to check the rank from.
	 * @param groupRank - The group rank (number).
	 * @returns This group builder.
	 */
	public BindToGroupRank(groupId: number, groupRank: number): this {
		this.bindType |= ZirconBindingType.Group;
		this.groupLink.push({
			GroupId: groupId,
			GroupRoleOrRank: groupRank,
		});
		return this;
	}

	/**
	 * Builds the configuration from the builder and returns it.
	 *
	 * @returns A ZirconGroupConfiguration object.
	 */
	public Build(): ZirconGroupConfiguration {
		return {
			BindType: this.bindType,
			Groups: this.groupLink,
			Id: this.id,
			Permissions: this.permissions,
			Rank: this.rank,
			UserIds: this.userIds,
		};
	}
}

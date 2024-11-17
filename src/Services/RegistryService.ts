import type { ZrValue } from "@cwyvern/zirconium/out/data/locals";
import ZrPlayerScriptContext from "@cwyvern/zirconium/out/runtime/player-script-context";
import type ZrScriptContext from "@cwyvern/zirconium/out/runtime/script-context";
import { Players } from "@rbxts/services";

import type { ZirconConfiguration, ZirconScopedGlobal } from "Class/zircon-configuration-builder";
import { ZirconConfigurationBuilder } from "Class/zircon-configuration-builder";
import { ZirconEnum } from "Class/ZirconEnum";
import { ZirconFunction } from "Class/ZirconFunction";
import { ZirconNamespace } from "Class/ZirconNamespace";
import { $print } from "rbxts-transform-debug";
import Remotes, { RemoteId } from "Shared/remotes";

import type { ZirconPermissions } from "../Server/Class/ZirconGroup";
import ZirconUserGroup from "../Server/Class/ZirconGroup";
import { toArray } from "../Shared/Collections";

export namespace ZirconRegistryService {
	const contexts = new Map<Player, Array<ZrScriptContext>>();
	const groups = new Map<string, ZirconUserGroup>();
	const playerGroupMap = new Map<Player, Array<ZirconUserGroup>>();
	const unregisteredTypes = new Array<ZirconScopedGlobal>();
	let initialized = false;

	function* playerFunctionIterator(player: Player): Generator<[string, ZrValue], boolean> {
		const groups = playerGroupMap.get(player);
		if (!groups) {
			return false;
		}

		for (const group of groups) {
			for (const value of group._getFunctions()) {
				yield value;
			}

			for (const value of group._getNamespaces()) {
				yield value;
			}

			for (const value of group._getEnums()) {
				yield value;
			}
		}

		return true;
	}

	/**
	 * @param player
	 * @internal
	 */
	export function GetScriptContextsForPlayer(player: Player): Array<ZrScriptContext> {
		let contextArray: Array<ZrScriptContext>;
		if (!contexts.has(player)) {
			contextArray = [];
			const context = new ZrPlayerScriptContext(player);
			for (const [name, fun] of playerFunctionIterator(player)) {
				context.registerGlobal(name, fun);
			}

			contextArray.push(context);
			contexts.set(player, contextArray);
		} else {
			contextArray = contexts.get(player)!;
		}

		return contextArray;
	}

	/**
	 * Registers a function in the global namespace to the specified group(s).
	 *
	 * @deprecated Use `ZirconFunctionBuilder` + the ZirconConfigurationBuilder
	 *   API.
	 * @param func - The function to register.
	 * @param groupIds - The groups.
	 */
	export function RegisterFunction(
		func: ZirconFunction<any, any>,
		groupIds: ReadonlyArray<string>,
	): void {
		if (!initialized) {
			unregisteredTypes.push([func, groupIds]);
		} else {
			$print("registered", func, "after init");
			for (const group of GetGroups(groupIds)) {
				group.RegisterFunction(func);
			}
		}
	}

	/**
	 * Registers a namespace to the specified group(s).
	 *
	 * @deprecated Use `ZirconNamespaceBuilder` + the ZirconConfigurationBuilder
	 *   API.
	 * @param namespace - The namespace to add to the groups.
	 * @param groupIds - The groups to register it to.
	 */
	export function RegisterNamespace(
		namespace: ZirconNamespace,
		groupIds: ReadonlyArray<string>,
	): void {
		if (!initialized) {
			unregisteredTypes.push([namespace, groupIds]);
		} else {
			$print("registered", namespace, "after init");
			for (const group of GetGroups(groupIds)) {
				group.RegisterNamespace(namespace);
			}
		}
	}

	export function GetGroups(groupIds: ReadonlyArray<string>): Array<ZirconUserGroup> {
		return groupIds.mapFiltered(groupId => groups.get(groupId.lower()));
	}

	/**
	 * Registers an enumerable type to the specified group(s).
	 *
	 * @deprecated Use `ZirconEnumBuilder` + the ZirconConfigurationBuilder API.
	 * @param enumType - The enumerable type.
	 * @param groupIds - The groups to register the enum to.
	 * @returns The enum.
	 */
	export function RegisterEnum<K extends string>(
		enumType: ZirconEnum<K>,
		groupIds: ReadonlyArray<string>,
	): void {
		if (!initialized) {
			unregisteredTypes.push([enumType, groupIds]);
		} else {
			$print("registered", enumType, "after init");
			for (const group of GetGroups(groupIds)) {
				group.RegisterEnum(enumType);
			}
		}
	}

	/**
	 * Gets the highest player group for this player.
	 *
	 * @param player
	 */
	export function GetHighestPlayerGroup(player: Player): undefined | ZirconUserGroup {
		return playerGroupMap.get(player)?.reduce((accumulator, current) => {
			return current.GetRank() > accumulator.GetRank() ? current : accumulator;
		});
	}

	/**
	 * Adds the specified player to the targeted groups.
	 *
	 * All players are added to `user`, and group owners/game owners are added
	 * to `creator` by default.
	 *
	 * @param player - The player to add to the groups.
	 * @param targetGroups - An array of groups to add the player to.
	 */
	function AddPlayerToGroups(
		player: Player,
		targetGroups: Array<string | ZirconUserGroup>,
	): void {
		const playerGroups = playerGroupMap.get(player) ?? [];
		for (const groupOrId of targetGroups) {
			const group = typeIs(groupOrId, "string") ? groups.get(groupOrId) : groupOrId;
			if (group) {
				$print(
					`Add player '${player}' to groups [ ${targetGroups
						.map(s => (typeIs(s, "string") ? s : s.GetName()))
						.join(", ")} ]`,
				);

				group.AddMember(player);
				playerGroups.push(group);
			} else {
				warn(`[Zircon] Failed to add player '${player}' to group '${tostring(groupOrId)}'`);
			}
		}

		playerGroupMap.set(player, playerGroups);
	}

	/**
	 * @param permission
	 * @internal
	 */
	export function GetGroupsWithPermission<K extends keyof ZirconPermissions>(
		permission: K,
	): Array<ZirconUserGroup> {
		const matching = new Array<ZirconUserGroup>();
		for (const [, group] of groups) {
			if (group.GetPermission(permission)) {
				matching.push(group);
			}
		}

		return matching;
	}

	/** The cache of players that are allowed this permission. */
	const permissionGroupCache = new Map<keyof ZirconPermissions, Array<Player>>();
	/**
	 * Gets the players with the specified permission.
	 *
	 * @param permission
	 * @internal
	 */
	export function InternalGetPlayersWithPermission<K extends keyof ZirconPermissions>(
		permission: K,
	): Array<Player> {
		if (permissionGroupCache.has(permission)) {
			return permissionGroupCache.get(permission)!;
		}

		const groups = GetGroupsWithPermission(permission);
		const playerSet = new Set<Player>();
		for (const group of groups) {
			for (const member of group.GetMembers()) {
				playerSet.add(member);
			}
		}

		const array = toArray(playerSet);
		permissionGroupCache.set(permission, array);
		return array;
	}

	/**
	 * @param player
	 * @param permission
	 * @internal
	 */
	export function InternalGetPlayerHasPermission<K extends keyof ZirconPermissions>(
		player: Player,
		permission: K,
	): boolean {
		const players = InternalGetPlayersWithPermission(permission);
		return players.find(playerCandidate => playerCandidate === player) !== undefined;
	}

	export function GetGroupOrThrow(name: string): ZirconUserGroup {
		const group = groups.get(name.lower());
		assert(group, "Group '" + name + "' does not exist!");
		return group;
	}

	function RegisterZirconGlobal([typeId, typeGroups]: ZirconScopedGlobal): void {
		if (typeId instanceof ZirconFunction) {
			for (const group of GetGroups(typeGroups)) {
				group.RegisterFunction(typeId);
			}
		} else if (typeId instanceof ZirconEnum) {
			for (const group of GetGroups(typeGroups)) {
				group.RegisterEnum(typeId);
			}
		} else if (typeId instanceof ZirconNamespace) {
			for (const group of GetGroups(typeGroups)) {
				group.RegisterNamespace(typeId);
			}
		}
	}

	/**
	 * Initializes Zircon as a logging console **only**.
	 *
	 * This is equivalent to the following.
	 *
	 * ```ts
	 * ZirconServer.Registry.Init(ZirconConfigurationBuilder.logging());
	 * ```
	 */
	export function InitLogging(): void {
		Init(ZirconConfigurationBuilder.logging());
	}

	/**
	 * Initializes Zircon on the server with a given configuration if specified.
	 *
	 * If no configuration is passed, it will behave as a logging console
	 * **only**.
	 *
	 * @param configuration - The configuration to initialize with.
	 */
	// eslint-disable-next-line max-lines-per-function -- FIXME: Make me smaller!
	export function Init(configuration: ZirconConfiguration): void {
		if (initialized) {
			return;
		}

		const configurationGroups = configuration.Groups;
		for (const group of configurationGroups) {
			$print("register zircon group", group.Id);
			const userGroup = new ZirconUserGroup(group.Rank, group.Id, group);
			groups.set(group.Id.lower(), userGroup);
		}

		// Handle builder API types
		for (const typeId of configuration.Registry) {
			$print("register zircon global (thru new api)", typeId[0]);
			RegisterZirconGlobal(typeId);
		}

		// Handle any types registered with the deprecated api
		for (const typeId of unregisteredTypes) {
			$print("register zircon global (thru deprecated api)", typeId[0]);
			RegisterZirconGlobal(typeId);
		}

		Players.PlayerAdded.Connect(player => {
			permissionGroupCache.clear();

			const groupsToJoin = new Array<ZirconUserGroup>();
			for (const [, group] of groups) {
				if (group.CanJoinGroup(player)) {
					groupsToJoin.push(group);
				}
			}

			AddPlayerToGroups(player, groupsToJoin);
			Remotes.Server.Get(RemoteId.ZirconInitialized).SendToPlayer(player);
		});

		Players.PlayerRemoving.Connect(player => {
			permissionGroupCache.clear();
			contexts.delete(player);
			playerGroupMap.delete(player);
		});

		for (const player of Players.GetPlayers()) {
			const groupsToJoin = new Array<ZirconUserGroup>();
			for (const [, group] of groups) {
				if (group.CanJoinGroup(player)) {
					groupsToJoin.push(group);
				}
			}

			AddPlayerToGroups(player, groupsToJoin);
		}

		initialized = true;
		Remotes.Server.Get(RemoteId.ZirconInitialized).SendToAllPlayers();
	}

	Remotes.Server.OnFunction(RemoteId.GetZirconInitialized, () => initialized);
}

export type ZirconRegistryService = typeof ZirconRegistryService;

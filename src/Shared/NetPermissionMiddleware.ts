import type Net from "@rbxts/net";

import { ZirconLogLevel } from "Client/Types";

import type { ZirconPermissions } from "../Server/Class/ZirconGroup";
import { GetCommandService } from "../Services";

export default function createPermissionMiddleware(
	permission: keyof ZirconPermissions,
): Net.Middleware {
	const permissionMiddleware: Net.Middleware = (nxt, event) => {
		const registry = GetCommandService("RegistryService");
		const log = GetCommandService("LogService");
		return (sender, ...args) => {
			const groups = registry.GetGroupsWithPermission(permission);
			const matchingGroup = groups.find(value => value.HasMember(sender));

			if (matchingGroup !== undefined) {
				return nxt(sender, ...args);
			}

			log.Write(
				ZirconLogLevel.Error,
				"NetPermissionMiddleware",
				`Request to {} by user {} denied.`,
				{
					Variables: [event.GetInstance().Name, sender],
				},
			);
			warn(
				`[Zircon] Request to '${event.GetInstance().GetFullName()}' by user '${sender}' denied.`,
			);
		};
	};

	return permissionMiddleware;
}

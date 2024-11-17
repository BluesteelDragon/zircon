import { t } from "@rbxts/t";

import Lazy from "../Shared/Lazy";
import TSRequire from "../Shared/ts-import-shim";
import type { ZirconClientDispatchService } from "./ClientDispatchService";
import type { ZirconClientRegistryService } from "./ClientRegistryService";
import type { ZirconDispatchService } from "./DispatchService";
import type { ZirconLogService } from "./LogService";
import type { ZirconRegistryService } from "./RegistryService";

const IS_SERVER = game.GetService("RunService").IsServer();

interface ServiceMap {
	ClientDispatchService: ZirconClientDispatchService;
	ClientRegistryService: ZirconClientRegistryService;
	DispatchService: ZirconDispatchService;
	LogService: ZirconLogService;
	RegistryService: ZirconRegistryService;
}

export type ServerDependencies = Array<keyof ServiceMap>;

const HasDependencyInjection = t.interface({
	dependencies: t.array(t.string),
	LoadDependencies: t.callback,
});

const serviceMap = new Map<string, ServiceMap[keyof ServiceMap]>();
const serviceLoading = new Set<string>();

// eslint-disable-next-line max-lines-per-function -- a
function GetServiceInt<K extends keyof ServiceMap>(
	service: K,
	importingFrom?: keyof ServiceMap,
): ServiceMap[K] {
	if (serviceLoading.has(service)) {
		throw `Cyclic service dependency ${importingFrom}<->${service}`;
	}

	let svcImport = serviceMap.get(service);
	if (svcImport === undefined) {
		serviceLoading.add(service);

		// const serviceMaster = require(script.FindFirstChild(service) as ModuleScript) as Map<string, ServiceMap[K]>;

		const serviceMaster = TSRequire(script, service) as Map<string, ServiceMap[K]>;

		const importId = IS_SERVER ? `Zircon${service}` : `Zircon${service}`;
		svcImport = serviceMaster.get(importId)!;
		if (svcImport === undefined) {
			throw `Tried importing service: ${service}, but no matching ${importId} declaration.`;
		}

		serviceMap.set(service, svcImport);

		if (HasDependencyInjection(svcImport)) {
			const dependencies = new Array<defined>();
			for (const dependency of svcImport.dependencies) {
				dependencies.push(
					Lazy(() => GetServiceInt(dependency as keyof ServiceMap, service)),
				);
			}

			svcImport.LoadDependencies(...dependencies);
		}

		serviceLoading.delete(service);
		return svcImport as ServiceMap[K];
	}

	return svcImport as ServiceMap[K];
}

/**
 * Synchronously imports the service.
 *
 * @template K - Service name.
 * @param service - The service name.
 * @returns The requested service.
 * @rbxts server
 * @internal
 */
export function GetCommandService<K extends keyof ServiceMap>(service: K): ServiceMap[K] {
	return GetServiceInt(service);
}

/** Utilities relating to Map objects. */
export namespace MapUtils {
	/**
	 * Creates a shallow copy of a map.
	 *
	 * @template K - The key type of the map.
	 * @template V - The value type of the map.
	 * @param map - The map to copy.
	 * @returns A shallow copy of the map.
	 */
	export function Copy<K, V>(map: ReadonlyMap<K, V>): Map<K, V> {
		const mapCopy = new Map<K, V>();
		for (const [key, value] of map) {
			mapCopy.set(key, value);
		}

		return mapCopy;
	}

	/**
	 * Gets the value of this map, or creates the key with the default value if
	 * it doesn't exist.
	 *
	 * @template K - The key type of the map.
	 * @template V - The value type of the map.
	 * @param map - The map to fetch from.
	 * @param key - The key to get the value or "place" a default value in.
	 * @param defaultValue - The default value if the key doesn't exist (to
	 *   set).
	 * @returns The value.
	 */
	export function GetOrCreateKey<K, V>(map: Map<K, V>, key: K, defaultValue: V): V {
		const value = map.get(key);
		if (value !== undefined) {
			return value;
		}

		map.set(key, defaultValue);
		return defaultValue;
	}
}

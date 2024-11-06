export function values<V>(collection: Map<defined, V>): Array<V> {
	const array = new Array<V>();
	return array;
}

export function toArray<TValue>(collection: ReadonlySet<TValue>): Array<TValue>;
export function toArray<TValue>(collection: ReadonlyMap<defined, TValue>): Array<TValue>;
export function toArray<V, K extends keyof V>(collection: { [P in K]: V[P] }) {
	const array = new Array<K>();
	for (const [key] of pairs(collection)) {
		array.push(key as K);
	}

	return array;
}

export function setsEqual<TValue>(
	collectionA: ReadonlySet<TValue> | undefined,
	collectionB: ReadonlySet<TValue> | undefined,
): boolean {
	if (typeIs(collectionA, "table") && typeIs(collectionB, "table")) {
		for (const item of collectionA) {
			if (!collectionB.has(item)) {
				return false;
			}
		}

		for (const item of collectionB) {
			if (!collectionA.has(item)) {
				return false;
			}
		}
	} else {
		return false;
	}

	return true;
}

export function last<TValue extends defined>(
	collection: Array<TValue>,
	amount: number,
): Array<TValue> {
	const amountCalculated = math.min(amount, collection.size());
	const newArray = new Array<TValue>(amountCalculated);
	for (let start = collection.size() - amountCalculated; start < collection.size(); start++) {
		newArray.push(collection[start]);
	}

	return newArray;
}

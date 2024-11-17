import { ZirconEnum } from "./ZirconEnum";

function keysOf<K2 extends string>(value: Record<K2, number>): Array<K2> {
	const keys = new Array<K2>();
	for (const [key] of pairs(value)) {
		keys.push(key as K2);
	}

	return keys;
}

export class ZirconEnumBuilder<K extends string = never> {
	private readonly members = new Array<K>();

	constructor(private readonly name: string) {}
	/**
	 * Adds the enum member to Zircon.
	 *
	 * @param name - The name of the enum member.
	 * @returns The enum builder.
	 */
	// eslint-disable-next-line ts/prefer-return-this-type -- May be necessary, test later.
	public AddEnumMember<TName extends string>(name: TName): ZirconEnumBuilder<K | TName> {
		this.members.push(name as string as K);
		return this;
	}

	public FromEnum<TEnumKey extends string>(
		enumerable: Record<TEnumKey, number>,
	): ZirconEnum<TEnumKey> {
		return new ZirconEnum(this.name, keysOf(enumerable));
	}

	public FromArray<K extends string>(values: Array<K>): ZirconEnum<K> {
		return new ZirconEnum(this.name, values);
	}

	/** Builds the enum. */
	public Build(): ZirconEnum<K> {
		return new ZirconEnum<K>(this.name, this.members);
	}
}

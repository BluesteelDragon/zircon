import { ZrEnumItem } from "@cwyvern/zirconium/out/data/enum-item";

import type { EnumMatchTree, ZirconEnum } from "./ZirconEnum";

/** An extension of the `ZrEnumItem` class for Zircon. */
export class ZirconEnumItem<
	TParent extends ZirconEnum<string> = ZirconEnum<string>,
	K extends string = string,
> extends ZrEnumItem {
	/**
	 * Performs a match against this enum value - similar to `match` in Rust.
	 *
	 * @param matches - The matches to check against.
	 */
	public match<R>(matches: EnumMatchTree<TParent, K, R>): R {
		return matches[this.getName()](this);
	}

	public getName(): K {
		return super.getName() as K;
	}

	public getEnum(): TParent {
		return super.getEnum() as TParent;
	}

	public toString(): string {
		return `${this.getEnum().getEnumName()}.${this.getName()}`;
	}
}

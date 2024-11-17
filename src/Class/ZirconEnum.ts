import { ZrEnum } from "@cwyvern/zirconium/out/data/enum";

import { $print } from "rbxts-transform-debug";
import { zirconTypeId } from "Shared/type-id";

import { ZirconEnumItem } from "./ZirconEnumItem";
import type { ZirconValidator } from "./ZirconTypeValidator";

export type EnumMatchTree<TEnum extends ZirconEnum<any>, K extends string, R> = {
	[P in K]: (value: ZirconEnumItem<TEnum, P>) => R;
};

export interface ZirconEnumValidator<K extends string>
	extends ZirconValidator<number | string | ZirconEnumItem, ZirconEnumItem<ZirconEnum<K>, K>> {
	Enum: ZirconEnum<K>;
}

/** An extension of the `ZrEnum` class for Zircon. */
export class ZirconEnum<K extends string> extends ZrEnum {
	constructor(name: string, members: Array<K>) {
		super(members, name, (value, index) => new ZirconEnumItem(this, index, value));
	}

	/**
	 * Returns whether or not the specified value is an ZirconEnumItem of this
	 * type.
	 *
	 * @param value - The EnumItem to test.
	 * @returns Boolean for if the provided EnumItem belongs to this Enum.
	 */
	public is(value: unknown): value is ZirconEnumItem<ZirconEnum<K>, K> {
		if (value instanceof ZirconEnumItem) {
			return this.getItems().includes(value);
		}

		return false;
	}

	/**
	 * Gets an enum item value by key.
	 *
	 * @param key - The key of the desired EnumItem.
	 * @returns The ZirconEnumItem requested.
	 */
	public getItem<TKey extends K>(key: TKey): ZirconEnumItem<ZirconEnum<K>, TKey> {
		return this.getItems().find(k => k.getName() === key)! as ZirconEnumItem<
			ZirconEnum<K>,
			TKey
		>;
	}

	/**
	 * Performs a match against the enum item given, similar to `match` in Rust.
	 *
	 * This also provides `_` for handling values that _don't_ match.
	 *
	 * @param value - The enum item.
	 * @param matches - The expected matches.
	 * @returns The matched item result.
	 */
	public match<R>(
		value: ZirconEnumItem,
		matches: { _?: () => R } & EnumMatchTree<ZirconEnum<K>, K, R>,
	): R {
		for (const member of this.getItems()) {
			if (member === value) {
				return matches[member.getName() as K](value as ZirconEnumItem<ZirconEnum<K>, K>);
			}
		}

		if (matches._ !== undefined) {
			return matches._();
		}

		throw `Invalid match`;
	}

	// eslint-disable-next-line max-lines-per-function -- a 3
	public getValidator(): ZirconEnumValidator<K> {
		return {
			Enum: this,
			ErrorMessage: value => {
				return `${zirconTypeId(value)} is not castable to Enum '${this.getEnumName()}'`;
			},
			Transform(value) {
				const enumType = this.Enum;
				if (typeIs(value, "string")) {
					const strItem = enumType
						.getItems()
						.find(item => item.getName().lower() === value.lower());
					return strItem as ZirconEnumItem<ZirconEnum<K>, K>;
				} else if (typeIs(value, "number")) {
					const strItem = enumType.getItems().find(item => item.getValue() === value);
					return strItem as ZirconEnumItem<ZirconEnum<K>, K>;
				}

				return value as ZirconEnumItem<ZirconEnum<K>, K>;
			},
			Type: this.getEnumName(),
			Validate(value): value is string | ZirconEnumItem<ZirconEnum<K>, K> {
				const enumType = this.Enum;
				if (typeIs(value, "string")) {
					const strItem = enumType
						.getItems()
						.find(item => item.getName().lower() === value.lower());
					$print("string cmp", value, strItem?.getName());
					return strItem !== undefined;
				} else if (typeIs(value, "number")) {
					const intItem = enumType.getItems().find(item => item.getValue() === value);
					$print("int cmp", value, intItem?.getValue());
					return intItem !== undefined;
				} else if (value instanceof ZirconEnumItem) {
					$print("instance cmp", value, enumType);
					return (value.getEnum() as ZirconEnum<K>) === enumType;
				}

				return false;
			},
		};
	}

	public toString(): string {
		return this.getEnumName();
	}
}

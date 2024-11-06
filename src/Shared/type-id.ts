import t from "@rbxts/t";
import { ZrEnum } from "@rbxts/zirconium/out/Data/Enum";
import { ZrEnumItem } from "@rbxts/zirconium/out/Data/EnumItem";
import type { ZrValue } from "@rbxts/zirconium/out/Data/Locals";
import ZrObject from "@rbxts/zirconium/out/Data/Object";
import ZrRange from "@rbxts/zirconium/out/Data/Range";
import ZrUndefined from "@rbxts/zirconium/out/Data/Undefined";
import { ZrInstanceUserdata, ZrUserdata } from "@rbxts/zirconium/out/Data/Userdata";

import { ZirconFunction } from "Class/ZirconFunction";

const array = t.array(t.any);

interface TypeId extends Pick<CheckableTypes, "boolean" | "number" | "string"> {
	array: Array<ZrValue>;
	enum: ZrEnum;
	EnumItem: ZrEnumItem;
	function: ZirconFunction<any, any>;
	Instance: ZrInstanceUserdata;
	object: ZrObject;
	range: ZrRange;
	undefined: ZrUndefined;
	userdata: ZrUserdata<any>;
}

export function zirconTypeIs<K extends keyof TypeId>(
	value: ZrUndefined | ZrValue,
	k: K,
): value is TypeId[K] {
	return zirconTypeOf(value) === k;
}

export type ZirconCheckableTypes = `enum$${string}` | keyof TypeId;
export function zirconTypeOf(value: ZrUndefined | ZrValue): ZirconCheckableTypes {
	if (typeIs(value, "string") || typeIs(value, "number") || typeIs(value, "boolean")) {
		return typeOf(value) as ZirconCheckableTypes;
	} else if (value === ZrUndefined) {
		return "undefined";
	} else if (value instanceof ZirconFunction) {
		return "function";
	} else if (value instanceof ZrRange) {
		return "range";
	} else if (value instanceof ZrUserdata) {
		return "userdata";
	} else if (value instanceof ZrInstanceUserdata) {
		return "Instance";
	} else if (value instanceof ZrObject) {
		return "object";
	} else if (value instanceof ZrEnum) {
		return "enum";
	} else if (value instanceof ZrEnumItem) {
		return `enum$${value.getEnum().getEnumName()}`;
	} else if (array(value)) {
		return "array";
	}

	throw `Invalid Zirconium Type`;
}

export function zirconTypeId(value: ZrUndefined | ZrValue): string {
	if (zirconTypeIs(value, "string")) {
		return `string "${value}"`;
	} else if (zirconTypeIs(value, "number") || zirconTypeIs(value, "boolean")) {
		return `number '${tostring(value)}'`;
	} else if (zirconTypeIs(value, "range")) {
		return `range <${value.GetMin()} .. ${value.GetMax()}>`;
	} else if (zirconTypeIs(value, "enum")) {
		return `Enum '${value.getEnumName()}'`;
	} else if (zirconTypeIs(value, "EnumItem")) {
		return `EnumItem '${value.getEnum().getEnumName()}::${value.getName()}'`;
	} else if (zirconTypeIs(value, "function")) {
		return `function '${value.GetName()}'`;
	}

	return zirconTypeOf(value);
}

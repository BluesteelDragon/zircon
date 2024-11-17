import ZrUndefined from "@cwyvern/zirconium/out/data/undefined";

import { StatefulZirconValidator } from "../StatefulZirconValidator";
import type { ZirconValidator } from "../ZirconTypeValidator";

export class OptionalValidator<T, U = T> extends StatefulZirconValidator<
	T | ZrUndefined,
	U | undefined
> {
	constructor(private readonly innerValidator: ZirconValidator<T, U>) {
		super(innerValidator.Type + "?");
	}

	public Validate(value: unknown): value is T | ZrUndefined {
		return this.innerValidator.Validate(value) || value === ZrUndefined;
	}

	public Transform(value: T): U | undefined {
		return value !== ZrUndefined ? this.innerValidator.Transform?.(value) : undefined;
	}
}

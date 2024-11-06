type Literal = boolean | defined | number | string | undefined | void;

type Lazy<T> = { readonly __nominal_Lazy: any } & T;

declare function Lazy<T, A extends Array<Literal>>(fn: (...args: A) => T, ...args: A): Lazy<T>;

export = Lazy;

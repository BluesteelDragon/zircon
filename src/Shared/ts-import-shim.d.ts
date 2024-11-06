/**
 * Exposes the rbxts runtime import function.
 *
 * @param relativeTo - The script the import operation should be performed
 *   relative to.
 * @param rel - A list of strings representing the path or name of the files to
 *   import.
 * @returns The imported module requested (if it exists).
 * @internal
 */
// eslint-disable-next-line unicorn/prevent-abbreviations -- Not too sure what rel refers to here.
declare function TSRequire(relativeTo: Instance, ...rel: Array<string>): unknown;
export = TSRequire;

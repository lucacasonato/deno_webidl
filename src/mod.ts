import { CodeBlockWriter, webidl } from "../deps.ts";
import { genRoot } from "./generator.ts";
import { sortRootTypes } from "./sort.ts";

export function generate(idl: string): string {
  const rootTypes = webidl.parse(idl, {});

  const writer = new CodeBlockWriter({ indentNumberOfSpaces: 2 });

  const sortedRootTypes = sortRootTypes(rootTypes);

  for (const rootType of sortedRootTypes) {
    genRoot(writer, rootType);
  }

  return writer.toString();
}

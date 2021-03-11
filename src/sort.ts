import { webidl } from "../deps.ts";

export function sortRootTypes(
  rootTypes: webidl.IDLRootType[],
): webidl.IDLRootType[] {
  const typeDependencies: Record<
    string,
    { deps: string[]; rootType: webidl.IDLRootType }
  > = {};

  function idlTypeNames(idlType: webidl.IDLTypeDescription): string[] {
    if (idlType.generic == "sequence") {
      return idlTypeNames(idlType.idlType[0]);
    } else if (idlType.generic == "record") {
      return [
        ...idlTypeNames(idlType.idlType[0]),
        ...idlTypeNames(idlType.idlType[1]),
      ];
    } else if (idlType.generic) {
      // We handle these as any currently, so they don't add any deps
      return [];
    } else if (idlType.union) {
      return idlType.idlType.flatMap(idlTypeNames);
    } else {
      return [idlType.idlType];
    }
  }

  for (const type of rootTypes) {
    switch (type.type) {
      case "interface":
        if (type.partial) break;
        // Interfaces have no deps
        typeDependencies[type.name] = { deps: [], rootType: type };
        break;
      case "enum":
        // Enums have no deps
        typeDependencies[type.name] = { deps: [], rootType: type };
        break;
      case "dictionary":
        typeDependencies[type.name] = { deps: [], rootType: type };
        for (const member of type.members) {
          typeDependencies[type.name].deps.push(
            ...idlTypeNames(member.idlType),
          );
        }
        break;
      case "typedef":
        typeDependencies[type.name] = { deps: [], rootType: type };
        typeDependencies[type.name].deps.push(...idlTypeNames(type.idlType));
        break;
      default:
        break;
    }
  }

  const sorted: webidl.IDLRootType[] = [];
  const sortedNames: string[] = [];
  const inseterted = new Set<string>();

  function resolveDeps(deps: string[]) {
    for (const name of deps) {
      if (inseterted.has(name)) continue;
      const resolved = typeDependencies[name];
      if (!resolved) continue;
      const { deps, rootType } = resolved;
      resolveDeps(deps);
      if (inseterted.has(name)) {
        throw new Error(`Discovered circular dependency on ${name}!`);
      }
      inseterted.add(name);
      sortedNames.push(name);
      sorted.push(rootType);
    }
  }

  resolveDeps(Object.keys(typeDependencies));
  console.log(sortedNames);

  return sorted;
}

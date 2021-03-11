export function notImplemented(): never {
  throw new Error("Not implemented");
}

export function uppercase(name: string): string {
  return name[0].toUpperCase() + name.slice(1);
}

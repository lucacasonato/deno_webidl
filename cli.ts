import { generate } from "./src/mod.ts";

const idl = Deno.readTextFileSync(Deno.args[0]);

const script = generate(idl);

Deno.writeTextFileSync("out.js", script);

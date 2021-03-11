import { CodeBlockWriter as CBW, webidl } from "../deps.ts";
import { notImplemented, uppercase } from "./utils.ts";

export function genRoot(w: CBW, type: webidl.IDLRootType) {
  switch (type.type) {
    case "interface":
      generateInterface(w, type);
      break;
    case "enum":
      generateEnum(w, type);
      break;
    case "dictionary":
      generateDictionary(w, type);
      break;
    case "typedef":
      generateTypedef(w, type);
      break;
    default:
      break;
  }
}

function generateInterface(w: CBW, type: webidl.InterfaceType) {
  w.writeLine(`// INTERFACE: ${type.name}`);
  w.write(`webidl.converters.${type.name} = webidl.createInterfaceConverter(`);
  w.quote(type.name);
  w.write(`, ${type.name}`);
  w.write(");");
  w.newLine();
  w.newLine();
}

function generateEnum(w: CBW, type: webidl.EnumType) {
  w.writeLine(`// ENUM: ${type.name}`);
  w.write(`webidl.converters[`);
  w.quote(type.name);
  w.write("] = webidl.createEnumConverter(");
  w.quote(type.name);
  w.write(", [");
  for (const { value } of type.values) {
    w.newLine();
    w.indent(1);
    w.quote(value);
    w.write(", ");
  }
  w.writeLine("]);");
  w.newLine();
}

function generateDictionary(w: CBW, type: webidl.DictionaryType) {
  w.writeLine(`// DICTIONARY: ${type.name}`);
  w.write(`const dictMembers${type.name} = [`);
  for (const member of type.members) {
    w.newLine();
    w.indent(1);
    w.write("{ key: ");
    w.quote(member.name);
    w.write(", converter: ");
    generateIdlTypeConverter(w, member.idlType);
    if (member.required) {
      w.write(", required: true");
    }
    if (member.default) {
      w.write(", defaultValue: ");
      generateValue(w, member.default);
    }
    w.write(" },");
  }
  w.writeLine("];");

  w.write(`webidl.converters[`);
  w.quote(type.name);
  w.write("] = webidl.createDictionaryConverter(");
  w.quote(type.name);
  if (type.inheritance) {
    w.write(`, dictMembers${type.inheritance}`);
  }
  w.write(`, dictMembers${type.name}`);
  w.write(");");
  w.newLine();
  w.newLine();
}

function generateValue(
  w: CBW,
  val:
    | webidl.ValueDescriptionString
    | webidl.ValueDescriptionNumber
    | webidl.ValueDescriptionBoolean
    | webidl.ValueDescriptionNull
    | webidl.ValueDescriptionInfinity
    | webidl.ValueDescriptionNaN
    | webidl.ValueDescriptionSequence
    | webidl.ValueDescriptionDictionary,
) {
  switch (val.type) {
    case "string":
      w.quote(val.value);
      break;
    case "number":
      w.write(val.value);
      break;
    case "NaN":
      w.write("NaN");
      break;
    case "null":
      w.write("null");
      break;
    case "boolean":
      w.write(val.value ? "true" : "false");
      break;
    case "Infinity":
      w.write((val.negative ? "-" : "") + "Infinity");
      break;
    case "sequence":
      w.write("[]");
      break;
    case "dictionary":
      w.write("{}");
      break;
    default:
      notImplemented();
  }
}

function generateIdlTypeConverter(w: CBW, type: webidl.IDLTypeDescription) {
  if (type.nullable) w.write("webidl.createNullableConverter(");
  if (type.generic == "sequence") {
    w.write(`webidl.createSequenceConverter(`);
    generateIdlTypeConverter(w, type.idlType[0]);
    w.write(")");
  } else if (type.generic == "record") {
    w.write(`webidl.createRecordConverter(`);
    generateIdlTypeConverter(w, type.idlType[0]);
    w.write(", ");
    generateIdlTypeConverter(w, type.idlType[1]);
    w.write(")");
  } else if (type.generic) {
    w.write(`webidl.converters.any`);
  } else if (type.union) {
    w.write(`webidl.converters.any /** put union here! **/`);
  } else {
    const enforceRange = findExtAttr(type.extAttrs, "EnforceRange") ||
      findExtAttr(type.parent.extAttrs, "EnforceRange");
    const clamp = findExtAttr(type.extAttrs, "Clamp") ||
      findExtAttr(type.parent.extAttrs, "Clamp");
    const nullToEmptyString =
      findExtAttr(type.extAttrs, "LegacyNullToEmptyString") ||
      findExtAttr(type.parent.extAttrs, "LegacyNullToEmptyString");
    if (enforceRange || clamp || nullToEmptyString) w.write("(V, opts) => ");
    w.write(`webidl.converters[`);
    w.quote(type.idlType);
    w.write("]");
    if (enforceRange || clamp || nullToEmptyString) {
      w.write("(V, { ...opts");
      if (clamp) {
        w.write(", clamp: true");
      }
      if (enforceRange) {
        w.write(", enforceRange: true");
      }
      if (nullToEmptyString) {
        w.write(", treatNullAsEmptyString: true");
      }
      w.write(" })");
    }
  }
  if (type.nullable) w.write(")");
}

function findExtAttr(
  extAttrs: webidl.ExtendedAttribute[],
  name: string,
): webidl.ExtendedAttribute | undefined {
  return extAttrs.find((e) => e.name == name);
}

function generateTypedef(w: CBW, type: webidl.TypedefType) {
  w.writeLine(`// TYPEDEF: ${type.name}`);
  w.write(`webidl.converters[`);
  w.quote(type.name);
  w.write("] = ");
  generateIdlTypeConverter(w, type.idlType);
  w.write(";");
  w.newLine();
  w.newLine();
}

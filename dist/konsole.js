#!/usr/bin/env node
"use strict";

// src/konsole/init.ts
var import_node_fs3 = require("node:fs");
var import_node_crypto = require("node:crypto");
var import_node_path = require("node:path");

// node_modules/js-yaml/dist/js-yaml.mjs
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var jsYaml = {};
var loader = {};
var common = {};
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function isNothing(subject) {
    return typeof subject === "undefined" || subject === null;
  }
  function isObject(subject) {
    return typeof subject === "object" && subject !== null;
  }
  function toArray(sequence) {
    if (Array.isArray(sequence)) return sequence;
    else if (isNothing(sequence)) return [];
    return [sequence];
  }
  function extend(target, source) {
    if (source) {
      const sourceKeys = Object.keys(source);
      for (let index = 0, length = sourceKeys.length; index < length; index += 1) {
        const key = sourceKeys[index];
        target[key] = source[key];
      }
    }
    return target;
  }
  function repeat(string, count) {
    let result = "";
    for (let cycle = 0; cycle < count; cycle += 1) {
      result += string;
    }
    return result;
  }
  function isNegativeZero(number) {
    return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
  }
  common.isNothing = isNothing;
  common.isObject = isObject;
  common.toArray = toArray;
  common.repeat = repeat;
  common.isNegativeZero = isNegativeZero;
  common.extend = extend;
  return common;
}
var exception;
var hasRequiredException;
function requireException() {
  if (hasRequiredException) return exception;
  hasRequiredException = 1;
  function formatError(exception2, compact) {
    let where = "";
    const message = exception2.reason || "(unknown reason)";
    if (!exception2.mark) return message;
    if (exception2.mark.name) {
      where += 'in "' + exception2.mark.name + '" ';
    }
    where += "(" + (exception2.mark.line + 1) + ":" + (exception2.mark.column + 1) + ")";
    if (!compact && exception2.mark.snippet) {
      where += "\n\n" + exception2.mark.snippet;
    }
    return message + " " + where;
  }
  function YAMLException2(reason, mark) {
    Error.call(this);
    this.name = "YAMLException";
    this.reason = reason;
    this.mark = mark;
    this.message = formatError(this, false);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error().stack || "";
    }
  }
  YAMLException2.prototype = Object.create(Error.prototype);
  YAMLException2.prototype.constructor = YAMLException2;
  YAMLException2.prototype.toString = function toString(compact) {
    return this.name + ": " + formatError(this, compact);
  };
  exception = YAMLException2;
  return exception;
}
var snippet;
var hasRequiredSnippet;
function requireSnippet() {
  if (hasRequiredSnippet) return snippet;
  hasRequiredSnippet = 1;
  const common2 = requireCommon();
  function getLine(buffer, lineStart, lineEnd, position, maxLineLength) {
    let head = "";
    let tail = "";
    const maxHalfLength = Math.floor(maxLineLength / 2) - 1;
    if (position - lineStart > maxHalfLength) {
      head = " ... ";
      lineStart = position - maxHalfLength + head.length;
    }
    if (lineEnd - position > maxHalfLength) {
      tail = " ...";
      lineEnd = position + maxHalfLength - tail.length;
    }
    return {
      str: head + buffer.slice(lineStart, lineEnd).replace(/\t/g, "\u2192") + tail,
      pos: position - lineStart + head.length
      // relative position
    };
  }
  function padStart(string, max) {
    return common2.repeat(" ", max - string.length) + string;
  }
  function makeSnippet(mark, options) {
    options = Object.create(options || null);
    if (!mark.buffer) return null;
    if (!options.maxLength) options.maxLength = 79;
    if (typeof options.indent !== "number") options.indent = 1;
    if (typeof options.linesBefore !== "number") options.linesBefore = 3;
    if (typeof options.linesAfter !== "number") options.linesAfter = 2;
    const re = /\r?\n|\r|\0/g;
    const lineStarts = [0];
    const lineEnds = [];
    let match;
    let foundLineNo = -1;
    while (match = re.exec(mark.buffer)) {
      lineEnds.push(match.index);
      lineStarts.push(match.index + match[0].length);
      if (mark.position <= match.index && foundLineNo < 0) {
        foundLineNo = lineStarts.length - 2;
      }
    }
    if (foundLineNo < 0) foundLineNo = lineStarts.length - 1;
    let result = "";
    const lineNoLength = Math.min(mark.line + options.linesAfter, lineEnds.length).toString().length;
    const maxLineLength = options.maxLength - (options.indent + lineNoLength + 3);
    for (let i = 1; i <= options.linesBefore; i++) {
      if (foundLineNo - i < 0) break;
      const line2 = getLine(
        mark.buffer,
        lineStarts[foundLineNo - i],
        lineEnds[foundLineNo - i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo - i]),
        maxLineLength
      );
      result = common2.repeat(" ", options.indent) + padStart((mark.line - i + 1).toString(), lineNoLength) + " | " + line2.str + "\n" + result;
    }
    const line = getLine(mark.buffer, lineStarts[foundLineNo], lineEnds[foundLineNo], mark.position, maxLineLength);
    result += common2.repeat(" ", options.indent) + padStart((mark.line + 1).toString(), lineNoLength) + " | " + line.str + "\n";
    result += common2.repeat("-", options.indent + lineNoLength + 3 + line.pos) + "^\n";
    for (let i = 1; i <= options.linesAfter; i++) {
      if (foundLineNo + i >= lineEnds.length) break;
      const line2 = getLine(
        mark.buffer,
        lineStarts[foundLineNo + i],
        lineEnds[foundLineNo + i],
        mark.position - (lineStarts[foundLineNo] - lineStarts[foundLineNo + i]),
        maxLineLength
      );
      result += common2.repeat(" ", options.indent) + padStart((mark.line + i + 1).toString(), lineNoLength) + " | " + line2.str + "\n";
    }
    return result.replace(/\n$/, "");
  }
  snippet = makeSnippet;
  return snippet;
}
var type;
var hasRequiredType;
function requireType() {
  if (hasRequiredType) return type;
  hasRequiredType = 1;
  const YAMLException2 = requireException();
  const TYPE_CONSTRUCTOR_OPTIONS = [
    "kind",
    "multi",
    "resolve",
    "construct",
    "instanceOf",
    "predicate",
    "represent",
    "representName",
    "defaultStyle",
    "styleAliases"
  ];
  const YAML_NODE_KINDS = [
    "scalar",
    "sequence",
    "mapping"
  ];
  function compileStyleAliases(map2) {
    const result = {};
    if (map2 !== null) {
      Object.keys(map2).forEach(function(style) {
        map2[style].forEach(function(alias) {
          result[String(alias)] = style;
        });
      });
    }
    return result;
  }
  function Type2(tag, options) {
    options = options || {};
    Object.keys(options).forEach(function(name) {
      if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
        throw new YAMLException2('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
      }
    });
    this.options = options;
    this.tag = tag;
    this.kind = options["kind"] || null;
    this.resolve = options["resolve"] || function() {
      return true;
    };
    this.construct = options["construct"] || function(data) {
      return data;
    };
    this.instanceOf = options["instanceOf"] || null;
    this.predicate = options["predicate"] || null;
    this.represent = options["represent"] || null;
    this.representName = options["representName"] || null;
    this.defaultStyle = options["defaultStyle"] || null;
    this.multi = options["multi"] || false;
    this.styleAliases = compileStyleAliases(options["styleAliases"] || null);
    if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
      throw new YAMLException2('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
    }
  }
  type = Type2;
  return type;
}
var schema;
var hasRequiredSchema;
function requireSchema() {
  if (hasRequiredSchema) return schema;
  hasRequiredSchema = 1;
  const YAMLException2 = requireException();
  const Type2 = requireType();
  function compileList(schema2, name) {
    const result = [];
    schema2[name].forEach(function(currentType) {
      let newIndex = result.length;
      result.forEach(function(previousType, previousIndex) {
        if (previousType.tag === currentType.tag && previousType.kind === currentType.kind && previousType.multi === currentType.multi) {
          newIndex = previousIndex;
        }
      });
      result[newIndex] = currentType;
    });
    return result;
  }
  function compileMap() {
    const result = {
      scalar: {},
      sequence: {},
      mapping: {},
      fallback: {},
      multi: {
        scalar: [],
        sequence: [],
        mapping: [],
        fallback: []
      }
    };
    function collectType(type2) {
      if (type2.multi) {
        result.multi[type2.kind].push(type2);
        result.multi["fallback"].push(type2);
      } else {
        result[type2.kind][type2.tag] = result["fallback"][type2.tag] = type2;
      }
    }
    for (let index = 0, length = arguments.length; index < length; index += 1) {
      arguments[index].forEach(collectType);
    }
    return result;
  }
  function Schema2(definition) {
    return this.extend(definition);
  }
  Schema2.prototype.extend = function extend(definition) {
    let implicit = [];
    let explicit = [];
    if (definition instanceof Type2) {
      explicit.push(definition);
    } else if (Array.isArray(definition)) {
      explicit = explicit.concat(definition);
    } else if (definition && (Array.isArray(definition.implicit) || Array.isArray(definition.explicit))) {
      if (definition.implicit) implicit = implicit.concat(definition.implicit);
      if (definition.explicit) explicit = explicit.concat(definition.explicit);
    } else {
      throw new YAMLException2("Schema.extend argument should be a Type, [ Type ], or a schema definition ({ implicit: [...], explicit: [...] })");
    }
    implicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      if (type2.loadKind && type2.loadKind !== "scalar") {
        throw new YAMLException2("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
      }
      if (type2.multi) {
        throw new YAMLException2("There is a multi type in the implicit list of a schema. Multi tags can only be listed as explicit.");
      }
    });
    explicit.forEach(function(type2) {
      if (!(type2 instanceof Type2)) {
        throw new YAMLException2("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
    });
    const result = Object.create(Schema2.prototype);
    result.implicit = (this.implicit || []).concat(implicit);
    result.explicit = (this.explicit || []).concat(explicit);
    result.compiledImplicit = compileList(result, "implicit");
    result.compiledExplicit = compileList(result, "explicit");
    result.compiledTypeMap = compileMap(result.compiledImplicit, result.compiledExplicit);
    return result;
  };
  schema = Schema2;
  return schema;
}
var str;
var hasRequiredStr;
function requireStr() {
  if (hasRequiredStr) return str;
  hasRequiredStr = 1;
  const Type2 = requireType();
  str = new Type2("tag:yaml.org,2002:str", {
    kind: "scalar",
    construct: function(data) {
      return data !== null ? data : "";
    }
  });
  return str;
}
var seq;
var hasRequiredSeq;
function requireSeq() {
  if (hasRequiredSeq) return seq;
  hasRequiredSeq = 1;
  const Type2 = requireType();
  seq = new Type2("tag:yaml.org,2002:seq", {
    kind: "sequence",
    construct: function(data) {
      return data !== null ? data : [];
    }
  });
  return seq;
}
var map;
var hasRequiredMap;
function requireMap() {
  if (hasRequiredMap) return map;
  hasRequiredMap = 1;
  const Type2 = requireType();
  map = new Type2("tag:yaml.org,2002:map", {
    kind: "mapping",
    construct: function(data) {
      return data !== null ? data : {};
    }
  });
  return map;
}
var failsafe;
var hasRequiredFailsafe;
function requireFailsafe() {
  if (hasRequiredFailsafe) return failsafe;
  hasRequiredFailsafe = 1;
  const Schema2 = requireSchema();
  failsafe = new Schema2({
    explicit: [
      requireStr(),
      requireSeq(),
      requireMap()
    ]
  });
  return failsafe;
}
var _null;
var hasRequired_null;
function require_null() {
  if (hasRequired_null) return _null;
  hasRequired_null = 1;
  const Type2 = requireType();
  function resolveYamlNull(data) {
    if (data === null) return true;
    const max = data.length;
    return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
  }
  function constructYamlNull() {
    return null;
  }
  function isNull(object) {
    return object === null;
  }
  _null = new Type2("tag:yaml.org,2002:null", {
    kind: "scalar",
    resolve: resolveYamlNull,
    construct: constructYamlNull,
    predicate: isNull,
    represent: {
      canonical: function() {
        return "~";
      },
      lowercase: function() {
        return "null";
      },
      uppercase: function() {
        return "NULL";
      },
      camelcase: function() {
        return "Null";
      },
      empty: function() {
        return "";
      }
    },
    defaultStyle: "lowercase"
  });
  return _null;
}
var bool;
var hasRequiredBool;
function requireBool() {
  if (hasRequiredBool) return bool;
  hasRequiredBool = 1;
  const Type2 = requireType();
  function resolveYamlBoolean(data) {
    if (data === null) return false;
    const max = data.length;
    return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
  }
  function constructYamlBoolean(data) {
    return data === "true" || data === "True" || data === "TRUE";
  }
  function isBoolean(object) {
    return Object.prototype.toString.call(object) === "[object Boolean]";
  }
  bool = new Type2("tag:yaml.org,2002:bool", {
    kind: "scalar",
    resolve: resolveYamlBoolean,
    construct: constructYamlBoolean,
    predicate: isBoolean,
    represent: {
      lowercase: function(object) {
        return object ? "true" : "false";
      },
      uppercase: function(object) {
        return object ? "TRUE" : "FALSE";
      },
      camelcase: function(object) {
        return object ? "True" : "False";
      }
    },
    defaultStyle: "lowercase"
  });
  return bool;
}
var int;
var hasRequiredInt;
function requireInt() {
  if (hasRequiredInt) return int;
  hasRequiredInt = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  function isHexCode(c) {
    return c >= 48 && c <= 57 || c >= 65 && c <= 70 || c >= 97 && c <= 102;
  }
  function isOctCode(c) {
    return c >= 48 && c <= 55;
  }
  function isDecCode(c) {
    return c >= 48 && c <= 57;
  }
  function resolveYamlInteger(data) {
    if (data === null) return false;
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max) return false;
    let ch = data[index];
    if (ch === "-" || ch === "+") {
      ch = data[++index];
    }
    if (ch === "0") {
      if (index + 1 === max) return true;
      ch = data[++index];
      if (ch === "b") {
        index++;
        for (; index < max; index++) {
          ch = data[index];
          if (ch !== "0" && ch !== "1") return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "x") {
        index++;
        for (; index < max; index++) {
          if (!isHexCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
      if (ch === "o") {
        index++;
        for (; index < max; index++) {
          if (!isOctCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && isFinite(parseYamlInteger(data));
      }
    }
    for (; index < max; index++) {
      if (!isDecCode(data.charCodeAt(index))) {
        return false;
      }
      hasDigits = true;
    }
    if (!hasDigits) return false;
    return isFinite(parseYamlInteger(data));
  }
  function parseYamlInteger(data) {
    let value = data;
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
      if (ch === "-") sign = -1;
      value = value.slice(1);
      ch = value[0];
    }
    if (value === "0") return 0;
    if (ch === "0") {
      if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
      if (value[1] === "x") return sign * parseInt(value.slice(2), 16);
      if (value[1] === "o") return sign * parseInt(value.slice(2), 8);
    }
    return sign * parseInt(value, 10);
  }
  function constructYamlInteger(data) {
    return parseYamlInteger(data);
  }
  function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common2.isNegativeZero(object));
  }
  int = new Type2("tag:yaml.org,2002:int", {
    kind: "scalar",
    resolve: resolveYamlInteger,
    construct: constructYamlInteger,
    predicate: isInteger,
    represent: {
      binary: function(obj) {
        return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
      },
      octal: function(obj) {
        return obj >= 0 ? "0o" + obj.toString(8) : "-0o" + obj.toString(8).slice(1);
      },
      decimal: function(obj) {
        return obj.toString(10);
      },
      hexadecimal: function(obj) {
        return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
      }
    },
    defaultStyle: "decimal",
    styleAliases: {
      binary: [2, "bin"],
      octal: [8, "oct"],
      decimal: [10, "dec"],
      hexadecimal: [16, "hex"]
    }
  });
  return int;
}
var float;
var hasRequiredFloat;
function requireFloat() {
  if (hasRequiredFloat) return float;
  hasRequiredFloat = 1;
  const common2 = requireCommon();
  const Type2 = requireType();
  const YAML_FLOAT_PATTERN = new RegExp(
    // 2.5e4, 2.5 and integers
    "^(?:[-+]?(?:[0-9]+)(?:\\.[0-9]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9]+(?:[eE][-+]?[0-9]+)?|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  const YAML_FLOAT_SPECIAL_PATTERN = new RegExp(
    "^(?:[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
  );
  function resolveYamlFloat(data) {
    if (data === null) return false;
    if (!YAML_FLOAT_PATTERN.test(data)) {
      return false;
    }
    if (isFinite(parseFloat(data, 10))) {
      return true;
    }
    return YAML_FLOAT_SPECIAL_PATTERN.test(data);
  }
  function constructYamlFloat(data) {
    let value = data.toLowerCase();
    const sign = value[0] === "-" ? -1 : 1;
    if ("+-".indexOf(value[0]) >= 0) {
      value = value.slice(1);
    }
    if (value === ".inf") {
      return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else if (value === ".nan") {
      return NaN;
    }
    return sign * parseFloat(value, 10);
  }
  const SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
  function representYamlFloat(object, style) {
    if (isNaN(object)) {
      switch (style) {
        case "lowercase":
          return ".nan";
        case "uppercase":
          return ".NAN";
        case "camelcase":
          return ".NaN";
      }
    } else if (Number.POSITIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return ".inf";
        case "uppercase":
          return ".INF";
        case "camelcase":
          return ".Inf";
      }
    } else if (Number.NEGATIVE_INFINITY === object) {
      switch (style) {
        case "lowercase":
          return "-.inf";
        case "uppercase":
          return "-.INF";
        case "camelcase":
          return "-.Inf";
      }
    } else if (common2.isNegativeZero(object)) {
      return "-0.0";
    }
    const res = object.toString(10);
    return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
  }
  function isFloat(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common2.isNegativeZero(object));
  }
  float = new Type2("tag:yaml.org,2002:float", {
    kind: "scalar",
    resolve: resolveYamlFloat,
    construct: constructYamlFloat,
    predicate: isFloat,
    represent: representYamlFloat,
    defaultStyle: "lowercase"
  });
  return float;
}
var json;
var hasRequiredJson;
function requireJson() {
  if (hasRequiredJson) return json;
  hasRequiredJson = 1;
  json = requireFailsafe().extend({
    implicit: [
      require_null(),
      requireBool(),
      requireInt(),
      requireFloat()
    ]
  });
  return json;
}
var core;
var hasRequiredCore;
function requireCore() {
  if (hasRequiredCore) return core;
  hasRequiredCore = 1;
  core = requireJson();
  return core;
}
var timestamp;
var hasRequiredTimestamp;
function requireTimestamp() {
  if (hasRequiredTimestamp) return timestamp;
  hasRequiredTimestamp = 1;
  const Type2 = requireType();
  const YAML_DATE_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
  );
  const YAML_TIMESTAMP_REGEXP = new RegExp(
    "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
  );
  function resolveYamlTimestamp(data) {
    if (data === null) return false;
    if (YAML_DATE_REGEXP.exec(data) !== null) return true;
    if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
    return false;
  }
  function constructYamlTimestamp(data) {
    let fraction = 0;
    let delta = null;
    let match = YAML_DATE_REGEXP.exec(data);
    if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
    if (match === null) throw new Error("Date resolve error");
    const year = +match[1];
    const month = +match[2] - 1;
    const day = +match[3];
    if (!match[4]) {
      return new Date(Date.UTC(year, month, day));
    }
    const hour = +match[4];
    const minute = +match[5];
    const second = +match[6];
    if (match[7]) {
      fraction = match[7].slice(0, 3);
      while (fraction.length < 3) {
        fraction += "0";
      }
      fraction = +fraction;
    }
    if (match[9]) {
      const tzHour = +match[10];
      const tzMinute = +(match[11] || 0);
      delta = (tzHour * 60 + tzMinute) * 6e4;
      if (match[9] === "-") delta = -delta;
    }
    const date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
    if (delta) date.setTime(date.getTime() - delta);
    return date;
  }
  function representYamlTimestamp(object) {
    return object.toISOString();
  }
  timestamp = new Type2("tag:yaml.org,2002:timestamp", {
    kind: "scalar",
    resolve: resolveYamlTimestamp,
    construct: constructYamlTimestamp,
    instanceOf: Date,
    represent: representYamlTimestamp
  });
  return timestamp;
}
var merge;
var hasRequiredMerge;
function requireMerge() {
  if (hasRequiredMerge) return merge;
  hasRequiredMerge = 1;
  const Type2 = requireType();
  function resolveYamlMerge(data) {
    return data === "<<" || data === null;
  }
  merge = new Type2("tag:yaml.org,2002:merge", {
    kind: "scalar",
    resolve: resolveYamlMerge
  });
  return merge;
}
var binary;
var hasRequiredBinary;
function requireBinary() {
  if (hasRequiredBinary) return binary;
  hasRequiredBinary = 1;
  const Type2 = requireType();
  const BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
  function resolveYamlBinary(data) {
    if (data === null) return false;
    let bitlen = 0;
    const max = data.length;
    const map2 = BASE64_MAP;
    for (let idx = 0; idx < max; idx++) {
      const code = map2.indexOf(data.charAt(idx));
      if (code > 64) continue;
      if (code < 0) return false;
      bitlen += 6;
    }
    return bitlen % 8 === 0;
  }
  function constructYamlBinary(data) {
    const input = data.replace(/[\r\n=]/g, "");
    const max = input.length;
    const map2 = BASE64_MAP;
    let bits = 0;
    const result = [];
    for (let idx = 0; idx < max; idx++) {
      if (idx % 4 === 0 && idx) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      }
      bits = bits << 6 | map2.indexOf(input.charAt(idx));
    }
    const tailbits = max % 4 * 6;
    if (tailbits === 0) {
      result.push(bits >> 16 & 255);
      result.push(bits >> 8 & 255);
      result.push(bits & 255);
    } else if (tailbits === 18) {
      result.push(bits >> 10 & 255);
      result.push(bits >> 2 & 255);
    } else if (tailbits === 12) {
      result.push(bits >> 4 & 255);
    }
    return new Uint8Array(result);
  }
  function representYamlBinary(object) {
    let result = "";
    let bits = 0;
    const max = object.length;
    const map2 = BASE64_MAP;
    for (let idx = 0; idx < max; idx++) {
      if (idx % 3 === 0 && idx) {
        result += map2[bits >> 18 & 63];
        result += map2[bits >> 12 & 63];
        result += map2[bits >> 6 & 63];
        result += map2[bits & 63];
      }
      bits = (bits << 8) + object[idx];
    }
    const tail = max % 3;
    if (tail === 0) {
      result += map2[bits >> 18 & 63];
      result += map2[bits >> 12 & 63];
      result += map2[bits >> 6 & 63];
      result += map2[bits & 63];
    } else if (tail === 2) {
      result += map2[bits >> 10 & 63];
      result += map2[bits >> 4 & 63];
      result += map2[bits << 2 & 63];
      result += map2[64];
    } else if (tail === 1) {
      result += map2[bits >> 2 & 63];
      result += map2[bits << 4 & 63];
      result += map2[64];
      result += map2[64];
    }
    return result;
  }
  function isBinary(obj) {
    return Object.prototype.toString.call(obj) === "[object Uint8Array]";
  }
  binary = new Type2("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: isBinary,
    represent: representYamlBinary
  });
  return binary;
}
var omap;
var hasRequiredOmap;
function requireOmap() {
  if (hasRequiredOmap) return omap;
  hasRequiredOmap = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const _toString = Object.prototype.toString;
  function resolveYamlOmap(data) {
    if (data === null) return true;
    const objectKeys = {};
    const object = data;
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      let pairHasKey = false;
      if (_toString.call(pair) !== "[object Object]") return false;
      let pairKey;
      for (pairKey in pair) {
        if (_hasOwnProperty.call(pair, pairKey)) {
          if (!pairHasKey) pairHasKey = true;
          else return false;
        }
      }
      if (!pairHasKey) return false;
      if (_hasOwnProperty.call(objectKeys, pairKey)) return false;
      Object.defineProperty(objectKeys, pairKey, { value: true });
    }
    return true;
  }
  function constructYamlOmap(data) {
    return data !== null ? data : [];
  }
  omap = new Type2("tag:yaml.org,2002:omap", {
    kind: "sequence",
    resolve: resolveYamlOmap,
    construct: constructYamlOmap
  });
  return omap;
}
var pairs;
var hasRequiredPairs;
function requirePairs() {
  if (hasRequiredPairs) return pairs;
  hasRequiredPairs = 1;
  const Type2 = requireType();
  const _toString = Object.prototype.toString;
  function resolveYamlPairs(data) {
    if (data === null) return true;
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      if (_toString.call(pair) !== "[object Object]") return false;
      const keys = Object.keys(pair);
      if (keys.length !== 1) return false;
      result[index] = [keys[0], pair[keys[0]]];
    }
    return true;
  }
  function constructYamlPairs(data) {
    if (data === null) return [];
    const object = data;
    const result = new Array(object.length);
    for (let index = 0, length = object.length; index < length; index += 1) {
      const pair = object[index];
      const keys = Object.keys(pair);
      result[index] = [keys[0], pair[keys[0]]];
    }
    return result;
  }
  pairs = new Type2("tag:yaml.org,2002:pairs", {
    kind: "sequence",
    resolve: resolveYamlPairs,
    construct: constructYamlPairs
  });
  return pairs;
}
var set;
var hasRequiredSet;
function requireSet() {
  if (hasRequiredSet) return set;
  hasRequiredSet = 1;
  const Type2 = requireType();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  function resolveYamlSet(data) {
    if (data === null) return true;
    const object = data;
    for (const key in object) {
      if (_hasOwnProperty.call(object, key)) {
        if (object[key] !== null) return false;
      }
    }
    return true;
  }
  function constructYamlSet(data) {
    return data !== null ? data : {};
  }
  set = new Type2("tag:yaml.org,2002:set", {
    kind: "mapping",
    resolve: resolveYamlSet,
    construct: constructYamlSet
  });
  return set;
}
var _default;
var hasRequired_default;
function require_default() {
  if (hasRequired_default) return _default;
  hasRequired_default = 1;
  _default = requireCore().extend({
    implicit: [
      requireTimestamp(),
      requireMerge()
    ],
    explicit: [
      requireBinary(),
      requireOmap(),
      requirePairs(),
      requireSet()
    ]
  });
  return _default;
}
var hasRequiredLoader;
function requireLoader() {
  if (hasRequiredLoader) return loader;
  hasRequiredLoader = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const makeSnippet = requireSnippet();
  const DEFAULT_SCHEMA2 = require_default();
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CONTEXT_FLOW_IN = 1;
  const CONTEXT_FLOW_OUT = 2;
  const CONTEXT_BLOCK_IN = 3;
  const CONTEXT_BLOCK_OUT = 4;
  const CHOMPING_CLIP = 1;
  const CHOMPING_STRIP = 2;
  const CHOMPING_KEEP = 3;
  const PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
  const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
  const PATTERN_FLOW_INDICATORS = /[,\[\]{}]/;
  const PATTERN_TAG_HANDLE = /^(?:!|!!|![0-9A-Za-z-]+!)$/;
  const PATTERN_TAG_URI = /^(?:!|[^,\[\]{}])(?:%[0-9a-f]{2}|[0-9a-z\-#;/?:@&=+$,_.!~*'()\[\]])*$/i;
  function _class(obj) {
    return Object.prototype.toString.call(obj);
  }
  function isEol(c) {
    return c === 10 || c === 13;
  }
  function isWhiteSpace(c) {
    return c === 9 || c === 32;
  }
  function isWsOrEol(c) {
    return c === 9 || c === 32 || c === 10 || c === 13;
  }
  function isFlowIndicator(c) {
    return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
  }
  function fromHexCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    const lc = c | 32;
    if (lc >= 97 && lc <= 102) {
      return lc - 97 + 10;
    }
    return -1;
  }
  function escapedHexLen(c) {
    if (c === 120) {
      return 2;
    }
    if (c === 117) {
      return 4;
    }
    if (c === 85) {
      return 8;
    }
    return 0;
  }
  function fromDecimalCode(c) {
    if (c >= 48 && c <= 57) {
      return c - 48;
    }
    return -1;
  }
  function simpleEscapeSequence(c) {
    switch (c) {
      case 48:
        return "\0";
      case 97:
        return "\x07";
      case 98:
        return "\b";
      case 116:
        return "	";
      case 9:
        return "	";
      case 110:
        return "\n";
      case 118:
        return "\v";
      case 102:
        return "\f";
      case 114:
        return "\r";
      case 101:
        return "\x1B";
      case 32:
        return " ";
      case 34:
        return '"';
      case 47:
        return "/";
      case 92:
        return "\\";
      case 78:
        return "\x85";
      case 95:
        return "\xA0";
      case 76:
        return "\u2028";
      case 80:
        return "\u2029";
      default:
        return "";
    }
  }
  function charFromCodepoint(c) {
    if (c <= 65535) {
      return String.fromCharCode(c);
    }
    return String.fromCharCode(
      (c - 65536 >> 10) + 55296,
      (c - 65536 & 1023) + 56320
    );
  }
  function setProperty(object, key, value) {
    if (key === "__proto__") {
      Object.defineProperty(object, key, {
        configurable: true,
        enumerable: true,
        writable: true,
        value
      });
    } else {
      object[key] = value;
    }
  }
  const simpleEscapeCheck = new Array(256);
  const simpleEscapeMap = new Array(256);
  for (let i = 0; i < 256; i++) {
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
  }
  function State(input, options) {
    this.input = input;
    this.filename = options["filename"] || null;
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.onWarning = options["onWarning"] || null;
    this.legacy = options["legacy"] || false;
    this.json = options["json"] || false;
    this.listener = options["listener"] || null;
    this.maxDepth = typeof options["maxDepth"] === "number" ? options["maxDepth"] : 100;
    this.maxTotalMergeKeys = typeof options["maxTotalMergeKeys"] === "number" ? options["maxTotalMergeKeys"] : 1e4;
    this.implicitTypes = this.schema.compiledImplicit;
    this.typeMap = this.schema.compiledTypeMap;
    this.length = input.length;
    this.position = 0;
    this.line = 0;
    this.lineStart = 0;
    this.lineIndent = 0;
    this.depth = 0;
    this.totalMergeKeys = 0;
    this.firstTabInLine = -1;
    this.documents = [];
    this.anchorMapTransactions = [];
  }
  function generateError(state, message) {
    const mark = {
      name: state.filename,
      buffer: state.input.slice(0, -1),
      // omit trailing \0
      position: state.position,
      line: state.line,
      column: state.position - state.lineStart
    };
    mark.snippet = makeSnippet(mark);
    return new YAMLException2(message, mark);
  }
  function throwError(state, message) {
    throw generateError(state, message);
  }
  function throwWarning(state, message) {
    if (state.onWarning) {
      state.onWarning.call(null, generateError(state, message));
    }
  }
  function storeAnchor(state, name, value) {
    const transactions = state.anchorMapTransactions;
    if (transactions.length !== 0) {
      const transaction = transactions[transactions.length - 1];
      if (!_hasOwnProperty.call(transaction, name)) {
        transaction[name] = {
          existed: _hasOwnProperty.call(state.anchorMap, name),
          value: state.anchorMap[name]
        };
      }
    }
    state.anchorMap[name] = value;
  }
  function beginAnchorTransaction(state) {
    state.anchorMapTransactions.push(/* @__PURE__ */ Object.create(null));
  }
  function commitAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const transactions = state.anchorMapTransactions;
    if (transactions.length === 0) return;
    const parent = transactions[transactions.length - 1];
    const names = Object.keys(transaction);
    for (let index = 0, length = names.length; index < length; index += 1) {
      const name = names[index];
      if (!_hasOwnProperty.call(parent, name)) {
        parent[name] = transaction[name];
      }
    }
  }
  function rollbackAnchorTransaction(state) {
    const transaction = state.anchorMapTransactions.pop();
    const names = Object.keys(transaction);
    for (let index = names.length - 1; index >= 0; index -= 1) {
      const entry = transaction[names[index]];
      if (entry.existed) {
        state.anchorMap[names[index]] = entry.value;
      } else {
        delete state.anchorMap[names[index]];
      }
    }
  }
  function snapshotState(state) {
    return {
      position: state.position,
      line: state.line,
      lineStart: state.lineStart,
      lineIndent: state.lineIndent,
      firstTabInLine: state.firstTabInLine,
      tag: state.tag,
      anchor: state.anchor,
      kind: state.kind,
      result: state.result
    };
  }
  function restoreState(state, snapshot) {
    state.position = snapshot.position;
    state.line = snapshot.line;
    state.lineStart = snapshot.lineStart;
    state.lineIndent = snapshot.lineIndent;
    state.firstTabInLine = snapshot.firstTabInLine;
    state.tag = snapshot.tag;
    state.anchor = snapshot.anchor;
    state.kind = snapshot.kind;
    state.result = snapshot.result;
  }
  const directiveHandlers = {
    YAML: function handleYamlDirective(state, name, args) {
      if (state.version !== null) {
        throwError(state, "duplication of %YAML directive");
      }
      if (args.length !== 1) {
        throwError(state, "YAML directive accepts exactly one argument");
      }
      const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
      if (match === null) {
        throwError(state, "ill-formed argument of the YAML directive");
      }
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major !== 1) {
        throwError(state, "unacceptable YAML version of the document");
      }
      state.version = args[0];
      state.checkLineBreaks = minor < 2;
      if (minor !== 1 && minor !== 2) {
        throwWarning(state, "unsupported YAML version of the document");
      }
    },
    TAG: function handleTagDirective(state, name, args) {
      let prefix;
      if (args.length !== 2) {
        throwError(state, "TAG directive accepts exactly two arguments");
      }
      const handle = args[0];
      prefix = args[1];
      if (!PATTERN_TAG_HANDLE.test(handle)) {
        throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
      }
      if (_hasOwnProperty.call(state.tagMap, handle)) {
        throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
      }
      if (!PATTERN_TAG_URI.test(prefix)) {
        throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
      }
      try {
        prefix = decodeURIComponent(prefix);
      } catch (err) {
        throwError(state, "tag prefix is malformed: " + prefix);
      }
      state.tagMap[handle] = prefix;
    }
  };
  function captureSegment(state, start, end, checkJson) {
    if (start < end) {
      const _result = state.input.slice(start, end);
      if (checkJson) {
        for (let _position = 0, _length = _result.length; _position < _length; _position += 1) {
          const _character = _result.charCodeAt(_position);
          if (!(_character === 9 || _character >= 32 && _character <= 1114111)) {
            throwError(state, "expected valid JSON character");
          }
        }
      } else if (PATTERN_NON_PRINTABLE.test(_result)) {
        throwError(state, "the stream contains non-printable characters");
      }
      state.result += _result;
    }
  }
  function mergeMappings(state, destination, source, overridableKeys) {
    if (!common2.isObject(source)) {
      throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    const sourceKeys = Object.keys(source);
    for (let index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
      const key = sourceKeys[index];
      if (state.maxTotalMergeKeys !== -1 && ++state.totalMergeKeys > state.maxTotalMergeKeys) {
        throwError(state, "merge keys exceeded maxTotalMergeKeys (" + state.maxTotalMergeKeys + ")");
      }
      if (!_hasOwnProperty.call(destination, key)) {
        setProperty(destination, key, source[key]);
        overridableKeys[key] = true;
      }
    }
  }
  function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startLineStart, startPos) {
    if (Array.isArray(keyNode)) {
      keyNode = Array.prototype.slice.call(keyNode);
      for (let index = 0, quantity = keyNode.length; index < quantity; index += 1) {
        if (Array.isArray(keyNode[index])) {
          throwError(state, "nested arrays are not supported inside keys");
        }
        if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
          keyNode[index] = "[object Object]";
        }
      }
    }
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
      keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (_result === null) {
      _result = {};
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
      if (Array.isArray(valueNode)) {
        for (let index = 0, quantity = valueNode.length; index < quantity; index += 1) {
          mergeMappings(state, _result, valueNode[index], overridableKeys);
        }
      } else {
        mergeMappings(state, _result, valueNode, overridableKeys);
      }
    } else {
      if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
        state.line = startLine || state.line;
        state.lineStart = startLineStart || state.lineStart;
        state.position = startPos || state.position;
        throwError(state, "duplicated mapping key");
      }
      setProperty(_result, keyNode, valueNode);
      delete overridableKeys[keyNode];
    }
    return _result;
  }
  function readLineBreak(state) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 10) {
      state.position++;
    } else if (ch === 13) {
      state.position++;
      if (state.input.charCodeAt(state.position) === 10) {
        state.position++;
      }
    } else {
      throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
    state.firstTabInLine = -1;
  }
  function skipSeparationSpace(state, allowComments, checkIndent) {
    let lineBreaks = 0;
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      while (isWhiteSpace(ch)) {
        if (ch === 9 && state.firstTabInLine === -1) {
          state.firstTabInLine = state.position;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      if (allowComments && ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 10 && ch !== 13 && ch !== 0);
      }
      if (isEol(ch)) {
        readLineBreak(state);
        ch = state.input.charCodeAt(state.position);
        lineBreaks++;
        state.lineIndent = 0;
        while (ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
      } else {
        break;
      }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
      throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
  }
  function testDocumentSeparator(state) {
    let _position = state.position;
    let ch = state.input.charCodeAt(_position);
    if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
      _position += 3;
      ch = state.input.charCodeAt(_position);
      if (ch === 0 || isWsOrEol(ch)) {
        return true;
      }
    }
    return false;
  }
  function writeFoldedLines(state, count) {
    if (count === 1) {
      state.result += " ";
    } else if (count > 1) {
      state.result += common2.repeat("\n", count - 1);
    }
  }
  function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    let captureStart;
    let captureEnd;
    let hasPendingContent;
    let _line;
    let _lineStart;
    let _lineIndent;
    const _kind = state.kind;
    const _result = state.result;
    let ch = state.input.charCodeAt(state.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
      return false;
    }
    if (ch === 63 || ch === 45) {
      const following = state.input.charCodeAt(state.position + 1);
      if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
        return false;
      }
    }
    state.kind = "scalar";
    state.result = "";
    captureStart = captureEnd = state.position;
    hasPendingContent = false;
    while (ch !== 0) {
      if (ch === 58) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
          break;
        }
      } else if (ch === 35) {
        const preceding = state.input.charCodeAt(state.position - 1);
        if (isWsOrEol(preceding)) {
          break;
        }
      } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
        break;
      } else if (isEol(ch)) {
        _line = state.line;
        _lineStart = state.lineStart;
        _lineIndent = state.lineIndent;
        skipSeparationSpace(state, false, -1);
        if (state.lineIndent >= nodeIndent) {
          hasPendingContent = true;
          ch = state.input.charCodeAt(state.position);
          continue;
        } else {
          state.position = captureEnd;
          state.line = _line;
          state.lineStart = _lineStart;
          state.lineIndent = _lineIndent;
          break;
        }
      }
      if (hasPendingContent) {
        captureSegment(state, captureStart, captureEnd, false);
        writeFoldedLines(state, state.line - _line);
        captureStart = captureEnd = state.position;
        hasPendingContent = false;
      }
      if (!isWhiteSpace(ch)) {
        captureEnd = state.position + 1;
      }
      ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
      return true;
    }
    state.kind = _kind;
    state.result = _result;
    return false;
  }
  function readSingleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 39) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 39) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (ch === 39) {
          captureStart = state.position;
          state.position++;
          captureEnd = state.position;
        } else {
          return true;
        }
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a single quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a single quoted scalar");
  }
  function readDoubleQuotedScalar(state, nodeIndent) {
    let captureStart;
    let captureEnd;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 34) {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      if (ch === 34) {
        captureSegment(state, captureStart, state.position, true);
        state.position++;
        return true;
      } else if (ch === 92) {
        captureSegment(state, captureStart, state.position, true);
        ch = state.input.charCodeAt(++state.position);
        if (isEol(ch)) {
          skipSeparationSpace(state, false, nodeIndent);
        } else if (ch < 256 && simpleEscapeCheck[ch]) {
          state.result += simpleEscapeMap[ch];
          state.position++;
        } else if ((tmp = escapedHexLen(ch)) > 0) {
          let hexLength = tmp;
          let hexResult = 0;
          for (; hexLength > 0; hexLength--) {
            ch = state.input.charCodeAt(++state.position);
            if ((tmp = fromHexCode(ch)) >= 0) {
              hexResult = (hexResult << 4) + tmp;
            } else {
              throwError(state, "expected hexadecimal character");
            }
          }
          state.result += charFromCodepoint(hexResult);
          state.position++;
        } else {
          throwError(state, "unknown escape sequence");
        }
        captureStart = captureEnd = state.position;
      } else if (isEol(ch)) {
        captureSegment(state, captureStart, captureEnd, true);
        writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
        captureStart = captureEnd = state.position;
      } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
        throwError(state, "unexpected end of the document within a double quoted scalar");
      } else {
        state.position++;
        if (!isWhiteSpace(ch)) {
          captureEnd = state.position;
        }
      }
    }
    throwError(state, "unexpected end of the stream within a double quoted scalar");
  }
  function readFlowCollection(state, nodeIndent) {
    let readNext = true;
    let _line;
    let _lineStart;
    let _pos;
    const _tag = state.tag;
    let _result;
    const _anchor = state.anchor;
    let terminator;
    let isPair;
    let isExplicitPair;
    let isMapping;
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyNode;
    let keyTag;
    let valueNode;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 91) {
      terminator = 93;
      isMapping = false;
      _result = [];
    } else if (ch === 123) {
      terminator = 125;
      isMapping = true;
      _result = {};
    } else {
      return false;
    }
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    ch = state.input.charCodeAt(++state.position);
    while (ch !== 0) {
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === terminator) {
        state.position++;
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = isMapping ? "mapping" : "sequence";
        state.result = _result;
        return true;
      } else if (!readNext) {
        throwError(state, "missed comma between flow collection entries");
      } else if (ch === 44) {
        throwError(state, "expected the node content, but found ','");
      }
      keyTag = keyNode = valueNode = null;
      isPair = isExplicitPair = false;
      if (ch === 63) {
        const following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following)) {
          isPair = isExplicitPair = true;
          state.position++;
          skipSeparationSpace(state, true, nodeIndent);
        }
      }
      _line = state.line;
      _lineStart = state.lineStart;
      _pos = state.position;
      composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
      keyTag = state.tag;
      keyNode = state.result;
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if ((isExplicitPair || state.line === _line) && ch === 58) {
        isPair = true;
        ch = state.input.charCodeAt(++state.position);
        skipSeparationSpace(state, true, nodeIndent);
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        valueNode = state.result;
      }
      if (isMapping) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos);
      } else if (isPair) {
        _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode, _line, _lineStart, _pos));
      } else {
        _result.push(keyNode);
      }
      skipSeparationSpace(state, true, nodeIndent);
      ch = state.input.charCodeAt(state.position);
      if (ch === 44) {
        readNext = true;
        ch = state.input.charCodeAt(++state.position);
      } else {
        readNext = false;
      }
    }
    throwError(state, "unexpected end of the stream within a flow collection");
  }
  function readBlockScalar(state, nodeIndent) {
    let folding;
    let chomping = CHOMPING_CLIP;
    let didReadContent = false;
    let detectedIndent = false;
    let textIndent = nodeIndent;
    let emptyLines = 0;
    let atMoreIndented = false;
    let tmp;
    let ch = state.input.charCodeAt(state.position);
    if (ch === 124) {
      folding = false;
    } else if (ch === 62) {
      folding = true;
    } else {
      return false;
    }
    state.kind = "scalar";
    state.result = "";
    while (ch !== 0) {
      ch = state.input.charCodeAt(++state.position);
      if (ch === 43 || ch === 45) {
        if (CHOMPING_CLIP === chomping) {
          chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
        } else {
          throwError(state, "repeat of a chomping mode identifier");
        }
      } else if ((tmp = fromDecimalCode(ch)) >= 0) {
        if (tmp === 0) {
          throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
        } else if (!detectedIndent) {
          textIndent = nodeIndent + tmp - 1;
          detectedIndent = true;
        } else {
          throwError(state, "repeat of an indentation width identifier");
        }
      } else {
        break;
      }
    }
    if (isWhiteSpace(ch)) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (isWhiteSpace(ch));
      if (ch === 35) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (!isEol(ch) && ch !== 0);
      }
    }
    while (ch !== 0) {
      readLineBreak(state);
      state.lineIndent = 0;
      ch = state.input.charCodeAt(state.position);
      while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
        state.lineIndent++;
        ch = state.input.charCodeAt(++state.position);
      }
      if (!detectedIndent && state.lineIndent > textIndent) {
        textIndent = state.lineIndent;
      }
      if (isEol(ch)) {
        emptyLines++;
        continue;
      }
      if (!detectedIndent && textIndent === 0) {
        throwError(state, "missing indentation for block scalar");
      }
      if (state.lineIndent < textIndent) {
        if (chomping === CHOMPING_KEEP) {
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (chomping === CHOMPING_CLIP) {
          if (didReadContent) {
            state.result += "\n";
          }
        }
        break;
      }
      if (folding) {
        if (isWhiteSpace(ch)) {
          atMoreIndented = true;
          state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        } else if (atMoreIndented) {
          atMoreIndented = false;
          state.result += common2.repeat("\n", emptyLines + 1);
        } else if (emptyLines === 0) {
          if (didReadContent) {
            state.result += " ";
          }
        } else {
          state.result += common2.repeat("\n", emptyLines);
        }
      } else {
        state.result += common2.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
      }
      didReadContent = true;
      detectedIndent = true;
      emptyLines = 0;
      const captureStart = state.position;
      while (!isEol(ch) && ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, state.position, false);
    }
    return true;
  }
  function readBlockSequence(state, nodeIndent) {
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = [];
    let detected = false;
    if (state.firstTabInLine !== -1) return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      if (ch !== 45) {
        break;
      }
      const following = state.input.charCodeAt(state.position + 1);
      if (!isWsOrEol(following)) {
        break;
      }
      detected = true;
      state.position++;
      if (skipSeparationSpace(state, true, -1)) {
        if (state.lineIndent <= nodeIndent) {
          _result.push(null);
          ch = state.input.charCodeAt(state.position);
          continue;
        }
      }
      const _line = state.line;
      composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
      _result.push(state.result);
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a sequence entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "sequence";
      state.result = _result;
      return true;
    }
    return false;
  }
  function readBlockMapping(state, nodeIndent, flowIndent) {
    let allowCompact;
    let _keyLine;
    let _keyLineStart;
    let _keyPos;
    const _tag = state.tag;
    const _anchor = state.anchor;
    const _result = {};
    const overridableKeys = /* @__PURE__ */ Object.create(null);
    let keyTag = null;
    let keyNode = null;
    let valueNode = null;
    let atExplicitKey = false;
    let detected = false;
    if (state.firstTabInLine !== -1) return false;
    if (state.anchor !== null) {
      storeAnchor(state, state.anchor, _result);
    }
    let ch = state.input.charCodeAt(state.position);
    while (ch !== 0) {
      if (!atExplicitKey && state.firstTabInLine !== -1) {
        state.position = state.firstTabInLine;
        throwError(state, "tab characters must not be used in indentation");
      }
      const following = state.input.charCodeAt(state.position + 1);
      const _line = state.line;
      if ((ch === 63 || ch === 58) && isWsOrEol(following)) {
        if (ch === 63) {
          if (atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
            keyTag = keyNode = valueNode = null;
          }
          detected = true;
          atExplicitKey = true;
          allowCompact = true;
        } else if (atExplicitKey) {
          atExplicitKey = false;
          allowCompact = true;
        } else {
          throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
        }
        state.position += 1;
        ch = following;
      } else {
        _keyLine = state.line;
        _keyLineStart = state.lineStart;
        _keyPos = state.position;
        if (!composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          break;
        }
        if (state.line === _line) {
          ch = state.input.charCodeAt(state.position);
          while (isWhiteSpace(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 58) {
            ch = state.input.charCodeAt(++state.position);
            if (!isWsOrEol(ch)) {
              throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
            }
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = false;
            allowCompact = false;
            keyTag = state.tag;
            keyNode = state.result;
          } else if (detected) {
            throwError(state, "can not read an implicit mapping pair; a colon is missed");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else if (detected) {
          throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
        } else {
          state.tag = _tag;
          state.anchor = _anchor;
          return true;
        }
      }
      if (state.line === _line || state.lineIndent > nodeIndent) {
        if (atExplicitKey) {
          _keyLine = state.line;
          _keyLineStart = state.lineStart;
          _keyPos = state.position;
        }
        if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
          if (atExplicitKey) {
            keyNode = state.result;
          } else {
            valueNode = state.result;
          }
        }
        if (!atExplicitKey) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _keyLine, _keyLineStart, _keyPos);
          keyTag = keyNode = valueNode = null;
        }
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
      }
      if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
        throwError(state, "bad indentation of a mapping entry");
      } else if (state.lineIndent < nodeIndent) {
        break;
      }
    }
    if (atExplicitKey) {
      storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null, _keyLine, _keyLineStart, _keyPos);
    }
    if (detected) {
      state.tag = _tag;
      state.anchor = _anchor;
      state.kind = "mapping";
      state.result = _result;
    }
    return detected;
  }
  function readTagProperty(state) {
    let isVerbatim = false;
    let isNamed = false;
    let tagHandle;
    let tagName;
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 33) return false;
    if (state.tag !== null) {
      throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60) {
      isVerbatim = true;
      ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33) {
      isNamed = true;
      tagHandle = "!!";
      ch = state.input.charCodeAt(++state.position);
    } else {
      tagHandle = "!";
    }
    let _position = state.position;
    if (isVerbatim) {
      do {
        ch = state.input.charCodeAt(++state.position);
      } while (ch !== 0 && ch !== 62);
      if (state.position < state.length) {
        tagName = state.input.slice(_position, state.position);
        ch = state.input.charCodeAt(++state.position);
      } else {
        throwError(state, "unexpected end of the stream within a verbatim tag");
      }
    } else {
      while (ch !== 0 && !isWsOrEol(ch)) {
        if (ch === 33) {
          if (!isNamed) {
            tagHandle = state.input.slice(_position - 1, state.position + 1);
            if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
              throwError(state, "named tag handle cannot contain such characters");
            }
            isNamed = true;
            _position = state.position + 1;
          } else {
            throwError(state, "tag suffix cannot contain exclamation marks");
          }
        }
        ch = state.input.charCodeAt(++state.position);
      }
      tagName = state.input.slice(_position, state.position);
      if (PATTERN_FLOW_INDICATORS.test(tagName)) {
        throwError(state, "tag suffix cannot contain flow indicator characters");
      }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
      throwError(state, "tag name cannot contain such characters: " + tagName);
    }
    try {
      tagName = decodeURIComponent(tagName);
    } catch (err) {
      throwError(state, "tag name is malformed: " + tagName);
    }
    if (isVerbatim) {
      state.tag = tagName;
    } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
      state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
      state.tag = "!" + tagName;
    } else if (tagHandle === "!!") {
      state.tag = "tag:yaml.org,2002:" + tagName;
    } else {
      throwError(state, 'undeclared tag handle "' + tagHandle + '"');
    }
    return true;
  }
  function readAnchorProperty(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 38) return false;
    if (state.anchor !== null) {
      throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(_position, state.position);
    return true;
  }
  function readAlias(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 42) return false;
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while (ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)) {
      ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
      throwError(state, "name of an alias node must contain at least one character");
    }
    const alias = state.input.slice(_position, state.position);
    if (!_hasOwnProperty.call(state.anchorMap, alias)) {
      throwError(state, 'unidentified alias "' + alias + '"');
    }
    state.result = state.anchorMap[alias];
    skipSeparationSpace(state, true, -1);
    return true;
  }
  function tryReadBlockMappingFromProperty(state, propertyStart, nodeIndent, flowIndent) {
    const fallbackState = snapshotState(state);
    beginAnchorTransaction(state);
    restoreState(state, propertyStart);
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    if (readBlockMapping(state, nodeIndent, flowIndent) && state.kind === "mapping") {
      commitAnchorTransaction(state);
      return true;
    }
    rollbackAnchorTransaction(state);
    restoreState(state, fallbackState);
    return false;
  }
  function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars;
    let allowBlockCollections;
    let indentStatus = 1;
    let atNewLine = false;
    let hasContent = false;
    let propertyStart = null;
    let type2;
    let flowIndent;
    let blockIndent;
    if (state.depth >= state.maxDepth) {
      throwError(state, "nesting exceeded maxDepth (" + state.maxDepth + ")");
    }
    state.depth += 1;
    if (state.listener !== null) {
      state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
      if (skipSeparationSpace(state, true, -1)) {
        atNewLine = true;
        if (state.lineIndent > parentIndent) {
          indentStatus = 1;
        } else if (state.lineIndent === parentIndent) {
          indentStatus = 0;
        } else if (state.lineIndent < parentIndent) {
          indentStatus = -1;
        }
      }
    }
    if (indentStatus === 1) {
      while (true) {
        const ch = state.input.charCodeAt(state.position);
        const propertyState = snapshotState(state);
        if (atNewLine && (ch === 33 && state.tag !== null || ch === 38 && state.anchor !== null)) {
          break;
        }
        if (!readTagProperty(state) && !readAnchorProperty(state)) {
          break;
        }
        if (propertyStart === null) {
          propertyStart = propertyState;
        }
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          allowBlockCollections = allowBlockStyles;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        } else {
          allowBlockCollections = false;
        }
      }
    }
    if (allowBlockCollections) {
      allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
      if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
        flowIndent = parentIndent;
      } else {
        flowIndent = parentIndent + 1;
      }
      blockIndent = state.position - state.lineStart;
      if (indentStatus === 1) {
        if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
          hasContent = true;
        } else {
          const ch = state.input.charCodeAt(state.position);
          if (propertyStart !== null && allowBlockStyles && !allowBlockCollections && ch !== 124 && ch !== 62 && tryReadBlockMappingFromProperty(
            state,
            propertyStart,
            propertyStart.position - propertyStart.lineStart,
            flowIndent
          )) {
            hasContent = true;
          } else if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
            hasContent = true;
          } else if (readAlias(state)) {
            hasContent = true;
            if (state.tag !== null || state.anchor !== null) {
              throwError(state, "alias node should not have any properties");
            }
          } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
            hasContent = true;
            if (state.tag === null) {
              state.tag = "?";
            }
          }
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
        }
      } else if (indentStatus === 0) {
        hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
      }
    }
    if (state.tag === null) {
      if (state.anchor !== null) {
        storeAnchor(state, state.anchor, state.result);
      }
    } else if (state.tag === "?") {
      if (state.result !== null && state.kind !== "scalar") {
        throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
      }
      for (let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
        type2 = state.implicitTypes[typeIndex];
        if (type2.resolve(state.result)) {
          state.result = type2.construct(state.result);
          state.tag = type2.tag;
          if (state.anchor !== null) {
            storeAnchor(state, state.anchor, state.result);
          }
          break;
        }
      }
    } else if (state.tag !== "!") {
      if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
        type2 = state.typeMap[state.kind || "fallback"][state.tag];
      } else {
        type2 = null;
        const typeList = state.typeMap.multi[state.kind || "fallback"];
        for (let typeIndex = 0, typeQuantity = typeList.length; typeIndex < typeQuantity; typeIndex += 1) {
          if (state.tag.slice(0, typeList[typeIndex].tag.length) === typeList[typeIndex].tag) {
            type2 = typeList[typeIndex];
            break;
          }
        }
      }
      if (!type2) {
        throwError(state, "unknown tag !<" + state.tag + ">");
      }
      if (state.result !== null && type2.kind !== state.kind) {
        throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type2.kind + '", not "' + state.kind + '"');
      }
      if (!type2.resolve(state.result, state.tag)) {
        throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
      } else {
        state.result = type2.construct(state.result, state.tag);
        if (state.anchor !== null) {
          storeAnchor(state, state.anchor, state.result);
        }
      }
    }
    if (state.listener !== null) {
      state.listener("close", state);
    }
    state.depth -= 1;
    return state.tag !== null || state.anchor !== null || hasContent;
  }
  function readDocument(state) {
    const documentStart = state.position;
    let hasDirectives = false;
    let ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = /* @__PURE__ */ Object.create(null);
    state.anchorMap = /* @__PURE__ */ Object.create(null);
    while ((ch = state.input.charCodeAt(state.position)) !== 0) {
      skipSeparationSpace(state, true, -1);
      ch = state.input.charCodeAt(state.position);
      if (state.lineIndent > 0 || ch !== 37) {
        break;
      }
      hasDirectives = true;
      ch = state.input.charCodeAt(++state.position);
      let _position = state.position;
      while (ch !== 0 && !isWsOrEol(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      const directiveName = state.input.slice(_position, state.position);
      const directiveArgs = [];
      if (directiveName.length < 1) {
        throwError(state, "directive name must not be less than one character in length");
      }
      while (ch !== 0) {
        while (isWhiteSpace(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 0 && !isEol(ch));
          break;
        }
        if (isEol(ch)) break;
        _position = state.position;
        while (ch !== 0 && !isWsOrEol(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveArgs.push(state.input.slice(_position, state.position));
      }
      if (ch !== 0) readLineBreak(state);
      if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
        directiveHandlers[directiveName](state, directiveName, directiveArgs);
      } else {
        throwWarning(state, 'unknown document directive "' + directiveName + '"');
      }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
      state.position += 3;
      skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
      throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
      throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
      if (state.input.charCodeAt(state.position) === 46) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      }
      return;
    }
    if (state.position < state.length - 1) {
      throwError(state, "end of the stream or a document separator is expected");
    }
  }
  function loadDocuments(input, options) {
    input = String(input);
    options = options || {};
    if (input.length !== 0) {
      if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
        input += "\n";
      }
      if (input.charCodeAt(0) === 65279) {
        input = input.slice(1);
      }
    }
    const state = new State(input, options);
    const nullpos = input.indexOf("\0");
    if (nullpos !== -1) {
      state.position = nullpos;
      throwError(state, "null byte is not allowed in input");
    }
    state.input += "\0";
    while (state.input.charCodeAt(state.position) === 32) {
      state.lineIndent += 1;
      state.position += 1;
    }
    while (state.position < state.length - 1) {
      readDocument(state);
    }
    return state.documents;
  }
  function loadAll2(input, iterator, options) {
    if (iterator !== null && typeof iterator === "object" && typeof options === "undefined") {
      options = iterator;
      iterator = null;
    }
    const documents = loadDocuments(input, options);
    if (typeof iterator !== "function") {
      return documents;
    }
    for (let index = 0, length = documents.length; index < length; index += 1) {
      iterator(documents[index]);
    }
  }
  function load2(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
      return void 0;
    } else if (documents.length === 1) {
      return documents[0];
    }
    throw new YAMLException2("expected a single document in the stream, but found more");
  }
  loader.loadAll = loadAll2;
  loader.load = load2;
  return loader;
}
var dumper = {};
var hasRequiredDumper;
function requireDumper() {
  if (hasRequiredDumper) return dumper;
  hasRequiredDumper = 1;
  const common2 = requireCommon();
  const YAMLException2 = requireException();
  const DEFAULT_SCHEMA2 = require_default();
  const _toString = Object.prototype.toString;
  const _hasOwnProperty = Object.prototype.hasOwnProperty;
  const CHAR_BOM = 65279;
  const CHAR_TAB = 9;
  const CHAR_LINE_FEED = 10;
  const CHAR_CARRIAGE_RETURN = 13;
  const CHAR_SPACE = 32;
  const CHAR_EXCLAMATION = 33;
  const CHAR_DOUBLE_QUOTE = 34;
  const CHAR_SHARP = 35;
  const CHAR_PERCENT = 37;
  const CHAR_AMPERSAND = 38;
  const CHAR_SINGLE_QUOTE = 39;
  const CHAR_ASTERISK = 42;
  const CHAR_COMMA = 44;
  const CHAR_MINUS = 45;
  const CHAR_COLON = 58;
  const CHAR_EQUALS = 61;
  const CHAR_GREATER_THAN = 62;
  const CHAR_QUESTION = 63;
  const CHAR_COMMERCIAL_AT = 64;
  const CHAR_LEFT_SQUARE_BRACKET = 91;
  const CHAR_RIGHT_SQUARE_BRACKET = 93;
  const CHAR_GRAVE_ACCENT = 96;
  const CHAR_LEFT_CURLY_BRACKET = 123;
  const CHAR_VERTICAL_LINE = 124;
  const CHAR_RIGHT_CURLY_BRACKET = 125;
  const ESCAPE_SEQUENCES = {};
  ESCAPE_SEQUENCES[0] = "\\0";
  ESCAPE_SEQUENCES[7] = "\\a";
  ESCAPE_SEQUENCES[8] = "\\b";
  ESCAPE_SEQUENCES[9] = "\\t";
  ESCAPE_SEQUENCES[10] = "\\n";
  ESCAPE_SEQUENCES[11] = "\\v";
  ESCAPE_SEQUENCES[12] = "\\f";
  ESCAPE_SEQUENCES[13] = "\\r";
  ESCAPE_SEQUENCES[27] = "\\e";
  ESCAPE_SEQUENCES[34] = '\\"';
  ESCAPE_SEQUENCES[92] = "\\\\";
  ESCAPE_SEQUENCES[133] = "\\N";
  ESCAPE_SEQUENCES[160] = "\\_";
  ESCAPE_SEQUENCES[8232] = "\\L";
  ESCAPE_SEQUENCES[8233] = "\\P";
  const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF"
  ];
  const DEPRECATED_BASE60_SYNTAX = /^[-+]?[0-9_]+(?::[0-9_]+)+(?:\.[0-9_]*)?$/;
  function compileStyleMap(schema2, map2) {
    if (map2 === null) return {};
    const result = {};
    const keys = Object.keys(map2);
    for (let index = 0, length = keys.length; index < length; index += 1) {
      let tag = keys[index];
      let style = String(map2[tag]);
      if (tag.slice(0, 2) === "!!") {
        tag = "tag:yaml.org,2002:" + tag.slice(2);
      }
      const type2 = schema2.compiledTypeMap["fallback"][tag];
      if (type2 && _hasOwnProperty.call(type2.styleAliases, style)) {
        style = type2.styleAliases[style];
      }
      result[tag] = style;
    }
    return result;
  }
  function encodeHex(character) {
    let handle;
    let length;
    const string = character.toString(16).toUpperCase();
    if (character <= 255) {
      handle = "x";
      length = 2;
    } else if (character <= 65535) {
      handle = "u";
      length = 4;
    } else if (character <= 4294967295) {
      handle = "U";
      length = 8;
    } else {
      throw new YAMLException2("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return "\\" + handle + common2.repeat("0", length - string.length) + string;
  }
  const QUOTING_TYPE_SINGLE = 1;
  const QUOTING_TYPE_DOUBLE = 2;
  function State(options) {
    this.schema = options["schema"] || DEFAULT_SCHEMA2;
    this.indent = Math.max(1, options["indent"] || 2);
    this.noArrayIndent = options["noArrayIndent"] || false;
    this.skipInvalid = options["skipInvalid"] || false;
    this.flowLevel = common2.isNothing(options["flowLevel"]) ? -1 : options["flowLevel"];
    this.styleMap = compileStyleMap(this.schema, options["styles"] || null);
    this.sortKeys = options["sortKeys"] || false;
    this.lineWidth = options["lineWidth"] || 80;
    this.noRefs = options["noRefs"] || false;
    this.noCompatMode = options["noCompatMode"] || false;
    this.condenseFlow = options["condenseFlow"] || false;
    this.quotingType = options["quotingType"] === '"' ? QUOTING_TYPE_DOUBLE : QUOTING_TYPE_SINGLE;
    this.forceQuotes = options["forceQuotes"] || false;
    this.replacer = typeof options["replacer"] === "function" ? options["replacer"] : null;
    this.implicitTypes = this.schema.compiledImplicit;
    this.explicitTypes = this.schema.compiledExplicit;
    this.tag = null;
    this.result = "";
    this.duplicates = [];
    this.usedDuplicates = null;
  }
  function indentString(string, spaces) {
    const ind = common2.repeat(" ", spaces);
    let position = 0;
    let result = "";
    const length = string.length;
    while (position < length) {
      let line;
      const next = string.indexOf("\n", position);
      if (next === -1) {
        line = string.slice(position);
        position = length;
      } else {
        line = string.slice(position, next + 1);
        position = next + 1;
      }
      if (line.length && line !== "\n") result += ind;
      result += line;
    }
    return result;
  }
  function generateNextLine(state, level) {
    return "\n" + common2.repeat(" ", state.indent * level);
  }
  function testImplicitResolving(state, str2) {
    for (let index = 0, length = state.implicitTypes.length; index < length; index += 1) {
      const type2 = state.implicitTypes[index];
      if (type2.resolve(str2)) {
        return true;
      }
    }
    return false;
  }
  function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
  }
  function isPrintable(c) {
    return c >= 32 && c <= 126 || c >= 161 && c <= 55295 && c !== 8232 && c !== 8233 || c >= 57344 && c <= 65533 && c !== CHAR_BOM || c >= 65536 && c <= 1114111;
  }
  function isNsCharOrWhitespace(c) {
    return isPrintable(c) && c !== CHAR_BOM && // - b-char
    c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
  }
  function isPlainSafe(c, prev, inblock) {
    const cIsNsCharOrWhitespace = isNsCharOrWhitespace(c);
    const cIsNsChar = cIsNsCharOrWhitespace && !isWhitespace(c);
    return (
      // ns-plain-safe
      (inblock ? cIsNsCharOrWhitespace : cIsNsCharOrWhitespace && // - c-flow-indicator
      c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET) && // ns-plain-char
      c !== CHAR_SHARP && // false on '#'
      !(prev === CHAR_COLON && !cIsNsChar) || // false on ': '
      isNsCharOrWhitespace(prev) && !isWhitespace(prev) && c === CHAR_SHARP || // change to true on '[^ ]#'
      prev === CHAR_COLON && cIsNsChar
    );
  }
  function isPlainSafeFirst(c) {
    return isPrintable(c) && c !== CHAR_BOM && !isWhitespace(c) && // - s-white
    // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && // | “#” | “&” | “*” | “!” | “|” | “=” | “>” | “'” | “"”
    c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && // | “%” | “@” | “`”)
    c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
  }
  function isPlainSafeLast(c) {
    return !isWhitespace(c) && c !== CHAR_COLON;
  }
  function codePointAt(string, pos) {
    const first = string.charCodeAt(pos);
    let second;
    if (first >= 55296 && first <= 56319 && pos + 1 < string.length) {
      second = string.charCodeAt(pos + 1);
      if (second >= 56320 && second <= 57343) {
        return (first - 55296) * 1024 + second - 56320 + 65536;
      }
    }
    return first;
  }
  function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
  }
  const STYLE_PLAIN = 1;
  const STYLE_SINGLE = 2;
  const STYLE_LITERAL = 3;
  const STYLE_FOLDED = 4;
  const STYLE_DOUBLE = 5;
  function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType, quotingType, forceQuotes, inblock) {
    let i;
    let char = 0;
    let prevChar = null;
    let hasLineBreak = false;
    let hasFoldableLine = false;
    const shouldTrackWidth = lineWidth !== -1;
    let previousLineBreak = -1;
    let plain = isPlainSafeFirst(codePointAt(string, 0)) && isPlainSafeLast(codePointAt(string, string.length - 1));
    if (singleLineOnly || forceQuotes) {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
    } else {
      for (i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
        char = codePointAt(string, i);
        if (char === CHAR_LINE_FEED) {
          hasLineBreak = true;
          if (shouldTrackWidth) {
            hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
            i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
            previousLineBreak = i;
          }
        } else if (!isPrintable(char)) {
          return STYLE_DOUBLE;
        }
        plain = plain && isPlainSafe(char, prevChar, inblock);
        prevChar = char;
      }
      hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
      if (plain && !forceQuotes && !testAmbiguousType(string)) {
        return STYLE_PLAIN;
      }
      return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
      return STYLE_DOUBLE;
    }
    if (!forceQuotes) {
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    return quotingType === QUOTING_TYPE_DOUBLE ? STYLE_DOUBLE : STYLE_SINGLE;
  }
  function writeScalar(state, string, level, iskey, inblock) {
    state.dump = function() {
      if (string.length === 0) {
        return state.quotingType === QUOTING_TYPE_DOUBLE ? '""' : "''";
      }
      if (!state.noCompatMode) {
        if (DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1 || DEPRECATED_BASE60_SYNTAX.test(string)) {
          return state.quotingType === QUOTING_TYPE_DOUBLE ? '"' + string + '"' : "'" + string + "'";
        }
      }
      const indent = state.indent * Math.max(1, level);
      const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
      const singleLineOnly = iskey || // No block styles in flow mode.
      state.flowLevel > -1 && level >= state.flowLevel;
      function testAmbiguity(string2) {
        return testImplicitResolving(state, string2);
      }
      switch (chooseScalarStyle(
        string,
        singleLineOnly,
        state.indent,
        lineWidth,
        testAmbiguity,
        state.quotingType,
        state.forceQuotes && !iskey,
        inblock
      )) {
        case STYLE_PLAIN:
          return string;
        case STYLE_SINGLE:
          return "'" + string.replace(/'/g, "''") + "'";
        case STYLE_LITERAL:
          return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
        case STYLE_FOLDED:
          return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
        case STYLE_DOUBLE:
          return '"' + escapeString(string) + '"';
        default:
          throw new YAMLException2("impossible error: invalid scalar style");
      }
    }();
  }
  function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    const clip = string[string.length - 1] === "\n";
    const keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    const chomp = keep ? "+" : clip ? "" : "-";
    return indentIndicator + chomp + "\n";
  }
  function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
  }
  function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = function() {
      let nextLF = string.indexOf("\n");
      nextLF = nextLF !== -1 ? nextLF : string.length;
      lineRe.lastIndex = nextLF;
      return foldLine(string.slice(0, nextLF), width);
    }();
    let prevMoreIndented = string[0] === "\n" || string[0] === " ";
    let moreIndented;
    let match;
    while (match = lineRe.exec(string)) {
      const prefix = match[1];
      const line = match[2];
      moreIndented = line[0] === " ";
      result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
      prevMoreIndented = moreIndented;
    }
    return result;
  }
  function foldLine(line, width) {
    if (line === "" || line[0] === " ") return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0;
    let end;
    let curr = 0;
    let next = 0;
    let result = "";
    while (match = breakRe.exec(line)) {
      next = match.index;
      if (next - start > width) {
        end = curr > start ? curr : next;
        result += "\n" + line.slice(start, end);
        start = end + 1;
      }
      curr = next;
    }
    result += "\n";
    if (line.length - start > width && curr > start) {
      result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
    } else {
      result += line.slice(start);
    }
    return result.slice(1);
  }
  function escapeString(string) {
    let result = "";
    let char = 0;
    for (let i = 0; i < string.length; char >= 65536 ? i += 2 : i++) {
      char = codePointAt(string, i);
      const escapeSeq = ESCAPE_SEQUENCES[char];
      if (!escapeSeq && isPrintable(char)) {
        result += string[i];
        if (char >= 65536) result += string[i + 1];
      } else {
        result += escapeSeq || encodeHex(char);
      }
    }
    return result;
  }
  function writeFlowSequence(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level, value, false, false) || typeof value === "undefined" && writeNode(state, level, null, false, false)) {
        if (_result !== "") _result += "," + (!state.condenseFlow ? " " : "");
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = "[" + _result + "]";
  }
  function writeBlockSequence(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
      let value = object[index];
      if (state.replacer) {
        value = state.replacer.call(object, String(index), value);
      }
      if (writeNode(state, level + 1, value, true, true, false, true) || typeof value === "undefined" && writeNode(state, level + 1, null, true, true, false, true)) {
        if (!compact || _result !== "") {
          _result += generateNextLine(state, level);
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          _result += "-";
        } else {
          _result += "- ";
        }
        _result += state.dump;
      }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
  }
  function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
      let pairBuffer = "";
      if (_result !== "") pairBuffer += ", ";
      if (state.condenseFlow) pairBuffer += '"';
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level, objectKey, false, false)) {
        continue;
      }
      if (state.dump.length > 1024) pairBuffer += "? ";
      pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
      if (!writeNode(state, level, objectValue, false, false)) {
        continue;
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = "{" + _result + "}";
  }
  function writeBlockMapping(state, level, object, compact) {
    let _result = "";
    const _tag = state.tag;
    const objectKeyList = Object.keys(object);
    if (state.sortKeys === true) {
      objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
      objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
      throw new YAMLException2("sortKeys must be a boolean or a function");
    }
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
      let pairBuffer = "";
      if (!compact || _result !== "") {
        pairBuffer += generateNextLine(state, level);
      }
      const objectKey = objectKeyList[index];
      let objectValue = object[objectKey];
      if (state.replacer) {
        objectValue = state.replacer.call(object, objectKey, objectValue);
      }
      if (!writeNode(state, level + 1, objectKey, true, true, true)) {
        continue;
      }
      const explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
      if (explicitPair) {
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += "?";
        } else {
          pairBuffer += "? ";
        }
      }
      pairBuffer += state.dump;
      if (explicitPair) {
        pairBuffer += generateNextLine(state, level);
      }
      if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
        continue;
      }
      if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
        pairBuffer += ":";
      } else {
        pairBuffer += ": ";
      }
      pairBuffer += state.dump;
      _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
  }
  function detectType(state, object, explicit) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    for (let index = 0, length = typeList.length; index < length; index += 1) {
      const type2 = typeList[index];
      if ((type2.instanceOf || type2.predicate) && (!type2.instanceOf || typeof object === "object" && object instanceof type2.instanceOf) && (!type2.predicate || type2.predicate(object))) {
        if (explicit) {
          if (type2.multi && type2.representName) {
            state.tag = type2.representName(object);
          } else {
            state.tag = type2.tag;
          }
        } else {
          state.tag = "?";
        }
        if (type2.represent) {
          const style = state.styleMap[type2.tag] || type2.defaultStyle;
          let _result;
          if (_toString.call(type2.represent) === "[object Function]") {
            _result = type2.represent(object, style);
          } else if (_hasOwnProperty.call(type2.represent, style)) {
            _result = type2.represent[style](object, style);
          } else {
            throw new YAMLException2("!<" + type2.tag + '> tag resolver accepts not "' + style + '" style');
          }
          state.dump = _result;
        }
        return true;
      }
    }
    return false;
  }
  function writeNode(state, level, object, block, compact, iskey, isblockseq) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
      detectType(state, object, true);
    }
    const type2 = _toString.call(state.dump);
    const inblock = block;
    if (block) {
      block = state.flowLevel < 0 || state.flowLevel > level;
    }
    const objectOrArray = type2 === "[object Object]" || type2 === "[object Array]";
    let duplicateIndex;
    let duplicate;
    if (objectOrArray) {
      duplicateIndex = state.duplicates.indexOf(object);
      duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
      compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
      state.dump = "*ref_" + duplicateIndex;
    } else {
      if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
        state.usedDuplicates[duplicateIndex] = true;
      }
      if (type2 === "[object Object]") {
        if (block && Object.keys(state.dump).length !== 0) {
          writeBlockMapping(state, level, state.dump, compact);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowMapping(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object Array]") {
        if (block && state.dump.length !== 0) {
          if (state.noArrayIndent && !isblockseq && level > 0) {
            writeBlockSequence(state, level - 1, state.dump, compact);
          } else {
            writeBlockSequence(state, level, state.dump, compact);
          }
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + state.dump;
          }
        } else {
          writeFlowSequence(state, level, state.dump);
          if (duplicate) {
            state.dump = "&ref_" + duplicateIndex + " " + state.dump;
          }
        }
      } else if (type2 === "[object String]") {
        if (state.tag !== "?") {
          writeScalar(state, state.dump, level, iskey, inblock);
        }
      } else if (type2 === "[object Undefined]") {
        return false;
      } else {
        if (state.skipInvalid) return false;
        throw new YAMLException2("unacceptable kind of an object to dump " + type2);
      }
      if (state.tag !== null && state.tag !== "?") {
        let tagStr = encodeURI(
          state.tag[0] === "!" ? state.tag.slice(1) : state.tag
        ).replace(/!/g, "%21");
        if (state.tag[0] === "!") {
          tagStr = "!" + tagStr;
        } else if (tagStr.slice(0, 18) === "tag:yaml.org,2002:") {
          tagStr = "!!" + tagStr.slice(18);
        } else {
          tagStr = "!<" + tagStr + ">";
        }
        state.dump = tagStr + " " + state.dump;
      }
    }
    return true;
  }
  function getDuplicateReferences(object, state) {
    const objects = [];
    const duplicatesIndexes = [];
    inspectNode(object, objects, duplicatesIndexes);
    const length = duplicatesIndexes.length;
    for (let index = 0; index < length; index += 1) {
      state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
  }
  function inspectNode(object, objects, duplicatesIndexes) {
    if (object !== null && typeof object === "object") {
      const index = objects.indexOf(object);
      if (index !== -1) {
        if (duplicatesIndexes.indexOf(index) === -1) {
          duplicatesIndexes.push(index);
        }
      } else {
        objects.push(object);
        if (Array.isArray(object)) {
          for (let i = 0, length = object.length; i < length; i += 1) {
            inspectNode(object[i], objects, duplicatesIndexes);
          }
        } else {
          const objectKeyList = Object.keys(object);
          for (let i = 0, length = objectKeyList.length; i < length; i += 1) {
            inspectNode(object[objectKeyList[i]], objects, duplicatesIndexes);
          }
        }
      }
    }
  }
  function dump2(input, options) {
    options = options || {};
    const state = new State(options);
    if (!state.noRefs) getDuplicateReferences(input, state);
    let value = input;
    if (state.replacer) {
      value = state.replacer.call({ "": value }, "", value);
    }
    if (writeNode(state, 0, value, true, true)) return state.dump + "\n";
    return "";
  }
  dumper.dump = dump2;
  return dumper;
}
var hasRequiredJsYaml;
function requireJsYaml() {
  if (hasRequiredJsYaml) return jsYaml;
  hasRequiredJsYaml = 1;
  const loader2 = requireLoader();
  const dumper2 = requireDumper();
  function renamed(from, to) {
    return function() {
      throw new Error("Function yaml." + from + " is removed in js-yaml 4. Use yaml." + to + " instead, which is now safe by default.");
    };
  }
  jsYaml.Type = requireType();
  jsYaml.Schema = requireSchema();
  jsYaml.FAILSAFE_SCHEMA = requireFailsafe();
  jsYaml.JSON_SCHEMA = requireJson();
  jsYaml.CORE_SCHEMA = requireCore();
  jsYaml.DEFAULT_SCHEMA = require_default();
  jsYaml.load = loader2.load;
  jsYaml.loadAll = loader2.loadAll;
  jsYaml.dump = dumper2.dump;
  jsYaml.YAMLException = requireException();
  jsYaml.types = {
    binary: requireBinary(),
    float: requireFloat(),
    map: requireMap(),
    null: require_null(),
    pairs: requirePairs(),
    set: requireSet(),
    timestamp: requireTimestamp(),
    bool: requireBool(),
    int: requireInt(),
    merge: requireMerge(),
    omap: requireOmap(),
    seq: requireSeq(),
    str: requireStr()
  };
  jsYaml.safeLoad = renamed("safeLoad", "load");
  jsYaml.safeLoadAll = renamed("safeLoadAll", "loadAll");
  jsYaml.safeDump = renamed("safeDump", "dump");
  return jsYaml;
}
var jsYamlExports = requireJsYaml();
var yaml = /* @__PURE__ */ getDefaultExportFromCjs(jsYamlExports);
var {
  Type,
  Schema,
  FAILSAFE_SCHEMA,
  JSON_SCHEMA,
  CORE_SCHEMA,
  DEFAULT_SCHEMA,
  load,
  loadAll,
  dump,
  YAMLException,
  types,
  safeLoad,
  safeLoadAll,
  safeDump
} = yaml;

// src/gemeinsam/regelsatz.ts
var import_attesta_core = require("@miloe255/attesta-core");

// src/gemeinsam/kopfzeile.ts
var URHEBER = "PROSTRUCTIVE\xAE Consulting & Management";
function formatiereKopfzeile(felder) {
  return [`# Urheber: ${URHEBER}`, `# Lizenz: ${felder.lizenz}`, `# Herkunft: ${felder.herkunft}`].join("\n") + "\n";
}

// src/gemeinsam/profildatei.ts
var PROFIL_LIZENZ = "PolyForm-Internal-Use-1.0.0";
function formatiereProfildatei(datei, basisversion) {
  return formatiereKopfzeile({ lizenz: PROFIL_LIZENZ, herkunft: basisversion }) + `# Pruefsumme: ${datei.pruefsumme}

` + datei.inhalt;
}

// src/gemeinsam/fehler.ts
var KonsoleFehler = class extends Error {
  rueckgabewert;
  constructor(meldung, rueckgabewert = 2) {
    super(meldung);
    this.name = "KonsoleFehler";
    this.rueckgabewert = rueckgabewert;
  }
};

// src/gemeinsam/profilvergleich.ts
var import_node_fs = require("node:fs");
function ladeLock(lockPfad) {
  if (!(0, import_node_fs.existsSync)(lockPfad)) return {};
  try {
    return load((0, import_node_fs.readFileSync)(lockPfad, "utf-8")) ?? {};
  } catch {
    return {};
  }
}
function listeBasiswechsel(lockPfad, neueBasis) {
  const lock = ladeLock(lockPfad);
  return neueBasis.dateien.map((datei) => {
    const eintrag = lock[datei.dateiname];
    const neuePruefsumme = (0, import_attesta_core.pruefsumme)(formatiereProfildatei(datei, neueBasis.basisversion));
    return {
      dateiname: datei.dateiname,
      aendertSich: eintrag?.pruefsumme !== neuePruefsumme,
      alteBasisversion: eintrag?.basisversion,
      neueBasisversion: neueBasis.basisversion,
      altePruefsumme: eintrag?.pruefsumme,
      neuePruefsumme
    };
  });
}

// src/gemeinsam/eigene-rollen.ts
var import_node_fs2 = require("node:fs");

// src/gemeinsam/guete-regelsatz.generated.ts
var GUETE_ROLLEN = [
  "Auftraggeber",
  "Fachexperte",
  "technische Leitung",
  "Entwicklung",
  "Reviewer",
  "Qualitaetssicherung",
  "Betrieb",
  "Endnutzer",
  "KI-Agent"
];
var GUETE_UNSCHAERFE = [
  {
    "wort": "schnell",
    "stufe": "verstoss",
    "hinweis": "Zahl mit Einheit nennen, zum Beispiel Antwortzeit unter 200 ms"
  },
  {
    "wort": "langsam",
    "stufe": "verstoss",
    "hinweis": "oberen Schwellwert mit Einheit nennen"
  },
  {
    "wort": "benutzerfreundlich",
    "stufe": "verstoss",
    "hinweis": "pruefbares Kriterium nennen, zum Beispiel Aufgabe in unter drei Klicks abschliessbar"
  },
  {
    "wort": "performant",
    "stufe": "verstoss",
    "hinweis": "Durchsatz- oder Latenzzahl nennen"
  },
  {
    "wort": "robust",
    "stufe": "verstoss",
    "hinweis": "konkreten Fehlerfall und erwartetes Verhalten nennen"
  },
  {
    "wort": "intuitiv",
    "stufe": "verstoss",
    "hinweis": "pruefbares Nutzerverhalten nennen, zum Beispiel ohne Schulung bedienbar"
  },
  {
    "wort": "zeitnah",
    "stufe": "verstoss",
    "hinweis": "Frist mit Einheit nennen"
  },
  {
    "wort": "angemessen",
    "stufe": "warnung",
    "hinweis": "wo moeglich durch eine Zahl oder einen Verweis auf eine Norm ersetzen, Fachbegriff in Normtexten"
  },
  {
    "wort": "m\xF6glichst",
    "stufe": "verstoss",
    "hinweis": "verbindliche Formulierung ohne Einschraenkung waehlen"
  },
  {
    "wort": "gegebenenfalls",
    "stufe": "verstoss",
    "hinweis": "Bedingung explizit nennen, unter der der Satz gilt"
  },
  {
    "wort": "einfach",
    "stufe": "verstoss",
    "hinweis": "konkretes Kriterium nennen, was Einfachheit hier bedeutet"
  },
  {
    "wort": "flexibel",
    "stufe": "verstoss",
    "hinweis": "konkrete Variationsbreite nennen"
  },
  {
    "wort": "modern",
    "stufe": "verstoss",
    "hinweis": "konkrete Technologie oder Version nennen"
  },
  {
    "wort": "sicher",
    "stufe": "warnung",
    "hinweis": "wo moeglich durch eine Zahl, einen Standard oder eine Kontrollliste ersetzen, Fachbegriff in Normtexten"
  }
];
var GUETE_TECHNOLOGIEN = [
  "github",
  "gitlab",
  "azure",
  "aws",
  "react",
  "angular",
  "vue",
  "node.js",
  "python",
  "typescript",
  "java",
  "kubernetes",
  "docker",
  "postgresql",
  "mongodb",
  "redis",
  "kafka"
];

// src/gemeinsam/eigene-rollen.ts
var EIGENE_ROLLEN_PFAD = "attesta/rollen-eigene.yaml";
var KENNUNG_MUSTER = /^[a-z][a-z0-9_]*$/;
var MINDESTWOERTER_DEFINITION = 5;
function grundbestandKennungen() {
  return new Set(GUETE_ROLLEN.map((name) => name.toLowerCase().replace(/\s+/g, "_")));
}
function pruefeRolle(roh, index, bekannt, belegt) {
  const stelle = `${EIGENE_ROLLEN_PFAD}, Eintrag ${index + 1}`;
  const { kennung, anzeigename, definition } = roh;
  if (!kennung || !KENNUNG_MUSTER.test(kennung)) {
    return { befund: `${stelle}: kennung fehlt oder enthaelt andere Zeichen als Kleinbuchstaben, Ziffern und Unterstrich` };
  }
  if (bekannt.has(kennung)) {
    return { befund: `${stelle}: kennung "${kennung}" gehoert bereits zum Grundbestand und wird nicht ueberschrieben` };
  }
  if (belegt.has(kennung)) {
    return { befund: `${stelle}: kennung "${kennung}" kommt in der Datei mehrfach vor` };
  }
  if (!anzeigename || anzeigename.trim().length === 0) {
    return { befund: `${stelle}: anzeigename fehlt` };
  }
  if (!definition || definition.trim().split(/\s+/).length < MINDESTWOERTER_DEFINITION) {
    return { befund: `${stelle}: definition fehlt oder umfasst weniger als ${MINDESTWOERTER_DEFINITION} Woerter` };
  }
  return { rolle: { kennung, anzeigename: anzeigename.trim(), definition } };
}
function leseEigeneRollen(wurzel) {
  const pfad = `${wurzel}/${EIGENE_ROLLEN_PFAD}`;
  if (!(0, import_node_fs2.existsSync)(pfad)) return { rollen: [], befunde: [] };
  let geparst;
  try {
    geparst = load((0, import_node_fs2.readFileSync)(pfad, "utf-8"));
  } catch {
    return { rollen: [], befunde: [`${EIGENE_ROLLEN_PFAD}: kein gueltiges YAML, der Grundbestand gilt weiter`] };
  }
  if (geparst === null || geparst === void 0) return { rollen: [], befunde: [] };
  if (typeof geparst !== "object") {
    return { rollen: [], befunde: [`${EIGENE_ROLLEN_PFAD}: kein YAML-Objekt, der Grundbestand gilt weiter`] };
  }
  const liste = geparst.rollen;
  if (liste === void 0 || liste === null) return { rollen: [], befunde: [] };
  if (!Array.isArray(liste)) {
    return { rollen: [], befunde: [`${EIGENE_ROLLEN_PFAD}: das Feld "rollen" ist keine Liste`] };
  }
  const bekannt = grundbestandKennungen();
  const belegt = /* @__PURE__ */ new Set();
  const rollen = [];
  const befunde = [];
  liste.forEach((roh, index) => {
    const { rolle, befund } = pruefeRolle(roh ?? {}, index, bekannt, belegt);
    if (befund) {
      befunde.push(befund);
      return;
    }
    if (rolle) {
      belegt.add(rolle.kennung);
      rollen.push(rolle.anzeigename);
    }
  });
  return { rollen, befunde };
}
var EIGENE_ROLLEN_VORLAGE = `# Betriebseigene Rollen, zusaetzlich zum Grundbestand aus rules/rollen.yaml.
#
# Diese Datei gehoert dir. Sie ist kein Teil des Profils und wird nicht
# gegen die Profilbasis geprueft. Traege hier die Rollennamen ein, die in
# deinem Betrieb tatsaechlich vorkommen, damit sie in Anforderungen als
# benannter Akteur gelten.
#
# Regeln je Eintrag:
#   kennung      Kleinbuchstaben, Ziffern und Unterstrich, nicht aus dem Grundbestand
#   anzeigename  wie die Rolle in einer Anforderung geschrieben wird
#   definition   mindestens fuenf Woerter
#
# Beispiel:
# rollen:
#   - kennung: produktionsleiter
#     anzeigename: "Produktionsleiter"
#     definition: "verantwortet die laufende Fertigung und den Ausschuss einer Schicht"

rollen: []
`;

// src/gemeinsam/vorlagen.generated.ts
var VORLAGEN = [
  {
    "name": "00-intake.md",
    "inhalt": "# Intake: {{Projektname}}\n\n**Datum:** {{TT.MM.JJJJ}} \xB7 **Erfasst von:** {{Name}} \xB7 **Gespr\xE4chspartner:** {{Name, Rolle}}\n**Pflicht:** immer, unabh\xE4ngig von der Kritikalit\xE4t\n\n---\n\n## 1. Die vier Bl\xF6cke\n\n### Gesch\xE4ftsziel\n{{Welches Ergebnis will der Kunde erreichen? In seinen Worten, ohne L\xF6sung.}}\n\n### Umfang und Funktionen\n{{Was hat er genannt? W\xF6rtlich notieren, auch wenn es nach L\xF6sung klingt.}}\n\n### Technischer Rahmen\n{{Bestehende Systeme, Schnittstellen, Datenquellen, Betriebsumgebung, Vorgaben.}}\n\n### Kommerzieller Rahmen\n{{Budgetrahmen, Termine mit Konsequenz, Entscheidungsweg, Wettbewerbssituation.}}\n\n---\n\n## 2. Reifegradbewertung\n\nJede Dimension einzeln von 1 bis 5. **Es z\xE4hlt der niedrigste Einzelwert, kein Durchschnitt.**\n\n| # | Dimension | Wert | Begr\xFCndung in einem Satz |\n|---|---|---|---|\n| 1 | Klarheit des Umfangs | {{1-5}} | {{...}} |\n| 2 | Technische Machbarkeit | {{1-5}} | {{...}} |\n| 3 | Verf\xFCgbarkeit von Daten und Schnittstellen | {{1-5}} | {{...}} |\n| 4 | Entscheidungsbefugnis des Gespr\xE4chspartners | {{1-5}} | {{...}} |\n| 5 | Verf\xFCgbarkeit von Fachwissen beim Kunden | {{1-5}} | {{...}} |\n| 6 | Stabilit\xE4t der Rahmenbedingungen | {{1-5}} | {{...}} |\n\n**Skala je Dimension**\n\n| Wert | Bedeutung |\n|---|---|\n| 5 | belegt und gepr\xFCft, keine offene Frage |\n| 4 | vom Kunden best\xE4tigt, im Detail offen |\n| 3 | plausibel dargestellt, unbest\xE4tigt |\n| 2 | widerspr\xFCchlich oder unbekannt |\n| 1 | erkennbar nicht gegeben |\n\n**Gesamtreifegrad (Minimum aller Werte): {{Zahl}}**\n\n| Reifegrad | Empfehlung | Gew\xE4hlt |\n|---|---|---|\n| 5 | direktes Angebot | {{ }} |\n| 4 | direktes Angebot mit Annahmen-Register | {{ }} |\n| 3 | kurze Kl\xE4rungsrunde vor dem Angebot | {{ }} |\n| 2 | verpflichtende Discovery, kein Angebot vorher | {{ }} |\n| 1 | Discovery zwingend, Angebot erst danach | {{ }} |\n\n**Entscheidung:** {{Angebot / Kl\xE4rungsrunde / Discovery / Ablehnung}}\n**Begr\xFCndung:** {{ein Satz}}\n\n---\n\n## 3. Projektkategorie\n\n{{Beratung \xB7 Neuentwicklung \xB7 Produktentwicklung \xB7 MVP mit Begleitung \xB7 Wartung und Weiterentwicklung \xB7 Migration oder Integration \xB7 Spezialprojekt mit hoher Unsicherheit \xB7 technisches Audit}}\n\n---\n\n## 4. Annahmen-Register\n\nJede Zeile ist eine Aussage, die **wir** voraussetzen und die der Kunde **nicht best\xE4tigt** hat. Best\xE4tigte Aussagen sind Anforderungen und geh\xF6ren nicht hierher.\n\n| # | Annahme | Quelle | Wirkung, falls sie nicht zutrifft | Aufwand | Status |\n|---|---|---|---|---|---|\n| A1 | {{...}} | {{Gespr\xE4ch, Dokument, eigene Erfahrung}} | {{...}} | {{+X PT}} | offen |\n| A2 | {{...}} | {{...}} | {{...}} | {{+X PT}} | offen |\n| A3 | {{...}} | {{...}} | {{...}} | {{+X PT}} | offen |\n\n**Status:** offen \xB7 best\xE4tigt \xB7 widerlegt \xB7 gegenstandslos\n**Dieses Register wird in P0 \xFCbernommen, in der Abnahme gepr\xFCft und nie gel\xF6scht.**\n\n---\n\n## 5. Kritikalit\xE4tshinweis\n\n{{Erste Einsch\xE4tzung, welche Teile K3-verd\xE4chtig sind. Keine Festlegung, die erfolgt in P0.}}\n\n---\n\n## Selbstpr\xFCfung vor der \xDCbergabe\n\n- [ ] Alle sechs Dimensionen bewertet, jede mit einem Satz begr\xFCndet\n- [ ] Gesamtreifegrad ist das Minimum und nicht der Durchschnitt\n- [ ] Mindestens drei Annahmen im Register, jede mit Aufwandswirkung\n- [ ] Kein L\xF6sungsvorschlag als Anforderung notiert\n- [ ] Entscheidung getroffen und begr\xFCndet\n"
  },
  {
    "name": "01-intent.md",
    "inhalt": '# Intent: {{Vorhaben}}\n\n**Projekt:** {{...}} \xB7 **Datum:** {{TT.MM.JJJJ}} \xB7 **Verantwortlich:** {{Auftraggeber}} \xB7 **Fachlich:** {{technische Leitung}}\n**Pflicht:** immer \xB7 **Gate 0**\n\n---\n\n## 1. Problemdefinition\n\n**Wer leidet konkret:** {{Rolle und Person, keine Abteilung}}\n**Was passiert heute:** {{Ablauf im Ist-Zustand}}\n**Wie oft:** {{H\xE4ufigkeit mit Zahl}}\n**Was es kostet:** {{Zeit, Geld, Risiko, mit Zahl}}\n**Heutiger Behelf:** {{Excel, Zuruf, Erfahrung, Drittsystem}}\n\n---\n\n## 2. Outcome-Kriterium\n\n> {{Ein Satz. Enth\xE4lt eine Zahl mit Einheit und einen Zeitbezug. Nennt keine Funktion.}}\n\n**Gemessen wird:** {{Messgr\xF6\xDFe}}\n**Ausgangswert heute:** {{Zahl}} \xB7 **Erhoben am:** {{Datum}} \xB7 **Quelle:** {{...}}\n**Zielwert:** {{Zahl}} \xB7 **Gemessen wird am:** {{Datum, sp\xE4testens 8 Wochen nach Inbetriebnahme}}\n\n**Pr\xFCfung:** Enth\xE4lt der Satz eine Funktion, ist er falsch formuliert. \u201EDashboard mit Ampel" ist eine L\xF6sung. \u201EDie Abweichung ist in unter zwei Minuten bekannt" ist ein Outcome.\n\n---\n\n## 3. Abnahmekriterien\n\nWas muss wahr sein, damit der Auftraggeber unterschreibt?\n\n| # | Kriterium | Messbar woran |\n|---|---|---|\n| AK1 | {{...}} | {{...}} |\n| AK2 | {{...}} | {{...}} |\n| AK3 | {{...}} | {{...}} |\n\n---\n\n## 4. Kritikalit\xE4tseinstufung je Modul\n\n| Modul | K | Begr\xFCndung in einem Satz | H\xF6chste Delegation |\n|---|---|---|---|\n| {{...}} | {{K1/K2/K3}} | {{Was passiert im Fehlerfall}} | {{S4/S3/S2}} |\n| {{...}} | {{...}} | {{...}} | {{...}} |\n\n**Regel:** Eingestuft wird je Modul und je Aufgabe, nie je Projekt. Ohne maschinelle Leitplanken gilt bis Gate 3 h\xF6chstens S2.\n\n---\n\n## 5. Ausdr\xFCcklich nicht im Umfang\n\n| # | Nicht enthalten | Warum |\n|---|---|---|\n| 1 | {{...}} | {{...}} |\n| 2 | {{...}} | {{...}} |\n\n---\n\n## 6. \xDCbernommenes Annahmen-Register\n\n{{Verweis auf den Intake, offene Zeilen hier fortf\xFChren}}\n\n---\n\n## Gate 0, Pr\xFCfpunkte\n\n- [ ] Problemdefinition benennt eine Person, keine Abteilung\n- [ ] Outcome-Kriterium enth\xE4lt Zahl, Einheit und Messtermin\n- [ ] Ausgangswert ist erhoben und datiert\n- [ ] Mindestens zwei Abnahmekriterien, beide messbar\n- [ ] Jedes Modul eingestuft, jede Einstufung begr\xFCndet\n- [ ] Mindestens eine Zeile unter \u201Enicht im Umfang"\n- [ ] Annahmen-Register \xFCbernommen\n'
  },
  {
    "name": "01b-intent-kurz.md",
    "inhalt": "# Intent kurz: {{Vorhaben}}\n\n**F\xFCr K1 und kleine Vorhaben. F\xFCnf Felder, zehn Minuten.**\n\n| Feld | Inhalt |\n|---|---|\n| **Wer leidet** | {{Rolle}} |\n| **Woran** | {{Ist-Zustand in einem Satz}} |\n| **Woran erkennen wir Erfolg** | {{Zahl mit Einheit}} |\n| **Kritikalit\xE4t** | {{K1/K2/K3}} mit einem Satz Begr\xFCndung |\n| **Nicht im Umfang** | {{mindestens eine Zeile}} |\n\n**Wenn eines der f\xFCnf Felder leer bleibt, ist die lange Fassung f\xE4llig.**\n"
  },
  {
    "name": "02-use-case.md",
    "inhalt": '# Use Case UC-{{Nr}}: {{Titel als Verb plus Objekt}}\n\n**Projekt:** {{...}} \xB7 **Verfasst von:** {{...}} \xB7 **Datum:** {{TT.MM.JJJJ}}\n**Pflicht:** ab K3 \xB7 empfohlen ab K2 \xB7 **Phase P0 bis P2**\n\n---\n\n## Kopf\n\n| Feld | Inhalt |\n|---|---|\n| **Akteur** | {{Rolle aus der Rollenliste. Kein System, kein \u201Eder Nutzer"}} |\n| **Beteiligte Systeme** | {{...}} |\n| **Ausl\xF6ser** | {{Was genau startet den Ablauf}} |\n| **Vorbedingung** | {{Was muss vorher wahr sein}} |\n| **Nachbedingung bei Erfolg** | {{Welcher Zustand gilt danach}} |\n| **H\xE4ufigkeit** | {{X mal je Tag, Woche, Monat}} |\n| **Bezug zum Intent** | {{Welches Outcome-Kriterium zahlt darauf ein}} |\n\n---\n\n## Hauptpfad\n\n| # | Akteur tut | System antwortet |\n|---|---|---|\n| 1 | {{...}} | {{...}} |\n| 2 | {{...}} | {{...}} |\n| 3 | {{...}} | {{...}} |\n\n---\n\n## Alternativpfade\n\n| Kennung | Ab Schritt | Bedingung | Verlauf | Ergebnis |\n|---|---|---|---|---|\n| A1 | {{Nr}} | {{...}} | {{...}} | {{...}} |\n| A2 | {{Nr}} | {{...}} | {{...}} | {{...}} |\n\n---\n\n## Fehlerf\xE4lle\n\nDie vier Fragen, die erfahrungsgem\xE4\xDF St\xF6rungen im Betrieb verhindern.\n\n| Kennung | Frage | Antwort |\n|---|---|---|\n| F1 | Was passiert bei fehlenden Daten? | {{...}} |\n| F2 | Was passiert bei doppelter Eingabe oder doppeltem Ausl\xF6ser? | {{...}} |\n| F3 | Was passiert beim Abbruch mitten im Ablauf? | {{...}} |\n| F4 | Was passiert, wenn ein beteiligtes System nicht antwortet? | {{...}} |\n\n---\n\n## Abgeleitete Anforderungen\n\n| REQ | Aus Schritt | Kurzfassung |\n|---|---|---|\n| REQ-{{Nr}} | {{...}} | {{...}} |\n| REQ-{{Nr}} | {{...}} | {{...}} |\n\n**Ein Use Case erzeugt \xFCblicherweise f\xFCnf bis f\xFCnfzehn Anforderungen. Weniger als drei deutet darauf hin, dass der Ablauf zu grob beschrieben ist.**\n\n---\n\n## Selbstpr\xFCfung\n\n- [ ] Der Akteur ist eine benannte Rolle, kein System und kein \u201Eman"\n- [ ] Der Ausl\xF6ser ist ein Ereignis, kein Wunsch\n- [ ] Der Hauptpfad hat h\xF6chstens neun Schritte. Mehr hei\xDFt aufteilen\n- [ ] Alle vier Fehlerfragen sind beantwortet, auch mit \u201Etritt nicht auf, weil ..."\n- [ ] Jeder Schritt hat mindestens eine abgeleitete Anforderung oder eine Begr\xFCndung, warum nicht\n- [ ] Keine Technologie im Text\n'
  },
  {
    "name": "03-req.md",
    "inhalt": '# REQ-{{Nr}}: {{Kurztitel}}\n\n**Projekt:** {{...}} \xB7 **Autor:** {{...}} \xB7 **Datum:** {{TT.MM.JJJJ}} \xB7 **Status:** {{Entwurf / abgestimmt / abgenommen}}\n**Pflicht:** immer \xB7 **Gate 2**\n\n---\n\n## Der normative Satz\n\n> {{Akteur}} **muss** {{Ergebnis}}, wenn {{Bedingung}}.\n\n**Regeln f\xFCr diesen Satz**\n\n| Regel | Warum |\n|---|---|\n| Genau ein Modalverb | Zwei Forderungen in einem Satz sind zwei Anforderungen |\n| Akteur benannt, aus der Rollenliste | \u201EEs muss m\xF6glich sein" hat keinen Verantwortlichen |\n| Kein Wort aus der Unsch\xE4rfeliste | Die Liste steht in `attesta/profil/wortlisten.yaml` und wird von `attesta guete` gepr\xFCft. Sie hier zu wiederholen erzeugt Drift |\n| Keine Technologie | \u201E\xFCber eine Schnittstelle mit X" ist eine L\xF6sung im Anforderungsgewand |\n\n---\n\n## Abnahmekriterien\n\nMindestens eines mit Zahl und Einheit, Vergleichsoperator oder einem Zustandsnamen aus dem Zustandsmodell.\n\n| # | Kriterium | Messbar woran |\n|---|---|---|\n| 1 | {{...}} | {{...}} |\n| 2 | {{...}} | {{...}} |\n\n---\n\n## Einordnung\n\n| Feld | Inhalt |\n|---|---|\n| **Bezug zum Intent** | {{Outcome-Kriterium}} |\n| **Bezug zum Use Case** | {{UC-Nr, Schritt}} |\n| **Kritikalit\xE4t** | {{K1/K2/K3}} |\n| **Priorit\xE4t** | {{Muss / Soll / Kann}} |\n| **Abh\xE4ngig von** | {{REQ-Nr oder keine}} |\n| **Betroffene Annahme** | {{A-Nr aus dem Register oder keine}} |\n\n---\n\n## Begr\xFCndung\n\n{{Warum ist diese Anforderung notwendig? Ein bis zwei S\xE4tze. Wer das nicht schreiben kann, hat m\xF6glicherweise keine notwendige Anforderung.}}\n\n---\n\n## Gate 2, maschinelle Pr\xFCfung\n\n| # | Pr\xFCfung | Ergebnis |\n|---|---|---|\n| 1 | Genau ein normatives Modalverb | {{ }} |\n| 2 | Akteur aus der Rollenliste benannt | {{ }} |\n| 3 | Mindestens ein messbares Abnahmekriterium | {{ }} |\n| 4 | Kein Wort aus der Unsch\xE4rfeliste | {{ }} |\n| 5 | Keine Technologievorgabe | {{ }} |\n| 6 | Pflichtfelder gef\xFCllt | {{ }} |\n\n**Drei Merkmale bleiben menschliches Urteil und werden nicht maschinell gepr\xFCft: notwendig, korrekt, angemessen.**\n'
  },
  {
    "name": "04-spec.md",
    "inhalt": '# SPEC-{{Nr}}: {{Titel}}\n\n**Deckt ab:** REQ-{{Nr}}, REQ-{{Nr}} \xB7 **Autor:** {{...}} \xB7 **Datum:** {{TT.MM.JJJJ}}\n**Pflicht:** ab K2 \xB7 **Gate 2**\n\n---\n\n## 1. Zweck in einem Satz\n\n{{Was diese Spezifikation technisch festlegt.}}\n\n---\n\n## 2. Gesch\xE4ftsregeln\n\nJede Regel bekommt eine Kennung, weil daraus ein Contract wird.\n\n| Kennung | Regel | Aus REQ | Wird Contract |\n|---|---|---|---|\n| GR-1 | {{Pr\xE4zise Formulierung mit Schwellen, Zeiten, Mengen}} | REQ-{{Nr}} | ja / nein |\n| GR-2 | {{...}} | REQ-{{Nr}} | ja / nein |\n\n**Regel aus dem Regelset:** Bei **K2** wird ein Contract an jeder Modulgrenze verlangt. Bei **K3** immer, und zwar f\xFCr Schnittstelle, Daten und Fehlerverhalten. Bei K1 ist er freiwillig.\n\n---\n\n## 3. Zust\xE4nde und \xDCberg\xE4nge\n\n| Zustand | Bedeutung |\n|---|---|\n| {{...}} | {{...}} |\n\n| Von | Nach | Ausl\xF6ser | Bedingung |\n|---|---|---|---|\n| {{...}} | {{...}} | {{...}} | {{...}} |\n\n**Pflichtfrage:** Gibt es einen Zustand f\xFCr \u201Ekeine Daten", \u201Eunbekannt" oder \u201ESystem antwortet nicht"? Die Abwesenheit von Daten ist ein Zustand und wird regelm\xE4\xDFig vergessen.\n\n---\n\n## 4. Datenmodell\n\n| Feld | Typ | Pflicht | Wertebereich | Herkunft |\n|---|---|---|---|---|\n| {{...}} | {{...}} | {{ja/nein}} | {{...}} | {{...}} |\n\n---\n\n## 5. Schnittstellenskizze\n\n| Aufruf | Eingabe | Ausgabe | Fehlerf\xE4lle |\n|---|---|---|---|\n| {{...}} | {{...}} | {{...}} | {{...}} |\n\n---\n\n## 6. Fehlerverhalten\n\n| Situation | Verhalten | Meldung an wen |\n|---|---|---|\n| {{...}} | {{...}} | {{...}} |\n\n---\n\n## 7. Nicht spezifiziert\n\n{{Was bewusst offen bleibt und von der Umsetzung entschieden werden darf.}}\n\n---\n\n## Gate 2, Pr\xFCfpunkte\n\n- [ ] Jede Gesch\xE4ftsregel hat eine Kennung und einen REQ-Bezug\n- [ ] An jeder ber\xFChrten Modulgrenze ist eine Regel als Contract markiert (ab K2)\n- [ ] Zustandsmodell enth\xE4lt einen Zustand f\xFCr fehlende oder unbekannte Daten\n- [ ] Jedes Pflichtfeld hat einen Wertebereich\n- [ ] Fehlerverhalten je Schnittstelle beschrieben\n- [ ] Abschnitt \u201Enicht spezifiziert" ist ausgef\xFCllt und nicht leer\n'
  },
  {
    "name": "05-contract.md",
    "inhalt": "# Contract CT-{{Nr}}: {{Name der Regel}}\n\n**Aus:** SPEC-{{Nr}}, GR-{{Nr}} \xB7 **Autor:** {{...}} \xB7 **Datum:** {{TT.MM.JJJJ}}\n**Pflicht:** K2 an Modulgrenzen, K3 immer f\xFCr Schnittstelle, Daten und Fehlerverhalten \xB7 **Gate 4**\n\n---\n\n## 1. Die Aussage\n\n> {{Ein Satz, der wahr oder falsch sein kann. Keine Absicht, keine Beschreibung.}}\n\n---\n\n## 2. Vorbedingungen\n\n| # | Muss gelten, bevor die Regel greift |\n|---|---|\n| V1 | {{...}} |\n| V2 | {{...}} |\n\n## 3. Nachbedingungen\n\n| # | Muss gelten, nachdem die Regel gegriffen hat |\n|---|---|\n| N1 | {{...}} |\n| N2 | {{...}} |\n\n## 4. Invarianten\n\n| # | Muss immer gelten, davor wie danach |\n|---|---|\n| I1 | {{...}} |\n\n---\n\n## 5. Beispiele und Gegenbeispiele\n\n**Mindestens ein Gegenbeispiel ist Pflicht. Ein Contract ohne Gegenbeispiel pr\xFCft nichts.**\n\n| # | Art | Eingabe | Erwartetes Ergebnis | Warum dieser Fall |\n|---|---|---|---|---|\n| B1 | Beispiel | {{...}} | {{...}} | Hauptpfad |\n| B2 | Beispiel | {{...}} | {{...}} | Grenzwert |\n| G1 | **Gegenbeispiel** | {{...}} | {{...}} | {{Der Fall, der die Regel erst definiert}} |\n| G2 | **Gegenbeispiel** | {{...}} | {{...}} | {{...}} |\n\n**Die Frage, die diesen Abschnitt tr\xE4gt:** Welcher Fall sieht aus wie ein Treffer und ist keiner? Genau dieser Fall fehlt in maschinell erzeugten Tests am h\xE4ufigsten.\n\n---\n\n## 6. Abgrenzung\n\n| Feld | Inhalt |\n|---|---|\n| **Gilt nicht f\xFCr** | {{...}} |\n| **Wird nicht gepr\xFCft** | {{...}} |\n| **Abh\xE4ngig von Contract** | {{CT-Nr oder keine}} |\n\n---\n\n## 7. Umsetzung\n\n| Feld | Inhalt |\n|---|---|\n| **Testdatei** | {{Pfad}} |\n| **Testf\xE4lle** | {{Namen der Tests, die B1 bis G2 abdecken}} |\n| **Belegquelle im Gate** | {{Name des Pr\xFCflaufs}} |\n\n---\n\n## Gate 4, Pr\xFCfpunkte\n\n- [ ] Die Aussage ist entscheidbar, also wahr oder falsch\n- [ ] Mindestens ein Gegenbeispiel vorhanden\n- [ ] Jedes Beispiel und Gegenbeispiel hat einen Test\n- [ ] Der Testlauf ist als Belegquelle im Gate eingetragen\n- [ ] Der Contract verweist auf SPEC und REQ\n- [ ] Bei K3 sind Schnittstelle, Daten und Fehlerverhalten abgedeckt\n"
  },
  {
    "name": "06-testplan.md",
    "inhalt": '# Testplan: {{Vorhaben oder Release}}\n\n**Projekt:** {{...}} \xB7 **Autor:** {{...}} \xB7 **Datum:** {{TT.MM.JJJJ}}\n**Pflicht:** Abdeckung nach `rules/ks-matrix.yaml`, Dimension `test_coverage` \xB7 **Gate 4 und Gate 5**\n\n---\n\n## 1. Was auf welcher Ebene gepr\xFCft wird\n\n| Ebene | Pr\xFCft gegen | Verantwortlich | L\xE4uft wann |\n|---|---|---|---|\n| Unit | Contract und SPEC | Entwicklung | bei jedem Commit |\n| Integration | SPEC und Modulschnitt | Entwicklung und QA | vor der Freigabe, ab K3 Pflicht |\n| UAT | REQ und Abnahmekriterien | Auftraggeber | in P5 |\n| Outcome-Review | Intent | technische Leitung | 8 Wochen nach Inbetriebnahme |\n\n**Keine Ebene ersetzt eine andere. Ein gr\xFCner Unit-Test sagt nichts dar\xFCber, ob die Anforderung richtig war.**\n\n---\n\n## 2. Unit-Ebene\n\n| Contract | Testf\xE4lle | Datei | Gegenbeispiel abgedeckt |\n|---|---|---|---|\n| CT-{{Nr}} | {{Namen}} | {{Pfad}} | {{ja/nein}} |\n\n**Geforderte Testarten je Kritikalit\xE4t, verbindlich aus dem Regelset**\n\n| K | Geforderte Testarten | Reviewmodus | Sicherheitspr\xFCfungen |\n|---|---|---|---|\n| K1 | `smoke` | KI-Selbstreview plus Stichprobe durch einen Menschen | Secret-Scan |\n| K2 | `smoke`, `unit_core` | Vier-Augen-Prinzip | Secret-Scan, Zugriffsregeln, Authentifizierung |\n| K3 | `smoke`, `unit_core`, `integration`, `contract` | Vier-Augen plus unabh\xE4ngige KI-Pr\xFCfung mit frischem Kontext | zus\xE4tzlich DAST, OWASP, Verschl\xFCsselung |\n\n**Integrationstests sind erst ab K3 als Abdeckung gefordert.** Bei K2 sind sie zul\xE4ssig und sinnvoll, wenn Modulgrenzen ber\xFChrt werden, und sie sind dort keine Gate-Bedingung.\n\n---\n\n## 3. Integrationsebene\n\n| # | Was zusammenspielt | Pr\xFCfziel | Echte Schnittstelle oder Attrappe | Ergebnis |\n|---|---|---|---|---|\n| IT1 | {{Modul A und B}} | {{...}} | {{echt/Attrappe}} | {{ }} |\n| IT2 | {{...}} | {{...}} | {{...}} | {{ }} |\n\n**Regel:** Mindestens ein Integrationstest l\xE4uft gegen die echte Schnittstelle. Ein Testaufbau, in dem alles Attrappe ist, pr\xFCft die Attrappen.\n\n**Pflichtf\xE4lle, unabh\xE4ngig vom Vorhaben**\n\n| # | Fall | Abgedeckt durch |\n|---|---|---|\n| P1 | Ein beteiligtes System antwortet nicht | {{IT-Nr}} |\n| P2 | Ein beteiligtes System antwortet verz\xF6gert | {{IT-Nr}} |\n| P3 | Ein beteiligtes System kommt nach Neustart nicht zur\xFCck | {{IT-Nr}} |\n| P4 | Daten kommen doppelt | {{IT-Nr}} |\n\n---\n\n## 4. Testdaten\n\n| Datensatz | Herkunft | Personenbezug | Wo abgelegt |\n|---|---|---|---|\n| {{...}} | {{erzeugt / anonymisiert / aus Produktion}} | {{ja/nein}} | {{...}} |\n\n**Bei Personenbezug ist die Verwendung vor dem ersten Lauf zu kl\xE4ren. Produktionsdaten im Test sind ohne Grundlage unzul\xE4ssig.**\n\n---\n\n## 5. Was nicht getestet wird\n\n| Bereich | Warum | Risiko akzeptiert von |\n|---|---|---|\n| {{...}} | {{...}} | {{Name}} |\n\n---\n\n## Pr\xFCfpunkte\n\n- [ ] Jeder Contract hat mindestens einen Test, Gegenbeispiel eingeschlossen\n- [ ] Mindestens ein Integrationstest gegen eine echte Schnittstelle\n- [ ] Alle vier Pflichtf\xE4lle zugeordnet oder begr\xFCndet ausgeschlossen\n- [ ] Testdatenherkunft gekl\xE4rt, Personenbezug benannt\n- [ ] Abschnitt \u201Enicht getestet" ausgef\xFCllt und namentlich akzeptiert\n'
  },
  {
    "name": "07-uat-protokoll.md",
    "inhalt": '# Abnahmeprotokoll: {{Vorhaben}}\n\n**Auftraggeber:** {{Firma, Name}} \xB7 **Auftragnehmer:** {{Firma, Name}}\n**Vertrag oder Angebot:** {{Nummer, Datum}} \xB7 **Stand der Lieferung:** {{Version, Commit}}\n**Termin:** {{TT.MM.JJJJ}} \xB7 **Ort:** {{...}} \xB7 **Teilnehmende:** {{Name, Rolle}}\n**Pflicht:** ab K2 mit Protokoll, ab K3 mit Unterschrift \xB7 **Gate 5**\n\n---\n\n## 1. Gegenstand der Abnahme\n\n{{Was genau wird abgenommen? Versionsstand, Umfang, ausdr\xFCckliche Ausschl\xFCsse.}}\n\n---\n\n## 2. Pr\xFCfung gegen die Anforderungen\n\n| REQ | Kurzfassung | Pr\xFCffall | Ergebnis | Bemerkung |\n|---|---|---|---|---|\n| REQ-{{Nr}} | {{...}} | {{...}} | erf\xFCllt / teilweise / nicht erf\xFCllt | {{...}} |\n| REQ-{{Nr}} | {{...}} | {{...}} | {{...}} | {{...}} |\n\n---\n\n## 3. Pr\xFCfung gegen das Outcome-Kriterium\n\n| Feld | Inhalt |\n|---|---|\n| **Kriterium aus P0** | {{...}} |\n| **Ausgangswert** | {{Zahl, Datum}} |\n| **Gemessener Wert** | {{Zahl, Datum, Messverfahren}} |\n| **Erreicht** | {{ja / nein / sp\xE4ter messbar}} |\n\n---\n\n## 4. Abgleich mit dem Annahmen-Register\n\n**Der wirtschaftlich wichtigste Abschnitt. Jede Zeile aus dem Intake wird abgehakt.**\n\n| # | Annahme aus dem Intake | Trifft zu | Feststellung | Mehraufwand | Behandlung |\n|---|---|---|---|---|---|\n| A1 | {{...}} | ja / nein | {{...}} | {{X PT / X Euro}} | im Umfang / **Nachtrag** / entf\xE4llt |\n| A2 | {{...}} | {{...}} | {{...}} | {{...}} | {{...}} |\n\n**Summe der Nachtr\xE4ge: {{X PT, X Euro}}**\n\n**Zur Behandlung:** \u201EIm Umfang" bedeutet, dass der Auftragnehmer den Mehraufwand tr\xE4gt. \u201ENachtrag" bedeutet, dass er gesondert beauftragt wird. Diese Entscheidung f\xE4llt hier und nicht sp\xE4ter.\n\n---\n\n## 5. Offene Punkte\n\n| # | Punkt | Schwere | Frist | Verantwortlich |\n|---|---|---|---|---|\n| O1 | {{...}} | blockierend / wesentlich / unwesentlich | {{Datum}} | {{Name}} |\n\n**Blockierende Punkte verhindern die Abnahme. Wesentliche Punkte werden mit Frist vereinbart. Unwesentliche Punkte werden festgehalten und beeintr\xE4chtigen die Abnahme nicht.**\n\n---\n\n## 6. Abnahmeerkl\xE4rung\n\n{{Zutreffendes ankreuzen}}\n\n- [ ] **Abnahme ohne Vorbehalt.** Alle Anforderungen erf\xFCllt, keine blockierenden Punkte.\n- [ ] **Abnahme unter Vorbehalt.** Die unter 5 genannten wesentlichen Punkte werden bis zum {{Datum}} behoben. Die Abnahme bleibt davon unber\xFChrt.\n- [ ] **Abnahme verweigert.** Begr\xFCndung: {{...}}\n\n**Nachtr\xE4ge nach Abschnitt 4** werden {{gesondert beauftragt / mit Angebot Nr. ... beauftragt / abgelehnt}}.\n\n---\n\n| Rolle | Name | Datum | Unterschrift |\n|---|---|---|---|\n| Auftraggeber | {{...}} | {{...}} | |\n| Auftragnehmer | {{...}} | {{...}} | |\n\n---\n\n> **Rechtlicher Hinweis.** Diese Vorlage ist ein Arbeitsdokument und keine Rechtsberatung. Ob eine Abnahme im Sinne des Werkvertragsrechts vorliegt, welche Fristen und R\xFCgeobliegenheiten gelten und wie Nachtr\xE4ge zu vereinbaren sind, h\xE4ngt vom zugrunde liegenden Vertrag ab. **Vor der ersten Verwendung anwaltlich pr\xFCfen lassen.**\n\n---\n\n## Gate 5, Pr\xFCfpunkte\n\n- [ ] Jede Anforderung mit Ergebnis versehen\n- [ ] Outcome-Kriterium gemessen oder Messtermin benannt\n- [ ] **Jede Zeile des Annahmen-Registers abgehakt**\n- [ ] Offene Punkte nach Schwere klassifiziert und mit Frist versehen\n- [ ] Behandlung der Nachtr\xE4ge entschieden\n- [ ] Erkl\xE4rung angekreuzt und unterzeichnet\n'
  },
  {
    "name": "08-release-notes.md",
    "inhalt": '# Release {{Version}}: {{Kurztitel}}\n\n**Datum:** {{TT.MM.JJJJ}} \xB7 **Freigegeben von:** {{Name}} \xB7 **Ausgerollt von:** {{Name}}\n**Pflicht:** immer, Umfang steigt mit K \xB7 **Gate 5**\n\n---\n\n## 1. Was sich \xE4ndert\n\n| Art | Beschreibung | Bezug |\n|---|---|---|\n| Neu | {{...}} | REQ-{{Nr}} |\n| Ge\xE4ndert | {{...}} | REQ-{{Nr}} |\n| Behoben | {{...}} | Ticket {{Nr}} |\n| Entfernt | {{...}} | {{Begr\xFCndung}} |\n\n---\n\n## 2. Wer etwas merkt\n\n| Rolle | Was sich f\xFCr sie \xE4ndert | Muss sie etwas tun |\n|---|---|---|\n| {{...}} | {{...}} | {{ja, n\xE4mlich ... / nein}} |\n\n---\n\n## 3. Stand und Herkunft\n\n| Feld | Inhalt |\n|---|---|\n| **Version** | {{...}} |\n| **Commit** | {{Hash}} |\n| **Enthaltene Arbeitspakete** | {{Liste}} |\n| **H\xF6chste enthaltene Kritikalit\xE4t** | {{K1/K2/K3}} |\n| **Gates bestanden** | {{Gate 4 je Paket, Gate 5}} |\n| **Verzichte in dieser Lieferung** | {{Anzahl und Begr\xFCndungen}} |\n\n---\n\n## 4. Ausrollen\n\n| Feld | Inhalt |\n|---|---|\n| **Vorbedingungen** | {{Migrationen, Konfiguration, Abh\xE4ngigkeiten}} |\n| **Reihenfolge** | {{Schritte}} |\n| **Ausfallzeit** | {{keine / X Minuten, angek\xFCndigt am ...}} |\n| **Pr\xFCfung nach dem Ausrollen** | {{Was wird kontrolliert, in welcher Reihenfolge}} |\n\n---\n\n## 5. R\xFCckweg\n\n**Pflichtfeld. Ein Ausrollen ohne beschriebenen R\xFCckweg ist bei K2 und K3 unzul\xE4ssig.**\n\n| Feld | Inhalt |\n|---|---|\n| **Ausl\xF6ser f\xFCr den R\xFCckweg** | {{Woran erkennen wir, dass wir zur\xFCck m\xFCssen}} |\n| **Schritte** | {{...}} |\n| **Datenr\xFCckbau n\xF6tig** | {{ja, n\xE4mlich ... / nein}} |\n| **Zeitbedarf** | {{X Minuten}} |\n| **Getestet am** | {{Datum oder \u201Enicht getestet"}} |\n\n---\n\n## Pr\xFCfpunkte\n\n- [ ] Jede \xC4nderung hat einen Bezug zu REQ oder Ticket\n- [ ] Betroffene Rollen benannt, Handlungsbedarf gekl\xE4rt\n- [ ] Verzichte dieser Lieferung aufgef\xFChrt\n- [ ] R\xFCckweg beschrieben, bei K3 auch getestet\n- [ ] Pr\xFCfung nach dem Ausrollen definiert\n'
  },
  {
    "name": "09-monitoring-setup.md",
    "inhalt": '# \xDCberwachung: {{System oder Modul}}\n\n**Projekt:** {{...}} \xB7 **Verantwortlich:** {{Name}} \xB7 **Datum:** {{TT.MM.JJJJ}}\n**Pflicht:** Grundma\xDF immer, ab K2 vollst\xE4ndig \xB7 **Gate 6**\n\n---\n\n## 1. Der Leitsatz\n\n> Wenn der Kunde zuerst anruft, war die \xDCberwachung unvollst\xE4ndig.\n\nF\xFCr jede St\xF6rung, die ein Nutzer melden k\xF6nnte, muss es entweder einen Alarm geben oder eine bewusste Entscheidung, dass keiner n\xF6tig ist.\n\n---\n\n## 2. Messgr\xF6\xDFen\n\n| # | Messgr\xF6\xDFe | Quelle | Normalbereich | Warnschwelle | Alarmschwelle |\n|---|---|---|---|---|---|\n| M1 | Erreichbarkeit | {{...}} | {{...}} | {{...}} | {{...}} |\n| M2 | Antwortzeit | {{...}} | {{...}} | {{...}} | {{...}} |\n| M3 | Fehlerrate | {{...}} | {{...}} | {{...}} | {{...}} |\n| M4 | {{fachliche Gr\xF6\xDFe aus dem Intent}} | {{...}} | {{...}} | {{...}} | {{...}} |\n\n**M4 ist der Pflichteintrag, den fast alle vergessen:** eine fachliche Messgr\xF6\xDFe, die zeigt, ob das System seine Aufgabe erf\xFCllt. Ein System kann technisch einwandfrei laufen und fachlich nichts tun.\n\n---\n\n## 3. Stillstandserkennung\n\n| # | Frage | Antwort |\n|---|---|---|\n| S1 | Woran erkennen wir, dass gar keine Daten mehr kommen? | {{...}} |\n| S2 | Nach welcher Zeit ohne Daten wird alarmiert? | {{...}} |\n| S3 | Was passiert nach einem Neustart der Gegenstelle? | {{...}} |\n\n**Ausbleibende Daten erzeugen keinen Fehler. Sie erzeugen Stille, und Stille sieht auf jedem Bildschirm wie Normalbetrieb aus.**\n\n---\n\n## 4. Alarmwege\n\n| Schwere | Wer wird benachrichtigt | Wie | Innerhalb von | Wenn niemand reagiert |\n|---|---|---|---|---|\n| Alarm | {{...}} | {{...}} | {{...}} | {{Eskalation an ...}} |\n| Warnung | {{...}} | {{...}} | {{...}} | {{...}} |\n\n---\n\n## 5. Reaktionszusage\n\n| Schwere | Reaktionszeit | Bearbeitungszeit | Geltungszeitraum |\n|---|---|---|---|\n| Betrieb steht | {{...}} | {{...}} | {{Mo bis Fr, 8 bis 17 Uhr}} |\n| Eingeschr\xE4nkt | {{...}} | {{...}} | {{...}} |\n| Beeintr\xE4chtigung | {{...}} | {{...}} | {{...}} |\n\n**Ehrlichkeitsregel:** Eine Zusage, die au\xDFerhalb der eigenen Arbeitszeit gilt, braucht eine Vertretungsregelung. Ohne sie wird sie nicht eingehalten und ist damit schlechter als keine Zusage.\n\n---\n\n## 6. Bewusst nicht \xFCberwacht\n\n| Bereich | Warum | Entschieden von |\n|---|---|---|\n| {{...}} | {{...}} | {{Name}} |\n\n---\n\n## Gate 6, Pr\xFCfpunkte\n\n- [ ] Mindestens eine fachliche Messgr\xF6\xDFe aus dem Intent\n- [ ] Stillstandserkennung beantwortet, alle drei Fragen\n- [ ] Jeder Alarm hat einen Empf\xE4nger und einen Eskalationsweg\n- [ ] Reaktionszusage mit Geltungszeitraum und Vertretung\n- [ ] Abschnitt \u201Ebewusst nicht \xFCberwacht" ausgef\xFCllt und namentlich entschieden\n'
  },
  {
    "name": "10-outcome-review.md",
    "inhalt": "# Outcome-Review: {{Vorhaben}}\n\n**Datum:** {{TT.MM.JJJJ}} \xB7 **Inbetriebnahme war am:** {{TT.MM.JJJJ}} \xB7 **Teilnehmende:** {{...}}\n**Pflicht:** immer \xB7 **Gate 6**\n\n---\n\n## 1. Das Kriterium aus P0\n\n| Feld | Inhalt |\n|---|---|\n| **Outcome-Kriterium** | {{w\xF6rtlich aus dem Intent}} |\n| **Ausgangswert** | {{Zahl, Datum}} |\n| **Zielwert** | {{Zahl}} |\n| **Gemessener Wert** | {{Zahl, Datum, Messverfahren}} |\n| **Erreicht** | {{ja / teilweise / nein}} |\n\n---\n\n## 2. Weitere Kennzahlen\n\n| Kennzahl | Ziel | Ist | Bewertung |\n|---|---|---|---|\n| Erstdurchlaufquote am Gate | {{...}} | {{...}} | {{ }} |\n| Erstdurchlaufquote je S-Stufe | {{S2/S3/S4}} | {{...}} | {{ }} |\n| Verzichtsquote | unter 15 Prozent | {{...}} | {{ }} |\n| Ursachenverteilung | keine Vorgabe | {{Verteilung \xFCber sieben Werte}} | {{ }} |\n| Sch\xE4tzabweichung | unter 20 Prozent | {{...}} | {{ }} |\n| Vorf\xE4lle seit Inbetriebnahme | {{...}} | {{...}} | {{ }} |\n\n---\n\n## 2b. Notfallpfad\n\n| Frage | Antwort |\n|---|---|\n| Notf\xE4lle im Zeitraum | {{Zahl, siehe `attesta/BERICHT.md`}} |\n| davon nachdokumentiert innerhalb der Frist | {{Zahl}} |\n| davon \xFCberf\xE4llig | {{Zahl}} |\n| Schwelle je Quartal erreicht | {{ja / nein, Schwelle steht in `rules/notfall.yaml`}} |\n\n**Wenn die Schwelle erreicht ist, ist es kein Notfall mehr, sondern ein Muster.** Dann geh\xF6rt die Ursache hierher und nicht in den n\xE4chsten Notfall.\n\n---\n\n## 3. Was gelernt wurde\n\n| # | Beobachtung | Beleg | Folgerung |\n|---|---|---|---|\n| L1 | {{...}} | {{Kennzahl, Vorfall, Zitat}} | {{...}} |\n| L2 | {{...}} | {{...}} | {{...}} |\n\n---\n\n## 4. Anpassung des Regelsets\n\n**Der Teil, der den Zyklus zum Kreis macht. Ohne ihn bleibt jedes Review folgenlos.**\n\n| # | Was ge\xE4ndert wird | Warum | Datei | Kritikalit\xE4t der \xC4nderung |\n|---|---|---|---|---|\n| R1 | {{z. B. Anzeigemodule mit Dom\xE4nenbezug h\xF6chstens S3}} | {{Beleg aus Abschnitt 3}} | {{rules/...}} | K3, Vier-Augen |\n| R2 | {{...}} | {{...}} | {{...}} | {{...}} |\n\n**Wenn dieser Abschnitt leer bleibt, geh\xF6rt eine Begr\xFCndung hierher.** Ein Projekt ohne einen einzigen Lerneffekt am Regelset ist m\xF6glich und selten.\n\n---\n\n## 5. R\xFCckgabe an den Anfang\n\n| Frage | Antwort |\n|---|---|\n| Entsteht daraus ein neuer Intake? | {{ja, n\xE4mlich ... / nein}} |\n| Gibt es wiederkehrende Support-Anfragen, die zum Intake werden? | {{ja, ab dem dritten Auftreten / nein}} |\n| Welche Annahme aus dem Register hat sich als falsch erwiesen? | {{...}} |\n\n---\n\n## Gate 6, Pr\xFCfpunkte\n\n- [ ] Outcome-Kriterium gemessen, mit Verfahren und Datum\n- [ ] Alle Pflichtkennzahlen erhoben\n- [ ] Jede Beobachtung hat einen Beleg, keine reine Meinung\n- [ ] Abschnitt 4 ausgef\xFCllt oder das Ausbleiben begr\xFCndet\n- [ ] R\xFCckgabe an den Anfang beantwortet\n"
  },
  {
    "name": "11-vorfallbericht.md",
    "inhalt": '# Vorfall {{Nr}}: {{Kurztitel}}\n\n**Erkannt am:** {{TT.MM.JJJJ, HH:MM}} \xB7 **Behoben am:** {{TT.MM.JJJJ, HH:MM}} \xB7 **Schwere:** {{...}}\n**Erkannt durch:** {{\xDCberwachung / Nutzer / Zufall}} \xB7 **Bearbeitet von:** {{Name}}\n**Pflicht:** ab K2 \xB7 **Phase P6**\n\n---\n\n## 1. Was war\n\n{{Drei S\xE4tze. Was hat nicht funktioniert, wer war betroffen, wie lange.}}\n\n---\n\n## 2. Wirkung\n\n| Feld | Inhalt |\n|---|---|\n| **Betroffene** | {{Anzahl, Rolle}} |\n| **Dauer** | {{...}} |\n| **Fachlicher Schaden** | {{...}} |\n| **Wurde es gemeldet oder bemerkt** | {{\xDCberwachung / Nutzer meldete}} |\n\n**Wenn ein Nutzer zuerst gemeldet hat, geh\xF6rt ein Eintrag in Abschnitt 5.**\n\n---\n\n## 3. Ursache\n\n{{Was war die technische Ursache? Ein Absatz.}}\n\n**Und die Frage dahinter:** Welche Annahme in der Spezifikation traf nicht zu? H\xE4ufig fehlt ein Zustand, der in der Wirklichkeit vorkommt und im Modell nicht.\n\n---\n\n## 4. Sofortma\xDFnahme\n\n{{Was wurde getan, um den Betrieb wiederherzustellen? Diese Ma\xDFnahme muss nicht dauerhaft sein.}}\n\n---\n\n## 5. Dauerhafte Ma\xDFnahme\n\n| # | Ma\xDFnahme | Wird Arbeitspaket | Kritikalit\xE4t | Verantwortlich | Frist |\n|---|---|---|---|---|---|\n| M1 | {{...}} | {{ja, AP-Nr}} | {{K1/K2/K3}} | {{Name}} | {{Datum}} |\n| M2 | {{\xDCberwachungsl\xFCcke schlie\xDFen}} | {{...}} | {{...}} | {{...}} | {{...}} |\n\n---\n\n## 6. R\xFCckwirkung auf die Artefakte\n\n| Artefakt | \xC4nderung n\xF6tig | Erledigt |\n|---|---|---|\n| SPEC-{{Nr}} | {{z. B. Zustand \u201Ekeine Daten" erg\xE4nzen}} | {{ }} |\n| Contract CT-{{Nr}} | {{Gegenbeispiel erg\xE4nzen}} | {{ }} |\n| \xDCberwachung | {{Messgr\xF6\xDFe erg\xE4nzen}} | {{ }} |\n| Vorlage | {{Erkenntnis in die Vorlage \xFCbernehmen}} | {{ }} |\n\n**Die letzte Zeile ist die wertvollste.** Ein Vorfall, dessen Erkenntnis nur im Projekt bleibt, wiederholt sich im n\xE4chsten Projekt.\n\n---\n\n## Pr\xFCfpunkte\n\n- [ ] Ursache benannt, nicht nur das Symptom\n- [ ] Die Frage nach der nicht zutreffenden Annahme beantwortet\n- [ ] Sofortma\xDFnahme und dauerhafte Ma\xDFnahme getrennt\n- [ ] Jede dauerhafte Ma\xDFnahme hat Verantwortliche und Frist\n- [ ] R\xFCckwirkung auf Artefakte gepr\xFCft, auch wenn keine n\xF6tig ist\n'
  }
];
var BEDIENUNG = '# Bedienung des Vorlagensatzes\n\nZu jeder der dreizehn Vorlagen unter `docs/vorlagen/` steht hier eine\nBedienhilfe: wof\xFCr sie da ist, wann sie ausgef\xFCllt wird, was in jedes Feld\ngeh\xF6rt, ein ausgef\xFClltes Beispiel, die h\xE4ufigen Fehler und was die Maschine\ndavon pr\xFCft.\n\n**Was hier steht:** die Bedienung. Wie ein Feld auszuf\xFCllen ist.\n\n**Was hier nicht steht:** die Beratung. Wie ein Intake-Gespr\xE4ch moderiert wird,\nwie ein Umfang verhandelt wird, wie ein Team durch einen K3-Fall begleitet\nwird. Das ist Bestandteil eines Einf\xFChrungsmandats und nicht des Bausatzes.\n\nAlle Beispiele folgen einem durchgehenden Fall: ein Kunststoffverarbeiter mit\nzw\xF6lf Spritzgussmaschinen, der gewarnt werden will, wenn Messwerte aus dem\nToleranzband laufen.\n\n---\n\n# Bedienhilfe: `00-intake.md`\n\n**Vorprozess, vor jedem Angebot**\n\n## Wof\xFCr\n\nDie Entscheidung, ob ein Angebot geschrieben wird. Der Intake trennt ein Vorhaben, das man beziffern kann, von einem, bei dem man raten m\xFCsste.\n\n## Wann ausf\xFCllen\n\nEinmal je Anfrage, vor dem Angebot. Unabh\xE4ngig von der Kritikalit\xE4t, auch bei kleinen Vorhaben.\n\n## Feld f\xFCr Feld\n\n| Block | Was hineingeh\xF6rt |\n|---|---|\n| Gesch\xE4ftsziel | Was der Betrieb davon hat, in Geld oder Zeit. Keine Funktionsliste |\n| Umfang und Funktionen | Grobe Bausteine, noch keine Anforderungen |\n| Technischer Rahmen | Bestandssysteme, Schnittstellen, Datenlage |\n| Kommerzieller Rahmen | Budgetrahmen, Termin, Entscheidungsweg |\n| Reifegradbewertung | Sechs Dimensionen, Skala 1 bis 5, Gesamtwert ist das Minimum |\n| Projektkategorie | Aus der festen Liste, bestimmt den weiteren Zuschnitt |\n\n**Der Gesamtwert ist das Minimum, kein Mittelwert.** Eine einzelne 1 macht das\nVorhaben nicht angebotsreif, auch wenn alles andere eine 5 ist.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n| Dimension | Wert | Begr\xFCndung |\n|---|---|---|\n| Klarheit des Umfangs | 4 | Zw\xF6lf Maschinen, ein Messwerttyp, klar abgegrenzt |\n| Technische Machbarkeit | 4 | Maschinen liefern bereits Werte \xFCber OPC UA |\n| Daten und Schnittstellen | 2 | Kein Zugriff auf die Steuerung gekl\xE4rt, Hersteller nicht gefragt |\n| Entscheidungsbefugnis | 5 | Inhaber entscheidet selbst |\n| Fachwissen beim Kunden | 4 | Produktionsleiter kennt die Toleranzb\xE4nder |\n| Stabilit\xE4t der Rahmenbedingungen | 4 | Kein laufender Umbau |\n\n**Gesamtwert: 2 (Minimum).** Folge: Discovery, kein Angebot. Die offene\nSchnittstellenfrage kostet sonst mitten im Projekt.\n\n## H\xE4ufige Fehler\n\n- Den Gesamtwert mitteln statt das Minimum nehmen. Das verdeckt genau die eine L\xFCcke, die das Projekt kippt.\n- Funktionen ins Gesch\xE4ftsziel schreiben. \u201EEin Dashboard" ist kein Ziel, sondern eine L\xF6sung.\n- Die Reifegradbewertung mit dem Kunden gemeinsam sch\xF6nrechnen.\n\n## Was die Maschine pr\xFCft\n\nNichts. Der Intake ist eine Gespr\xE4chs- und Urteilsgrundlage und wird nicht maschinell gepr\xFCft.\n\n---\n\n# Bedienhilfe: `01-intent.md`\n\n**P0, Gate 0**\n\n## Wof\xFCr\n\nLegt fest, woran am Ende gemessen wird, und stuft die Kritikalit\xE4t ein. Ohne dieses Blatt gibt es sp\xE4ter keinen Ma\xDFstab f\xFCr das Outcome-Review.\n\n## Wann ausf\xFCllen\n\nZu Beginn jedes Vorhabens, vor der Architektur. Immer, unabh\xE4ngig von K.\n\n## Feld f\xFCr Feld\n\n| Feld | Was hineingeh\xF6rt |\n|---|---|\n| Problemdefinition | Der Ist-Zustand und was daran weh tut. Keine L\xF6sung |\n| Outcome-Kriterium | Eine messbare Aussage \xFCber die Welt nach dem Vorhaben |\n| Abnahmekriterien | Woran die Lieferung gepr\xFCft wird |\n| Kritikalit\xE4tseinstufung je Modul | K1 bis K3, mit Begr\xFCndung. Kriterium ist der Schaden bei Fehler |\n| Ausdr\xFCcklich nicht im Umfang | Was bewusst wegbleibt. Sch\xFCtzt sp\xE4ter vor Streit |\n| Annahmen-Register | Was angenommen und nicht gepr\xFCft wurde |\n\n**Die Einstufung ist eine Ein-Minuten-Entscheidung, kein Assessment.** Im\nZweifel eine Stufe h\xF6her.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n**Outcome-Kriterium:** Ausschuss durch zu sp\xE4t erkannte Toleranzabweichung\nsinkt binnen sechs Monaten von 3,1 Prozent auf unter 2,0 Prozent.\n\n**Kritikalit\xE4t je Modul**\n\n| Modul | K | Begr\xFCndung |\n|---|---|---|\n| Messwertaufnahme | K2 | Fehler st\xF6rt die Produktion, ist aber behebbar |\n| Alarmierung | K2 | Ein verpasster Alarm kostet eine Charge, keine Sicherheit |\n| Nutzerverwaltung | K3 | Zugangsdaten |\n\n**Nicht im Umfang:** Eingriff in die Maschinensteuerung. Nur Beobachtung.\n\n## H\xE4ufige Fehler\n\n- Ein Outcome-Kriterium ohne Zahl. \u201EWeniger Ausschuss" ist kein Kriterium, sondern ein Wunsch.\n- Die Kritikalit\xE4t am Aufwand festmachen statt am Schaden. Ein aufw\xE4ndiges Modul ohne Schadenspotenzial bleibt K1.\n- \u201ENicht im Umfang" leer lassen. Genau dort entstehen die sp\xE4teren Nachtr\xE4ge.\n\n## Was die Maschine pr\xFCft\n\nNichts unmittelbar. Das Outcome-Kriterium wird in `10-outcome-review.md` wieder aufgegriffen, dort f\xE4llt eine fehlende Zahl auf.\n\n---\n\n# Bedienhilfe: `01b-intent-kurz.md`\n\n**P0, Kurzform f\xFCr K1**\n\n## Wof\xFCr\n\nDieselbe Funktion wie `01-intent.md`, auf eine halbe Seite gek\xFCrzt. F\xFCr Vorhaben, bei denen die volle Fassung mehr Zeremonie w\xE4re als Nutzen.\n\n## Wann ausf\xFCllen\n\nBei K1 statt der vollen Fassung. Ab K2 geh\xF6rt die volle Fassung genommen.\n\n## Feld f\xFCr Feld\n\n| Feld | Was hineingeh\xF6rt |\n|---|---|\n| Vorhaben | Ein Satz |\n| Warum | Ein bis zwei S\xE4tze |\n| Woran gemessen | Eine messbare Aussage |\n| Kritikalit\xE4t | K1, sonst w\xE4re dies die falsche Vorlage |\n\n**Wenn du beim Ausf\xFCllen merkst, dass eine Zeile nicht reicht, ist es kein K1.**\nDann wechsle auf die volle Fassung.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n**Vorhaben:** Sortierung der Maschinenliste nach letzter Meldung.\n**Warum:** Der Produktionsleiter sucht die auff\xE4llige Maschine jedes Mal von Hand.\n**Woran gemessen:** Auff\xE4llige Maschine steht ohne Scrollen oben.\n**Kritikalit\xE4t:** K1, reine Anzeigereihenfolge, trivial umkehrbar.\n\n## H\xE4ufige Fehler\n\n- Die Kurzform f\xFCr ein K2-Vorhaben nehmen, weil sie schneller geht. Das ist der h\xE4ufigste Missbrauch dieser Vorlage.\n- Das Messkriterium weglassen, weil es \u201Eoffensichtlich" ist.\n\n## Was die Maschine pr\xFCft\n\nNichts.\n\n---\n\n# Bedienhilfe: `02-use-case.md`\n\n**P0 bis P2, Pflicht ab K3**\n\n## Wof\xFCr\n\nBeschreibt einen Ablauf aus Sicht des Handelnden, mit Alternativpfaden und Fehlerf\xE4llen. Aus ihm werden die Anforderungen abgeleitet, nicht umgekehrt.\n\n## Wann ausf\xFCllen\n\nAb K3 Pflicht, ab K2 empfohlen. Vor den Anforderungen, sonst fehlen die Fehlerf\xE4lle.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Kopf | Akteur aus der Rollenliste, Ausl\xF6ser, Vorbedingung, Ergebnis |\n| Hauptpfad | Die Schritte, wenn nichts schiefgeht. Nummeriert |\n| Alternativpfade | Abweichungen, die trotzdem zum Ziel f\xFChren |\n| Fehlerf\xE4lle | Abweichungen, die nicht zum Ziel f\xFChren. **Der wertvollste Teil** |\n| Abgeleitete Anforderungen | Welche REQ aus welchem Schritt entsteht |\n\n**Ein Use Case ohne Fehlerf\xE4lle ist unfertig.** Die Fehlerf\xE4lle sind der Grund,\nwarum diese Vorlage ab K3 Pflicht ist.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n**Akteur:** Produktionsleiter \xB7 **Ausl\xF6ser:** Messwert au\xDFerhalb des Toleranzbands\n\n**Hauptpfad**\n1. Maschine meldet Messwert\n2. System vergleicht gegen das Toleranzband der Maschine\n3. Bei drei aufeinanderfolgenden Abweichungen: Alarm an den Produktionsleiter\n4. Produktionsleiter quittiert den Alarm\n\n**Fehlerf\xE4lle**\n\n| # | Fall | Erwartetes Verhalten |\n|---|---|---|\n| F1 | Maschine liefert keine Werte mehr | Zustand `keine_daten` nach f\xFCnf Minuten, eigener Alarm |\n| F2 | Toleranzband f\xFCr die Maschine fehlt | Kein Alarm, Hinweis an die Einrichtung |\n| F3 | Alarm wird nicht quittiert | Eskalation nach drei\xDFig Minuten |\n\n## H\xE4ufige Fehler\n\n- Nur den Hauptpfad schreiben. Dann fehlen sp\xE4ter genau die Anforderungen, die im Betrieb wehtun.\n- Den Akteur als \u201ESystem" benennen. Ein System ist kein Akteur aus der Rollenliste.\n- L\xF6sungsdetails in die Schritte schreiben (\u201Eklickt auf den blauen Knopf").\n\n## Was die Maschine pr\xFCft\n\nDie abgeleiteten Anforderungen werden \xFCber `attesta guete` gepr\xFCft, sobald sie als REQ vorliegen. Der Use Case selbst wird nicht gepr\xFCft.\n\n---\n\n# Bedienhilfe: `03-req.md`\n\n**P0 und P2, Gate 2, immer Pflicht**\n\n## Wof\xFCr\n\nEine Anforderung, ein normativer Satz, mindestens ein messbares Abnahmekriterium. Das ist die Vorlage, die `attesta guete` tats\xE4chlich pr\xFCft.\n\n## Wann ausf\xFCllen\n\nF\xFCr jede Anforderung eine eigene Datei. Immer, unabh\xE4ngig von K.\n\n## Feld f\xFCr Feld\n\n| Feld | Regel |\n|---|---|\n| Der normative Satz | Genau ein Modalverb (muss, soll, kann), Akteur aus der Rollenliste, kein Unsch\xE4rfewort, keine Technologie |\n| Abnahmekriterien | Mindestens eines mit Zahl und Einheit oder Vergleichsoperator |\n| Einordnung | K, Priorit\xE4t, Bezug zu Intent und Use Case |\n| Begr\xFCndung | Ein bis zwei S\xE4tze. Wer sie nicht schreiben kann, hat wom\xF6glich keine notwendige Anforderung |\n\n**Die Unsch\xE4rfeliste steht in `attesta/profil/wortlisten.yaml`.** Schreibe sie\nnicht in die Anforderung ab, sonst driftet deine Kopie vom Regelsatz.\n\n**Die Rollenliste hat zwei Teile.** Der generische Grundbestand kommt aus dem\nRegelsatz. Betriebseigene Rollen wie `Produktionsleiter` oder `Schichtleitung`\ntr\xE4gst du in `attesta/rollen-eigene.yaml` ein. Diese Datei geh\xF6rt dir, wird bei\neinem Basiswechsel nie \xFCberschrieben und nicht gegen die Profilbasis gepr\xFCft.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n> Das System **muss** den Produktionsleiter alarmieren, wenn drei\n> aufeinanderfolgende Messwerte einer Maschine au\xDFerhalb des Toleranzbands liegen.\n\n| # | Abnahmekriterium | Messbar woran |\n|---|---|---|\n| 1 | Alarm erreicht den Produktionsleiter in unter 60 Sekunden nach dem dritten Wert | Zeitstempel Messwert gegen Zeitstempel Zustellung |\n| 2 | Bei zwei Abweichungen und einem Wert im Band erfolgt kein Alarm | Testfall mit fester Wertefolge |\n\n**Kritikalit\xE4t:** K2 \xB7 **Priorit\xE4t:** Muss \xB7 **Bezug zum Use Case:** UC-1, Schritt 3\n\n## H\xE4ufige Fehler\n\n- Zwei Forderungen in einem Satz (\u201Emuss alarmieren und protokollieren"). Das sind zwei Anforderungen.\n- \u201EDas System" als Akteur, wenn die Rollenliste ihn nicht f\xFChrt.\n- Abnahmekriterien ohne Zahl. \u201ESchnell genug" ist kein Kriterium.\n- Die Technologie in die Anforderung schreiben. Das ist eine L\xF6sung im Anforderungsgewand.\n\n## Was die Maschine pr\xFCft\n\n`attesta guete <Pfad>` pr\xFCft sechs Punkte: ein Modalverb, benannter Akteur,\nmessbares Abnahmekriterium, kein Unsch\xE4rfewort, keine Technologievorgabe,\nPflichtfelder gef\xFCllt.\n\n**Drei Merkmale bleiben menschliches Urteil und werden nicht gepr\xFCft:\nnotwendig, korrekt, angemessen.**\n\n---\n\n# Bedienhilfe: `04-spec.md`\n\n**P2, Gate 2, Pflicht ab K2**\n\n## Wof\xFCr\n\n\xDCbersetzt Anforderungen in Gesch\xE4ftsregeln, Zust\xE4nde und Fehlerverhalten. Die Spezifikation beantwortet das Wie auf fachlicher Ebene, noch nicht auf technischer.\n\n## Wann ausf\xFCllen\n\nAb K2. Nach den Anforderungen, vor der Umsetzung.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Zweck in einem Satz | Wof\xFCr dieses Modul da ist |\n| Gesch\xE4ftsregeln | Je Regel eine Kennung (GR-x.y) und der Bezug zur REQ |\n| Zust\xE4nde und \xDCberg\xE4nge | Alle Zust\xE4nde, alle \xDCberg\xE4nge |\n| Datenmodell | Felder mit Typ, Pflicht, Wertebereich |\n| Schnittstellenskizze | Ein- und Ausgabe je Aufruf |\n| Fehlerverhalten | Je Situation: Verhalten und Empf\xE4nger der Meldung |\n\n**Die Pflichtfrage im Zustandsabschnitt ist ernst gemeint:** Gibt es einen\nZustand f\xFCr \u201Ekeine Daten", \u201Eunbekannt" oder \u201ESystem antwortet nicht"? Die\nAbwesenheit von Daten ist ein Zustand und wird regelm\xE4\xDFig vergessen.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n**Zust\xE4nde einer Maschine**\n\n| Zustand | Bedeutung |\n|---|---|\n| `ruhig` | Werte innerhalb des Bands |\n| `beobachtet` | Ein oder zwei Werte au\xDFerhalb |\n| `ausgeloest` | Drei Werte au\xDFerhalb, Alarm gesendet |\n| `quittiert` | Produktionsleiter hat best\xE4tigt |\n| `keine_daten` | Seit f\xFCnf Minuten kein Wert eingegangen |\n\n**Fehlerverhalten**\n\n| Situation | Verhalten | Meldung an |\n|---|---|---|\n| Toleranzband fehlt | Zustand bleibt `ruhig`, kein Alarm | Einrichtung |\n| Messwert unplausibel | Wert verworfen, Z\xE4hler unver\xE4ndert | Betrieb |\n\n## H\xE4ufige Fehler\n\n- Den Zustand f\xFCr fehlende Daten vergessen. Das ist der h\xE4ufigste Fund in dieser Vorlage.\n- Gesch\xE4ftsregeln ohne Kennung. Dann l\xE4sst sich sp\xE4ter kein Test darauf beziehen.\n- Technische Umsetzung hineinschreiben. Das geh\xF6rt in den Contract oder in den Code.\n\n## Was die Maschine pr\xFCft\n\nNichts unmittelbar. Die Zustandsnamen werden von `attesta guete` als messbare Gr\xF6\xDFe erkannt, wenn sie in einem Abnahmekriterium auftauchen.\n\n---\n\n# Bedienhilfe: `05-contract.md`\n\n**P4, Gate 4, Pflicht an Modulgrenzen ab K2**\n\n## Wof\xFCr\n\nH\xE4lt eine Zusage zwischen zwei Modulen fest: Vorbedingung, Nachbedingung, Invariante. Der Contract ist die Stelle, an der ein Test ansetzen kann.\n\n## Wann ausf\xFCllen\n\nAb K2 an jeder Modulgrenze, ab K3 immer f\xFCr Schnittstelle, Daten und Fehlerverhalten.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Die Aussage | Ein Satz: was zugesichert wird |\n| Vorbedingungen | Was gelten muss, damit der Aufruf zul\xE4ssig ist |\n| Nachbedingungen | Was nach dem Aufruf gilt |\n| Invarianten | Was w\xE4hrenddessen nie verletzt wird |\n| Beispiele und Gegenbeispiele | Je mindestens eins. Das Gegenbeispiel ist der wertvollere Teil |\n| Abgrenzung | Was dieser Contract ausdr\xFCcklich nicht zusichert |\n\n**Ein Contract ohne Contract-Test ist eine Absichtserkl\xE4rung.** Ab K3 verlangt\ndas Regelset beides.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n**Die Aussage:** Die Alarmierung stellt sicher, dass je Maschine und\nAusl\xF6sung h\xF6chstens ein Alarm entsteht.\n\n**Vorbedingung:** F\xFCr die Maschine ist ein Toleranzband hinterlegt.\n**Nachbedingung:** Der Zustand ist `ausgeloest`, genau ein Alarm ist verschickt.\n**Invariante:** Der Z\xE4hler der Abweichungen ist nie kleiner als null.\n\n**Gegenbeispiel:** Vier Werte au\xDFerhalb hintereinander erzeugen keinen zweiten\nAlarm, solange nicht quittiert wurde.\n\n## H\xE4ufige Fehler\n\n- Nur Beispiele schreiben, keine Gegenbeispiele. Die Grenze wird erst am Gegenbeispiel sichtbar.\n- Die Abgrenzung leer lassen. Dann wird der Contract sp\xE4ter breiter ausgelegt, als er gemeint war.\n\n## Was die Maschine pr\xFCft\n\nNichts unmittelbar. Ob ein Contract-Test gr\xFCn ist, wertet das Gate \xFCber den Check-Run aus.\n\n---\n\n# Bedienhilfe: `06-testplan.md`\n\n**P4 und P5, Gate 4 und Gate 5**\n\n## Wof\xFCr\n\nLegt fest, was auf welcher Ebene gepr\xFCft wird und was bewusst ungepr\xFCft bleibt. Die Abdeckung richtet sich nach der Kritikalit\xE4t.\n\n## Wann ausf\xFCllen\n\nVor der Umsetzung skizzieren, vor der Freigabe vervollst\xE4ndigen.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Was auf welcher Ebene | Zuordnung Anforderung zu Testebene |\n| Unit-Ebene | Kernlogik, ab K2 Pflicht |\n| Integrationsebene | Zusammenspiel, ab K3 Pflicht. Enth\xE4lt feste Pflichtf\xE4lle |\n| Testdaten | Herkunft, Personenbezug, L\xF6schung |\n| Was nicht getestet wird | Mit Begr\xFCndung |\n\n**Die Abdeckung steht in `attesta/profil/pruefungstiefen.yaml`.** Bei Abweichung\ngilt das Regelset, nicht diese Vorlage.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n| Anforderung | Ebene | Fall |\n|---|---|---|\n| REQ-01 Alarm nach drei Werten | Unit | Wertefolge au\xDFen, au\xDFen, au\xDFen |\n| REQ-01 kein Alarm bei Unterbrechung | Unit | au\xDFen, au\xDFen, innen |\n| REQ-02 Stillstandserkennung | Integration | F\xFCnf Minuten ohne Wert |\n\n**Testdaten:** synthetische Messreihen, kein Personenbezug, keine\nProduktionsdaten.\n\n**Nicht getestet:** Verhalten bei mehr als zw\xF6lf Maschinen. Begr\xFCndung: der\nBetrieb hat zw\xF6lf, eine Erweiterung ist nicht geplant.\n\n## H\xE4ufige Fehler\n\n- Produktionsdaten als Testdaten nehmen, ohne die Rechtsgrundlage zu kl\xE4ren.\n- \u201EWas nicht getestet wird" leer lassen. Der Abschnitt macht bewusste L\xFCcken sichtbar statt sie zu verstecken.\n\n## Was die Maschine pr\xFCft\n\nOb die Testsuite gr\xFCn ist, wertet das Gate \xFCber den Check-Run aus. Der Plan selbst wird nicht gepr\xFCft.\n\n---\n\n# Bedienhilfe: `07-uat-protokoll.md`\n\n**P5, Gate 5, Pflicht ab K2**\n\n## Wof\xFCr\n\nH\xE4lt fest, dass der Auftraggeber gepr\xFCft und abgenommen hat, und gegen welche Anforderungen.\n\n## Wann ausf\xFCllen\n\nVor der Freigabe. Ab K2 mit Protokoll, ab K3 mit Unterschrift.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Gegenstand | Was genau abgenommen wird, mit Version |\n| Pr\xFCfung gegen die Anforderungen | Je REQ ein Ergebnis |\n| Pr\xFCfung gegen das Outcome-Kriterium | Aus `01-intent.md` |\n| Abgleich mit dem Annahmen-Register | Welche Annahme hat sich best\xE4tigt, welche nicht |\n| Offene Punkte | Mit Frist und Verantwortlichem |\n| Abnahmeerkl\xE4rung | Vorbehaltlos, unter Vorbehalt oder verweigert |\n\n**Rechtlicher Vorbehalt:** Ob und wie eine Abnahme im Sinne des\nWerkvertragsrechts wirkt, ist anwaltlich zu kl\xE4ren (R1). Bis dahin tr\xE4gt die\nVorlage diesen Hinweis sichtbar.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n| REQ | Ergebnis | Bemerkung |\n|---|---|---|\n| REQ-01 Alarm nach drei Werten | erf\xFCllt | Vorgef\xFChrt an Maschine 4 |\n| REQ-02 Stillstandserkennung | erf\xFCllt unter Vorbehalt | Nur mit einer Maschine gepr\xFCft |\n\n**Outcome-Kriterium:** noch nicht messbar, Zeitraum l\xE4uft sechs Monate.\n**Annahme A2 (Maschinen liefern im Sekundentakt):** widerlegt, Takt ist\nf\xFCnf Sekunden. Ohne Wirkung auf die Anforderungen.\n\n## H\xE4ufige Fehler\n\n- Das Outcome-Kriterium als \u201Eerf\xFCllt" abhaken, obwohl der Messzeitraum noch l\xE4uft. Abnahme und Outcome sind zwei verschiedene Dinge.\n- Offene Punkte ohne Frist und ohne Namen aufnehmen.\n\n## Was die Maschine pr\xFCft\n\nNichts. Die Abnahme ist ein menschlicher Akt und wird nicht maschinell gepr\xFCft.\n\n---\n\n# Bedienhilfe: `08-release-notes.md`\n\n**P5, Gate 5, immer Pflicht**\n\n## Wof\xFCr\n\nSagt den Betroffenen, was sich \xE4ndert, wer es merkt und wie man zur\xFCckkommt.\n\n## Wann ausf\xFCllen\n\nZu jeder Auslieferung. Der Umfang steigt mit der Kritikalit\xE4t.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Was sich \xE4ndert | Aus Sicht der Nutzung, nicht aus Sicht des Codes |\n| Wer etwas merkt | Welche Rolle, woran |\n| Stand und Herkunft | Version, Commit, Herkunft des Regelsatzes |\n| Ausrollen | Reihenfolge, Zeitfenster, Voraussetzungen |\n| R\xFCckweg | **Pflichtfeld ab K2.** Ein Ausrollen ohne beschriebenen R\xFCckweg ist bei K2 und K3 unzul\xE4ssig |\n\n**Der R\xFCckweg ist kein Formalismus.** Wer ihn nicht beschreiben kann, hat ihn\nin der Regel auch nicht.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n**Was sich \xE4ndert:** Maschinen melden ab sofort auch Stillstand, nicht nur\nToleranzabweichung.\n\n**Wer etwas merkt:** Der Produktionsleiter bekommt einen zus\xE4tzlichen\nAlarmtyp. Die Einrichtung muss je Maschine ein Toleranzband hinterlegen,\nsonst bleibt die Maschine still.\n\n**R\xFCckweg:** Version 1.3 wieder einspielen, Alarmtyp `keine_daten` in der\nKonfiguration abschalten. Kein Datenverlust, die Messreihen bleiben.\n\n## H\xE4ufige Fehler\n\n- Den R\xFCckweg mit \u201ERollback \xFCber Git" abtun. Das beschreibt das Werkzeug, nicht den Weg.\n- \xC4nderungen aus Codesicht beschreiben. Der Leser ist der Betrieb, nicht die Entwicklung.\n\n## Was die Maschine pr\xFCft\n\nNichts. Ob ein Rollback-Plan vorliegt, pr\xFCft das Gate ab K3 als vorhandenes Artefakt.\n\n---\n\n# Bedienhilfe: `09-monitoring-setup.md`\n\n**P6, Gate 6**\n\n## Wof\xFCr\n\nLegt fest, was im Betrieb beobachtet wird, wann jemand geweckt wird und wie schnell reagiert wird.\n\n## Wann ausf\xFCllen\n\nVor dem ersten Produktivlauf. Grundma\xDF immer, ab K2 vollst\xE4ndig.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Der Leitsatz | Was das System im Kern leisten muss |\n| Messgr\xF6\xDFen | Je Gr\xF6\xDFe: Schwelle, Messintervall |\n| Stillstandserkennung | Wie erkannt wird, dass gar nichts mehr kommt |\n| Alarmwege | Wer wird wie erreicht, und wer, wenn der Erste nicht reagiert |\n| Reaktionszusage | Reaktionszeit je Schwereklasse und Geltungszeitraum |\n| Bewusst nicht \xFCberwacht | Mit Begr\xFCndung |\n\n**Zur Reaktionszusage:** Eine Zusage in einem Dokument, das dem Kunden\nvorliegt, kann vertraglich binden, auch ohne eigenen Vertrag (R3). Keine\nZusage \xFCber Nacht oder am Wochenende ohne Vertretungsregelung.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n| Schwere | Reaktionszeit | Geltungszeitraum |\n|---|---|---|\n| Betrieb steht | 4 Stunden | Mo bis Fr, 8 bis 17 Uhr |\n| eingeschr\xE4nkt | 1 Arbeitstag | Mo bis Fr, 8 bis 17 Uhr |\n| Beeintr\xE4chtigung | 3 Arbeitstage | Mo bis Fr, 8 bis 17 Uhr |\n\n**Stillstandserkennung:** Bleibt der Messwertstrom einer Maschine l\xE4nger als\nf\xFCnf Minuten aus, gilt sie als `keine_daten`. Bleiben alle zw\xF6lf aus, ist das\nein Fall der Klasse \u201EBetrieb steht".\n\n**Bewusst nicht \xFCberwacht:** Netzlast. Begr\xFCndung: das Netz geh\xF6rt dem Betrieb.\n\n## H\xE4ufige Fehler\n\n- Eine Reaktionszusage geben, die ohne Vertretung nicht haltbar ist. Sie w\xE4re schlechter als keine Zusage.\n- Nur Fehler \xFCberwachen, nicht Stillstand. Ein System, das schweigt, sieht aus wie ein System ohne Probleme.\n\n## Was die Maschine pr\xFCft\n\nNichts. Die Reaktionszusage ist eine gesch\xE4ftliche Festlegung.\n\n---\n\n# Bedienhilfe: `10-outcome-review.md`\n\n**P6, Gate 6, immer Pflicht**\n\n## Wof\xFCr\n\nVergleicht das Ergebnis mit dem Kriterium aus P0 und f\xFChrt die Learnings in das Regelset zur\xFCck. Das ist die Stelle, an der der Zyklus sich schlie\xDFt.\n\n## Wann ausf\xFCllen\n\nNach dem festgelegten Messzeitraum, nicht direkt nach der Auslieferung.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Das Kriterium aus P0 | W\xF6rtlich \xFCbernommen, dann das Ergebnis |\n| Weitere Kennzahlen | Erstdurchlaufquote, Ursachenverteilung, Sch\xE4tzabweichung |\n| Notfallpfad | Notf\xE4lle im Zeitraum, nachdokumentiert, \xFCberf\xE4llig |\n| Was gelernt wurde | Auch das Unangenehme |\n| Anpassung des Regelsets | Konkrete \xC4nderung an `rules/` oder am Profil |\n| R\xFCckgabe an den Anfang | Was daraus ein neues Vorhaben wird |\n\n**Die Zahlen stehen in `attesta/BERICHT.md`.** Sie m\xFCssen nicht von Hand\ngesammelt werden.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n**Kriterium aus P0:** Ausschuss unter 2,0 Prozent binnen sechs Monaten.\n**Ergebnis:** 2,4 Prozent. Nicht erreicht.\n\n**Was gelernt wurde:** Der Alarm kommt schnell genug, aber in zwei von drei\nF\xE4llen war die Maschine bereits nachgeregelt worden, bevor jemand reagiert\nhat. Die Ursache liegt nicht in der Software.\n\n**Anpassung des Regelsets:** keine. **R\xFCckgabe an den Anfang:** neues\nVorhaben zur Ursache der Toleranzabweichung, nicht zur schnelleren Meldung.\n\n## H\xE4ufige Fehler\n\n- Ein nicht erreichtes Kriterium umdeuten, statt es stehen zu lassen. Der Wert dieses Blattes liegt genau darin.\n- Die Learnings ohne Konsequenz aufschreiben. Ohne Anpassung ist es ein Tagebuch.\n\n## Was die Maschine pr\xFCft\n\nNichts. Die Zahlen kommen aus dem Monatsbericht, die Bewertung ist menschlich.\n\n---\n\n# Bedienhilfe: `11-vorfallbericht.md`\n\n**P6, Pflicht ab K2**\n\n## Wof\xFCr\n\nH\xE4lt einen Vorfall im Betrieb fest, seine Ursache und die dauerhafte Ma\xDFnahme. Nicht zur Schuldzuweisung, sondern zur R\xFCckwirkung auf die Artefakte.\n\n## Wann ausf\xFCllen\n\nNach jedem Vorfall ab K2. Zeitnah, solange die Details noch bekannt sind.\n\n## Feld f\xFCr Feld\n\n| Abschnitt | Was hineingeh\xF6rt |\n|---|---|\n| Was war | Ablauf mit Zeitstempeln |\n| Wirkung | Wer war betroffen, wie lange, was hat es gekostet |\n| Ursache | Die technische und die dahinterliegende |\n| Sofortma\xDFnahme | Was die St\xF6rung beendet hat |\n| Dauerhafte Ma\xDFnahme | Was verhindert, dass es wiederkommt |\n| R\xFCckwirkung auf die Artefakte | Welche REQ, SPEC oder welcher Contract wird ge\xE4ndert |\n\n**Der letzte Abschnitt ist der Zweck des Berichts.** Ein Vorfallbericht ohne\nR\xFCckwirkung auf ein Artefakt hat nichts bewirkt.\n\n## Ausgef\xFClltes Beispiel\n\nDurchgehender Fall: ein Kunststoffverarbeiter mit zw\xF6lf Spritzgussmaschinen\nwill gewarnt werden, wenn Messwerte aus dem Toleranzband laufen.\n\n**Was war:** 14:02 Maschine 7 meldet keine Werte mehr. 14:35 Produktionsleiter\nbemerkt es beim Rundgang. Kein Alarm ausgel\xF6st.\n\n**Ursache, technisch:** Die Stillstandserkennung pr\xFCfte nur auf Werte\nau\xDFerhalb des Bands, nicht auf ausbleibende Werte.\n**Ursache, dahinter:** Der Zustand `keine_daten` fehlte in der Spezifikation.\n\n**R\xFCckwirkung:** SPEC-02 um den Zustand `keine_daten` erg\xE4nzt, REQ-07 neu\nangelegt, Integrationstest F1 erg\xE4nzt. Die Pflichtfrage in `04-spec.md` ist\ngenau deshalb Pflicht.\n\n## H\xE4ufige Fehler\n\n- Bei der technischen Ursache stehen bleiben. Die dahinterliegende Ursache ist die, die sich beheben l\xE4sst.\n- Den Bericht ohne R\xFCckwirkung abschlie\xDFen.\n- Personen benennen, wo ein Artefakt gemeint ist.\n\n## Was die Maschine pr\xFCft\n\nNichts. Der Ursachencode am Pull Request ist ein anderes Werkzeug und ersetzt diesen Bericht nicht.\n';

// src/konsole/init.ts
function fuehreInitAus(zielVerzeichnis, optionen = {}) {
  const ueberschreiben = optionen.ueberschreiben ?? false;
  const jetzt = optionen.jetzt ?? (() => (/* @__PURE__ */ new Date()).toISOString());
  const basis = (0, import_attesta_core.ladeProfilBasis)();
  const profilVerzeichnis = (0, import_node_path.join)(zielVerzeichnis, "attesta", "profil");
  const lockPfad = (0, import_node_path.join)(zielVerzeichnis, "attesta", "profil.lock");
  if (!ueberschreiben) {
    const vorhanden = basis.dateien.map((d) => (0, import_node_path.join)(profilVerzeichnis, d.dateiname)).filter((pfad) => (0, import_node_fs3.existsSync)(pfad));
    if (vorhanden.length > 0) {
      throw new KonsoleFehler(
        `Profil existiert bereits: ${vorhanden.join(", ")}. Mit --ueberschreiben erneut ausfuehren, um zu ersetzen.`,
        1
      );
    }
  }
  (0, import_node_fs3.mkdirSync)(profilVerzeichnis, { recursive: true });
  const zeitpunkt = jetzt();
  const lock = {};
  const geschriebeneDateien = [];
  for (const datei of basis.dateien) {
    const inhalt = formatiereProfildatei(datei, basis.basisversion);
    const ziel = (0, import_node_path.join)(profilVerzeichnis, datei.dateiname);
    (0, import_node_fs3.writeFileSync)(ziel, inhalt, "utf-8");
    geschriebeneDateien.push(ziel);
    lock[datei.dateiname] = {
      // Pruefsumme der Datei, wie sie geschrieben wurde, einschliesslich
      // Kopfzeile. Die Pruefsumme des blossen Rumpfs wuerde nie wieder
      // getroffen, weil im Kundenrepository immer die volle Datei liegt.
      pruefsumme: (0, import_attesta_core.pruefsumme)(inhalt),
      basisversion: basis.basisversion,
      erzeugt_am: zeitpunkt
    };
  }
  (0, import_node_fs3.writeFileSync)(lockPfad, dump(lock, { lineWidth: -1, noRefs: true }), "utf-8");
  const betriebskennungPfad = (0, import_node_path.join)(zielVerzeichnis, "attesta", "betriebskennung");
  if (!(0, import_node_fs3.existsSync)(betriebskennungPfad)) {
    (0, import_node_fs3.writeFileSync)(betriebskennungPfad, (0, import_node_crypto.randomUUID)(), "utf-8");
  }
  const vorlagenVerzeichnis = (0, import_node_path.join)(zielVerzeichnis, "docs", "vorlagen");
  (0, import_node_fs3.mkdirSync)(vorlagenVerzeichnis, { recursive: true });
  for (const vorlage of VORLAGEN) {
    const ziel = (0, import_node_path.join)(vorlagenVerzeichnis, vorlage.name);
    if (!(0, import_node_fs3.existsSync)(ziel)) (0, import_node_fs3.writeFileSync)(ziel, vorlage.inhalt, "utf-8");
  }
  const bedienungPfad = (0, import_node_path.join)(vorlagenVerzeichnis, "BEDIENUNG.md");
  if (!(0, import_node_fs3.existsSync)(bedienungPfad)) (0, import_node_fs3.writeFileSync)(bedienungPfad, BEDIENUNG, "utf-8");
  const eigeneRollenPfad = (0, import_node_path.join)(zielVerzeichnis, ...EIGENE_ROLLEN_PFAD.split("/"));
  if (!(0, import_node_fs3.existsSync)(eigeneRollenPfad)) {
    (0, import_node_fs3.writeFileSync)(eigeneRollenPfad, EIGENE_ROLLEN_VORLAGE, "utf-8");
  }
  return { profilVerzeichnis, lockPfad, geschriebeneDateien };
}
function zeigeBasiswechsel(zielVerzeichnis) {
  const lockPfad = (0, import_node_path.join)(zielVerzeichnis, "attesta", "profil.lock");
  if (!(0, import_node_fs3.existsSync)(lockPfad)) return;
  const aenderungen = listeBasiswechsel(lockPfad, (0, import_attesta_core.ladeProfilBasis)()).filter((eintrag) => eintrag.aendertSich);
  if (aenderungen.length === 0) {
    console.log("Basiswechsel: keine Abweichung, das Profil entspricht der installierten Basis.");
    return;
  }
  console.log(`Basiswechsel: ${aenderungen.length} Abweichung(en) werden ueberschrieben.`);
  for (const eintrag of aenderungen) {
    console.log(`  ${eintrag.dateiname}`);
    console.log(`    alt: Basis ${eintrag.alteBasisversion ?? "unbekannt"}, ${eintrag.altePruefsumme ?? "keine Pruefsumme"}`);
    console.log(`    neu: Basis ${eintrag.neueBasisversion}, ${eintrag.neuePruefsumme}`);
  }
}
var initBefehl = {
  name: "init",
  hilfe() {
    console.log("attesta init [--ueberschreiben]");
    console.log("  Eingabe:  aktuelles Arbeitsverzeichnis als Kundenrepository");
    console.log("  Ausgabe:  attesta/profil/ (drei Dateien), attesta/profil.lock,");
    console.log("            attesta/betriebskennung, attesta/rollen-eigene.yaml,");
    console.log("            docs/vorlagen/ (dreizehn Vorlagen plus BEDIENUNG.md)");
  },
  fuehreAus(argv) {
    const ueberschreiben = argv.includes("--ueberschreiben");
    if (ueberschreiben) {
      zeigeBasiswechsel(process.cwd());
    }
    const ergebnis = fuehreInitAus(process.cwd(), { ueberschreiben });
    for (const datei of ergebnis.geschriebeneDateien) console.log(`geschrieben: ${datei}`);
    console.log(`geschrieben: ${ergebnis.lockPfad}`);
    return 0;
  }
};

// src/konsole/pruefen.ts
var pruefenBefehl = {
  name: "pruefen",
  hilfe() {
    console.log("attesta pruefen <Pfad>");
    console.log("  Eingabe:  Pfad im Kundenrepository");
    console.log("  Ausgabe:  Befundliste, Rueckgabewert 0 ohne Befund, 1 bei Befund");
  },
  fuehreAus() {
    console.log("attesta pruefen: fachliche Pruefung noch nicht implementiert");
    return 0;
  }
};

// src/konsole/guete.ts
var import_node_fs4 = require("node:fs");

// src/gemeinsam/regex.ts
function maskiere(wort) {
  return wort.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// src/gemeinsam/guete.ts
var MODALVERBEN = ["muss", "soll", "kann"];
function normativerSatz(text) {
  const zeilen = text.split("\n").filter((zeile) => zeile.trim().startsWith(">"));
  return zeilen.length > 0 ? zeilen.join(" ") : text;
}
function zaehleWortTreffer(text, wort) {
  return (text.match(new RegExp(`\\b${maskiere(wort)}\\b`, "gi")) ?? []).length;
}
function pruefeModalverb(text) {
  const satz = normativerSatz(text);
  const anzahl = MODALVERBEN.reduce((summe, wort) => summe + zaehleWortTreffer(satz, wort), 0);
  if (anzahl === 0) {
    return { pruefung: "Modalverb", zustand: "verletzt", details: "kein Modalverb (muss, soll, kann) gefunden" };
  }
  if (anzahl > 1) {
    return { pruefung: "Modalverb", zustand: "verletzt", details: `${anzahl} Modalverben gefunden, genau eines erwartet` };
  }
  return { pruefung: "Modalverb", zustand: "erfuellt" };
}
function pruefeAkteur(text, rollen) {
  const gefunden = rollen.find((rolle) => zaehleWortTreffer(text, rolle) > 0);
  if (!gefunden) {
    return { pruefung: "benannter Akteur", zustand: "verletzt", details: "keine Rolle aus rollen.yaml oder attesta/rollen-eigene.yaml gefunden" };
  }
  return { pruefung: "benannter Akteur", zustand: "erfuellt", details: gefunden };
}
var ZAHL_MIT_EINHEIT = /\d+([.,]\d+)?\s*(ms|s|sekunden?|minuten?|stunden?|tage?|wochen?|prozent|%|euro|€|mb|gb|kb|kilometer|km)\b/i;
var VERGLEICHSOPERATOR = /(mindestens|h(ö|oe)chstens|maximal|minimal|genau|weniger als|mehr als|unter|über|ueber)\b|[<>]=?|(?<![a-zA-Z])=(?![a-zA-Z])/i;
function pruefeMessbarkeit(text) {
  if (ZAHL_MIT_EINHEIT.test(text) || VERGLEICHSOPERATOR.test(text)) {
    return { pruefung: "messbares Abnahmekriterium", zustand: "erfuellt" };
  }
  return { pruefung: "messbares Abnahmekriterium", zustand: "verletzt", details: "keine Zahl mit Einheit und kein Vergleichsoperator gefunden" };
}
function findeWortstamm(text, wort) {
  return new RegExp(`\\b${maskiere(wort)}\\w*`, "i").test(text);
}
function pruefeUnschaerfe(text, unschaerfe) {
  const verstoss = unschaerfe.find((w) => w.stufe === "verstoss" && findeWortstamm(text, w.wort));
  if (verstoss) {
    return { pruefung: "kein Unschaerfewort", zustand: "verletzt", details: `Wort: ${verstoss.wort}` };
  }
  const warnung = unschaerfe.find((w) => w.stufe === "warnung" && findeWortstamm(text, w.wort));
  if (warnung) {
    return { pruefung: "kein Unschaerfewort", zustand: "warnung", details: `Wort: ${warnung.wort}` };
  }
  return { pruefung: "kein Unschaerfewort", zustand: "erfuellt" };
}
function pruefeTechnologie(text, technologien) {
  const gefunden = technologien.find((wort) => findeWortstamm(text, wort));
  if (gefunden) {
    return { pruefung: "keine Technologievorgabe", zustand: "warnung", details: `Begriff: ${gefunden}` };
  }
  return { pruefung: "keine Technologievorgabe", zustand: "erfuellt" };
}
function pruefePflichtfelder(text) {
  const hatK = /\bK[123]\b/.test(text);
  const hatEinordnung = /\bS[1-4]\b/.test(text) || /\bPriorit(ä|ae)t\b/i.test(text);
  if (hatK && hatEinordnung) {
    return { pruefung: "Pflichtfelder gefuellt", zustand: "erfuellt" };
  }
  const fehlend = [
    !hatK && "Kritikalitaet (K1 bis K3)",
    !hatEinordnung && "Delegationsstufe (S1 bis S4) oder Prioritaet"
  ].filter(Boolean).join(", ");
  return { pruefung: "Pflichtfelder gefuellt", zustand: "verletzt", details: `fehlt: ${fehlend}` };
}
var RANG = { erfuellt: 0, warnung: 1, verletzt: 2 };
function pruefeAnforderung(text, regelsatz) {
  const pruefungen = [
    pruefeModalverb(text),
    pruefeAkteur(text, regelsatz.rollen),
    pruefeMessbarkeit(text),
    pruefeUnschaerfe(text, regelsatz.unschaerfe),
    pruefeTechnologie(text, regelsatz.technologien),
    pruefePflichtfelder(text)
  ];
  const gesamt = pruefungen.reduce((schlechtester, p) => RANG[p.zustand] > RANG[schlechtester] ? p.zustand : schlechtester, "erfuellt");
  return { gesamt, pruefungen };
}
function pruefeAnforderungMitRegelsatz(text, eigeneRollen = []) {
  return pruefeAnforderung(text, {
    rollen: [...GUETE_ROLLEN, ...eigeneRollen],
    unschaerfe: GUETE_UNSCHAERFE,
    technologien: [...GUETE_TECHNOLOGIEN]
  });
}

// src/gemeinsam/meldung.ts
function formatiereBefund(felder) {
  const basis = `Verstoss gegen \`${felder.regelsatzdatei}\`, ${felder.regel}`;
  return felder.fundort ? `${basis} (${felder.fundort})` : basis;
}

// src/konsole/guete.ts
var gueteBefehl = {
  name: "guete",
  hilfe() {
    console.log("attesta guete <Pfad>");
    console.log("  Eingabe:  Pfad zu einer Datei im Repository");
    console.log("  Ausgabe:  Gueteliste je Pruefung, Rueckgabewert 0 ohne Befund, 1 bei Befund");
  },
  fuehreAus(argv) {
    const pfad = argv[0];
    if (!pfad) {
      throw new KonsoleFehler("Aufruf: attesta guete <Pfad>", 2);
    }
    if (!(0, import_node_fs4.existsSync)(pfad)) {
      throw new KonsoleFehler(`Pfad nicht gefunden: ${pfad}`, 2);
    }
    const text = (0, import_node_fs4.readFileSync)(pfad, "utf-8");
    const eigene = leseEigeneRollen(process.cwd());
    for (const befund of eigene.befunde) console.log(`Hinweis: ${befund}`);
    const ergebnis = pruefeAnforderungMitRegelsatz(text, eigene.rollen);
    let befundGefunden = false;
    for (const pruefung of ergebnis.pruefungen) {
      if (pruefung.zustand === "erfuellt") continue;
      befundGefunden = true;
      const regel = pruefung.details ? `${pruefung.pruefung}: ${pruefung.details}` : pruefung.pruefung;
      console.log(formatiereBefund({ regelsatzdatei: pfad, regel }));
    }
    if (!befundGefunden) {
      console.log(`${pfad}: sechs Pruefungen ohne Befund`);
    }
    return befundGefunden ? 1 : 0;
  }
};

// src/gemeinsam/ursachen.generated.ts
var URSACHEN = [
  {
    "kennung": "klarheit",
    "label": "Klarheit",
    "beschreibung": "Das Abnahmekriterium war nie messbar formuliert"
  },
  {
    "kennung": "komplexitaet",
    "label": "Komplexitaet",
    "beschreibung": "Umfang oder Werkzeug haben die Aufgabe unterschaetzt"
  },
  {
    "kennung": "koennen",
    "label": "Koennen",
    "beschreibung": "Fachwissen oder eine Vorlage fehlten"
  },
  {
    "kennung": "kontrolle",
    "label": "Kontrolle",
    "beschreibung": "Niemand hat frueh genug geprueft, bis das Gate lief"
  },
  {
    "kennung": "konsequenz",
    "label": "Konsequenz",
    "beschreibung": "Der Verstoss blieb wiederholt folgenlos, die Regel wurde nicht durchgesetzt"
  },
  {
    "kennung": "wollen",
    "label": "Wollen",
    "beschreibung": "Der Mensch wusste es und hat es unterlassen",
    "nur_reviewer": true
  },
  {
    "kennung": "werkzeugfehler",
    "label": "Werkzeugfehler",
    "beschreibung": "Das Gate wurde zu Unrecht rot, kein tatsaechlicher Verstoss"
  }
];

// src/gemeinsam/delegationsreife.generated.ts
var REIFE_HISTORIE = {
  "arbeitspakete_in_folge": 10,
  "ohne_notfall": true,
  "ohne_werkzeugfehler": true
};

// src/gemeinsam/delegationsreife.ts
function bestimmeDelegationsreife(b) {
  const fehlend = [];
  if (!b.stufe1.profilVorhanden) fehlend.push("Profil (attesta/profil/)");
  if (!b.stufe1.issueFormularVorhanden) fehlend.push("Issue-Formular (.github/ISSUE_TEMPLATE/arbeitspaket.yml)");
  const stufe1 = b.stufe1.profilVorhanden && b.stufe1.issueFormularVorhanden;
  if (!b.stufe2.pruefungenVerbindlich) fehlend.push("verbindliche Pruefungen (Indiz aus PR-Historie)");
  if (!b.stufe2.vierAugenBelegt) fehlend.push("belegte Vier-Augen-Freigabe");
  if (!b.stufe2.keinSelbstMerge) fehlend.push("kein Selbst-Merge");
  const stufe2 = stufe1 && b.stufe2.pruefungenVerbindlich && b.stufe2.vierAugenBelegt && b.stufe2.keinSelbstMerge;
  if (!b.stufe3.leitplankenMaschinenlesbar) fehlend.push("maschinenlesbare Leitplanken");
  if (!b.stufe3.gate3Durchlaufen) fehlend.push("durchlaufenes Gate 3 (Selbstauskunft ueber /attesta gate3 bestanden <Begruendung>)");
  const stufe3 = stufe2 && b.stufe3.leitplankenMaschinenlesbar && b.stufe3.gate3Durchlaufen;
  if (!b.stufe4.historieNachgewiesen) {
    fehlend.push(`belegte Historie (${REIFE_HISTORIE.arbeitspakete_in_folge} Arbeitspakete in Folge ohne Notfall und ohne Werkzeugfehler)`);
  }
  const stufe4 = stufe3 && b.stufe4.historieNachgewiesen;
  const stufe = stufe4 ? 4 : stufe3 ? 3 : stufe2 ? 2 : 1;
  return { stufe, fehlend };
}

// src/gemeinsam/kennzahlen.ts
var KENNZAHLEN_FORMELVERSION = "1.0.0";
function erzeugeKennzahlenDatensatz(params) {
  const ursachenverteilung = {};
  for (const ursache of URSACHEN) {
    ursachenverteilung[ursache.kennung] = params.ursachen.filter((eintrag) => eintrag.wert === ursache.kennung).length;
  }
  const { stufe } = bestimmeDelegationsreife(params.stufenBedingungen);
  return {
    betriebskennung: params.betriebskennung,
    formelversion: KENNZAHLEN_FORMELVERSION,
    arbeitspakete: params.ursachen.length,
    erstdurchlauf_je_stufe: { S1: 0, S2: 0, S3: 0, S4: 0 },
    ursachenverteilung,
    nachweisgrad: 0,
    delegationsreife: stufe,
    notfaelle: params.notfaelle.length
  };
}

// src/konsole/kennzahlen-lokal.ts
var import_node_fs5 = require("node:fs");
var import_node_path2 = require("node:path");
function leseYamlVerzeichnis(pfad) {
  if (!(0, import_node_fs5.existsSync)(pfad)) return [];
  const ergebnisse = [];
  for (const datei of (0, import_node_fs5.readdirSync)(pfad)) {
    if (!datei.endsWith(".yaml") && !datei.endsWith(".yml")) continue;
    const geparst = load((0, import_node_fs5.readFileSync)((0, import_node_path2.join)(pfad, datei), "utf-8"));
    if (geparst && typeof geparst === "object") ergebnisse.push(geparst);
  }
  return ergebnisse;
}
function liesUrsachenLokal(wurzel) {
  return leseYamlVerzeichnis((0, import_node_path2.join)(wurzel, "attesta", "ursachen"));
}
function liesNotfaelleLokal(wurzel) {
  return leseYamlVerzeichnis((0, import_node_path2.join)(wurzel, "attesta", "notfaelle"));
}
function liesBetriebskennung(wurzel) {
  const pfad = (0, import_node_path2.join)(wurzel, "attesta", "betriebskennung");
  return (0, import_node_fs5.existsSync)(pfad) ? (0, import_node_fs5.readFileSync)(pfad, "utf-8").trim() || void 0 : void 0;
}
function ermittleStufenBedingungenLokal(wurzel) {
  const existiert = (relativerPfad) => (0, import_node_fs5.existsSync)((0, import_node_path2.join)(wurzel, relativerPfad));
  return {
    stufe1: {
      profilVorhanden: existiert("attesta/profil.lock"),
      issueFormularVorhanden: existiert(".github/ISSUE_TEMPLATE/arbeitspaket.yml")
    },
    stufe2: { pruefungenVerbindlich: false, vierAugenBelegt: false, keinSelbstMerge: false },
    stufe3: {
      leitplankenMaschinenlesbar: existiert(".github/workflows") && (existiert("CLAUDE.md") || existiert("AGENTS.md")),
      gate3Durchlaufen: existiert("attesta/gates/p3-bestanden.yaml")
    },
    stufe4: { historieNachgewiesen: false }
  };
}

// src/konsole/kennzahlen.ts
var kennzahlenBefehl = {
  name: "kennzahlen",
  hilfe() {
    console.log("attesta kennzahlen --probe");
    console.log("  Eingabe:  keine");
    console.log("  Ausgabe:  Datensatz im Klartext, sendet nichts");
  },
  fuehreAus(argv) {
    if (!argv.includes("--probe")) {
      console.log("attesta kennzahlen: nur --probe ist unterstuetzt. Echter Versand (REQ-39 bis REQ-41) ist gesperrt, siehe D2-13.");
      return 0;
    }
    const wurzel = process.cwd();
    const betriebskennung = liesBetriebskennung(wurzel);
    if (!betriebskennung) {
      throw new KonsoleFehler("Profil fehlt. Erst attesta init ausfuehren.", 2);
    }
    const datensatz = erzeugeKennzahlenDatensatz({
      betriebskennung,
      ursachen: liesUrsachenLokal(wurzel),
      notfaelle: liesNotfaelleLokal(wurzel),
      stufenBedingungen: ermittleStufenBedingungenLokal(wurzel)
    });
    console.log(dump(datensatz, { lineWidth: -1, noRefs: true }));
    console.log("Nichts gesendet. Echter Versand ist gesperrt, siehe D2-13.");
    return 0;
  }
};

// src/konsole/index.ts
var BEFEHLE = [initBefehl, pruefenBefehl, gueteBefehl, kennzahlenBefehl];
function findeBefehl(name) {
  return BEFEHLE.find((b) => b.name === name);
}
function fuehreAus(argv) {
  const [name, ...rest] = argv;
  const befehl = findeBefehl(name);
  if (!befehl) {
    console.error(`Unbekannter Befehl. Verfuegbar: ${BEFEHLE.map((b) => b.name).join(", ")}`);
    return 2;
  }
  if (rest.includes("--help")) {
    befehl.hilfe();
    return 0;
  }
  return befehl.fuehreAus(rest);
}
function fuehreAusMitFehlerbehandlung(argv) {
  try {
    return fuehreAus(argv);
  } catch (e) {
    if (e instanceof KonsoleFehler) {
      console.error(`Befund: ${e.message}`);
      return e.rueckgabewert;
    }
    throw e;
  }
}

// src/konsole/cli.ts
process.exitCode = fuehreAusMitFehlerbehandlung(process.argv.slice(2));

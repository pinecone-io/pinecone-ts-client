// openapi-generator's typescript-fetch generator (v7.0.0) mishandles an object
// schema that pairs `properties` with an `anyOf`/`oneOf` used purely to
// constrain those properties, e.g. "at least one of `embed`, `sparse_embed`,
// or `full_text_search` is required". It treats the schema as composed and
// stops generating its inline members: a property's inline enum is referenced
// but never emitted (`Cannot find name 'StringFieldTypeEnum'`), and inline
// object properties collapse to `object`. The upstream normalizer rule meant
// for this, REMOVE_ANYOF_ONEOF_AND_KEEP_PROPERTIES_ONLY, has no effect on these
// schemas in v7.0.0. A sibling `not` is stripped too: once the `anyOf` is gone
// the generator would otherwise emit it as an empty, unused model.
//
// Such branches carry no type information a generated interface can express,
// so drop them from a copy of the spec before generation. The API still
// enforces them. A branch only counts as a constraint when it declares no
// type, `$ref`, or `allOf`, and only refines properties the parent already
// declares; any branch that could change the generated type is left alone.
//
// Usage: node codegen/strip-validation-only-composition.mjs <input> <output>
import { readFileSync, writeFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';

const COMPOSITION_KEYWORDS = ['anyOf', 'oneOf'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isConstraintOnly(branch, propertyNames) {
  if (!isPlainObject(branch)) return false;
  if ('$ref' in branch || 'type' in branch || 'allOf' in branch) return false;
  if (
    branch.properties &&
    !Object.keys(branch.properties).every((name) => propertyNames.has(name))
  ) {
    return false;
  }
  if (branch.not && !isConstraintOnly(branch.not, propertyNames)) return false;
  return COMPOSITION_KEYWORDS.every(
    (keyword) =>
      !branch[keyword] ||
      branch[keyword].every((nested) => isConstraintOnly(nested, propertyNames)),
  );
}

function strip(node, path, stripped) {
  if (Array.isArray(node)) {
    node.forEach((item, index) => strip(item, `${path}/${index}`, stripped));
    return;
  }
  if (!isPlainObject(node)) return;

  if (isPlainObject(node.properties)) {
    const propertyNames = new Set(Object.keys(node.properties));
    for (const keyword of COMPOSITION_KEYWORDS) {
      if (
        Array.isArray(node[keyword]) &&
        node[keyword].every((branch) => isConstraintOnly(branch, propertyNames))
      ) {
        delete node[keyword];
        stripped.push(`${path}/${keyword}`);
      }
    }
    if (node.not && isConstraintOnly(node.not, propertyNames)) {
      delete node.not;
      stripped.push(`${path}/not`);
    }
  }

  for (const [key, value] of Object.entries(node)) {
    strip(value, `${path}/${key}`, stripped);
  }
}

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error(
    'Usage: node codegen/strip-validation-only-composition.mjs <input> <output>',
  );
  process.exit(1);
}

const spec = parse(readFileSync(input, 'utf8'));
const stripped = [];
strip(spec, '#', stripped);
writeFileSync(output, stringify(spec));
for (const path of stripped) {
  console.log(`Stripped validation-only ${path}`);
}

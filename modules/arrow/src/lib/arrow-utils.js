// import {deduceTableSchema} from '@loaders.gl/core';

import {
  Schema,
  // DataType,
  // Bool,
  // Int8, Int16, Int32, Int64, Uint8, Uint16, Uint32,
  Float32
  // Float64,
  // Utf8,

  // Table,
  // FloatVector,
  // DateVector
  // Utf8Vector,
  // RecordBatch,
  // RecordBatchStreamWriter
} from 'apache-arrow';

// Deduce a standard loaders.gl table schema from an arrow table
export function deduceArrowTableSchema(arrowTable) {
  const schema = {};
  arrowTable.schema.fields.forEach(field => {});
  return schema;
}

const TABLE_SCHEMA_TO_ARROW_VECTOR_TYPE_MAP = [
  // [Boolean, Bool],
  // [Uint8Array, Uint8],
  // [Int8Array, Int8],
  // [Int32Array, Int32],
  // [Float32Array, Float32,],
  [Float32Array, Float32],
  [Date, Float32]
];

let arrowVectorTypeMap = null;

function getArrowVectorType(schemaType) {
  arrowVectorTypeMap = arrowVectorTypeMap || new Map(TABLE_SCHEMA_TO_ARROW_VECTOR_TYPE_MAP);
  const ArrowVectorType = arrowVectorTypeMap.get(schemaType);
  return ArrowVectorType;
}

export function createArrowSchema(schema) {
  const vectors = [];
  const names = [];
  for (const key in schema) {
    vectors.push({type: getArrowVectorType(schema[key])});
    names.push(key);
  }
  return Schema.from(vectors, names);
}

export function createArrowTable(schema) {}

export function convertArrowTableToColumns(arrowTable, options) {
  // Extract columns

  // TODO - avoid calling `getColumn` on columns we are not interested in?
  // Add options object?
  const columnarTable = {};

  arrowTable.schema.fields.forEach(field => {
    // This (is intended to) coalesce all record batches into a single typed array
    const arrowColumn = arrowTable.getColumn(field.name);
    const values = arrowColumn.toArray();
    columnarTable[field.name] = values;
  });

  return columnarTable;
}

// function convertTableToArrow(table, options = {}) {
//   const schema = deduceTableSchema(table, options.schema);

//   const rainfall = Table.new(
//     [FloatVector.from(rainAmounts), DateVector.from(rainDates)],
//     ['precipitation', 'date']
//   );
// }

// function encodeArrowAsString(table, options) {
//   return table.toString();
// }

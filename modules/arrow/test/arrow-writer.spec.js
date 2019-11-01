/* eslint-disable */
import test from 'tape-promise/tape';

import {
  Schema,
  DataType,
  Table,
  RecordBatch,
  Utf8Vector,
  FloatVector,
  RecordBatchStreamWriter
} from 'apache-arrow';

import {Iterable} from 'ix';

import {parseFileSync} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';

function* demoData(batchLen = 10, numBatches = 5) {
  let schema;
  for (let i = -1; ++i < numBatches; ) {
    const strings = new Array(batchLen).fill(`abcdefghijklmnopqrstuvwxyz0123456789_`);
    const numbers = new Float32Array(batchLen);
    const columns = [Utf8Vector.from(strings), FloatVector.from(numbers)];
    schema = schema || new Schema(columns, ['strings', 'floats']);
    yield new RecordBatch(schema, batchLen, columns);
  }
}

/*
test('Write demo data', t => {
  const wstream = new WritableMemoryStream('foo');

  wstream.on('finish', () => {
    const buffer = wstream.getBuffer();

    const typedArray = new Uint8Array(buffer);
    const arrayBuffer = typedArray.buffer;

    t.comment(`Buffer length = ${arrayBuffer.byteLength}`);

    const table = Table.from([new Uint8Array(arrayBuffer)]);
    t.comment(`Buffer="${JSON.stringify(table, null, 1)}"`);

    const columns = parseFileSync(arrayBuffer, 'dictionary.arrow', ArrowLoader);
    t.comment(`Columns="${JSON.stringify(columns, null, 1)}"`);
    t.end();
  });

  RecordBatchStreamWriter.writeAll(demoData()).pipe(wstream);
  // console.log(Table.from(res.body)); // Table<{ strings: Utf8, floats: Float32 }>
});

// Creates a new arrow table with averages of all float columns from the input table
function getAverageFloatColsTable(table) {
  const floatFields = table.schema.fields.filter(DataType.isFloat);
  const names = floatFields.map(field => `${field.name}_avg`);
  const averages = floatFields
    .map(field => table.getColumn(field.name))
    .map(column => Iterable.from(column).average())
    .map(avg => FloatVector.from(new Float32Array([avg])));
  return new Table(RecordBatch.from(averages, names));
}

test('Transform and encode', t => {
  const inputTable = parseFileSync();
  const averageTable = getAverageFloatColsTable(table);
  encodeFileSync();
  // console.log(Table.from(res.body)); // Table<{ floats_avg: Float32 }>
  t.end();
});

/*
// Receive Arrow RecordBatch streams
const { AsyncIterable } = require('ix');
const { createWriteStream } = require('fs');
const eos = require('util').promisify(require('stream').finished);

fastify.post(`/update`, (request, reply) => {
  request.recordBatches()
    .map((recordBatches) => eos(recordBatches
      .pipe(createWriteStream('./new_data.arrow'))))
    .map(() => 'ok').catch(() => AsyncIterable.of('fail'))
    .pipe(reply.type('application/octet-stream').stream());
});

(async () => {
  const res = await fastfiy.inject({
    url: '/update', method: `POST`, headers: {
      'accepts':  `text/plain; charset=utf-8`,
      'content-type':  `application/octet-stream`
    },
    payload: RecordBatchStreamWriter.writeAll(demoData()).toNodeStream()
  });
  console.log(res.body); // 'ok' | 'fail'
})();

// Send and receive Arrow RecordBatch streams
fastify.post(`/avg_floats`, (request, reply) => {
  request.recordBatches()
    .map((recordBatches) => averageFloatCols(Table.from(recordBatches)))
    .pipe(RecordBatchStreamWriter.throughNode({ autoDestroy: false }))
    .pipe(reply.type('application/octet-stream').stream());
});

(async () => {
  const writer = RecordBatchStreamWriter.writeAll(demoData());
  const averages = await fastfiy.inject({
    url: '/avg_floats', method: `POST`,
    payload: writer.toNodeStream(),
    headers: {
      'accepts':  `application/octet-stream`,
      'content-type':  `application/octet-stream`
    },
  });
  console.log(Table.from(res.body)); // Table<{ floats_avg: Float32 }>
})();
*/

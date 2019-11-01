import test from 'tape-promise/tape';
// import {deduceTableSchema} from '@loaders.gl/core';
import {createArrowSchema} from '@loaders.gl/arrow/lib/arrow-utils';

test('ArrowLoader#createArrowSchema', async t => {
  const schema = {
    value: Float32Array,
    date: Date
  };

  const arrowSchema = createArrowSchema(schema);

  // Check loader specific results
  t.ok(arrowSchema.fields, 'schema.fields available');
  t.end();
});

test('ArrowLoader#createArrowTable', async t => {
  const schema = {
    value: Float32Array,
    date: Date
  };

  const arrowSchema = createArrowSchema(schema);

  // Check loader specific results
  t.ok(arrowSchema.fields, 'schema.fields available');
  t.end();
});

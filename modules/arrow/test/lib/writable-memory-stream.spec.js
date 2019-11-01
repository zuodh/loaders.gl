import test from 'tape-promise/tape';
import WritableMemoryStream from '@loaders.gl/arrow/lib/writable-memory-stream';

test('WritableMemoryStream#on(\'finish\')', t => {
  // Trying our stream out
  const stream = new WritableMemoryStream('foo');

  stream.on('finish', () => {
    const value = stream.getBuffer().toString();
    t.equal(value, 'hello world', 'Stream finished with correct memory contents');
    t.end();
  });

  stream.write('hello ');
  stream.write('world');
  stream.end();
});

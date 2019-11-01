/* global Buffer */
import {Writable} from 'stream';
// import util from 'util';

export default class WritableMemoryStream extends Writable {
  constructor(options = {}) {
    super(options);
    this.buffer = new Buffer(''); // empty
  }

  getBuffer() {
    return this.buffer;
  }

  // TODO - is this efficient?
  _write(chunk, enc, cb) {
    // our memory store stores things in buffers
    const buffer = Buffer.isBuffer(chunk)
      ? chunk // already is Buffer use it
      : new Buffer(chunk, enc); // string, convert

    // concat to the buffer already there
    this.buffer = Buffer.concat([this.buffer, buffer]);
    cb();
  }
}

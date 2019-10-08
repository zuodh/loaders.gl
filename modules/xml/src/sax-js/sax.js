import {default as SAXParser} from './sax-parser';
import {default as SAXStream} from './sax-stream';

export * from './constants';

export {default as SAXParser} from './sax-parser';
export {default as SAXStream} from './sax-stream';

export function parser(strict, opt) {
  return new SAXParser(strict, opt);
}

export function createStream (strict, opt) {
  return new SAXStream(strict, opt)
}

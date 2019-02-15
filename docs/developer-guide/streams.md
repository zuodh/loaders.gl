# Streams

Working with streams in JavaScript is somewhat complicated because there are two partially incompatible versions (Node.js and DOM/whatwg streams), however it is possible to smooth over the differences and write portable code. At the moment.

## Streams and AsyncIterators

Note that since AsyncIterables are part of JavaScript now (ES2018), they're really the lowest-common-denominator streaming primitive. Because of this generality, loaders.gl uses only AsyncIterables (and Iterables when synchronous processing is possible) in its internal processing and conversion to from streams is done on the edge.

In this sense, AsyncIterable<T> is a superset of both node and whatwg streams. a ReadableStream in node is just an `AsyncIterable<Buffer>` or `AsyncIterable<string>`

And Node.js streams now implement the `[Symbol.asyncIterator]()` method so you can do `for await (const buf of fs.createReadStream('foo.txt')) {}` (instead of registering callbacks on the stream).

DOM/whatwg streams are supposed to eventually support that, but the standardization process is somewhat slow going, so you may have to use utilities/polyfills in the mean time.


## Converting from Node to DOM Streams

* [web-stream-tools](https://www.npmjs.com/package/web-stream-tools) - A great little DOM streams utility library. Utility functions for WhatWG Streams


## Polyfills

Stream support across browsers can be somewhat improved with polyfills. TBA

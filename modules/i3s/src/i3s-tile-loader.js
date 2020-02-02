import {parseI3SNodeGeometry} from './lib/parsers/parse-i3s-node-geometry';

/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

async function parse(arrayBuffer, options, context, loader) {
  const tile = {
    ...options.node,
    ...options.nodeInTree,
    featureData: options.featureData
  };
  const byteOffset = options.byteOffset;
  await parseI3SNodeGeometry(arrayBuffer, byteOffset, options, context, tile);
  return tile;
}

export default {
  id: 'i3s',
  name: 'i3s',
  version: VERSION,
  extensions: ['i3s'],
  mimeType: 'application/octet-stream',
  // test: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  parse,
  binary: true,
  options: {
    i3s: {}
  }
};

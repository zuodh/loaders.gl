import parseBasis from './lib/parse-basis';

/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const BasisWorkerLoader = {
  id: 'basis',
  name: 'Basis',
  version: VERSION,
  extensions: ['basis'],
  test: 'sB',
  mimeType: 'application/octet-stream',
  binary: true,
  options: {
    basis: {
      format: 'rgb565', // TODO: auto...
      libraryPath: `libs/`
      // workerUrl: `https://unpkg.com/@loaders.gl/basis@${VERSION}/dist/basis-loader.worker.js`
    }
  }
};

export const BasisLoader = {
  ...BasisWorkerLoader,
  parse: parseBasis
};

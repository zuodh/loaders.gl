import test from 'tape-promise/tape';

import {ImageLoader, isImageTypeSupported, getImageType, getImageData} from '@loaders.gl/images';
import {isBrowser, load} from '@loaders.gl/core';

import {TEST_CASES, IMAGE_URL, IMAGE_DATA_URL} from './lib/test-cases';

const TYPES = ['auto', 'imagebitmap', 'image', 'data'].filter(isImageTypeSupported);

test('image loaders#imports', t => {
  t.ok(ImageLoader, 'ImageLoader defined');
  t.end();
});

test('ImageLoader#load(URL)', async t => {
  for (const type of TYPES) {
    const image = await load(IMAGE_URL, ImageLoader, {image: {type}});
    t.ok(image, 'image loaded successfully from URL');
  }
  t.end();
});

test('ImageLoader#load(data URL)', async t => {
  for (const type of TYPES) {
    const image = await load(IMAGE_DATA_URL, ImageLoader, {image: {type}});
    t.ok(image, 'image loaded successfully from data URL');

    t.deepEquals(image.width, 2, 'image width is correct');
    t.deepEquals(image.height, 2, 'image height is correct');
    if (!isBrowser) {
      t.ok(ArrayBuffer.isView(image.data), 'image data is `ArrayBuffer`');
      t.equals(image.data.byteLength, 16, 'image `data.byteLength` is correct');
    }
  }
  t.end();
});

test(`ImageLoader#load({type: 'data'})`, async t => {
  for (const testCase of TEST_CASES) {
    const {title, url, width, height, skip} = testCase;

    // Skip some test case under Node.js
    if (skip) {
      return;
    }

    const imageData = await load(url, ImageLoader, {image: {type: 'data'}});
    t.equal(getImageType(imageData), 'data', `${title} image type is data`);
    t.equal(getImageData(imageData), imageData, `${title} getImageData() works`);
    t.equal(imageData.width, width, `${title} image has correct width`);
    t.equal(imageData.height, height, `${title} image has correct height`);
  }

  t.end();
});

/*
test('loadImage#worker', t => {
  if (typeof Worker === 'undefined') {
    t.comment('loadImage only works under browser');
    t.end();
    return;
  }

  const worker = new LoadImageWorker();
  let testIndex = 0;

  const runTest = index => {
    const testCase = TEST_CASES[index];
    if (!testCase) {
      t.end();
      return;
    }
    if (testCase.worker === false) {
      // the current loader does not support loading from dataURL in a worker
      runTest(testIndex++);
      return;
    }

    const {title, width, height} = testCase;
    t.comment(title);

    let {url} = testCase;
    url = url.startsWith('data:') ? url : resolvePath(CONTENT_BASE + url);

    worker.onmessage = ({data}) => {
      if (data.error) {
        t.fail(data.error);
      } else {
        t.ok(data.image, 'loadImage loaded data from url');
        t.ok(
          data.image.width === width && data.image.height === height,
          'loaded image has correct content'
        );
      }

      runTest(testIndex++);
    };

    worker.postMessage(url);
  };

  runTest(testIndex++);
});
*/

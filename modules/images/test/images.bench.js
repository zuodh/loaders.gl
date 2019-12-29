import {ImageLoader, isImageTypeSupported} from '@loaders.gl/images';
import {fetchFile, parse} from '@loaders.gl/core';

const TEST_URL = '@loaders.gl/images/test/data/img1-preview.png';

export default async function imageLoaderBench(suite) {
  suite.group('ImageLoader - parsing');

  const response = await fetchFile(TEST_URL);
  const arrayBuffer = await response.arrayBuffer();

  for (const type of ['image', 'imagebitmap', 'data']) {
    if (isImageTypeSupported(type)) {
      suite.addAsync(`parse(ImageLoader, type=${type})`, async () => {
        return await parse(arrayBuffer, ImageLoader, {image: {type}});
      });
    }
  }

  for (const type of ['image', 'imagebitmap', 'data']) {
    if (isImageTypeSupported(type)) {
      suite.addAsync(`parse(ImageLoader, type=${type}, data=true)`, async () => {
        return await parse(arrayBuffer, ImageLoader, {image: {type, data: true}});
      });
    }
  }
}

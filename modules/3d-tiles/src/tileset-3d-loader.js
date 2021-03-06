/* global TextDecoder */
export default {
  id: '3d-tileset',
  name: '3D Tileset',
  extensions: ['json'],
  parse: async arrayBuffer => JSON.parse(new TextDecoder().decode(arrayBuffer)),
  parseTextSync: JSON.parse,
  testText: text => text.indexOf('asset' >= 0)
};

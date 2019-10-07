/* global Cesium */

Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4Y2RlNjczZi02MThlLTQxNGQtYmIxZC0wNjFiOWFhNDY2MzEiLCJpZCI6OTYxOSwic2NvcGVzIjpbImFzciIsImdjIl0sImlhdCI6MTU1NDQ4ODE1OH0.XIVcgLjGcA1HkJlUL-HMaiQfCoaSOrMPmnR7i1ScTyI';

const viewer = new Cesium.Viewer('cesiumContainer');

const tileset = viewer.scene.primitives.add(
    new Cesium.Cesium3DTileset({
      url:
          'https://raw.githubusercontent.com/uber-common/deck.gl-data/master/3d-tiles/555Market/tileset.json'
    })
);

viewer.zoomTo(tileset);

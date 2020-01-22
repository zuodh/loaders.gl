/* global fetch */

import {COORDINATE_SYSTEM, CompositeLayer} from '@deck.gl/core';
import {PointCloudLayer} from '@deck.gl/layers';
import {ScenegraphLayer, SimpleMeshLayer} from '@deck.gl/mesh-layers';
import GL from '@luma.gl/constants';
import {Tileset3DLoader} from '@loaders.gl/3d-tiles';

// Question: IonLoader or options
const defaultProps = {
  getPointColor: [0, 0, 0],
  pointSize: 1.0,

  data: null,
  loader: Tileset3DLoader, // TilesetIonLoader, I3SLoader,
  loaderOptions: {
  },
  loadOptions: {throttleRequests: true},

  onTilesetLoad: tileset3d => {},
  onTileLoad: tileHeader => {},
  onTileUnload: tileHeader => {},
  onTileError: (tile, message, url) => {}
};

export default class Tile3DLayer extends CompositeLayer {
  initializeState() {
    this.state = {
      layerMap: {},
      tileset3d: null
    };
  }

  shouldUpdateState({changeFlags}) {
    return changeFlags.somethingChanged;
  }

  updateState({props, oldProps, changeFlags}) {
    if (props.data && props.data !== oldProps.data) {
      this._loadTileset(props.data);
    }

    if (changeFlags.viewportChanged) {
      const {tileset3d} = this.state;
      this._updateTileset(tileset3d);
    }
  }

  async _loadTileset(tilesetUrl) {
    // loader: IonLoader, Tile3DLoader, I3SLoader
    // output: Tilset3D object
    const loader = this.props.loader;
    const tileset3d = load(tilesetUrl, loader, {
      // ion paramters
    });

    this.setState({
      tileset3d,
      layerMap: {}
    });

    if (tileset3d) {
      this._updateTileset(tileset3d);
      this.props.onTilesetLoad(tileset3d);
    }
  }

  _updateTileset(tileset3d) {
    const {viewport} = this.context;
    if (!viewport || !tileset3d) {
      return;
    }

    this._frameNumber = tileset3d.update(viewport);
  }

  _create3DTileLayer(tileHeader) {
    if (!tileHeader.layerType) {
      return null;
    }

    switch (tileHeader.layerType) {
      case 'pointcloud':
        return this._createPointCloudTileLayer(tileHeader);
      case 'scenegraph':
        return this._create3DModelTileLayer(tileHeader);
      case 'simplemesh':
        return this._createSimpleMeshLayer(tileHeader);
      default:
        throw new Error(`Tile3DLayer: Failed to render layer of type ${tileHeader.content.type}`);
    }
  }

  _createSimpleMeshLayer(tileHeader) {
    const content = tileHeader.content;
    const {attributes, matrix, cartographicOrigin, texture} = content;
    const positions = new Float32Array(attributes.position.value.length);
    for (let i = 0; i < positions.length; i += 3) {
      scratchOffset.copy(matrix.transform(attributes.position.value.subarray(i, i + 3)));
      positions.set(scratchOffset, i);
    }

    const SubLayerClass = this.getSubLayerClass('mesh', SimpleMeshLayer);

    const geometry = new Geometry({
      drawMode: GL.TRIANGLES,
      attributes: {
        positions,
        normals: attributes.normal,
        texCoords: attributes.uv0
      }
    });

    return new SubLayerClass({
      id: `mesh-layer-${tileHeader.id}`,
      mesh: geometry,
      data: [{}],
      getPosition: [0, 0, 0],
      getColor: [255, 255, 255],
      texture,
      coordinateOrigin: cartographicOrigin,
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
    });
  }

  // - id
  // - renderState
  //   - selected
  //   - unloaded
  // - content
  //   -

  _create3DModelTileLayer(tileHeader) {
    // const {gltf, instances, modelMatrix, cartographicOrigin} = tileHeader.content;
    // const {attributes, pointCount, constantRGBA, modelMatrix, cartographicOrigin} = tileHeader.content;
    // const {attributes, texture, modelMatrix, cartographicOrigin} = tileHeader.content;

    // tileHeader
    // layer specific
    // - layerProps

    const SubLayerClass = this.getSubLayerClass('scenegraph', ScenegraphLayer);

    return new SubLayerClass(
      {
        _lighting: 'pbr'
      },
      this.getSubLayerProps({
        id: 'scenegraph'
      }),
      {
        id: `${this.id}-scenegraph-${tileHeader.id}`,
        data: instances || [{}],
        scenegraph: gltf,

        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        coordinateOrigin,
        modelMatrix,
        getTransformMatrix: instance => instance.modelMatrix,
        getPosition: instance => [0, 0, 0]
      }
    );
  }

  _createPointCloudTileLayer(tileHeader) {
    const {
      attributes,
      pointCount,
      constantRGBA,
      cartographicOrigin,
      modelMatrix
    } = tileHeader.content;
    const {positions, normals, colors} = attributes;

    if (!positions) {
      return null;
    }

    const {pointSize, getPointColor} = this.props;
    const SubLayerClass = this.getSubLayerClass('pointcloud', PointCloudLayer);

    return new SubLayerClass(
      {
        pointSize
      },
      this.getSubLayerProps({
        id: 'pointcloud'
      }),
      {
        id: `${this.id}-pointcloud-${tileHeader.id}`,
        data: {
          header: {
            vertexCount: pointCount
          },
          attributes: {
            POSITION: positions,
            NORMAL: normals,
            COLOR_0: colors
          }
        },
        coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS,
        coordinateOrigin: cartographicOrigin,
        modelMatrix,

        getColor: constantRGBA || getPointColor
      }
    );
  }

  _updateLayer(tile) {
    const {layerMap} = this.state;
    let layer = layerMap[tile.id];

    // selected tile
    if (tile.selectedFrame === this._frameNumber) {
      if (layer && layer.props && !layer.props.visible) {
        // Still has GPU resource but visibility is turned off so turn it back on so we can render it.
        layer = layer.clone({visible: true});
        layerMap[tile.id].layer = layer;
      }
      return;
    }

    // unloaded tile
    if (tile.contentUnloaded) {
      delete layerMap[tile.id];
      return;
    }

    // cached but not selected tile
    if (layer && layer.props && layer.props.visible) {
      // Still in tileset cache but doesn't need to render this frame.
      // Keep the GPU resource bound but don't render it.
      layer = layer.clone({visible: false});
      layerMap[tile.id].layer = layer;
    }
  }

  _getLayer(tile) {
    const {layerMap} = this.state;
    if (!layerMap[tile.id]) {
      layerMap[tile.id] = {
        layer: this._create3DTileLayer(tile),
        tile
      };
    }

    return layerMap[tile.id];
  }

  renderLayers() {
    return this.state.tileset3d.selectedTiles.map(tile => {
      const layer = this._getLayer(tile);
      this._updateLayer(tile);
      return layer;
    });
  }
}

Tile3DLayer.layerName = 'Tile3DLayer';
Tile3DLayer.defaultProps = defaultProps;

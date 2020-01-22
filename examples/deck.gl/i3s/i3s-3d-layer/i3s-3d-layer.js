/* global fetch */
import {Vector3} from 'math.gl';

import {COORDINATE_SYSTEM, CompositeLayer, log} from '@deck.gl/core';
import {SimpleMeshLayer} from '@deck.gl/mesh-layers';

import {I3STileset} from '@loaders.gl/i3s';
import {Geometry} from '@luma.gl/core';
import GL from '@luma.gl/constants';

const scratchOffset = new Vector3(0, 0, 0);

const defaultProps = {
  data: null,
  loadOptions: {throttleRequests: true},
  onTilesetLoad: tileset3d => {},
  onTileLoad: tileHeader => {},
  onTileUnload: tileHeader => {}
};

function getRootNodeUrl(tilesetUrl) {
  return `${tilesetUrl}/nodes/root`;
}

export default class Tile3DLayer extends CompositeLayer {
  initializeState() {
    if ('onTileLoadFail' in this.props) {
      log.removed('onTileLoadFail', 'onTileError')();
    }
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
      this._updateTileset(this.state.tileset3d);
    }
  }

  async _loadTileset(tilesetUrl, fetchOptions) {
    const rootNodeUrl = getRootNodeUrl(tilesetUrl);
    const response = await fetch(tilesetUrl, fetchOptions);

    const tilesetJson = await response.json();
    // TODO hack to mathc tile3d object, should move to tileset loader
    tilesetJson.root = await fetch(rootNodeUrl, fetchOptions).then(resp => resp.json());
    tilesetJson.refine = 'REPLACE';

    const tileset3d = new I3STileset(tilesetJson, tilesetUrl, {
      basePath: tilesetUrl,
      onTileLoad: tile => this._onTileLoad(tile),
      onTileUnload: tile => this._onTileUnload(tile)
    });

    this.setState({
      tileset3d,
      layerMap: {}
    });

    if (tileset3d) {
      this.props.onTilesetLoad(tileset3d);
      this._updateTileset(tileset3d);
    }
  }

  _onTileLoad(tile) {
    this._updateTileset(this.state.tileset3d);
    this.props.onTileLoad(tile);
  }

  _onTileUnload(tile) {
    this.props.onTileUnload(tile);
  }

  _updateTileset(tileset3d) {
    const {viewport} = this.context;
    if (!viewport || !tileset3d) {
      return;
    }

    // TODO use a valid frameState
    const frameNumber = tileset3d.update(viewport);
    this._updateLayerMap(frameNumber);
  }

  _updateLayerMap(frameNumber) {
    const {tileset3d, layerMap} = this.state;

    // create layers for new tiles
    const {selectedTiles} = tileset3d;
    if (selectedTiles) {
      const tilesWithoutLayer = Object.values(selectedTiles).filter(
        tile => !layerMap[tile.id] && tile.content
      );

      for (const tile of tilesWithoutLayer) {
        // TODO move it to @loaders.gl/i3s
        tileset3d.addTileToCache(tile);
        layerMap[tile.id] = {
          layer: this._create3DTileLayer(tile),
          tile
        };
      }
    }

    // update layer visibility
    this._selectLayers(frameNumber);
  }

  // Grab only those layers who were selected this frame.
  _selectLayers(frameNumber) {
    const {layerMap} = this.state;
    const layerMapValues = Object.values(layerMap);

    for (const value of layerMapValues) {
      const {tile} = value;
      let {layer} = value;

      if (tile.selectedFrame === frameNumber) {
        if (layer && layer.props && !layer.props.visible) {
          // Still has GPU resource but visibility is turned off so turn it back on so we can render it.
          layer = layer.clone({visible: true});
          layerMap[tile.id].layer = layer;
        }
      } else if (tile.contentUnloaded) {
        // Was cleaned up from tileset cache. We no longer need to track it.
        delete layerMap[tile.id];
      } else if (layer && layer.props && layer.props.visible) {
        // Still in tileset cache but doesn't need to render this frame. Keep the GPU resource bound but don't render it.
        layer = layer.clone({visible: false});
        layerMap[tile.id].layer = layer;
      }
    }

    this.setState({layers: Object.values(layerMap).map(layer => layer.layer)});
  }

  _create3DTileLayer(tile) {
    const content = tile.content;
    const {attributes, modelMatrix, cartographicOrigin, texture} = content;
    const positions = new Float32Array(attributes.positions.value.length);
    for (let i = 0; i < positions.length; i += 3) {
      scratchOffset.copy(modelMatrix.transform(attributes.positions.value.subarray(i, i + 3)));
      positions.set(scratchOffset, i);
    }

    const SubLayerClass = this.getSubLayerClass('mesh', SimpleMeshLayer);

    const geometry = new Geometry({
      drawMode: GL.TRIANGLES,
      attributes: {
        positions,
        normals: attributes.normals,
        texCoords: attributes.texCoords
      }
    });

    return new SubLayerClass({
      id: `mesh-layer-${tile.id}`,
      mesh: geometry,
      data: [{}],
      getPosition: [0, 0, 0],
      getColor: [255, 255, 255],
      texture,
      coordinateOrigin: cartographicOrigin,
      coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS
    });
  }

  renderLayers() {
    return this.state.layers;
  }
}

Tile3DLayer.layerName = 'Tile3DLayer';
Tile3DLayer.defaultProps = defaultProps;

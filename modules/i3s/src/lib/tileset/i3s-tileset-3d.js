import Tileset3DTraverser from './tileset-3d-traverser';
import {parseI3SNodeGeometry} from '../parsers/parse-i3s-node-geometry';

import {TILE3D_CONTENT_STATE} from './i3s-tile-tree';
import RequestScheduler from '../request-utils/request-scheduler';
import {Ellipsoid} from '@math.gl/geospatial';
import {Matrix4} from 'math.gl';
import assert from '@loaders.gl/3d-tiles/src/lib/utils/assert';
import {path} from '@loaders.gl/core';
import {Stats} from 'probe.gl';
import Tileset3DCache from '@loaders.gl/3d-tiles/src/lib/tileset/tileset-3d-cache';

const DEFAULT_OPTIONS = {
  basePath: '',

  ellipsoid: Ellipsoid.WGS84,
  // A 4x4 transformation matrix this transforms the entire tileset.
  modelMatrix: new Matrix4(),

  // Set to true to enable experimental request throttling, for improved performance
  throttleRequests: false,

  // The maximum screen space error used to drive level of detail refinement.
  maximumScreenSpaceError: 16,
  maximumMemoryUsage: 32,

  // default props
  dynamicScreenSpaceError: false,
  dynamicScreenSpaceErrorDensity: 0.00278,
  dynamicScreenSpaceErrorFactor: 4.0,

  // Optimization option. Determines if level of detail skipping should be applied during the traversal.
  skipLevelOfDetail: false,
  // The screen space error this must be reached before skipping levels of detail.
  baseScreenSpaceError: 1024,

  onTileLoad: () => {}, // Indicates this a tile's content was loaded
  onTileUnload: () => {}, // Indicates this a tile's content was unloaded
  onTileLoadFail: (tile, message, url) => {}
};

export const stats = {};

function updatePriority(tile) {
  // Check if any reason to abort
  if (!tile._isVisible) {
    return -1;
  }
  if (tile._contentState === TILE3D_CONTENT_STATE.UNLOADED) {
    return -1;
  }
  return Math.max(1e7 - tile._priority, 0) || 0;
}

export default class I3STileset3D {
  constructor(json, baseUrl, options = DEFAULT_OPTIONS) {
    assert(json);

    // PUBLIC MEMBERS
    this.options = {...DEFAULT_OPTIONS, ...options};
    this.url = url; // The url to a tileset JSON file.
    this.basePath = path.dirname(url); // base path that non-absolute paths in tileset are relative to.
    this.modelMatrix = this.options.modelMatrix;
    this.stats = new Stats({id: url});
    this._initializeStats();

    this.gpuMemoryUsageInBytes = 0; // The total amount of GPU memory in bytes used by the tileset.
    this.geometricError = undefined; // Geometric error when the tree is not rendered at all
    this.userData = {};

    // HELPER OBJECTS
    this._queryParams = {};
    this._requestScheduler = new RequestScheduler({
      throttleRequests: this.options.throttleRequests
    });
    this._traverser = new Tileset3DTraverser();
    this._cache = new Tileset3DCache();

    // HOLD TRAVERSAL RESULTS
    this._processingQueue = [];
    this.selectedTiles = [];
    this._emptyTiles = [];
    this._requestedTiles = [];
    this._selectedTilesToStyle = [];

    // Metadata for the entire tileset
    this.asset = {};
    this.credits = {};
    this.description = options.description;

    // EXTRACTED FROM TILESET
    this._root = undefined;
    this._properties = undefined; // Metadata for per-model/point/etc properties
    this._extensionsUsed = undefined;
    this._gltfUpAxis = undefined;

    this._loadTimestamp = undefined;
    this._timeSinceLoad = 0.0;
    this._updatedVisibilityFrame = 0;
    this._extras = undefined;

    this._allTilesAdditive = true;
    this._hasMixedContent = false;
    this._maximumScreenSpaceError = options.maximumScreenSpaceError;
    this._maximumMemoryUsage = options.maximumMemoryUsage;

    this._tilesLoaded = false;
    this._initialTilesLoaded = false;

    this._readyPromise = Promise.resolve();

    this._classificationType = this.options.classificationType;
    this._ellipsoid = this.options.ellipsoid;

    this._dynamicScreenSpaceErrorComputedDensity = 0.0; // Updated based on the camera position and direction

    this._initializeTileSet(json, this.options);
  }



  async update(frameState) {
    if (!this.root) {
      this.root = await fetchRootNode(this.baseUrl, this.json.store.rootNode);
    }

    await this._traverser.traverse(this.root, frameState, this.options);
    this.results = this._traverser.results;

    if (this.results.selectedTiles) {
      const selectedTiles = Object.values(this.results.selectedTiles);
      for (const tile of selectedTiles) {
        if (tile._contentState === TILE3D_CONTENT_STATE.UNLOADED) {
          tile._contentState = TILE3D_CONTENT_STATE.LOADING_CONTENT;

          if (!stats[tile.id]) {
            stats[tile.id] = {
              cancelled: 0,
              requested: 0,
              processed: 0,
              unloaded: 0
            };
          }

          if (stats[tile.id].requested) {
            continue;
          }

          stats[tile.id].requested += 1;
          const cancelled = !(await this._requestScheduler.scheduleRequest(tile, updatePriority));

          if (cancelled) {
            stats[tile.id].cancelled += 1;
            tile._contentState = TILE3D_CONTENT_STATE.UNLOADED;
            continue;
          }

          try {
            this._requestScheduler.startRequest(tile);
            await this._loadTile(tile);
            this._requestScheduler.endRequest(tile);

            tile._contentState = TILE3D_CONTENT_STATE.READY;

            this._onTileLoad(tile);
          } catch (error) {
            // Tile is unloaded before the content finishes loading
            tile._contentState = TILE3D_CONTENT_STATE.FAILED;
            throw error;
          }
        }
      }
    }

    console.log(stats);
  }

  async _loadTile(tile) {
    if (!tile) {
      return;
    }

    if (
      tile.attributes ||
      tile._contentState === TILE3D_CONTENT_STATE.READY ||
      tile._contentState === TILE3D_CONTENT_STATE.PROCESSING ||
      tile._contentState === TILE3D_CONTENT_STATE.UNLOADED
    ) {
      return;
    }

    if (!tile._isVisible) {
      return;
    }

    tile._contentState = TILE3D_CONTENT_STATE.PROCESSING;
    tile.featureData = await loadFeatureData(this.baseUrl, tile);
    tile.geometryBuffer = await loadGeometryBuffer(this.baseUrl, tile);
    tile.gpuMemoryUsageInBytes = tile.geometryBuffer.byteLength;
    if (tile.content.textureData) {
      tile.texture = `${this.baseUrl}/nodes/${tile.id}/${tile.content.textureData[0].href}`;
    }

    parseI3SNodeGeometry(tile.geometryBuffer, tile);
    if (!stats[tile.id]) {
      stats[tile.id] = {
        cancelled: 0,
        requested: 0,
        processed: 0
      };
    }
    stats[tile.id].processed += 1;
    tile._contentState = TILE3D_CONTENT_STATE.READY;
  }
}

async function loadFeatureData(baseUrl, tile) {
  const featureData = tile.content.featureData[0];
  const featureDataPath = `${baseUrl}/nodes/${tile.id}/${featureData.href}`;
  return await fetch(featureDataPath).then(resp => resp.json());
}

async function loadGeometryBuffer(baseUrl, tile) {
  const geometryData = tile.content.geometryData[0];
  const geometryDataPath = `${baseUrl}/nodes/${tile.id}/${geometryData.href}`;
  return await fetch(geometryDataPath).then(resp => resp.arrayBuffer());
}

export async function fetchTileNode(baseUrl, tileId) {
  const tileUrl = `${baseUrl}/nodes/${tileId}`;
  return await fetch(tileUrl).then(resp => resp.json());
}

async function fetchRootNode(baseUrl, rootRef) {
  const rootUrl = `${baseUrl}/${rootRef}`;
  return await fetch(rootUrl).then(resp => resp.json());
}

function getTileMetaPath(nodeId) {
  return `nodes/${nodeId}/3dNodeIndexDocument.json.gz`;
}

function getTileFeaturePath(tileId, featureNumber) {
  return `nodes/${tileId}/features/${featureNumber}.json.gz`;
}

function getTileGeometryBufferPath(nodeId, geometryNumber) {
  return `nodes/${nodeId}/geometries/${geometryNumber}.bin.gz`;
}

function getTileSharedResourcePath(nodeId, featureNumber) {
  return `nodes/${nodeId}/shared/sharedResource.json.gz`;
}

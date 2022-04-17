'use strict';

import PouchPromise from 'pouchdb-promise';
import RBush from 'rbush';
import * as turf from '@turf/turf';

export default GeospatialTree;

/**
 * @description Geospatial RBush that uses bounding boxes.
 * @private
 */
class RTree extends RBush {
  /**
   * @description Geospatial RBush that expected items with IDs and bboxes.
   * @param {Array} item {id, bbox}.
   * @private
   * @return {Object} {minX, minY, maxX, maxY}
   */
  toBBox(item) {
    return {
      minX: item.bbox[0],
      minY: item.bbox[1],
      maxX: item.bbox[2],
      maxY: item.bbox[3],
      id: item.id,
    };
  }
  /**
   * @description Compare minimum x between two items.
   * @param {Object} a Item #1.
   * @param {Object} b Item #2.
   * @private
   * @return {Number} Positive if 'a' x is greater than 'b' otherwise negative.
   */
  compareMinX(a, b) {
    return a.bbox[0] - b.bbox[0];
  }
  /**
   * @description Compare minimum y between two items.
   * @param {Object} a Item #1.
   * @param {Object} b Item #2.
   * @private
   * @return {Number} Positive if 'a' y is greater than 'b' otherwise negative.
   */
  compareMinY(a, b) {
    return a.bbox[1] - b.bbox[1];
  }
}

/**
 * @description Geospatial R-Tree.
 * @name tree
 * @namespace GeospatialTree
 */

/**
 * @description Geospatial R-Tree.
 * @type GeospatialTree
 * @memberof PouchDBGeospatial
 * @name tree
 */

/**
 * @description Geospatial tree constructor
 * @private
 */
function GeospatialTree() {
  /**
   * @description R-Tree to store geometries.
   * @private
   */
  this.rtree = new RTree();
}

/**
 * @description Add GeoJSON to the R-Tree.
 * @memberof GeospatialTree
 * @param {GeoJSON} geojson GeoJSON to add.
 * @param {String} id GeoJSON database document ID.
 * @return {Promise} Promise with id and bbox added {id, bbox}.
 */
GeospatialTree.prototype.add = function(geojson, id) {
  const tree = this.rtree;
  return new PouchPromise((resolve) => {
    const bbox = geojson.bbox || turf.bbox(geojson);
    const item = {id, bbox};
    tree.insert(item);
    resolve(item);
  });
};

/**
 * @description Tree bulk data item.
 * @typedef {object} TreeBulkData
 * @property {String} id Document ID
 * @property {GeoJSON} geojson GeoJSON corresponding to id
 */

/**
 * @description Add array of GeoJSONs to the R-Tree.
 * @memberof GeospatialTree
 * @param {TreeBulkData[]} data Array of id and GeoJSON to add.
 * @return {Promise} Promise array of id and bounding boxes loaded {id, bbox}.
 */
GeospatialTree.prototype.load = function(data) {
  const tree = this.rtree;
  return new PouchPromise((resolve) => {
    const items = data.map((item) => {
      const bbox = item.geojson.bbox || turf.bbox(item.geojson);
      return {id: item.id, bbox};
    });
    tree.load(items);
    resolve(items);
  });
};

/**
 * @description Remove document from the R-Tree.
 * @memberof GeospatialTree
 * @param {Object} doc {id, geojson}.
 * @return {Promise} Promise of doc removed {id, bbox}.
 */
GeospatialTree.prototype.remove = function(doc) {
  const tree = this.rtree;
  const bbox = doc.geojson.bbox || turf.bbox(doc.geojson);
  const item = {id: doc.id, bbox};
  return new PouchPromise((resolve) => {
    tree.remove(item, (a, b) => {
      return a.id === b.id;
    });
    resolve(item);
  });
};

/**
 * @description Find all GeoJSON that collide with query GeoJSON.
 * @memberof GeospatialTree
 * @param {GeoJSON} geojson Query GeoJSON with polygon features.
 * @return {Promise} Promise with array objects with id and bbox properties.
 */
GeospatialTree.prototype.query = function(geojson) {
  const bbox = geojson.bbox || turf.bbox(geojson);
  const extents = {
    minX: bbox[0],
    minY: bbox[1],
    maxX: bbox[2],
    maxY: bbox[3],
  };
  const tree = this.rtree;
  return new PouchPromise((resolve) => {
    const ids = tree.search(extents);
    resolve(ids);
  });
};

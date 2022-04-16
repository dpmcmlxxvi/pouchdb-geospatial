'use strict';

import * as de9im from 'de9im';
import GeospatialTree from './geospatialtree';
import PouchPromise from 'pouchdb-promise';

export default GeospatialDB;

/**
 * @description Utility methods for geospatial db.
 * @private
 */
const Util = {
  /**
   * @description Add GeoJSON to the database. The object is put if an "_id"
   *              property is provided, otherwise post is used.
   * @param {PouchDB} db PouchDB database.
   * @param {GeoJSON} geojson GeoJSON to add.
   * @param {Options} [options] PouchDB put/post options.
   * @private
   * @return {Promise} Promise with db put/post response.
   */
  add: (db, geojson, options) => {
    if (geojson._id) {
      return db.put(geojson, options);
    }
    return db.post(geojson, options);
  },
  /**
   * @description Bulk add GeoJSON to the database.
   * @param {PouchDB} db PouchDB database.
   * @param {GeoJSON} geojsons GeoJSONs to add.
   * @param {Options} [options] PouchDB put/post options.
   * @private
   * @return {Promise} Promise with db put/post response.
   */
  load: (db, geojsons, options) => {
    return db.bulkDocs(geojsons, options);
  },
  /**
   * @description Find all GeoJSON colliding with the query GeoJSON.
   * @param {PouchDB} db PouchDB database.
   * @param {GeospatialTree} rtree R-Tree to query.
   * @param {GeoJSON} geojson Query GeoJSON with polygon features.
   * @private
   * @return {Promise} Promise with array of documents.
   */
  query: (db, rtree, geojson) => {
    // Search for tree collisions and return their db documents.
    return rtree.query(geojson).then((response) => {
      return db.allDocs({
        include_docs: true,
        keys: response.map((result) => result.id),
      }).then((docs) => PouchPromise.all(docs.rows.map((doc) => doc.doc)));
    });
  },
  /**
   * @description Remove GeoJSON from the database.
   * @param {PouchDB} db PouchDB database.
   * @param {String} id GeoJSON document ID.
   * @private
   * @return {Promise} Promise with db remove response.
   */
  remove: (db, id) => {
    return db.get(id).then((doc) => db.remove(doc));
  },
  /**
   * @description Bulk remove GeoJSON from the database.
   * @param {PouchDB} db PouchDB database.
   * @param {GeoJSON} geojsons GeoJSONs to add.
   * @param {Options} [options] PouchDB put/post options.
   * @private
   * @return {Promise} Promise with db put/post response.
   */
  unload: (db, geojsons, options) => {
    geojsons = geojsons.map((geojson) => {
      geojson._deleted = true;
      return geojson;
    });
    return db.bulkDocs(geojsons, options);
  },

};

/**
 * @description Geospatial database constructor.
 * @param {PouchDB} db PouchDB instance.
 * @private
 */
function GeospatialDB(db) {
  /**
   * @description PouchDB database to store documents.
   * @private
   */
  this.db = db;
  /**
   * @description R-Tree to store geometries.
   * @private
   */
  this.rtree = new GeospatialTree();
  /**
   * @description Bounding box of all data added to R-Tree.
   * @private
   */
  this.bbox = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-Infinity, -Infinity],
          [Infinity, -Infinity],
          [Infinity, Infinity],
          [-Infinity, Infinity],
          [-Infinity, -Infinity],
        ],
      ],
    },
  };
}

/**
 * @description Find all GeoJSON satisfying the spatial predicate.
 * @param {PouchDB} db PouchDB database.
 * @param {GeospatialTree} rtree R-Tree to query.
 * @param {GeoJSON} geojson Query GeoJSON.
 * @param {function} predicate Binary spatial predicate (e.g., within).
 * @param {GeoJSON} [rbox] R-Tree querying box. Default is input geojson.
 * @private
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.predicate = function(db, rtree, geojson, predicate, rbox) {
  rbox = rbox || geojson;
  return Util.query(db, rtree, rbox).then((docs) => {
    return docs.filter((doc) => predicate(doc, geojson, false)).map((doc) => {
      return doc._id;
    });
  });
};

/**
 * @description Add GeoJSON to the database. Uses put method if GeoJSON has _id
 *              property otherwise uses post.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name add
 * @param {GeoJSON} geojson GeoJSON to add.
 * @param {Options} [options] PouchDB put/post options.
 * @return {Promise} Promise with db put/post response.
 */
GeospatialDB.prototype.add = function(geojson, options) {
  const db = this.db;
  const tree = this.rtree;
  return Util.add(db, geojson, options).then((response) => {
    return tree.add(geojson, response.id).then(() => {
      return response;
    }).catch((error) => {
      // If tree failed to add object then remove from db and raise error
      return Util.remove(db, response.id).then(() => {
        throw error;
      });
    });
  });
};

/**
 * @description Find all GeoJSON containing the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name contains
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.contains = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.contains);
};

/**
 * @description Find all GeoJSON coveredby the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name coveredby
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.coveredby = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.coveredby);
};

/**
 * @description Find all GeoJSON covering the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name covers
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.covers = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.covers);
};

/**
 * @description Find all GeoJSON crossing the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name crosses
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.crosses = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.crosses);
};

/**
 * @description Find all GeoJSON disjoint from the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name disjoint
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.disjoint = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.disjoint,
      this.bbox);
};

/**
 * @description Find all GeoJSON that equal the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name equals
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.equals = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.equals);
};

/**
 * @description Find all GeoJSON intersecting the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name intersects
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.intersects = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.intersects);
};

/**
 * @description Bulk add array of GeoJSON to the database. Uses put method if
 *              GeoJSON has _id property otherwise uses post.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name load
 * @param {Array<GeoJSON>} geojsons GeoJSONs to add.
 * @param {Options} [options] PouchDB put/post options.
 * @return {Promise} Promise with db put/post response.
 */
GeospatialDB.prototype.load = function(geojsons, options) {
  const db = this.db;
  const tree = this.rtree;
  return Util.load(db, geojsons, options).then((response) => {
    return PouchPromise.all(response.map((doc) => {
      return db.get(doc.id);
    })).then((docs) => {
      const items = docs.map((doc) => ({id: doc._id, geojson: doc}));
      return tree.load(items).then(() => response).catch((error) => {
        // Tree failed to add object so remove from db and raise error
        return Util.unload(db, docs).then(() => {
          throw error;
        });
      });
    });
  });
};

/**
 * @description Find all GeoJSON overlapping the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name overlaps
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.overlaps = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.overlaps);
};

/**
 * @description Remove GeoJSON from the database.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name remove
 * @param {String} id GeoJSON document ID to remove.
 * @return {Promise} Promise with db remove response.
 */
GeospatialDB.prototype.remove = function(id) {
  const tree = this.rtree;
  return this.db.get(id).then((geojson) => {
    const item = {id, geojson};
    return Util.remove(this.db, id).then((response) => {
      return tree.remove(item).then(() => response);
    });
  });
};

/**
 * @description Find all GeoJSON touching the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name touches
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.touches = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.touches);
};

/**
 * @description Access underlying R-tree.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name tree
 * @private
 * @return {GeospatialTree} R-tree.
 */
GeospatialDB.prototype.tree = function() {
  return this.rtree;
};

/**
 * @description Find all GeoJSON within the query GeoJSON.
 * @function
 * @instance
 * @memberof PouchDBGeospatial
 * @name within
 * @param {GeoJSON} geojson Query GeoJSON.
 * @return {Promise} Promise with array of document IDs.
 */
GeospatialDB.prototype.within = function(geojson) {
  return GeospatialDB.predicate(this.db,
      this.rtree,
      geojson,
      de9im.within);
};

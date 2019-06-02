'use strict';

import GeospatialDB from './geospatialdb';

/**
 * @description Geospatial plugin function.
 * @private
 * @return {PouchDBGeospatial} Geospatial plugin API object.
 */
function GeospatialPlugin() {
  const db = this;

  /**
   * @description The object exposed by the geospatial plugin API.
   *              All methods return promises.
   * @namespace PouchDBGeospatial
   */
  const PouchDBGeospatial = (function() {
    const geodb = new GeospatialDB(db);

    return {
      add: geodb.add.bind(geodb),
      contains: geodb.contains.bind(geodb),
      coveredby: geodb.coveredby.bind(geodb),
      covers: geodb.covers.bind(geodb),
      crosses: geodb.crosses.bind(geodb),
      disjoint: geodb.disjoint.bind(geodb),
      equals: geodb.equals.bind(geodb),
      intersects: geodb.intersects.bind(geodb),
      load: geodb.load.bind(geodb),
      overlaps: geodb.overlaps.bind(geodb),
      remove: geodb.remove.bind(geodb),
      touches: geodb.touches.bind(geodb),
      within: geodb.within.bind(geodb),
    };
  }());

  return PouchDBGeospatial;
};

const plugin = {
  geospatial: GeospatialPlugin,
};

export default plugin;

/* istanbul ignore next */
if (typeof window !== 'undefined' && window.PouchDB) {
  window.PouchDB.plugin(plugin);
}

/**
 * @description https://geojson.org
 * @external GeoJSON
 */

/**
 * @description https://pouchdb.com
 * @external Options
 */

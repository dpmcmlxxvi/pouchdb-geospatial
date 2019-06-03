# [PouchDB Geospatial][pouchdb-geospatial-github]

[![build](https://travis-ci.org/dpmcmlxxvi/pouchdb-geospatial.svg?branch=master)](https://travis-ci.org/dpmcmlxxvi/pouchdb-geospatial)
[![coverage](https://img.shields.io/coveralls/dpmcmlxxvi/pouchdb-geospatial.svg)](https://coveralls.io/r/dpmcmlxxvi/pouchdb-geospatial?branch=master)
[![npm](https://badge.fury.io/js/pouchdb-geospatial.svg)](https://badge.fury.io/js/pouchdb-geospatial)
[![code](https://api.codacy.com/project/badge/Grade/ee6c4c853e3d4eae9d1cdaab497acdf1)](https://www.codacy.com/app/dpmcmlxxvi/pouchdb-geospatial?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=dpmcmlxxvi/pouchdb-geospatial&amp;utm_campaign=Badge_Grade)

The [PouchDB][pouchdb-site] Geospatial plugin provides spatial querying of
[GeoJSON][geojson-site] objects. The query methods available support the
[DE-9IM][de9im-wiki] spatial predicates. Any GeoJSON object inserted into the
database via the the plugin API is spatially indexed using an
[R-Tree][rtree-wiki]. Spatial queries are then processed by querying the R-Tree
for candidate geometries and the final query results are returned after the
candidates are filtered by the appropriate spatial predicate. The spatial
indexing is performed by [RBush][rbush-github] and geospatial predicates
are computed with [de9im][de9im-github]. A sample of how to use the plugin is
available at the [examples page][pouchdb-geospatial-examples]. The API is
described below and at the [documentation page][pouchdb-geospatial-api].

## USAGE

### In browser

To use this plugin, include it after `pouchdb.js` in your HTML page. This plugin
has two dependencies not bundled with it that must be included
[Turf][turf-github] and [de9im][de9im-github].

```html
<script src="https://unpkg.com/pouchdb/dist/pouchdb.min.js"></script>
<script src="https://unpkg.com/@turf/turf"></script>
<script src="https://unpkg.com/de9im"></script>
<script src="https://unpkg.com/pouchdb-geospatial"></script>
```

### In Node

To use it in Node, install it

```shell
npm install pouchdb-geospatial
```

then attach it to the `PouchDB` object:
 
```javascript
import PouchDB from 'pouchdb';
import PouchDBGeospatial from 'pouchdb-geospatial';
PouchDB.plugin(PouchDBGeospatial);
```

### Create database

The plugin methods are exposed via an object API. All methods return promises.

```javascript
const db = new PouchDB('dbname');
const api = db.geospatial();
```

## API

### Database methods

The database methods accept the same options and return a promise with the same
response returned by their corresponding `PouchDB` methods: `put`, `post`,
`bulkDocs`, and `remove`.

```javascript
api.add(geojson, options);
api.load([geojson, ...], options);
api.remove(id);
```

### Query methods

The query methods accept a GeoJSON and return a promise with an array of
database document IDs that satisfy the spatial predicate. For example,

```javascript
api.contains(geojson).then((ids) => {
  // Do something with document ids.
});
```

The following spatial predicates are available:

```javascript
contains
coveredby
covers
crosses
disjoint
equals
intersects
overlaps
touches
within
```

Each predicate takes one GeoJSON argument. The predicate should be interpreted
as the database GeoJSON operating on the argument GeoJSON. For example,

```javascript
api.within(polygon)
```

should be read as

```shell
any database GeoJSON within polygon?
```

## BUILD

To build and test the library locally:

```shell
npm install
npm test
```

After installation, the bundled plugin is at `pouchdb-geospatial.min.js`.

## LICENSE

Copyright (c) 2019 Daniel Pulido <mailto:dpmcmlxxvi@gmail.com>

Source code is released under the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0)

[de9im-github]: https://github.com/dpmcmlxxvi/de9im
[de9im-wiki]: https://en.wikipedia.org/wiki/DE-9IM
[geojson-site]: http://geojson.org
[pouchdb-site]: https://pouchdb.com
[pouchdb-geospatial-api]: http://dpmcmlxxvi.github.io/pouchdb-geospatial/api
[pouchdb-geospatial-examples]: http://dpmcmlxxvi.github.io/pouchdb-geospatial/examples
[pouchdb-geospatial-github]: https://github.com/dpmcmlxxvi/pouchdb-geospatial
[rbush-github]: https://github.com/mourner/rbush
[rtree-wiki]: https://en.wikipedia.org/wiki/R-tree
[turf-github]: https://github.com/Turfjs/turf

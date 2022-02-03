const fixtures = require('./fixtures');
const fs = require('fs');
const path = require('path');
const PouchDB = require('pouchdb');
const PouchDBGeospatial = require('./pouchdb.geospatial.loader').default;
const tap = require('tap');

PouchDB.plugin(PouchDBGeospatial);

// JSON loader
const loadSync = (filepath) => JSON.parse(fs.readFileSync(filepath));

// Load test fixtures
const directory = path.join(__dirname, 'data/api');
const capitals = loadSync(path.join(directory, 'us_capitals.json'));
const city = loadSync(path.join(directory, 'us_city.json'));
const interstates = loadSync(path.join(directory, 'us_interstates.json'));
const points = loadSync(path.join(directory, 'points.json'));
const pointsId = loadSync(path.join(directory, 'points_id.json'));
const states = loadSync(path.join(directory, 'us_states.json'));

// Geospatial db and apiget created before each test.
let api;
let db;
let id = 0;

// Get new database with unique name
const database = () => {
  const name = 'http://localhost:5984/testdb' + (++id);
  return new PouchDB(name);
};

// Process database query for given predicate
const query = (predicate, fixture, expected) => {
  const db = database();
  const api = db.geospatial();
  return api.add(fixture.features[0]).then(() => {
    return api[predicate](fixture.features[1]).then((result) => {
      return db.destroy().then(() => {
        return result.length === expected;
      });
    });
  });
};

// Run predicate tests for true, false, and throws cases.
const tests = (predicate, t) => {
  const cases = fixtures[predicate];

  t.resolves(Promise.all(cases['true'].map((fixture) => {
    return query(predicate, fixture, 1);
  })));

  t.resolves(Promise.all(cases['false'].map((fixture) => {
    return query(predicate, fixture, 0);
  })));

  if (cases['throws'].length === 0) {
    return;
  }

  t.resolves(Promise.all(cases['throws'].map((fixture) => {
    return query(predicate, fixture, 0);
  })));
};

tap.beforeEach((done) => {
  db = database();
  api = db.geospatial();
});

tap.afterEach((done) => {
  db.destroy();
});

tap.test('Post points to database', async (t) => {
  const response = await api.add(points);
  const geojson = await db.get(response.id);
  t.ok(geojson.features.length > 0);
  const doc = await db.allDocs();
  t.ok(doc.total_rows > 0);
  t.end();
}).catch(tap.threw);

tap.test('Put points to database', async (t) => {
  const options = {new_edits: true};
  const response = await api.add(pointsId, options);
  const geojson = await db.get(response.id);
  t.ok(geojson.features.length > 0);
  const doc = await db.allDocs();
  t.ok(doc.total_rows > 0);
  t.end();
}).catch(tap.threw);

tap.test('Put small collection', async (t) => {
  const options = {new_edits: true};
  const docs = await api.load([pointsId], options);
  t.equal(docs.length, 1);
  t.end();
}).catch(tap.threw);

tap.test('Do not add non-geometry to database', async (t) => {
  const doc = await api.add({}).catch(() => db.allDocs());
  t.equal(doc.total_rows, 0);
  t.end();
}).catch(tap.threw);

tap.test('Do not load non-collection to database', async (t) => {
  const doc = await api.load([{}]).catch(() => db.allDocs());
  t.equal(doc.total_rows, 0);
  t.end();
}).catch(tap.threw);

tap.test('Contains test suite', async (t) => {
  tests('contains', t);
}).catch(tap.threw);

tap.test('CoveredBy test suite', async (t) => {
  tests('coveredby', t);
}).catch(tap.threw);

tap.test('Covers test suite', async (t) => {
  tests('covers', t);
}).catch(tap.threw);

tap.test('Crosses test suite', async (t) => {
  tests('crosses', t);
}).catch(tap.threw);

tap.test('Disjoint test suite', async (t) => {
  tests('disjoint', t);
}).catch(tap.threw);

tap.test('Equals test suite', async (t) => {
  tests('equals', t);
}).catch(tap.threw);

tap.test('Intersects test suite', async (t) => {
  tests('intersects', t);
}).catch(tap.threw);

tap.test('Overlaps test suite', async (t) => {
  tests('overlaps', t);
}).catch(tap.threw);

tap.test('Touches test suite', async (t) => {
  tests('touches', t);
}).catch(tap.threw);

tap.test('Within test suite', async (t) => {
  tests('within', t);
}).catch(tap.threw);

tap.test('Remove post points from db', async (t) => {
  const response = await api.add(points);
  const geojson = await db.get(response.id);
  const doc = await api.remove(geojson._id).then(() => db.allDocs());
  t.equal(doc.total_rows, 0);
  t.end();
}).catch(tap.threw);

tap.test('Remove put points from db', async (t) => {
  const options = {new_edits: true};
  const response = await api.add(pointsId, options);
  const geojson = await db.get(response.id);
  const doc = await api.remove(geojson._id).then(() => db.allDocs());
  t.equal(doc.total_rows, 0);
  t.end();
}).catch(tap.threw);

tap.test('Load large collection', async (t) => {
  const docs = await api.load(states.features);
  t.equal(docs.length, states.features.length);
  t.end();
}).catch(tap.threw);

tap.test('Put large collection', async (t) => {
  const options = {new_edits: true};
  const docs = await api.load(states.features.map((feature, index) => {
    feature._id = index.toString();
    return feature;
  }), options);
  t.equal(docs.length, states.features.length);
  t.end();
}).catch(tap.threw);

tap.test('Find point contained in large collection', async (t) => {
  const response = await api.load(states.features).then(() => {
    return api.contains(city);
  });
  t.equal(response.length, 1);
  const geojson = await db.get(response[0]);
  t.equal(geojson.properties.NAME, 'Virginia');
  t.end();
}).catch(tap.threw);

tap.test('Find capital covered by state', async (t) => {
  const responses = await api.load(capitals.features).then(() => {
    return Promise.all(states.features.map((state) => api.coveredby(state)));
  });
  responses.forEach((response, index) => {
    t.equal(response.length, 1, states.features[index].properties.NAME);
  });
  t.end();
}).catch(tap.threw);

tap.test('Find interstate intersecting state', async (t) => {
  const responses = await api.load(interstates.features).then(() => {
    return Promise.all(states.features.map((state) => api.intersects(state)));
  });
  responses.forEach((response, index) => {
    t.ok(response.length > 0, states.features[index].properties.NAME);
  });
  t.end();
}).catch(tap.threw);

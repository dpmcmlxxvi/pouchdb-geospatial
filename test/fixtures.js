const glob = require('glob');
const load = require('load-json-file');
const path = require('path');

// Find fixtures for each predicate and expected return type
const ext = '*.json';
const fixtures = {};

[
  'contains',
  'coveredby',
  'covers',
  'crosses',
  'disjoint',
  'equals',
  'intersects',
  'overlaps',
  'touches',
  'within',
].forEach((predicate) => {
  fixtures[predicate] = {};
  [
    'true',
    'false',
    'throws',
  ].forEach((type) => {
    fixtures[predicate][type] = [];
    const pattern = path.join(__dirname, 'data', predicate, type, '**', ext);
    glob.sync(pattern).forEach((filepath) => {
      const geojson = load.sync(filepath);
      fixtures[predicate][type].push(geojson);
    });
  });
});

module.exports = fixtures;

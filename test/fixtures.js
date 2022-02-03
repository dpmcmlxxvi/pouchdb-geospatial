const fs = require('fs');
const glob = require('glob');
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
      const geojson = JSON.parse(fs.readFileSync(filepath));
      fixtures[predicate][type].push(geojson);
    });
  });
});

module.exports = fixtures;

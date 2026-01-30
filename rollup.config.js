import commonjs from '@rollup/plugin-commonjs';
import globals from 'rollup-plugin-node-globals'; // optional: keep if you rely on it
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const pkg = require('./package.json');

const banner = `\
/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 *
 * @author ${pkg.author}
 * @license ${pkg.license}
 * @preserve
 */
`;

const build = (filename, plugins) => ({
  external: [
    '@turf/turf',
    'de9im',
  ],
  input: pkg.module,
  output: {
    banner: banner,
    file: filename,
    format: 'umd',
    name: 'PouchDBGeospatial',
  },
  plugins,
});

export default [
  build('pouchdb-geospatial.js', [
    resolve({ browser: true }), // resolve first (for browser fields), then commonjs
    commonjs(),
    globals(), // optional: provides `process`, `Buffer`, etc. in bundles
  ]),
  build('pouchdb-geospatial.min.js', [
    resolve({ browser: true }),
    commonjs(),
    globals(),
    terser(),
    json(),
  ]),
];


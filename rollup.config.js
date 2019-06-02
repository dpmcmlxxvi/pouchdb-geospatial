import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import pkg from './package.json';
import resolve from 'rollup-plugin-node-resolve';
import {terser} from 'rollup-plugin-terser';

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
  build('pouchdb-geospatial.js', [commonjs(), globals(), resolve()]),
  build('pouchdb-geospatial.min.js', [commonjs(), globals(), resolve(), terser()]),
];

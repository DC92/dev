import node from '@rollup/plugin-node-resolve';
import cjs from '@rollup/plugin-commonjs'; // Convert CommonJS module into ES module
import css from 'rollup-plugin-import-css'; // Collect css
import terser from '@rollup/plugin-terser'; // Rollup plugin to minify generated es bundle
import {
	readFileSync, // Read banner file
} from 'fs';

const banner = readFileSync('./build/banner.js', 'utf-8');

export default [{
	// Full myol / compressed library
	input: 'build/index.js',
	plugins: [
		node(),
		cjs(),
		css({
			output: 'dist/myol.css',
		}),
		terser(),
	],
	output: [{
		name: 'myol',
		banner,
		file: 'dist/myol.js',
		format: 'umd',
		sourcemap: true,
	}],
}, {
	// Full myol / debug library
	input: 'build/index.js',
	plugins: [
		node(),
		cjs(),
		css({
			output: 'dist/myol.css',
		}),
	],
	output: [{
		name: 'myol',
		banner,
		file: 'dist/myol-debug.js',
		format: 'iife',
	}],
}];
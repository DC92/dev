import cjs from "@rollup/plugin-commonjs";
import node from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import externalGlobals from "rollup-plugin-external-globals";
import css from "rollup-plugin-import-css";
import {
	readFileSync
} from 'fs';

const banner = readFileSync('./build/banner.js', 'utf-8')

export default [{
	// Full myol / compressed library
	input: "build/index.js",
	plugins: [
		node({
			browser: true,
		}),
		cjs(),
		externalGlobals({}),
		css({
			output: "dist/myol.css",
			minify: true,
		}),
		terser(),
	],
	output: [{
		name: "myol",
		banner,
		file: "./dist/myol.js",
		format: "umd",
		sourcemap: true,
		//inlineDynamicImports: true,
	}],
}, {
	// Full myol / debug library
	input: "build/index.js",
	plugins: [
		node({
			browser: true,
		}),
		cjs(),
		externalGlobals({}),
		css({
			output: "dist/myol-debug.css",
		}),
	],
	output: [{
		name: "myol",
		banner,
		file: "./dist/myol-debug.js",
		format: "iife",
	}],
}, {
	// Compressed library for refuges.info
	input: "build/wri.js",
	plugins: [
		node({
			browser: true,
		}),
		cjs(),
		externalGlobals({}),
		terser(),
	],
	output: [{
		name: "myol",
		file: "./dist/myol-wri.js",
		format: "umd",
		sourcemap: true,
		//inlineDynamicImports: true,
	}],
}, {
	// Debug library for refuges.info
	input: "build/wri.js",
	plugins: [
		node({
			browser: true,
		}),
		cjs(),
		externalGlobals({}),
	],
	output: [{
		name: "myol",
		file: "./dist/myol-wri-debug.js",
		format: "iife",
	}],
}];
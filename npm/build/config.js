import node from "@rollup/plugin-node-resolve";
import cjs from "@rollup/plugin-commonjs";
import externalGlobals from "rollup-plugin-external-globals";
import terser from "@rollup/plugin-terser";
import css from "rollup-plugin-import-css";

export default {
	input: "build/index.js",
	plugins: [
		node({
			browser: true
		}),
		cjs(),
		css({
              output: "dist/myol.css",
              outputStyle: "compressed"
          }),
		externalGlobals({}),
		terser()
	],
	output: [{
		name: "myol",
		file: "./dist/myol.js",
		format: "umd",
		sourcemap: true,
		//inlineDynamicImports: true
	}],
};
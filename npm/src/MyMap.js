/**
 * @module ol/MyMap
 */
import Map from '../node_modules/ol/Map.js';

class MyMap extends Map {
	constructor(options) {
		super(options);
		console.log('568');
	}
}

export default MyMap;
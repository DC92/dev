/**
 * Optimised library for refuges.info
 */
 
import Map from '../node_modules/ol/Map.js';
import View from '../node_modules/ol/View.js';
import Attribution from '../node_modules/ol/control/Attribution';
import Zoom from '../node_modules/ol/control/Zoom';
import {demoTileLayer} from '../src/TileLayerCollection.js';

// Include geocoder code
import '@kirtandesai/ol-geocoder/dist/ol-geocoder-debug.js';

export var index = new Map({
		target: 'map',
		view: new View({
			center: [700000, 5600000], // Sud est
			zoom: 7,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: [
			new Zoom(),
			new Attribution({
				collapsed: false,
			}),
			controlLayerSwitcher({
				layers: demoTileLayer(layersKeys),
			}),
		],
	}),
	point = new Map({
		target: 'map',
		view: new View({
			center: [700000, 5600000], // Sud est
			zoom: 7,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: [
			new Zoom(),
			new Attribution({
				collapsed: false,
			}),
			controlLayerSwitcher({
				layers: demoTileLayer(layersKeys),
			}),
		],
	}),
	modification = new Map({
		target: 'map',
		view: new View({
			center: [700000, 5600000], // Sud est
			zoom: 7,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: [
			new Zoom(),
			new Attribution({
				collapsed: false,
			}),
			controlLayerSwitcher({
				layers: demoTileLayer(layersKeys),
			}),
		],
	}),
	nav = new Map({
		target: 'map',
		view: new View({
			center: [700000, 5600000], // Sud est
			zoom: 7,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: [
			new Zoom(),
			new Attribution({
				collapsed: false,
			}),
			controlLayerSwitcher({
				layers: demoTileLayer(layersKeys),
			}),
		],
	}),
	edit = new Map({
		target: 'map',
		view: new View({
			center: [700000, 5600000], // Sud est
			zoom: 7,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: [
			new Zoom(),
			new Attribution({
				collapsed: false,
			}),
			controlLayerSwitcher({
				layers: demoTileLayer(layersKeys),
			}),
		],
	});
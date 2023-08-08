// This file defines the contents of the dist/myol.css & dist/myol libraries
// This contains all what is necessary for refuges.info & chemineur.fr websites

import Editor from '../src/Editor';
import LayerSwitcher from '../src/LayerSwitcher';
import Marker from '../src/Marker';
import MyGeocoder from '../src/MyGeocoder';
import MyGeolocation from '../src/MyGeolocation';
import * as myControl from '../src/MyControl';
import * as myVectorLayer from '../src/MyVectorLayer';
import * as stylesOptions from '../src/stylesOptions';
import * as tileLayercollection from '../src/TileLayerCollection';
import * as vectorLayerCollection from '../src/VectorLayerCollection';

const myol = {
	control: { //BEST mettre dans un répertoire scr/control
		Editor: Editor,
		LayerSwitcher: LayerSwitcher,
		MyGeocoder: MyGeocoder,
		MyGeolocation: MyGeolocation,
		...myControl,
	},
	layer: { //BEST mettre dans un répertoire scr/layer
		Hover: myVectorLayer.Hover,
		Marker: Marker,
		MyVectorLayer: myVectorLayer.MyVectorLayer,
		tile: tileLayercollection,
		vector: vectorLayerCollection,
	},
	Selector: myVectorLayer.Selector,
	stylesOptions: stylesOptions,
};

import ol from '../src/ol';
window.ol ||= ol; // Export Openlayers native functions as global if none already defined
myol.ol = ol; // Packing Openlayers native functions in the bundle
export default myol;

// Trace in the console
import * as util from 'ol/util';
console.log('OL V' + util.VERSION);
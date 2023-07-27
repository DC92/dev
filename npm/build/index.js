// This file defines the contents of the dist/myol.css & dist/myol libraries
// This contains all what is necessary for refuges.info & chemineur.fr websites

// Openlayers
import 'ol/ol.css';

import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import Map from 'ol/Map';
import ScaleLine from 'ol/control/ScaleLine';
import View from 'ol/View';
import Zoom from 'ol/control/Zoom';
import * as loadingstrategy from 'ol/loadingstrategy';
import * as proj from 'ol/proj';
import * as style from 'ol/style';

const ol = {
	Map: Map,
	View: View,
	control: {
		Attribution: Attribution,
		FullScreen: FullScreen,
		ScaleLine: ScaleLine,
		Zoom: Zoom,
	},
	loadingstrategy: loadingstrategy,
	proj: {
		fromLonLat: proj.fromLonLat,
		transformExtent: proj.transformExtent,
	},
	style: style,
};

// MyOl
import layerSwitcher from '../src/LayerSwitcher';
import MyGeocoder from '../src/MyGeocoder';
import myGeolocation from '../src/MyGeolocation';
import * as controlCollection from '../src/controlCollection';
import * as files from '../src/Files';
import * as myControl from '../src/MyControl';
import * as myVectorLayer from '../src/MyVectorLayer';
import * as stylesOptions from '../src/stylesOptions';
import * as tileLayercollection from '../src/TileLayerCollection';
import * as vectorLayerCollection from '../src/VectorLayerCollection';

const myol = {
	ol: ol, // Packing some original Openlayers functions

	control: { //BEST mettre dans un répertoire scr/control
		...controlCollection,
		...myControl,
		...files,
		layerSwitcher: layerSwitcher,
		myGeolocation: myGeolocation,
		MyGeocoder: MyGeocoder,
	},
	layer: { //BEST mettre dans un répertoire scr/layer
		MyVectorLayer: myVectorLayer.MyVectorLayer,
		Hover: myVectorLayer.Hover,
		tile: tileLayercollection,
		vector: vectorLayerCollection,
	},
	Selector: myVectorLayer.Selector,
	stylesOptions: stylesOptions,
};

export default myol;


// Debug
import {
	VERSION
} from 'ol/util';
console.log('Ol V' + VERSION);
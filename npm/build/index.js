// This file defines the contents of the dist/myol.css & dist/myol libraries
// This contains all what is necessary for refuges.info & chemineur.fr websites

// Openlayers
import 'ol/ol.css';

import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import Map from 'ol/Map';
import MultiPolygon from 'ol/geom/MultiPolygon';
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
	geom: {
		MultiPolygon: MultiPolygon,
	},
	loadingstrategy: loadingstrategy,
	proj: {
		fromLonLat: proj.fromLonLat,
		transformExtent: proj.transformExtent,
	},
	style: style,
};

// MyOl
import LayerSwitcher from '../src/LayerSwitcher';
import Marker from '../src/Marker';
import MyGeocoder from '../src/MyGeocoder';
import MyGeolocation from '../src/MyGeolocation';
import Editor from '../src/Editor';
import * as controlCollection from '../src/controlCollection';
import * as controlFiles from '../src/Files';
import * as myControl from '../src/MyControl';
import * as myVectorLayer from '../src/MyVectorLayer';
import * as stylesOptions from '../src/stylesOptions';
import * as tileLayercollection from '../src/TileLayerCollection';
import * as vectorLayerCollection from '../src/VectorLayerCollection';

const myol = {
	ol: ol, // Packing some original Openlayers functions

	control: { //BEST mettre dans un répertoire scr/control
		...controlCollection,
		...controlFiles,
		...myControl,
		Editor: Editor,
		LayerSwitcher: LayerSwitcher,
		MyGeolocation: MyGeolocation,
		MyGeocoder: MyGeocoder,
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

export default myol;

// Debug
import * as util from 'ol/util';
console.log('OL V' + util.VERSION);
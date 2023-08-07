// This file defines the contents of the dist/myol.css & dist/myol libraries
// This contains all what is necessary for refuges.info & chemineur.fr websites

// Openlayers
import 'ol/ol.css';

import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import GeoJSON from 'ol/format/GeoJSON';
import GPX from 'ol/format/GPX';
import KML from 'ol/format/KML';
import Map from 'ol/Map';
import MultiPolygon from 'ol/geom/MultiPolygon';
import OSM from 'ol/source/OSM';
import ScaleLine from 'ol/control/ScaleLine';
import Stamen from 'ol/source/Stamen';
import Tile from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
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
	format: {
		GeoJSON: GeoJSON,
		GPX: GPX,
		KML: KML,
	},
	geom: {
		MultiPolygon: MultiPolygon,
	},
	layer: {
		Tile: Tile,
		Vector: VectorLayer,
	},
	loadingstrategy: loadingstrategy,
	proj: {
		fromLonLat: proj.fromLonLat,
		transform: proj.transform,
		transformExtent: proj.transformExtent,
	},
	source: {
		OSM: OSM,
		Stamen: Stamen,
		Vector: VectorSource,
	},
	style: style,
};

// MyOl
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

window.ol ||= ol; // Export Openlayers native functions as global if none already defined
myol.ol = ol; // Packing Openlayers native functions in the bundle
export default myol;

// Debug
import * as util from 'ol/util';
console.log('OL V' + util.VERSION);
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
import * as controlCollection from '../src/controlCollection';
import * as files from '../src/Files';
import * as myGeolocation from '../src/MyGeolocation';
import * as myControl from '../src/myControl';
import * as myVectorLayer from '../src/MyVectorLayer';
import * as stylesOptions from '../src/stylesOptions';
import * as tileLayercollection from '../src/TileLayerCollection';
import * as vectorLayerCollection from '../src/VectorLayerCollection';


const myol = {
	ol: ol, // Packing some original Openlayers functions

	stylesOptions: stylesOptions,
	Selector: myVectorLayer.Selector,
	layer: { //BEST mettre dans un répertoire scr/layer
		MyVectorLayer: myVectorLayer.MyVectorLayer,
		Hover: myVectorLayer.Hover,
		tile: tileLayercollection,
		vector: vectorLayerCollection,
	},
	control: { //BEST mettre dans un répertoire scr/control
		...controlCollection,
		layerSwitcher: layerSwitcher,
		load: files.load,
		download: files.download,
		print: myControl.print,
		myGeolocation: myGeolocation.myGeolocation,
		MyGeocoder: MyGeocoder,
	},
};

export default myol;


// Debug
import {
	VERSION
} from 'ol/util';
console.log('Ol V' + VERSION);


/*
import * as editor from '../src/Editor';
import * as marker from '../src/Marker';
Button: controls.controlButton,
MousePosition: controls.controlMousePosition,
Permalink: controls.controlPermalink,
import MultiPolygon from 'ol/geom/MultiPolygon';

// MyOl
import * as controls from '../src/Controls';
import * as editor from '../src/Editor';
import * as marker from '../src/Marker';
geom:  MultiPolygon: MultiPolygon,
layer: {
	ArcGisTile: tileLayercollection.ArcGis,
	GoogleTile: tileLayercollection.Google,
	IgnTile: tileLayercollection.IGN,
	KompassMriTile: tileLayercollection.Kompass,
	Marker: marker.layerMarker,
	MriTile: tileLayercollection.MRI,
	OsmTile: tileLayercollection.OSM,
	SpainTile: tileLayercollection.IgnES,
	SwissTopoTile: tileLayercollection.SwissTopo,
	ThunderforestTile: tileLayercollection.Thunderforest,
	TopoTile: tileLayercollection.Topo,
	WRI: myVector.WRI,
	tileCollection: tileLayercollection.collection,
*/
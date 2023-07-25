// This file defines the contents of the dist/myol.css & dist/myol libraries
// This contains all what is necessary for refuges.info & chemineur.fr websites

// Openlayers
import 'ol/ol.css';

import Map from 'ol/Map';
import View from 'ol/View';
import * as loadingstrategy from 'ol/loadingstrategy';
import * as style from 'ol/style';
const myol = {
	Map: Map,
	View: View,
	loadingstrategy: loadingstrategy,
	style: style,
};

import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';
myol.control = {
	Attribution: Attribution,
	FullScreen: FullScreen,
	ScaleLine: ScaleLine,
	Zoom: Zoom,
};

import * as proj from 'ol/proj';
myol.proj = {
	fromLonLat: proj.fromLonLat,
	transformExtent: proj.transformExtent,
};

// MyOl
import * as stylesOptions from '../src/stylesOptions';
myol.stylesOptions = stylesOptions;

import * as myVectorLayer from '../src/MyVectorLayer';
import * as vectorLayerCollection from '../src/VectorLayerCollection';
import * as tileLayercollection from '../src/TileLayerCollection';
myol.Selector = myVectorLayer.Selector;
myol.layer = { //TODO mettre dans un répertoire scr/layer
	MyVectorLayer: myVectorLayer.MyVectorLayer,
	Hover: myVectorLayer.HoverLayer,
	tile: tileLayercollection,
	vector: vectorLayerCollection,
};

export default myol; //TODO exporter ol & myol;


/*
import MultiPolygon from 'ol/geom/MultiPolygon';

// MyOl
import * as controls from '../src/Controls';
import * as controlcollection from '../src/controlCollection';
import * as editor from '../src/Editor';
import * as files from '../src/Files';
import * as geolocation from '../src/Geolocation';
import * as layerswitcher from '../src/LayerSwitcher';
import * as marker from '../src/Marker';

export default {
	control: {
		//Button: controls.controlButton,
		//Download: files.controlDownload,
		//GPS: geolocation.controlGPS,
		LayerSwitcher: layerswitcher.controlLayerSwitcher,
		LoadGPX: files.controlLoadGPX,
		MousePosition: controls.controlMousePosition,
		Permalink: controls.controlPermalink,
		Print: controls.controlPrint,
		collection: controlcollection.controlCollection,
	},
	geom: {
		MultiPolygon: MultiPolygon,
	},
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
	},
}
*/

// Debug
import {
	VERSION
} from 'ol/util';
console.log('Ol V' + VERSION);
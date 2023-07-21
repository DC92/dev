// This file defines the contents of the dist/myol.css & dist/myol libraries
// This contains all what is necessary for refuges.info & chemineur.fr websites

// Openlayers
import 'ol/ol.css';

import Map from 'ol/Map';
import View from 'ol/View';
const myol = {
	Map: Map,
	View: View,
};

import Attribution from 'ol/control/Attribution';
myol.control = {
	Attribution: Attribution,
};

import * as proj from 'ol/proj';
myol.proj = {
	fromLonLat: proj.fromLonLat,
	transformExtent: proj.transformExtent,
};

// MyOl
//import * as myVectorLayer from '../src/MyVectorLayer';
import * as vectorLayerCollection from '../src/VectorLayerCollection';
myol.layer = {
	WriAreas: vectorLayerCollection.WriAreas,
};


//TMP
import OSM from 'ol/source/OSM';
import Tile from 'ol/layer/Tile';
myol.source = {
	OSM: OSM,
};
myol.layer.Tile = Tile;
//TMP


export default myol;


/*
import FullScreen from 'ol/control/FullScreen';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';
myol.	control:{
		Attribution:Attribution,
		FullScreenFullScreen:FullScreenFullScreen,
		ScaleLine:ScaleLine,
		Zoom:Zoom,
	},

import * as style from 'ol/style';

import MultiPolygon from 'ol/geom/MultiPolygon';
import Stroke from 'ol/style/Stroke';

// MyOl
import * as controls from '../src/Controls';
import * as controlcollection from '../src/controlCollection';
import * as editor from '../src/Editor';
import * as files from '../src/Files';
import * as geolocation from '../src/Geolocation';
import * as layerswitcher from '../src/LayerSwitcher';
import * as marker from '../src/Marker';
import * as tilelayercollection from '../src/TileLayerCollection';
import * as stylesOptions from '../src/stylesOptions';
import * as myvectorlayer from '../src/MyVectorLayer';
import * as myVector from '../src/VectorLayerCollection';

export default {
	...myol,
	control: {
		Attribution: Attribution,
		//Button: controls.controlButton,
		//Download: files.controlDownload,
		FullScreen: FullScreen,
		//GPS: geolocation.controlGPS,
		LayerSwitcher: layerswitcher.controlLayerSwitcher,
		LoadGPX: files.controlLoadGPX,
		MousePosition: controls.controlMousePosition,
		Permalink: controls.controlPermalink,
		Print: controls.controlPrint,
		ScaleLine: ScaleLine,
		Zoom: Zoom,

		collection: controlcollection.controlCollection,
	},
	geom: {
		MultiPolygon: MultiPolygon,
	},
	stylesOptions: {
		label: stylesOptions.label,
	},
	layer: {
		ArcGisTile: tilelayercollection.ArcGisTileLayer,
		GoogleTile: tilelayercollection.GoogleTileLayer,
		IgnTile: tilelayercollection.IgnTileLayer,
		KompassMriTile: tilelayercollection.KompassMriTileLayer,
		Marker: marker.layerMarker,
		MriTile: tilelayercollection.MriTileLayer,
		OsmTile: tilelayercollection.OsmTileLayer,
		SpainTile: tilelayercollection.SpainTileLayer,
		SwissTopoTile: tilelayercollection.SwissTopoTileLayer,
		ThunderforestTile: tilelayercollection.ThunderforestTileLayer,
		TopoTile: tilelayercollection.TopoTileLayer,
		Wri: myVector.Wri,

		tileCollection: tilelayercollection.tileLayerCollection,
	},
	Map: Map,
	style: {
		Stroke: Stroke,
	},
	View: View,
}
*/

// Debug
import {
	VERSION
} from 'ol/util';
console.log('Ol V' + VERSION);
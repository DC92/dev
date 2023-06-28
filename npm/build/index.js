// This file defines the contents of the dist/myol.css & dist/myol.js libraries
// This contains all what is necessary for refuges.info & chemineur.fr websites

// Openlayers
import 'ol/ol.css';
import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import Map from 'ol/Map.js';
import MultiPolygon from 'ol/geom/MultiPolygon';
import ScaleLine from 'ol/control/ScaleLine';
import Stroke from 'ol/style/Stroke';
import View from 'ol/View.js';
import Zoom from 'ol/control/Zoom';
import * as proj from 'ol/proj.js';

// MyOl
import * as controls from '../src/Controls.js';
import * as controlcollection from '../src/controlCollection.js';
import * as editor from '../src/Editor.js';
import * as files from '../src/Files.js';
import * as geolocation from '../src/Geolocation.js';
import * as layerswitcher from '../src/LayerSwitcher.js';
import * as marker from '../src/Marker.js';
import * as tilelayercollection from '../src/TileLayerCollection.js';
import * as vectorlayer from '../src/MyVectorLayer.js';
import * as vectorlayercollection from '../src/VectorLayerCollection.js';

export default {
	control: {
		Attribution: Attribution,
		Button: controls.controlButton,
		Download: files.controlDownload,
		FullScreen: FullScreen,
		GPS: geolocation.controlGPS,
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
		label: vectorlayer.labelStylesOptions,
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
		Wri: vectorlayercollection.LayerWri,

		tileCollection: tilelayercollection.tileLayerCollection,
	},
	Map: Map,
	proj: {
		fromLonLat: proj.fromLonLat,
		transformExtent: proj.transformExtent,
	},
	style: {
		Stroke: Stroke,
	},
	View: View,
}

// Debug
import {
	VERSION
} from 'ol/util.js';
console.log('Ol V' + VERSION);
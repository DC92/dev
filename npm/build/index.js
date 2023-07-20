// This file defines the contents of the dist/myol.css & dist/myol libraries
// This contains all what is necessary for refuges.info & chemineur.fr websites

// Openlayers
import 'ol/ol.css';
import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import Map from 'ol/Map';
import MultiPolygon from 'ol/geom/MultiPolygon';
import ScaleLine from 'ol/control/ScaleLine';
import Stroke from 'ol/style/Stroke';
import View from 'ol/View';
import Zoom from 'ol/control/Zoom';
import * as proj from 'ol/proj';
import * as style from 'ol/style';

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
} from 'ol/util';
console.log('Ol V' + VERSION);
// This file defines the contents of the dist/myol.css & dist/myol.js libraries
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

/* Openlayers for Geocoder */
//TODO DELETE import * as feature from 'ol/Feature';
import Feature from 'ol/Feature';
import Icon from 'ol/style/Icon';
import * as proj from 'ol/proj'; //TODO
import Point from 'ol/geom/Point';
import SourceLayer from 'ol/source/Vector';
import Style from 'ol/style/Style';
import VectorLayer from 'ol/layer/Vector';

// MyOl
import * as mycontrols from '../src/Controls';
import * as mycontrolcollection from '../src/controlCollection';
import * as myeditor from '../src/Editor';
import * as myfiles from '../src/Files';
import * as mygeolocation from '../src/Geolocation';
import * as mylayerswitcher from '../src/LayerSwitcher';
import * as mymarker from '../src/Marker';
import * as mytilelayercollection from '../src/TileLayerCollection';
import * as myvectorlayer from '../src/VectorLayer';
import * as myvectorlayercollection from '../src/VectorLayerCollection';

// Geocoder
import Geocoder from '@kirtandesai/ol-geocoder/dist/ol-geocoder';

export default {
	control: {
		Attribution: Attribution,
		Button: mycontrols.controlButton,
		Download: myfiles.controlDownload,
		FullScreen: FullScreen,
		GPS: mygeolocation.controlGPS,
		LayerSwitcher: mylayerswitcher.controlLayerSwitcher,
		LoadGPX: myfiles.controlLoadGPX,
		MousePosition: mycontrols.controlMousePosition,
		Permalink: mycontrols.controlPermalink,
		Print: mycontrols.controlPrint,
		ScaleLine: ScaleLine,
		Zoom: Zoom,

		collection: mycontrolcollection.controlCollection,
	},
	Feature: Feature,
	Geocoder: Geocoder,
	geom: {
		MultiPolygon: MultiPolygon,
		Point: Point,
	},
	styleOptions: {
		label: myvectorlayer.labelStyleOptions,
	},
	source: {
		Vector: SourceLayer,
	},
	layer: {
		ArcGisTile: mytilelayercollection.ArcGisTileLayer,
		GoogleTile: mytilelayercollection.GoogleTileLayer,
		IgnTile: mytilelayercollection.IgnTileLayer,
		KompassMriTile: mytilelayercollection.KompassMriTileLayer,
		Marker: mymarker.layerMarker,
		MriTile: mytilelayercollection.MriTileLayer,
		OsmTile: mytilelayercollection.OsmTileLayer,
		SpainTile: mytilelayercollection.SpainTileLayer,
		SwissTopoTile: mytilelayercollection.SwissTopoTileLayer,
		ThunderforestTile: mytilelayercollection.ThunderforestTileLayer,
		tileCollection: mytilelayercollection.tileLayerCollection,
		TopoTile: mytilelayercollection.TopoTileLayer,
		Vector: VectorLayer,
		Wri: myvectorlayercollection.LayerWri,
	},
	Map: Map,
	//import * as proj from 'ol/proj';
	proj: {
		fromLonLat: proj.fromLonLat,
		transformExtent: proj.transformExtent,
	},
	style: {
		Icon: Icon,
		Stroke: Stroke,
		Style: Style,
	},
	View: View,
}

// Debug
import {
	VERSION
} from 'ol/util';
console.log('Ol V' + VERSION);
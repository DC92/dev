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
import '../src/controls.css';
import '../src/layerSwitcher.css';
import '../src/editor.css';
import * as controls from '../src/Controls.js';
import * as files from '../src/Files.js';
import * as geolocation from '../src/Geolocation.js';
import * as layerswitcher from '../src/LayerSwitcher.js';
import * as marker from '../src/Marker.js';
import * as tilelayercollection from '../src/TileLayerCollection.js';

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
	},
	geom: {
		MultiPolygon: MultiPolygon,
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
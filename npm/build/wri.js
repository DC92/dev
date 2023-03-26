// Openlayers
import 'ol/ol.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
var myol = {
	Map: Map,
	View: View,
}

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

import MultiPolygon from 'ol/geom/MultiPolygon';
myol.geom = {
	MultiPolygon: MultiPolygon,
};

import {
	fromLonLat,
	transformExtent,
} from 'ol/proj.js';
myol.proj = {
	fromLonLat: fromLonLat,
	transformExtent: transformExtent,
};

import Stroke from 'ol/style/Stroke';
myol.style = {
	Stroke: Stroke,
};

// MyOl
import {
	controlButton,
	controlMousePosition,
	controlPermalink,
	controlPrint,
} from '../src/Controls.js';
import {
	controlDownload,
	controlLoadGPX,
} from '../src/Files.js';
import {
	controlGPS,
} from '../src/Geolocation.js';
import {
	controlLayerSwitcher,
} from '../src/LayerSwitcher.js';
myol.control = {
	...myol.control,
	Button: controlButton,
	Download: controlDownload,
	GPS: controlGPS,
	LayerSwitcher: controlLayerSwitcher,
	LoadGPX: controlLoadGPX,
	MousePosition: controlMousePosition,
	Permalink: controlPermalink,
	Print: controlPrint,
};

import {
	layerMarker,
} from '../src/Marker.js';
import {
	ArcGisTileLayer,
	GoogleTileLayer,
	IgnTileLayer,
	KompassMriTileLayer,
	MriTileLayer,
	OsmTileLayer,
	SpainTileLayer,
	SwissTopoTileLayer,
	ThunderforestTileLayer,
	TopoTileLayer,
} from '../src/TileLayerCollection.js';
myol.layer = {
	ArcGisTile: ArcGisTileLayer,
	GoogleTile: GoogleTileLayer,
	IgnTile: IgnTileLayer,
	KompassMriTile: KompassMriTileLayer,
	Marker: layerMarker,
	MriTile: MriTileLayer,
	OsmTile: OsmTileLayer,
	SpainTile: SpainTileLayer,
	SwissTopoTile: SwissTopoTileLayer,
	ThunderforestTile: ThunderforestTileLayer,
	TopoTile: TopoTileLayer,
};
import {
	LayerWri,
} from '../src/VectorLayerCollection.js';

export default myol;
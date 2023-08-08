// Openlayers imports used in this package
// Will be used in the sources & the build

import 'ol/ol.css';

import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
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
import * as control from 'ol/control';
import * as format from 'ol/format';
import * as loadingstrategy from 'ol/loadingstrategy';
import * as proj from 'ol/proj';
import * as style from 'ol/style';

export default {
	Map: Map,
	View: View,
	control: {
		Attribution: control.Attribution,
		Control: control.Control,
		FullScreen: control.FullScreen,
		MousePosition: control.MousePosition,
		ScaleLine: control.ScaleLine,
		Zoom: control.Zoom,
	},
	format: {
		GeoJSON: format.GeoJSON,
		GPX: format.GPX,
		KML: format.KML,
	},
	geom: {
		MultiPolygon: MultiPolygon,
	},
	interaction: {
		MouseWheelZoom: MouseWheelZoom,
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
	style: {
		Circle: style.Circle,
		Fill: style.Fill,
		Icon: style.Icon,
		Stroke: style.Stroke,
		Style: style.Style,
		Text: style.Text,
	},
};
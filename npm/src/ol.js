// Openlayers imports used in this package
// Will be used in the sources & the build

import 'ol/ol.css';

import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import Map from 'ol/Map';
import OSM from 'ol/source/OSM';
import Stamen from 'ol/source/Stamen';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import View from 'ol/View';
import * as control from 'ol/control';
import * as coordinate from 'ol/coordinate';
import * as extent from 'ol/extent';
import * as format from 'ol/format';
import * as geom from 'ol/geom';
import * as loadingstrategy from 'ol/loadingstrategy';
import * as proj from 'ol/proj';
import * as sphere from 'ol/sphere';
import * as style from 'ol/style';

export default {
	Feature: Feature,
	Geolocation: Geolocation,
	Map: Map,
	View: View,
	control: control, // Quite all controls are used ...
	format: { // Not all formats are used ...
		GeoJSON: format.GeoJSON,
		GPX: format.GPX,
		KML: format.KML,
	},
	extent: {
		getArea: extent.getArea,
		getCenter: extent.getCenter,
		getWidth: extent.getWidth,
		getTopLeft: extent.getTopLeft,
		isEmpty: extent.isEmpty,
	},
	coordinate: {
		createStringXY: coordinate.createStringXY,
	},
	geom: {
		GeometryCollection: geom.GeometryCollection,
		LineString: geom.LineString,
		MultiLineString: geom.MultiLineString,
		MultiPolygon: geom.MultiPolygon,
	},
	interaction: {
		MouseWheelZoom: MouseWheelZoom,
	},
	layer: {
		Tile: TileLayer,
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
	sphere: {
		getDistance: sphere.getDistance,
		getLength: sphere.getLength,
	},
	style: style,
};
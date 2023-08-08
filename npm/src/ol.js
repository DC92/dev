// Openlayers imports used in this package
// Will be used in the sources & the build

import 'ol/ol.css';

import Feature from 'ol/Feature';
import Geolocation from 'ol/Geolocation';
import Map from 'ol/Map';
import View from 'ol/View';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import * as control from 'ol/control';
import * as coordinate from 'ol/coordinate';
import * as extent from 'ol/extent';
import * as format from 'ol/format';
import * as geom from 'ol/geom';
import * as interaction from 'ol/interaction';
import * as layer from 'ol/layer';
import * as loadingstrategy from 'ol/loadingstrategy';
import * as proj from 'ol/proj';
import * as source from 'ol/source';
import * as sphere from 'ol/sphere';
import * as style from 'ol/style';

export default {
	control: control,
	coordinate: coordinate,
	extent: extent,
	Feature: Feature,
	format: { // Not all formats are used ...
		GeoJSON: format.GeoJSON,
		GPX: format.GPX,
		KML: format.KML,
	},
	Geolocation: Geolocation,
	geom: geom,
	interaction: {
		Draw: interaction.Draw,
		Modify: interaction.Modify,
		MouseWheelZoom: interaction.MouseWheelZoom,
		Pointer: interaction.Pointer,
		Snap: interaction.Snap,
	},
	layer: {
		Tile: layer.Tile,
		Vector: layer.Vector,
	},
	Map: Map,
	loadingstrategy: loadingstrategy,
	proj: proj,
	source: {
		BingMaps: source.BingMaps,
		Cluster: source.Cluster,
		OSM: source.OSM,
		Stamen: source.Stamen,
		TileWMS: source.TileWMS,
		Vector: source.Vector,
		WMTS: source.WMTS,
		XYZ: source.XYZ,
	},
	sphere: sphere,
	style: style,
	tilegrid: {
		WMTS: WMTSTileGrid,
	},
	View: View,
};
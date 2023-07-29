/**
 * Marker.js
 * Marker position display & edit
 * Options:
   src : url of the marker image
   prefix : id prefix of input/output values
   focus : center & zoom on the marker
   dragable : can draw the marker to edit position
 */

// Proj4.js
import proj4 from 'proj4/lib/index.js';

// Openlayers
import Feature from 'ol/Feature.js';
import Icon from 'ol/style/Icon.js';
import Point from 'ol/geom/Point.js';
import Pointer from 'ol/interaction/Pointer.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import {
	toStringHDMS,
} from 'ol/coordinate.js';
import {
	containsCoordinate,
} from 'ol/extent.js';
import {
	transform,
} from 'ol/proj.js';
import {
	register
} from 'ol/proj/proj4.js';
import {
	Style,
} from 'ol/style.js';


// Layer to display a marker
//BEST make it a class
export default function Marker(opt) {
	const options = {
			position: [0, 0],
			...opt,
		},
		els = [],
		point = new Point(options.position),
		source = new VectorSource({
			features: [new Feature(point)],
		}),
		layer = new VectorLayer({
			source: source,
			zIndex: 1000, // Above points
			style: new Style({
				image: new Icon({
					src: options.src,
				}),
			}),
			...options,
		});
	let view;

	// Initialise specific projection
	if (typeof proj4 == 'function') {
		// Swiss
		proj4.defs('EPSG:21781',
			'+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 ' +
			'+k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel ' +
			'+towgs84=660.077,13.551,369.344,2.484,1.783,2.939,5.66 +units=m +no_defs'
		);

		// UTM zones
		for (let u = 1; u <= 60; u++) {
			proj4.defs('EPSG:' + (32600 + u), '+proj=utm +zone=' + u + ' +ellps=WGS84 +datum=WGS84 +units=m +no_defs');
			proj4.defs('EPSG:' + (32700 + u), '+proj=utm +zone=' + u + ' +ellps=WGS84 +datum=WGS84 +units=m +no_defs');
		}

		register(proj4);
	}

	// Collect all entries elements
	['json', 'lon', 'lat', 'x', 'y', 'select', 'string'].forEach(i => {
		els[i] = document.getElementById((options.prefix || 'marker') + '-' + i) || document.createElement('div');
		els[i].onchange = onChange;
	});

	// Initialise position with existing entries values
	els.lon.onchange();
	els.json.onchange();

	// Read new values
	function onChange(evt) {
		// Find changed input type from tne input id
		const idMatch = (evt ? evt.target : this).id.match(/-([a-z]+)/);

		if (idMatch)
			switch (idMatch[1]) {
				case 'json': // Init the field
					changeLL([...els.json.value.matchAll(/-?[0-9\.]+/g)], 'EPSG:4326', true);
					break;
				case 'lon': // Change lon / lat
				case 'lat':
					changeLL([els.lon.value, els.lat.value], 'EPSG:4326', true);
					break;
				case 'x': // Change X / Y
				case 'y':
					changeLL([els.x.value, els.y.value], 'EPSG:21781', true);
					break;
				case 'select': // Change the display format
					changeLL();
			}
	}

	layer.setMapInternal = function(map) {
		map.once('loadstart', () => { // Hack to be noticed at map init
			view = map.getView();
			const pc = point.getCoordinates();

			// Focus on the marker
			if (options.focus && view) {
				if (pc[0] && pc[1])
					view.setCenter(pc);
				else
					// If no position given, put the marker on the center of the visible map
					changeLL(view.getCenter(), 'EPSG:3857');

				view.setZoom(options.focus);
			}

			// Edit the marker position
			if (options.dragable) {
				// Drag the marker
				map.addInteraction(new Pointer({
					handleDownEvent: function(evt) {
						return map.getFeaturesAtPixel(evt.pixel, {
							layerFilter: function(l) {
								return l.ol_uid == layer.ol_uid;
							}
						}).length;
					},
					handleDragEvent: function(evt) {
						changeLL(evt.coordinate, 'EPSG:3857');
					},
				}));

				// Get the marker at the dblclick position
				map.on('dblclick', function(evt) {
					changeLL(evt.coordinate, 'EPSG:3857');
					return false;
				});
			}
		});
	};

	// Display values
	function changeLL(pos, projection, focus) {
		//BEST change the cursor
		// If no position is given, use the marker's
		if (!pos || pos.length < 2) {
			pos = point.getCoordinates();
			projection = 'EPSG:3857';
		}

		// Don't change if none entry
		if (!pos[0] && !pos[1])
			return;

		const ll4326 = transform([
			// Protection against non-digital entries / transform , into .
			parseFloat(pos[0].toString().replace(/[^-0-9]+/, '.')),
			parseFloat(pos[1].toString().replace(/[^-0-9]+/, '.'))
		], projection, 'EPSG:4326');

		ll4326[0] -= Math.round(ll4326[0] / 360) * 360; // Wrap +-180°

		const ll3857 = transform(ll4326, 'EPSG:4326', 'EPSG:3857'),
			inEPSG21781 = typeof proj4 == 'function' &&
			containsCoordinate([664577, 5753148, 1167741, 6075303], ll3857);

		// Move the marker
		point.setCoordinates(ll3857);

		// Move the map
		if (focus && view)
			view.setCenter(ll3857);

		// Populate inputs
		els.lon.value = Math.round(ll4326[0] * 100000) / 100000;
		els.lat.value = Math.round(ll4326[1] * 100000) / 100000;
		els.json.value = '{"type":"Point","coordinates":[' + els.lon.value + ',' + els.lat.value + ']}';

		// Display
		const strings = {
			dec: 'Lon: ' + els.lon.value + ', Lat: ' + els.lat.value,
			dms: toStringHDMS(ll4326),
		};

		if (inEPSG21781) {
			const ll21781 = transform(ll4326, 'EPSG:4326', 'EPSG:21781'),
				z = Math.floor(ll4326[0] / 6 + 90) % 60 + 1,
				u = 32600 + z + (ll4326[1] < 0 ? 100 : 0),
				llutm = transform(ll3857, 'EPSG:4326', 'EPSG:' + u);

			// UTM zones
			strings.utm = ' UTM ' + z +
				' E:' + Math.round(llutm[0]) + ' ' +
				(llutm[1] > 0 ? 'N:' : 'S:') + Math.round(llutm[1] + (llutm[1] > 0 ? 0 : 10000000));

			// Swiss
			els.x.value = Math.round(ll21781[0]);
			els.y.value = Math.round(ll21781[1]);
			strings.swiss = 'X=' + els.x.value + ', Y=' + els.y.value + ' (CH1903)';
		}
		// When not on the CH1903 extend, hide the choice
		else if (els.select.value == 'swiss')
			els.select.value = 'dec';

		// Hide Swiss coordinates when out of extent
		document.querySelectorAll('.xy').forEach(el =>
			el.style.display = inEPSG21781 ? '' : 'none'
		);

		// Display selected format
		els.string.textContent = strings[els.select.value || 'dec'];
	}

	return layer;
}
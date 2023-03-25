/**
 * GPS control
 */
import 'ol/ol.css';
import Control from 'ol/control/Control.js';
import Feature from 'ol/Feature.js';
import Geolocation from 'ol/Geolocation.js';
import GeometryCollection from 'ol/geom/GeometryCollection.js';
import LineString from 'ol/geom/LineString.js';
import MultiLineString from 'ol/geom/MultiLineString.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import {
	Fill,
	Stroke,
	Style,
} from 'ol/style.js';

import '@kirtandesai/ol-geocoder/dist/ol-geocoder.css';

import {
	controlButton,
} from './Controls.js';


//BEST make it a class GeolocationControl
export function controlGPS(options) {
	const subMenu = location.href.match(/(https|localhost)/) ?
		//BEST use .html content / option
		'<p>Localisation GPS:</p>' +
		'<label>' +
		'<input type="radio" name="myol-gps-source" value="0" ctrlonchange="renderGPS" checked="checked" />' +
		'Inactif</label><label>' +
		'<input type="radio" name="myol-gps-source" value="1" ctrlonchange="renderGPS" />' +
		'Position GPS <span>(1) extérieur</span></label><label>' +
		'<input type="radio" name="myol-gps-source" value="2" ctrlonchange="renderGPS" />' +
		'Position GPS ou IP <span>(2) intérieur</span></label><hr><label>' +
		'<input type="radio" name="myol-gps-display" value="0" ctrlonchange="renderGPS" checked="checked" />' +
		'Graticule, carte libre</label><label>' +
		'<input type="radio" name="myol-gps-display" value="1" ctrlonchange="renderGPS" />' +
		'Centre la carte, nord en haut</label><label>' +
		'<input type="radio" name="myol-gps-display" value="2" ctrlonchange="renderGPS" />' +
		'Centre et oriente la carte <span>(3)</span></label>' +

		'<hr /><p>(1) plus précis en extérieur mais plus lent à initialiser, ' +
		'nécessite un capteur et une réception GPS.</p>' +
		'<p>(2) plus précis et rapide en intérieur ou en zone urbaine ' +
		'mais peut être très erroné en extérieur à l&apos;initialisation. ' +
		'Utilise les position des points WiFi proches en plus du GPS dont il peut se passer.</p>' +
		'<p>(3) nécessite un capteur magnétique et un explorateur le supportant.</p>' :

		// Si on est en http
		'<p>L&apos;utilisation du GPS nécessite https</p>' +
		'<a href="' + document.location.href.replace('http:', 'https:') + '">Passer en https<a>',

		// Display status, altitude & speed
		control = controlButton({
			className: 'myol-button-gps',
			label: '&#x2295;',
			submenuHTML: subMenu,
			...options,
		}),

		// Graticule
		graticuleFeature = new Feature(), //BEST Use layer Graticule
		northGraticuleFeature = new Feature(),
		graticuleLayer = new VectorLayer({
			source: new VectorSource({
				features: [graticuleFeature, northGraticuleFeature],
			}),
			zIndex: 20, // Above the features
			style: new Style({
				fill: new Fill({
					color: 'rgba(128,128,255,0.2)',
				}),
				stroke: new Stroke({
					color: '#20b',
					lineDash: [16, 14],
					width: 1,
				}),
			}),
		}),
		statusEl = document.createElement('p');

	control.element.appendChild(statusEl);

	graticuleFeature.setStyle(new Style({
		stroke: new Stroke({
			color: '#000',
			lineDash: [16, 14],
			width: 1,
		}),
	}));

	northGraticuleFeature.setStyle(new Style({
		stroke: new Stroke({
			color: '#c00',
			lineDash: [16, 14],
			width: 1,
		}),
	}));

	let geolocation;
	window.gpsValues = {}; // Store the measures for internal use & other controls

	control.setMap = function(map) { //HACK execute actions on Map init
		Control.prototype.setMap.call(this, map);

		map.addLayer(graticuleLayer);
		map.on('moveend', control.renderGPS); // Refresh graticule after map zoom

		geolocation = new Geolocation({
			projection: map.getView().getProjection(),
			trackingOptions: {
				enableHighAccuracy: true,
				maximumAge: 1000,
				timeout: 1000,
				...options,
			},
		});
		geolocation.on('change', control.renderGPS);
		geolocation.on('error', function(error) {
			console.log('Geolocation error: ' + error.message);
		});

		// Browser heading from the inertial & magnetic sensors
		window.addEventListener('deviceorientationabsolute', function(evt) {
			window.gpsValues.heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
			control.renderGPS(evt);
		});
	};

	// Trigered by <input ... ctrlOnChange="renderGPS" />
	control.renderGPS = function(evt) {
		const sourceLevelEl = document.querySelector('input[name="myol-gps-source"]:checked'),
			displayLevelEl = document.querySelector('input[name="myol-gps-display"]:checked'),
			displayEls = document.getElementsByName('myol-gps-display'),
			sourceLevel = sourceLevelEl ? parseInt(sourceLevelEl.value) : 0, // On/off, GPS, GPS&WiFi
			displayLevel = displayLevelEl ? parseInt(displayLevelEl.value) : 0, // Graticule & sourceLevel
			map = control.getMap(),
			view = map ? map.getView() : null;

		// Tune the tracking level
		if (evt.target.name == 'myol-gps-source') {
			geolocation.setTracking(sourceLevel > 0);
			graticuleLayer.setVisible(false);
			window.gpsValues = {}; // Reset the values
			if (!sourceLevel)
				displayEls[0].checked = true;
			if (sourceLevel && displayLevel == 0)
				displayEls[2].checked = true;
		}

		// Get geolocation values
		['Position', 'AccuracyGeometry', 'Speed', 'Altitude'].forEach(valueName => {
			const value = geolocation['get' + valueName]();
			if (value)
				window.gpsValues[valueName.toLowerCase()] = value;
		});

		// State 1 only takes positions from the GPS (which have an altitude)
		if (sourceLevel == 1 && !window.gpsValues.altitude)
			window.gpsValues.position = null;

		// Render position & graticule
		if (map && view && sourceLevel && window.gpsValues.position) {
			// Estimate the viewport size to draw a visible graticule
			const p = window.gpsValues.position,
				hg = map.getCoordinateFromPixel([0, 0]),
				bd = map.getCoordinateFromPixel(map.getSize()),
				far = Math.hypot(hg[0] - bd[0], hg[1] - bd[1]) * 10,
				// The graticule
				geometry = [
					new MultiLineString([
						[
							[p[0] - far, p[1]],
							[p[0] + far, p[1]]
						],
						[
							[p[0], p[1]],
							[p[0], p[1] - far]
						],
					]),
				],
				// Color north in red
				northGeometry = [
					new LineString([
						[p[0], p[1]],
						[p[0], p[1] + far]
					]),
				];

			// The accuracy circle
			if (window.gpsValues.accuracygeometry)
				geometry.push(window.gpsValues.accuracygeometry);

			graticuleFeature.setGeometry(new GeometryCollection(geometry));
			northGraticuleFeature.setGeometry(new GeometryCollection(northGeometry));

			// Center the map
			if (displayLevel > 0)
				view.setCenter(p);

			// Orientation
			if (!sourceLevel || displayLevel == 1)
				view.setRotation(0);
			else if (window.gpsValues.heading && displayLevel == 2)
				view.setRotation(
					Math.PI / 180 * (window.gpsValues.heading - screen.orientation.angle) // Delivered ° reverse clockwize
				);

			// Zoom on the area
			if (!window.gpsValues.isZoomed) { // Only the first time after activation
				window.gpsValues.isZoomed = true;
				view.setZoom(17);

				// Close submenu when GPS locates
				control.element.classList.remove('myol-button-hover');
				control.element.classList.remove('myol-button-selected');
			}
			graticuleLayer.setVisible(true);
		} else
			view.setRotation(0); // Return to inactive state

		// Display data under the button
		let status = window.gpsValues.position ? '' : 'Sync...';
		if (window.gpsValues.altitude) {
			status = Math.round(window.gpsValues.altitude) + ' m';
			if (window.gpsValues.speed)
				status += ' ' + (Math.round(window.gpsValues.speed * 36) / 10) + ' km/h';
		}
		if (statusEl)
			statusEl.innerHTML = sourceLevel ? status : '';

		// Close the submenu
		if (evt.target.name) // Only when an input is hit
			control.element.classList.remove('myol-display-submenu');
	};

	return control;
}
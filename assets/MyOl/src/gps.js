/**
 * GPS control
 * Requires controlButton
 */
function controlGPS(options) {
	const subMenu = location.href.match(/(https|localhost)/) ?
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

		//BEST use .html content / option
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
			...options
		}),

		// Graticule
		graticuleFeature = new ol.Feature(),
		northGraticuleFeature = new ol.Feature(),
		graticuleLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features: [graticuleFeature, northGraticuleFeature],
			}),
			zIndex: 20, // Above the features
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(128,128,255,0.2)',
				}),
				stroke: new ol.style.Stroke({
					color: '#20b',
					lineDash: [16, 14],
					width: 1,
				}),
			}),
		}),
		statusEl = document.createElement('p');

	control.element.appendChild(statusEl);

	graticuleFeature.setStyle(new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: '#000',
			lineDash: [16, 14],
			width: 1,
		}),
	}));

	northGraticuleFeature.setStyle(new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: '#c00',
			lineDash: [16, 14],
			width: 1,
		}),
	}));

	let geolocation;
	ol.gpsValues = {}; // Store the measures for internal use & other controls

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		map.addLayer(graticuleLayer);
		map.on('moveend', control.renderGPS); // Refresh graticule after map zoom

		geolocation = new ol.Geolocation({
			projection: map.getView().getProjection(),
			trackingOptions: {
				enableHighAccuracy: true,
				maximumAge: 1000,
				timeout: 1000,
				...options
			},
		});
		geolocation.on('change', control.renderGPS);
		geolocation.on('error', function(error) {
			console.log('Geolocation error: ' + error.message);
		});

		// Browser heading from the inertial & magnetic sensors
		window.addEventListener('deviceorientationabsolute', function(evt) {
			ol.gpsValues.heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
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
			ol.gpsValues = {}; // Reset the values
			if (!sourceLevel)
				displayEls[0].checked = true;
			if (sourceLevel && displayLevel == 0)
				displayEls[2].checked = true;
		}

		// Get geolocation values
		['Position', 'AccuracyGeometry', 'Speed', 'Altitude'].forEach(valueName => {
			const value = geolocation['get' + valueName]();
			if (value)
				ol.gpsValues[valueName.toLowerCase()] = value;
		});

		// State 1 only takes positions from the GPS (which have an altitude)
		if (sourceLevel == 1 && !ol.gpsValues.altitude)
			ol.gpsValues.position = null;

		// Render position & graticule
		if (map && view && sourceLevel && ol.gpsValues.position) {
			// Estimate the viewport size to draw a visible graticule
			const p = ol.gpsValues.position,
				hg = map.getCoordinateFromPixel([0, 0]),
				bd = map.getCoordinateFromPixel(map.getSize()),
				far = Math.hypot(hg[0] - bd[0], hg[1] - bd[1]) * 10,
				// The graticule
				geometry = [
					new ol.geom.MultiLineString([
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
					new ol.geom.LineString([
						[p[0], p[1]],
						[p[0], p[1] + far]
					]),
				];

			// The accuracy circle
			if (ol.gpsValues.accuracygeometry)
				geometry.push(ol.gpsValues.accuracygeometry);

			graticuleFeature.setGeometry(new ol.geom.GeometryCollection(geometry));
			northGraticuleFeature.setGeometry(new ol.geom.GeometryCollection(northGeometry));

			// Center the map
			if (displayLevel > 0)
				view.setCenter(p);

			// Orientation
			if (!sourceLevel || displayLevel == 1)
				view.setRotation(0);
			else if (ol.gpsValues.heading && displayLevel == 2)
				view.setRotation(
					Math.PI / 180 * (ol.gpsValues.heading - screen.orientation.angle) // Delivered ° reverse clockwize
				);

			// Zoom on the area
			if (!ol.gpsValues.isZoomed) { // Only the first time after activation
				ol.gpsValues.isZoomed = true;
				view.setZoom(17);

				// Close submenu when GPS locates
				control.element.classList.remove('myol-button-selected');
			}
			graticuleLayer.setVisible(true);
		} else
			view.setRotation(0); // Return to inactive state

		// Display data under the button
		let status = ol.gpsValues.position ? '' : 'Sync...';
		if (ol.gpsValues.altitude) {
			status = Math.round(ol.gpsValues.altitude) + ' m';
			if (ol.gpsValues.speed)
				status += ' ' + (Math.round(ol.gpsValues.speed * 36) / 10) + ' km/h';
		}
		if (statusEl)
			statusEl.innerHTML = sourceLevel ? status : '';

		// Close the submenu
		if (evt.target.name) // Only when an input is hit
			control.element.classList.remove('myol-display-submenu');
	};

	return control;
}
/**
 * Marker position display & edit
 * Requires myol:onadd
 * Options:
 *   image : url of the marker image
 *   prefix : id prefix of input/output values
 *   focus : center & zoom on the marker
 *   dragable : can draw the marker to edit position
 */
function layerMarker(options) {
	const els = [],
		point = new ol.geom.Point([0, 0]),
		layer = new ol.layer.Vector(Object.assign({
			source: new ol.source.Vector({
				features: [new ol.Feature(point)],
			}),
			zIndex: 1,
			style: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [0.5, 0.5],
					src: options.image,
				}),
			}),
		}, options));

	// Initialise specific projection
	if (typeof proj4 == 'function') {
		// Swiss
		proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=660.077,13.551,369.344,2.484,1.783,2.939,5.66 +units=m +no_defs');

		// UTM zones
		for (let u = 1; u <= 60; u++) {
			proj4.defs('EPSG:' + (32600 + u), '+proj=utm +zone=' + u + ' +ellps=WGS84 +datum=WGS84 +units=m +no_defs');
			proj4.defs('EPSG:' + (32700 + u), '+proj=utm +zone=' + u + ' +ellps=WGS84 +datum=WGS84 +units=m +no_defs');
		}

		ol.proj.proj4.register(proj4);
	}

	// Collect all entries elements
	['json', 'lon', 'lat', 'x', 'y', 'coords', 'select', 'string'].forEach(i => {
		els[i] = document.getElementById((options.prefix || 'marker') + '-' + i) || document.createElement('div');
		els[i].onchange = onChange;
	});

	// Initialise position with existing entries values
	els.lon.onchange();
	els.json.onchange();

	// Read new values
	function onChange() {
		const fieldName = this.id.match(/-([a-z])/);

		if (fieldName) {
			if (fieldName[1] == 'j') { // json
				const json = (els.json.value).match(/([0-9\.]+)[, ]*([0-9\.]+)/);

				if (json)
					changeLL(json.slice(1), 'EPSG:4326', true);
			} else
			if (fieldName[1] == 'l') // lon | lat
				changeLL([els.lon.value, els.lat.value], 'EPSG:4326', true);
			else
			if (typeof proj4 == 'function') // x | y
				changeLL([parseInt(els.x.value), parseInt(els.y.value)], 'EPSG:21781', true);
		}
	}

	// Display values
	function changeLL(ll, projection, focus) {
		if (ll[0] && ll[1]) {
			// Wrap +-180°
			const bounds = ol.proj.transform([180, 85], 'EPSG:4326', projection);

			ll[0] -= Math.round(ll[0] / bounds[0] / 2) * bounds[0] * 2;

			const ll3857 = ol.proj.transform(ll, projection, 'EPSG:3857'),
				ll4326 = ol.proj.transform(ll, projection, 'EPSG:4326');

			// Move the marker
			point.setCoordinates(ll3857);

			// Move the map
			if (focus && layer.map_)
				layer.map_.getView().setCenter(ll3857);

			// Populate inputs
			els.lon.value = Math.round(ll4326[0] * 100000) / 100000;
			els.lat.value = Math.round(ll4326[1] * 100000) / 100000;
			els.json.value = '{"type":"Point","coordinates":[' + els.lon.value + ',' + els.lat.value + ']}';

			// Display	
			const strings = {
				dec: 'Lon: ' + els.lon.value + ', Lat: ' + els.lat.value,
				dms: ol.coordinate.toStringHDMS(ll4326),
			};

			if (typeof proj4 == 'function') {
				// UTM zones
				const z = Math.floor(ll4326[0] / 6 + 90) % 60 + 1,
					u = 32600 + z + (ll4326[1] < 0 ? 100 : 0),
					llutm = ol.proj.transform(ll, projection, 'EPSG:' + u);

				// Swiss
				const ll21781 = ol.proj.transform(ll, projection, 'EPSG:21781');
				els.x.value = Math.round(ll21781[0]);
				els.y.value = Math.round(ll21781[1]);

				// Display	
				strings.swiss = 'X=' + els.x.value + ', Y=' + els.y.value + ' (CH1903)';
				strings.utm = ' UTM ' + z +
					' E:' + Math.round(llutm[0]) + ' ' +
					(llutm[1] > 0 ? 'N:' : 'S:') + Math.round(llutm[1] + (llutm[1] > 0 ? 0 : 10000000));

				// Hide Swiss coordinates when out of extent
				const epsg21781 = ol.extent.containsCoordinate([664577, 5753148, 1167741, 6075303], ll3857);

				els.coords.classList[epsg21781 ? 'add' : 'remove']('epsg21781');

				if (!epsg21781 && els.select.value == 'swiss')
					els.select.value = 'dec';
			}

			// Display selected format
			els.string.textContent = strings[els.select.value || 'dec'];
		}
	}

	layer.once('myol:onadd', function(evt) {
		// Focus map on the marker
		if (options.focus) {
			evt.map.getView().setCenter(point.getCoordinates());
			evt.map.getView().setZoom(options.focus);
		}

		// Edit the marker position
		if (options.dragable) {
			// Drag the marker
			evt.map.addInteraction(new ol.interaction.Pointer({
				handleDownEvent: function(evt) {
					return evt.map.getFeaturesAtPixel(evt.pixel, {
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
			evt.map.on('dblclick', function(evt) {
				changeLL(evt.coordinate, 'EPSG:3857');
				return false;
			});
		}
	});

	return layer;
}
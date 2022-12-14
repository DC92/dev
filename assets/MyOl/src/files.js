/**
 * GPX file loader control
 * Requires controlButton
 */
//jshint esversion: 9

//BEST export / import names and links
//BEST Chemineur symbols in MyOl => translation sym (export symbols GPS ?)
//BEST misc formats
function controlLoadGPX(opt) {
	const options = {
			label: '&#x1F4C2;',
			submenuHTML: '<p>Importer un fichier au format GPX:</p>' +
				'<input type="file" accept=".gpx" ctrlOnChange="loadFile" />',
			...opt
		},
		control = controlButton(options);

	control.loadURL = async function(evt) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', evt.target.href);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200)
				loadText(xhr.responseText);
		};
		xhr.send();
	};

	// Load file at init		
	if (options.initFile) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', options.initFile);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200)
				loadText(xhr.responseText);
		};
		xhr.send();
	}

	// Load file on demand
	control.loadFile = function(evt) {
		const reader = new FileReader();

		if (evt.type == 'change' && evt.target.files)
			reader.readAsText(evt.target.files[0]);
		reader.onload = function() {
			loadText(reader.result);
		};
	};

	function loadText(text) {
		const map = control.getMap(),
			format = new ol.format.GPX(),
			features = format.readFeatures(text, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
			}),
			added = map.dispatchEvent({
				type: 'myol:onfeatureload', // Warn layerEditGeoJson that we uploaded some features
				features: features,
			});

		if (added !== false) { // If one used the feature
			// Display the track on the map
			const gpxSource = new ol.source.Vector({
					format: format,
					features: features,
				}),
				gpxLayer = new ol.layer.Vector({
					source: gpxSource,
					style: function(feature) {
						const properties = feature.getProperties(),
							styleOptions = {
								stroke: new ol.style.Stroke({
									color: 'blue',
									width: 3,
								}),
							};

						if (properties.sym)
							styleOptions.image = new ol.style.Icon({
								src: '//chemineur.fr/ext/Dominique92/GeoBB/icones/' + properties.sym + '.svg',
							});

						return new ol.style.Style(styleOptions);
					},
				});
			map.addLayer(gpxLayer);
		}

		// Zoom the map on the added features
		const extent = ol.extent.createEmpty();

		for (let f in features) //BEST try to create a geometry
			ol.extent.extend(extent, features[f].getGeometry().getExtent());

		if (ol.extent.isEmpty(extent))
			alert('Fichier GPX vide');
		else
			map.getView().fit(extent, {
				maxZoom: 17,
				size: map.getSize(), //BEST necessary ?
				padding: [5, 5, 5, 5],
			});

		// Close the submenu
		control.element.classList.remove('myol-display-submenu');
	}

	return control;
}

/**
 * File downloader control
 * Requires controlButton
 */
//TODO BUG incompatible with clusters
function controlDownload(opt) {
	const options = {
			label: '&#x1f4e5;',
			className: 'myol-button-download',
			submenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
				'contenant les éléments visibles dans la fenêtre:</p>' +
				'<a ctrlOnClick="download" id="GPX" mime="application/gpx+xml">GPX</a>' +
				'<a ctrlOnClick="download" id="KML" mime="vnd.google-earth.kml+xml">KML</a>' +
				'<a ctrlOnClick="download" id="GeoJSON" mime="application/json">GeoJSON</a>',
			fileName: document.title || 'openlayers', //BEST name from feature
			...opt
		},
		control = controlButton(options),
		hiddenEl = document.createElement('a');

	hiddenEl.target = '_self';
	hiddenEl.style = 'display:none';
	document.body.appendChild(hiddenEl);

	control.download = function(evt) {
		const formatName = evt.target.id,
			mime = evt.target.getAttribute('mime'),
			format = new ol.format[formatName](),
			map = control.getMap();
		let features = [],
			extent = map.getView().calculateExtent();

		// Get all visible features
		if (options.savedLayer)
			getFeatures(options.savedLayer);
		else
			map.getLayers().forEach(getFeatures);

		function getFeatures(savedLayer) {
			if (savedLayer.getSource() &&
				savedLayer.getSource().forEachFeatureInExtent) // For vector layers only
				savedLayer.getSource().forEachFeatureInExtent(extent, feature => {
					if (!savedLayer.getProperties().dragable) // Don't save the cursor
						features.push(feature);
				});
		}

		if (formatName == 'GPX')
			// Transform *Polygons in linestrings
			for (let f in features) {
				const geometry = features[f].getGeometry();

				if (geometry.getType().includes('Polygon')) {
					geometry.getCoordinates().forEach(coords => {
						if (typeof coords[0][0] == 'number')
							// Polygon
							features.push(new ol.Feature(new ol.geom.LineString(coords)));
						else
							// MultiPolygon
							coords.forEach(subCoords =>
								features.push(new ol.Feature(new ol.geom.LineString(subCoords)))
							);
					});
				}
			}

		const data = format.writeFeatures(features, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
				decimals: 5,
			})
			// Beautify the output
			.replace(/<[a-z]*>(0|null|[\[object Object\]|[NTZa:-]*)<\/[a-z]*>/g, '')
			.replace(/<Data name="[a-z_]*"\/>|<Data name="[a-z_]*"><\/Data>|,"[a-z_]*":""/g, '')
			.replace(/<Data name="copy"><value>[a-z_\.]*<\/value><\/Data>|,"copy":"[a-z_\.]*"/g, '')
			.replace(/(<\/gpx|<\/?wpt|<\/?trk>|<\/?rte>|<\/kml|<\/?Document)/g, '\n$1')
			.replace(/(<\/?Placemark|POINT|LINESTRING|POLYGON|<Point|"[a-z_]*":|})/g, '\n$1')
			.replace(/(<name|<ele|<sym|<link|<type|<rtept|<\/?trkseg|<\/?ExtendedData)/g, '\n\t$1')
			.replace(/(<trkpt|<Data|<LineString|<\/?Polygon|<Style)/g, '\n\t\t$1')
			.replace(/(<[a-z]+BoundaryIs)/g, '\n\t\t\t$1'),

			file = new Blob([data], {
				type: mime,
			});

		hiddenEl.download = options.fileName + '.' + formatName.toLowerCase();
		hiddenEl.href = URL.createObjectURL(file);
		hiddenEl.click();

		// Close the submenu
		control.element.classList.remove('myol-display-submenu');
	};

	return control;
}
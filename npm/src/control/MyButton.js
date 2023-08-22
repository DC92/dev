/**
 * Controls.js
 * Add some usefull controls without buttons
 */

import ol from '../../src/ol'; //TODO come back to direct import (optim ???)
import MyControl from './MyControl.js';
import './myButton.css';

/**
 * Control button
 * Abstract class to be used by other control buttons definitions
 */
export class MyButton extends MyControl {
	constructor(options) {
		// MyButton options
		// className : to be added to the control.element
		// label : one unicode character to decorate the button
		// subMenuId : id of an existing html containing the scrolling menu 
		// subMenuHTML : html code of the scrolling menu 
		super(options);

		// Add submenu below the button
		if (this.options.subMenuId)
			this.subMenuEl = document.getElementById(this.options.subMenuId);
		else {
			this.subMenuEl = document.createElement('div');
			if (this.options.subMenuHTML)
				this.subMenuEl.innerHTML = this.options.subMenuHTML;
		}

		// Display the button only if there are no label or submenu
		if (this.options.label && this.subMenuEl && this.subMenuEl.innerHTML) {
			// Create a button
			const buttonEl = document.createElement('button');
			buttonEl.setAttribute('type', 'button');
			buttonEl.innerHTML = this.options.label;
			buttonEl.addEventListener('click', evt => this.buttonAction(evt));

			// Populate the control
			this.element.className = 'ol-control myol-button' + (this.options.className ? ' ' + this.options.className : '');
			this.element.appendChild(buttonEl); // Add the button
			this.element.appendChild(this.subMenuEl); // Add the submenu
			this.element.addEventListener('mouseover', evt => this.buttonAction(evt));
			this.element.addEventListener('mouseout', evt => this.buttonAction(evt));

			// Close the submenu when click or touch on the map
			document.addEventListener('click', evt => {
				const el = document.elementFromPoint(evt.x, evt.y);

				if (el && el.tagName == 'CANVAS')
					this.element.classList.remove('myol-button-selected');
			});
		}
	}

	buttonAction(evt) {
		if (evt.type == 'mouseover')
			this.element.classList.add('myol-button-hover');
		else // mouseout | click
			this.element.classList.remove('myol-button-hover');

		if (evt.type == 'click') // Mouse click & touch
			this.element.classList.toggle('myol-button-selected');

		// Close other open buttons
		for (let el of document.getElementsByClassName('myol-button'))
			if (el != this.element)
				el.classList.remove('myol-button-selected');
	}
}
export default MyButton;

/**
 * GPX file loader control
 */
export class Load extends MyButton {
	constructor(options) {
		super({
			// MyButton options
			label: '&#128194;',
			subMenuHTML: '<p>Importer un fichier de points ou de traces</p>' +
				'<input type="file" accept=".gpx,.kml,.geojson" />',

			// Load options
			// initFileUrl, url of a gpx file to be uploaded at the init

			...options ||= {}, //HACK default when options is undefined
		});

		// Register action listeners
		this.element.querySelectorAll('input')
			.forEach(el =>
				el.addEventListener('change', evt => this.change(evt))
			);

		// Load file at init
		if (options.initFileUrl) {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', options.initFileUrl);
			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4 && xhr.status == 200)
					this.loadText(xhr.responseText, 'GPX');
			};
			xhr.send();
		}

		this.reader = new FileReader();
	}

	change(evt) {
		const blob = evt.target.files[0];

		this.reader.readAsText(blob);
		this.reader.onload = () => {
			this.loadText(
				this.reader.result,
				blob.name.split('.').pop().toUpperCase() // Extract extension to be used as format name
			);
		};
	}

	loadUrl(url) {
		fetch(url)
			.then(response => response.text())
			.then(text => this.loadText(
				text,
				url.split('.').pop().toUpperCase()
			));
	}

	loadText(text, formatName) {
		const map = this.getMap(),
			loadFormat = new ol.format[formatName in ol.format ? formatName : 'GeoJSON'](),
			receivedLat = text.match(/lat="-?([0-9]+)/), // Received projection depending on the first value
			receivedProjection = receivedLat && receivedLat.length && parseInt(receivedLat[1]) > 100 ? 'EPSG:3857' : 'EPSG:4326',
			features = loadFormat.readFeatures(text, {
				dataProjection: receivedProjection,
				featureProjection: map.getView().getProjection(), // Map projection
			}),
			added = map.dispatchEvent({
				type: 'myol:onfeatureload', // Warn Editor that we uploaded some features
				features: features,
			});

		if (added !== false) { // If none used the feature
			// Display the track on the map
			const gpxSource = new ol.source.Vector({
					format: loadFormat,
					features: features,
				}),
				gpxLayer = new ol.layer.Vector({
					source: gpxSource,
					style: feature => {
						const properties = feature.getProperties();

						return new ol.style.Style({
							stroke: new ol.style.Stroke({
								color: 'blue',
								width: 2,
							}),
							image: properties.sym ? new ol.style.Icon({
								//TODO compléter chemineur avec les symboles standards
								src: '//chemineur.fr/ext/Dominique92/GeoBB/icones/' + properties.sym + '.svg',
							}) : null,
						});
					},
				});

			map.addLayer(gpxLayer);

			// Zoom the map on the added features
			const fileExtent = gpxSource.getExtent();

			if (ol.extent.isEmpty(fileExtent))
				alert('Ce fichier ne comporte pas de points ni de trace');
			else
				map.getView().fit(
					fileExtent, {
						maxZoom: 17,
						padding: [5, 5, 5, 5],
					});
		}

		// Close the submenu
		this.element.classList.remove('myol-display-submenu');
	}
}

/**
 * File downloader control
 */
//BEST BUG incompatible with clusters
export class Download extends MyButton {
	constructor(options) {
		super({
			// MyButton options
			label: '&#128229;',
			subMenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
				'contenant les éléments visibles dans la fenêtre:</p>' +
				'<a mime="application/gpx+xml">GPX</a>' +
				'<a mime="vnd.google-earth.kml+xml">KML</a>' +
				'<a mime="application/json">GeoJSON</a>',
			fileName: document.title || 'openlayers', //BEST name from feature

			...options,
		});

		this.hiddenEl = document.createElement('a');
		this.hiddenEl.target = '_self';
		this.hiddenEl.style = 'display:none';
		document.body.appendChild(this.hiddenEl);

		// Register action listeners
		this.element.querySelectorAll('a')
			.forEach(el => {
				el.addEventListener('click', evt => this.action(evt));
			});
	}

	action(evt) {
		const map = this.getMap(),
			formatName = evt.target.innerText,
			downloadFormat = new ol.format[formatName](),
			mime = evt.target.getAttribute('mime');
		let features = [],
			extent = map.getView().calculateExtent();

		// Get all visible features
		if (this.options.savedLayer)
			getFeatures(this.options.savedLayer);
		else
			map.getLayers().forEach(getFeatures); //BEST what about (args)

		function getFeatures(savedLayer) { //BEST put in method
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

		const data = downloadFormat.writeFeatures(features, {
				dataProjection: 'EPSG:4326',
				featureProjection: map.getView().getProjection(), // Map projection
				decimals: 5,
			})
			// Beautify the output
			.replace(/<[a-z]*>(0|null|[[object Object]|[NTZa:-]*)<\/[a-z]*>/g, '')
			.replace(/<Data name="[a-z_]*"\/>|<Data name="[a-z_]*"><\/Data>|,"[a-z_]*":""/g, '')
			.replace(/<Data name="copy"><value>[a-z_.]*<\/value><\/Data>|,"copy":"[a-z_.]*"/g, '')
			.replace(/(<\/gpx|<\/?wpt|<\/?trk>|<\/?rte>|<\/kml|<\/?Document)/g, '\n$1')
			.replace(/(<\/?Placemark|POINT|LINESTRING|POLYGON|<Point|"[a-z_]*":|})/g, '\n$1')
			.replace(/(<name|<ele|<sym|<link|<type|<rtept|<\/?trkseg|<\/?ExtendedData)/g, '\n\t$1')
			.replace(/(<trkpt|<Data|<LineString|<\/?Polygon|<Style)/g, '\n\t\t$1')
			.replace(/(<[a-z]+BoundaryIs)/g, '\n\t\t\t$1')
			.replace(/ ([cvx])/g, '\n\t$1'),

			file = new Blob([data], {
				type: mime,
			});

		this.hiddenEl.download = this.options.fileName + '.' + formatName.toLowerCase();
		this.hiddenEl.href = URL.createObjectURL(file);
		this.hiddenEl.click();

		// Close the submenu
		this.element.classList.remove('myol-display-submenu');
	}
}

/**
 * Print control
 */
export class Print extends MyButton {
	constructor(options) {
		super({
			// MyButton options
			label: '&#128424;',
			className: 'myol-button-print',
			subMenuHTML: '<p>Pour imprimer la carte:</p>' +
				'<p>-Choisir portrait ou paysage,</p>' +
				'<p>-zoomer et déplacer la carte dans le format,</p>' +
				'<p>-imprimer.</p>' +
				'<label><input type="radio" value="0">Portrait A4</label>' +
				'<label><input type="radio" value="1">Paysage A4</label>' +
				'<a id="print">Imprimer</a>' +
				'<a onclick="location.reload()">Annuler</a>',

			...options,
		});

		// Register action listeners
		this.element.querySelectorAll('input,a')
			.forEach(el => {
				el.addEventListener('click', evt => this.action(evt));
			});

		// To return without print
		document.addEventListener('keydown', evt => {
			if (evt.key == 'Escape')
				setTimeout(() => { // Delay reload for FF & Opera
					location.reload();
				});
		});
	}

	action(evt) {
		const map = this.getMap(),
			mapEl = map.getTargetElement(),
			poElcs = this.element.querySelectorAll('input:checked'), // Selected orientation inputs
			orientation = poElcs.length ? parseInt(poElcs[0].value) : 0; // Selected orientation or portrait

		// Change map size & style
		mapEl.style.maxHeight = mapEl.style.maxWidth =
			mapEl.style.float = 'none';
		mapEl.style.width = orientation == 0 ? '208mm' : '295mm';
		mapEl.style.height = orientation == 0 ? '295mm' : '208mm';
		map.setSize([mapEl.clientWidth, mapEl.clientHeight]);

		// Set style portrait / landscape
		const styleSheet = document.createElement('style');
		styleSheet.type = 'text/css';
		styleSheet.innerText = '@page {size: ' + (orientation == 0 ? 'portrait' : 'landscape') + '}';
		document.head.appendChild(styleSheet);

		// Hide all but the map
		document.body.appendChild(mapEl);
		for (let child = document.body.firstElementChild; child !== null; child = child.nextSibling)
			if (child.style && child !== mapEl)
				child.style.display = 'none';

		// Finer zoom not dependent on the baselayer's levels
		map.getView().setConstrainResolution(false);
		map.addInteraction(new ol.interaction.MouseWheelZoom({
			maxDelta: 0.1,
		}));

		// Finally print if required
		if (evt.target.id == 'print')
			map.once('rendercomplete', () => {
				window.print();
				location.reload();
			});
	}
}
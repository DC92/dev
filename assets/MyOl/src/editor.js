/**
 * geoJson lines & polygons display
 * Lines & polygons edit
 * Requires JSONparse, controlButton (from src/controls.js)
 */
function layerEditGeoJson(opt) {
	const options = {
			format: new ol.format.GeoJSON(),
			projection: 'EPSG:3857',
			geoJsonId: 'editable-json', // Option geoJsonId : html element id of the geoJson features to be edited
			focus: false, // Zoom the map on the loaded features
			snapLayers: [], // Vector layers to snap on
			help: ['Modification', 'New line', 'New polygon'],
			readFeatures: function() {
				return options.format.readFeatures(
					options.geoJson ||
					JSONparse(geoJsonValue || '{"type":"FeatureCollection","features":[]}'), {
						featureProjection: options.projection,
					});
			},
			saveFeatures: function(coordinates, format) {
				return format.writeFeatures(
						source.getFeatures(
							coordinates, format), {
							featureProjection: options.projection,
							decimals: 5,
						})
					.replace(/"properties":\{[^\}]*\}/, '"properties":null');
			},
			// Drag lines or Polygons
			styleOptions: {
				// Lines or polygons border
				stroke: new ol.style.Stroke({
					color: 'red',
					width: 2,
				}),
				// Polygons
				fill: new ol.style.Fill({
					color: 'rgba(0,0,255,0.2)',
				}),
			},
			// Hover / modify / create
			editStyleOptions: {
				// Edit position marker
				image: new ol.style.Circle({
					radius: 4,
					stroke: new ol.style.Stroke({
						color: 'red',
						width: 2,
					}),
				}),
				// Lines or polygons border
				stroke: new ol.style.Stroke({
					color: 'red',
					width: 4,
				}),
				// Polygons
				fill: new ol.style.Fill({
					color: 'rgba(255,0,0,0.3)',
				}),
			},
			...opt
		},

		geoJsonEl = document.getElementById(options.geoJsonId), // Read data in an html element
		geoJsonValue = geoJsonEl ? geoJsonEl.value : '',
		displayStyle = new ol.style.Style(options.styleOptions),
		editStyle = new ol.style.Style(options.editStyleOptions),

		features = options.readFeatures(),
		source = new ol.source.Vector({
			features: features,
			wrapX: false,
		}),
		layer = new ol.layer.Vector({
			source: source,
			zIndex: 20, // Editor & cursor : above the features
			style: displayStyle,
		}),

		control = controlButton({
			className: 'myol-button-edit',
			label: 'TBD', // To be defined by changeModeEdit
			submenuHTML: '<p>Edition:</p>' + //BEST move in .html
				'<label for="myol-edit0">' +
				'<input type="radio" name="myol-edit" id="myol-edit0" value="0" ctrlOnChange="changeModeEdit" />' +
				'Modification &#x1F58D;' +
				'</label>' +
				(!options.help[1] ? '' :
					'<label for="myol-edit1">' +
					'<input type="radio" name="myol-edit" id="myol-edit1" value="1" ctrlOnChange="changeModeEdit" />' +
					'Création ligne &#xD17;' +
					'</label>') +
				(!options.help[2] ? '' :
					'<label for="myol-edit2">' +
					'<input type="radio" name="myol-edit" id="myol-edit2" value="2" ctrlOnChange="changeModeEdit" />' +
					'Création polygone &#X23E2;' +
					'</label>') +
				'<hr/><div id="myol-help-edit"></div>',
		}),
		labels = ['&#x1F58D;', '&#xD17;', '&#X23E2;'], // Modify, Line, Polygon

		interactions = [
			new ol.interaction.Modify({ // 0 Modify
				source: source,
				pixelTolerance: 16, // Default is 10
				style: editStyle,
			}),
			new ol.interaction.Draw({ // 1 drawLine
				style: editStyle,
				source: source,
				stopClick: true, // Avoid zoom when you finish drawing by doubleclick
				type: 'LineString',
			}),
			new ol.interaction.Draw({ // 2 drawPoly
				style: editStyle,
				source: source,
				stopClick: true, // Avoid zoom when you finish drawing by doubleclick
				type: 'Polygon',
			}),
			new ol.interaction.Snap({ // 3 snap
				source: source,
				pixelTolerance: 7.5, // 6 + line width / 2 : default is 10
			}),
		];

	// End of modify
	interactions[0].on('modifyend', function(evt) {
		//BEST move only one summit when dragging
		//BEST Ctrl+Alt+click on summit : delete the line or poly

		// Mark last change time
		sessionStorage.myol_lastChangeTime = Date.now();

		// Ctrl+Alt+click on segment : delete the line or poly
		if (evt.mapBrowserEvent.originalEvent.ctrlKey &&
			evt.mapBrowserEvent.originalEvent.altKey) {
			const selectedFeatures = control.getMap().getFeaturesAtPixel(
				evt.mapBrowserEvent.pixel, {
					hitTolerance: 6, // Default is 0
					layerFilter: function(l) {
						return l.ol_uid == layer.ol_uid;
					}
				});

			for (let f in selectedFeatures) // We delete the selected feature
				source.removeFeature(selectedFeatures[f]);
		}

		// Alt+click on segment : delete the segment & split the line
		const newFeature = interactions[3].snapTo(
			evt.mapBrowserEvent.pixel,
			evt.mapBrowserEvent.coordinate,
			interactions[3].getMap()
		);

		if (evt.mapBrowserEvent.originalEvent.altKey && newFeature)
			optimiseEdited(newFeature.vertex);

		// Finish
		optimiseEdited();
		hoveredFeature = null; // Recover hovering
	});

	// End of line & poly drawing
	[1, 2].forEach(i => interactions[i].on('drawend', drawEnd));

	function drawEnd() {
		// Warn source 'on change' to save the feature
		// Don't do it now as it's not yet added to the source
		source.modified = true;

		// Reset interaction & button to modify
		control.changeModeEdit();
	}

	// Snap on vector layers
	options.snapLayers.forEach(function(layer) {
		layer.getSource().on('change', function() {
			const fs = layer.getSource().getFeatures();
			for (let f in fs)
				interactions[3].addFeature(fs[f]);
		});
	});

	// Manage hover to save modify actions integrity
	let hoveredFeature = null;

	layer.setMapInternal = function(map) { //TODO ben non, ça va pas !!!
		ol.layer.Vector.prototype.setMapInternal.call(this, map);

		optimiseEdited(); // Treat the geoJson input as any other edit
		map.addControl(control);
		//TODO control.changeModeEdit(); // Display button & help

		// Zoom the map on the loaded features
		if (options.focus && features.length) {
			const extent = ol.extent.createEmpty(); // For focus on all features calculation

			for (let f in features)
				ol.extent.extend(extent, features[f].getGeometry().getExtent());

			map.getView().fit(extent, {
				maxZoom: options.focus,
				size: map.getSize(),
				padding: [5, 5, 5, 5],
			});
		}

		// Add features loaded from GPX file
		map.on('myol:onfeatureload', function(evt) {
			source.addFeatures(evt.features);
			optimiseEdited();
			return false; // Warn controlLoadGPX that the editor got the included feature
		});

		map.on('pointermove', hover);
	};

	control.changeModeEdit = function(evt) {
		const level = evt ? evt.target.value : 0,
			chidEls = control.element.children,
			inputEditEl = document.getElementById('myol-edit' + level),
			helpEditEl = document.getElementById('myol-help-edit');

		// Change button
		if (chidEls)
			chidEls[0].innerHTML = labels[level];

		// Change button
		if (inputEditEl)
			inputEditEl.checked = true;

		// Change specific help
		if (helpEditEl)
			helpEditEl.innerHTML = options.help[level];

		// Replace interactions
		interactions.forEach(i => control.getMap().removeInteraction(i));
		control.getMap().addInteraction(interactions[level]); // Add active interaction
		control.getMap().addInteraction(interactions[3]); // Snap must be added after the others

		//BEST control.getMap().getTargetElement().style.cursor = 'move';
	};

	// End of feature creation
	source.on('change', function() { // Call all sliding long
		if (source.modified) { // Awaiting adding complete to save it
			source.modified = false; // To avoid loops

			// Finish
			optimiseEdited();
			hoveredFeature = null; // Recover hovering
		}
	});

	function hover(evt) {
		let nbFeaturesAtPixel = 0;
		control.getMap().forEachFeatureAtPixel(evt.pixel, function(feature) {
			source.getFeatures().forEach(function(f) {
				if (f.ol_uid == feature.ol_uid) {
					nbFeaturesAtPixel++;
					if (!hoveredFeature) { // Hovering only one
						feature.setStyle(editStyle);
						hoveredFeature = feature; // Don't change it until there is no more hovered
					}
				}
			});
		}, {
			hitTolerance: 6, // Default is 0
		});

		// If no more hovered, return to the normal style
		if (!nbFeaturesAtPixel && !evt.originalEvent.buttons && hoveredFeature) {
			hoveredFeature.setStyle(displayStyle);
			hoveredFeature = null;
		}
	}

	function optimiseEdited(deleteCoords) {
		const coordinates = optimiseFeatures(
			source.getFeatures(),
			options.help[1],
			options.help[2],
			true,
			true,
			deleteCoords
		);

		// Recreate features
		source.clear();

		for (let l in coordinates.lines)
			source.addFeature(new ol.Feature({
				geometry: new ol.geom.LineString(coordinates.lines[l]),
			}));
		for (let p in coordinates.polys)
			source.addFeature(new ol.Feature({
				geometry: new ol.geom.Polygon(coordinates.polys[p]),
			}));

		// Save geometries in <EL> as geoJSON at every change
		if (geoJsonEl)
			geoJsonEl.value = options.saveFeatures(coordinates, options.format);
	}

	return layer;
}

/**
 * Refurbish Lines & Polygons
 * Split lines having a summit at deleteCoords
 */
function optimiseFeatures(features, withLines, withPolygons, merge, holes, deleteCoords) {
	const points = [],
		lines = [],
		polys = [];

	// Get all edited features as array of coordinates
	for (let f in features)
		flatFeatures(features[f].getGeometry(), points, lines, polys, deleteCoords);

	for (let a in lines)
		// Exclude 1 coordinate features (points)
		if (lines[a].length < 2)
			delete lines[a];

		// Merge lines having a common end
		else if (merge)
		for (let b = 0; b < a; b++) // Once each combination
			if (lines[b]) {
				const m = [a, b];
				for (let i = 4; i; i--) // 4 times
					if (lines[m[0]] && lines[m[1]]) { // Test if the line has been removed
						// Shake lines end to explore all possibilities
						m.reverse();
						lines[m[0]].reverse();
						if (compareCoords(lines[m[0]][lines[m[0]].length - 1], lines[m[1]][0])) {
							// Merge 2 lines having 2 ends in common
							lines[m[0]] = lines[m[0]].concat(lines[m[1]].slice(1));
							delete lines[m[1]]; // Remove the line but don't renumber the array keys
						}
					}
			}

	// Make polygons with looped lines
	for (let a in lines)
		if (withPolygons && // Only if polygons are autorized
			lines[a]) {
			// Close open lines
			if (!withLines) // If only polygons are autorized
				if (!compareCoords(lines[a]))
					lines[a].push(lines[a][0]);

			if (compareCoords(lines[a])) { // If this line is closed
				// Split squeezed polygons
				// Explore all summits combinaison
				for (let i1 = 0; i1 < lines[a].length - 1; i1++)
					for (let i2 = 0; i2 < i1; i2++)
						if (lines[a][i1][0] == lines[a][i2][0] &&
							lines[a][i1][1] == lines[a][i2][1]) { // Find 2 identical summits
							let squized = lines[a].splice(i2, i1 - i2); // Extract the squized part
							squized.push(squized[0]); // Close the poly
							polys.push([squized]); // Add the squized poly
							i1 = i2 = lines[a].length; // End loop
						}

				// Convert closed lines into polygons
				polys.push([lines[a]]); // Add the polygon
				delete lines[a]; // Forget the line
			}
		}

	// Makes holes if a polygon is included in a biggest one
	for (let p1 in polys) // Explore all Polygons combinaison
		if (holes && // Make holes option
			polys[p1]) {
			const fs = new ol.geom.Polygon(polys[p1]);
			for (let p2 in polys)
				if (polys[p2] && p1 != p2) {
					let intersects = true;
					for (let c in polys[p2][0])
						if (!fs.intersectsCoordinate(polys[p2][0][c]))
							intersects = false;
					if (intersects) { // If one intersects a bigger
						polys[p1].push(polys[p2][0]); // Include the smaler in the bigger
						delete polys[p2]; // Forget the smaller
					}
				}
		}

	return {
		points: points,
		lines: lines.filter(Boolean), // Remove deleted array members
		polys: polys.filter(Boolean),
	};

	function flatFeatures(geom, points, lines, polys, deleteCoords) {
		// Expand geometryCollection
		if (geom.getType() == 'GeometryCollection') {
			const geometries = geom.getGeometries();
			for (let g in geometries)
				flatFeatures(geometries[g], points, lines, polys, deleteCoords);
		}
		// Point
		else if (geom.getType().match(/point$/i))
			points.push(geom.getCoordinates());

		// line & poly
		else
			// Get lines or polyons as flat array of coordinates
			flatCoord(lines, geom.getCoordinates(), deleteCoords);
	}

	// Get all lines fragments (lines, polylines, polygons, multipolygons, hole polygons, ...)
	// at the same level & split if one point = deleteCoords
	function flatCoord(existingCoords, newCoords, deleteCoords) {
		if (typeof newCoords[0][0] == 'object') // Multi*
			for (let c1 in newCoords)
				flatCoord(existingCoords, newCoords[c1], deleteCoords);
		else {
			existingCoords.push([]); // Add a new segment

			for (let c2 in newCoords)
				if (deleteCoords && compareCoords(newCoords[c2], deleteCoords))
					existingCoords.push([]); // Ignore this point and add a new segment
				else
					// Stack on the last existingCoords array
					existingCoords[existingCoords.length - 1].push(newCoords[c2]);
		}
	}

	function compareCoords(a, b) {
		if (!a)
			return false;
		if (!b)
			return compareCoords(a[0], a[a.length - 1]); // Compare start with end
		return a[0] == b[0] && a[1] == b[1]; // 2 coordinates
	}
}
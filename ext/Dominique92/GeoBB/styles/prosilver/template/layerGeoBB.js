var map = new ol.Map({
	target: 'map',
	view: new ol.View({
		enableRotation: false,
	}),
	controls: [
		...myol.control.collection(),
		new myol.control.LayerSwitcher({
			layers: myol.layer.tile.collection(mapKeys),
			selectExtId: 'select-ext',
			//BEST Si on n'a que l'extension GeoBB, on n'a pas la couche gis.php
		}),
		new myol.control.Permalink({
			init: mapType != 'line' || scriptName != 'viewtopic',
			display: scriptName == 'index',
		}),
	],
	layers: [
		new myol.layer.Hover(),
	],
});

if (mapType == 'point')
	map.addLayer(layerMarker({
		src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/' + scriptName + '.svg',
		focus: 15, // Map zoom level
		dragable: scriptName == 'posting',
	}));

if (mapType == 'line' && scriptName == 'viewtopic') {
	const geoJson = document.getElementById('marker-json'),
		features = new ol.format.GeoJSON().readFeatures(geoJson.value, {
			featureProjection: "EPSG:3857",
		}),
		extent = ol.extent.createEmpty();

	for (let f in features)
		ol.extent.extend(extent, features[f].getGeometry().getExtent());

	map.getView().fit(extent, {
		maxZoom: 15,
	});
}

if (mapType == 'line' && scriptName == 'posting')
	//BEST save only layerEditGeoJson.layer
	map.addControl(layerEditGeoJson({
		geoJsonId: 'marker-json',
		focus: 15,
		help: [
			//BEST mettre dans le html
			// Modify
			'<p><u>Déplacer un sommet:</u> cliquer sur le sommet et le déplacer</p>' +
			'<p>Ajouter un sommet au milieu d&apos;un segment : cliquer le long du segment puis déplacer</p>' +
			'<p>Supprimer un sommet : Alt+cliquer sur le sommet</p>' +
			'<p>Couper une ligne en deux : Alt+cliquer sur le segment à supprimer</p>' +
			'<p>Inverser la direction d&apos;une ligne: Shift+cliquer sur le segment à inverser</p>' +
			'<p>Fusionner deux lignes : déplacer l&apos;extrémité d&apos;une ligne pour rejoindre l&apos;autre</p>' +
			'<p>Supprimer une ligne : Ctrl+Alt+cliquer sur un segment</p>',
			// Line
			'<p>Pour créer une ligne :</p>' +
			'<p>Cliquer sur l&apos;emplacement du début</p>' +
			'<p>Puis sur chaque sommet</p>' +
			'<p>Double cliquer sur le dernier sommet pour terminer</p>' +
			'<p><hr/>Cliquer sur une extrémité d&apos;une ligne existante pour l&apos;étendre</p>',
		],
	}));
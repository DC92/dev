// Resize map
if (jQuery.ui)
	$('#map').resizable({
		handles: 's,w,sw', // 2 côtés et 1 coin

		resize: function(event, ui) {
			ui.position.left = ui.originalPosition.left; // Reste à droite de la page
			map.updateSize(); // Reaffiche tout le nouveau <div>
		},
	});

var map = new ol.Map({
		target: 'map',
		controls: controlsCollection(typeof controlOptions == 'object' ? controlOptions : {})
			.concat(controlLayerSwitcher()),
		layers: [
			layerGeoBB({
				host: '', // Relative adress
				selectorName: 'geobb-features',
				maxResolution: 100,
				distance: 30,
			}),
			layerGeoBBCluster({
				host: '',
				selectorName: 'geobb-features',
				minResolution: 100,
				distance: 30,
			}),
		],
	}),

	// Point marker
	marker = layerEditGeoJson({
		geoJsonId: 'geo_json',
		displayPointId: typeof displayPointId == 'string' ? displayPointId : 'point-marker',
		singlePoint: true,
		dragPoint: scriptName == 'posting',
		focus: 15,
		//TODO BUG cursor above the features !!!
		styleOptions: {
			image: new ol.style.Icon({
				src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/' + scriptName + '.png',
			}),
		},
	});

if (scriptName == 'viewtopic')
	map.addLayer(marker);

if (scriptName == 'posting' && mapType == 'point')
	map.addLayer(marker);

if (scriptName == 'posting' && mapType == 'line')
	map.addLayer(layerEditGeoJson({
		geoJsonId: 'geo_json',
		focus: 15,
		titleModify: 'Modification d‘une ligne:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Cliquer et déplacer un sommet pour modifier une ligne\n' +
			'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
			'Alt+cliquer sur un sommet pour le supprimer\n' +
			'Alt+cliquer sur un segment à supprimer dans une ligne pour la couper\n' +
			'Joindre les extrémités deux lignes pour les fusionner\n' +
			'Ctrl+Alt+cliquer sur une ligne pour la supprimer',
		titleLine: 'Création d‘une ligne:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Cliquer sur la carte et sur chaque point désiré pour dessiner une ligne,\n' +
			'double cliquer pour terminer.\n' +
			'Cliquer sur une extrémité d‘une ligne pour l‘étendre',
	}));
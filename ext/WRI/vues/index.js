new ol.Map({
	target: 'carte-accueil',
	view: new ol.View({
		enableRotation: false,
	}),
	layers: [
		layerMRI(), // Fond de carte WRI
		layerWriAreas({ // La couche "massifs"
			host: '<?=$config_wri["sous_dossier_installation"]?>',
		}),
	],
	controls: [
		new ol.control.Attribution({
			collapsible: false, // Attribution always open
		}),
	],
})

// Centre la carte sur la zone souhaitée
.getView().fit(ol.proj.transformExtent([<?=$vue->bbox?>], 'EPSG:4326', 'EPSG:3857'));
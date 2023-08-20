/* global ol, myol */

var map = new ol.Map({
	target: 'map',
	view: new ol.View({
		constrainResolution: true, // Force zoom on the available tile's definition
	}),
	controls: [
		...myol.control.collection(),
		new myol.control.LayerSwitcher({
			layers: myol.layer.tile.collection(),
		}),
	],
});

// Ask to reload the PWA when a new version is loaded
navigator.serviceWorker.addEventListener('controllerchange', function() {
	map.addControl(
		new myol.control.MyButton({
			label: '&#127381;',
			subMenuHTML: "<p>Une nouvelle version</p>" +
				"<p>ou de nouvelles traces</p>" +
				"<p>sont disponibles.</p>" +
				"<a href=''>Recharger la page</a>",
		}),
	);
});
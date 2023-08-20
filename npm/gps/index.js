/* global ol, myol */

new ol.Map({
	target: 'map',
	view: new ol.View({
		enableRotation: false,
	}),
	controls: [
		...myol.control.collection(),
		new myol.control.LayerSwitcher({
			layers: myol.layer.tile.collection(),
		}),
	],
});
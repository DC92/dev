Dominique92.MyOl/tileLayers
===========================
This package defines :
* a tile layers collection
* a layer switcher control

Includes
========
* Standard Openlayers distribution ol.css & ol.js
* This package tileLayers.css & tileLayers.js

Javascript example
==================
```js
	new ol.Map({
		target: 'map',
		controls: [
			new ol.control.Zoom(),
			controlLayerSwitcher({
				baseLayers: layersCollection(),
				addonEl: document.getElementById('addon'),
			}),
		],
		view: new ol.View({
			center: [0, 0],
			zoom: 2,
		}),
	});
```

DEMO
====
(https://Dominique92.github.io/MyOl/tileLayers/)

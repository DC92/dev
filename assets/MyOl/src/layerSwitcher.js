/**
 * Layer switcher
 * Need to include layerSwitcher.css
 */
function controlLayerSwitcher(baseLayers, options) {
	baseLayers = baseLayers || layersCollection();
	options = options || {};

	const control = new ol.control.Control({
			element: document.createElement('div'),
		}),
		layerNames = Object.keys(baseLayers),
		match = document.cookie.match(/baselayer=([^;]+)/);

	var selectedBaseLayerName = match ? match[1] : layerNames[0],
		lastBaseLayerName = '',
		transparentBaseLayerName = '';

	// If the cookie doesn't correspond to an existing layer
	if (typeof baseLayers[selectedBaseLayerName] == 'undefined')
		selectedBaseLayerName = layerNames[0];

	// Build html transparency slider
	const rangeContainerEl = document.createElement('div');
	rangeContainerEl.innerHTML =
		'<input type="range" id="layerSlider" title="Glisser pour faire varier la tranparence">' +
		'<span>Ctrl+click: multicouches</span>';
	rangeContainerEl.firstChild.oninput = displayTransparencyRange;

	control.setMap = function(map) {
		ol.control.Control.prototype.setMap.call(this, map);

		// control.element is defined when attached to the map
		control.element.className = 'ol-control ol-control-switcher';
		control.element.innerHTML = '<button>\u2026</button>';
		control.element.appendChild(rangeContainerEl);
		control.element.onmouseover = function() {
			control.element.classList.add('ol-control-switcher-open');
		};

		// Hide the selector when the cursor is out of the selector
		map.on('pointermove', function(evt) {
			const max_x = map.getTargetElement().offsetWidth - control.element.offsetWidth - 20,
				max_y = control.element.offsetHeight + 20;

			if (evt.pixel[0] < max_x || evt.pixel[1] > max_y)
				control.element.classList.remove('ol-control-switcher-open');
		});

		// Build html baselayers selectors
		for (let name in baseLayers)
			if (baseLayers[name]) { // Don't dispatch null layers (whose declaraton failed)
				const layer = baseLayers[name];

				const selectionEl = document.createElement('div'),
					inputId = 'l' + layer.ol_uid + (name ? '-' + name : '');

				control.element.appendChild(selectionEl);
				selectionEl.innerHTML =
					'<input type="checkbox" name="baseLayer ' +
					'"id="' + inputId + '" value="' + name + '" ' + ' />' +
					'<label for="' + inputId + '">' + name + '</label>';
				selectionEl.firstChild.onclick = selectBaseLayer;
				layer.inputEl = selectionEl.firstChild; // Mem it for further ops

				layer.setVisible(false); // Don't begin to get the tiles yet
				map.addLayer(layer);
			}

		displayBaseLayers(); // Init layers

		// Attach html overlays selector
		const overlaySelector = document.getElementById(options.overlaySelectorId || 'overlay-selector');
		//TODO other id don't use the css
		if (overlaySelector)
			control.element.appendChild(overlaySelector);
	};

	function displayBaseLayers() {
		// Refresh layers visibility & opacity
		for (let name in baseLayers)
			if (baseLayers[name]) {
				baseLayers[name].inputEl.checked = false;
				baseLayers[name].setVisible(false);
				baseLayers[name].setOpacity(1);
			}

		// Baselayer default is the first of the selection
		if (!baseLayers[selectedBaseLayerName])
			selectedBaseLayerName = Object.keys(baseLayers)[0];

		baseLayers[selectedBaseLayerName].inputEl.checked = true;
		baseLayers[selectedBaseLayerName].setVisible(true);

		if (lastBaseLayerName) {
			baseLayers[lastBaseLayerName].inputEl.checked = true;
			baseLayers[lastBaseLayerName].setVisible(true);
		}
		displayTransparencyRange();
	}

	function displayTransparencyRange() {
		if (transparentBaseLayerName) {
			baseLayers[transparentBaseLayerName].setOpacity(
				rangeContainerEl.firstChild.value / 100
			);
			rangeContainerEl.className = 'double-layer';
		} else
			rangeContainerEl.className = 'single-layer';
	}

	function selectBaseLayer(evt) {
		// Set the baselayer cookie
		document.cookie = 'baselayer=' + this.value + '; path=/; SameSite=Secure; expires=' +
			new Date(2100, 0).toUTCString();

		// Manage the double selection
		if (evt && evt.ctrlKey && this.value != selectedBaseLayerName) {
			lastBaseLayerName = selectedBaseLayerName;

			transparentBaseLayerName =
				layerNames.indexOf(lastBaseLayerName) > layerNames.indexOf(this.value) ?
				lastBaseLayerName :
				this.value;

			baseLayers[transparentBaseLayerName].inputEl.checked = true;
			rangeContainerEl.firstChild.value = 50;
		} else
			lastBaseLayerName =
			transparentBaseLayerName = '';

		selectedBaseLayerName = this.value;
		baseLayers[selectedBaseLayerName].inputEl.checked = true;

		displayBaseLayers();
	}

	return control;
}
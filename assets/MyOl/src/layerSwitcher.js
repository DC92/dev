/**
 * Layer switcher
 * Need to include layerSwitcher.css
 */
//BEST alt key to swith layers / transparency
function controlLayerSwitcher(baseLayers, options) {
	baseLayers = baseLayers || layersCollection();
	options = options || {};

	const control = new ol.control.Control({
			element: document.createElement('div'),
		}),
		layerNames = Object.keys(baseLayers);

	var lastBaseLayerName = '',
		transparentBaseLayerName = '';

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
		control.element.innerHTML = '<button><i>&#x274F;</i></button>';
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
				// Make all choices an array of layers
				if (!baseLayers[name].length)
					baseLayers[name] = [baseLayers[name]];

				const selectionEl = document.createElement('div'),
					inputId = 'l' + baseLayers[name][0].ol_uid + (name ? '-' + name : '');

				control.element.appendChild(selectionEl);
				selectionEl.innerHTML =
					'<input type="checkbox" name="baseLayer ' +
					'"id="' + inputId + '" value="' + name + '" ' + ' />' +
					'<label for="' + inputId + '">' + name + '</label>';
				selectionEl.firstChild.onclick = selectBaseLayer;
				baseLayers[name].inputEl = selectionEl.firstChild; // Mem it for further ops

				for (let l = 0; l < baseLayers[name].length; l++) { //BEST HACK IE
					baseLayers[name][l].setVisible(false); // Don't begin to get the tiles yet
					map.addLayer(baseLayers[name][l]);
				}
			}

		displayBaseLayers(); // Init layers

		// Attach html additional selector
		const additionalSelector = document.getElementById(options.additionalSelectorId || 'additional-selector');

		//BEST other id don't use the css
		if (additionalSelector) {
			control.element.appendChild(additionalSelector);
			// Unmask the selector if it has been @ the declaration
			additionalSelector.style.display = '';
		}
	};

	function displayBaseLayers() {
		// Refresh layers visibility & opacity
		for (let name in baseLayers)
			if (baseLayers[name]) {
				baseLayers[name].inputEl.checked = false;
				for (let l = 0; l < baseLayers[name].length; l++) { //BEST HACK IE
					//for (let layer of baseLayers[name]) {
					baseLayers[name][l].setVisible(false);
					baseLayers[name][l].setOpacity(1);
				}
			}

		// Baselayer default is the first of the selection
		if (!baseLayers[localStorage.myol_baselayer])
			localStorage.myol_baselayer = Object.keys(baseLayers)[0];

		baseLayers[localStorage.myol_baselayer].inputEl.checked = true;
		for (let l = 0; l < baseLayers[localStorage.myol_baselayer].length; l++) //BEST HACK IE
			baseLayers[localStorage.myol_baselayer][l].setVisible(true);

		if (lastBaseLayerName) {
			baseLayers[lastBaseLayerName].inputEl.checked = true;
			for (let l = 0; l < baseLayers[lastBaseLayerName].length; l++) //BEST HACK IE
				baseLayers[lastBaseLayerName][l].setVisible(true);
		}
		displayTransparencyRange();
	}

	function displayTransparencyRange() {
		if (transparentBaseLayerName) {
			for (let l = 0; l < baseLayers[transparentBaseLayerName].length; l++) //BEST HACK IE
				baseLayers[transparentBaseLayerName][l].setOpacity(
					rangeContainerEl.firstChild.value / 100
				);
			rangeContainerEl.className = 'double-layer';
		} else
			rangeContainerEl.className = 'single-layer';
	}

	function selectBaseLayer(evt) {
		// Mem the baseLayer
		localStorage.myol_baselayer = this.value;

		// Manage the double selection
		if (evt && evt.ctrlKey && this.value != localStorage.myol_baselayer) {
			lastBaseLayerName = localStorage.myol_baselayer;

			transparentBaseLayerName =
				layerNames.indexOf(lastBaseLayerName) > layerNames.indexOf(this.value) ?
				lastBaseLayerName :
				this.value;

			baseLayers[transparentBaseLayerName].inputEl.checked = true;
			rangeContainerEl.firstChild.value = 50;
		} else
			lastBaseLayerName =
			transparentBaseLayerName = '';

		localStorage.myol_baselayer = this.value;
		baseLayers[localStorage.myol_baselayer].inputEl.checked = true;

		displayBaseLayers();
	}

	return control;
}
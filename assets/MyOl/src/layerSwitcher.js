/**
 * Layer switcher
 * Need to include layerSwitcher.css
 */
//BEST alt key to switch layers / transparency
function controlLayerSwitcher(opt) {
	const options = {
			layers: typeof layersCollection == 'function' ? layersCollection() : null,
			...opt
		},
		control = new ol.control.Control({
			element: document.createElement('div'),
		}),
		baseLayers = Object.fromEntries(
			Object.entries(options.layers)
			.filter(([_, v]) => v != null) // Remove empty layers
		),
		layerNames = Object.keys(baseLayers),
		baselayer = location.href.match(/baselayer=([^\&]+)/);

	let transparentBaseLayerName = '';

	// Get baselayer from url if any
	if (baselayer)
		localStorage.myol_baselayer = decodeURI(baselayer[1]);

	// Build html transparency slider
	//BEST implement on touch screen terminals
	const rangeContainerEl = document.createElement('div');

	rangeContainerEl.innerHTML =
		'<input type="range" id="layerSlider" title="Glisser pour faire varier la tranparence">' +
		'<span>Ctrl+click: multicouches</span>';
	rangeContainerEl.firstChild.oninput = displayTransparencyRange;

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		// control.element is defined when attached to the map
		control.element.className = 'ol-control myol-button-switcher';
		control.element.innerHTML = '<button><i>&#x274F;</i></button>';
		control.element.appendChild(rangeContainerEl);
		control.element.onmouseover = function() {
			control.element.classList.add('myol-button-switcher-open');
		};

		// Hide the selector when the cursor is out of the selector
		map.on('pointermove', function(evt) {
			const max_x = map.getTargetElement().offsetWidth - control.element.offsetWidth - 20,
				max_y = control.element.offsetHeight + 20;

			if (evt.pixel[0] < max_x || evt.pixel[1] > max_y)
				control.element.classList.remove('myol-button-switcher-open');
		});

		// Build html baselayers selectors
		for (let name in baseLayers) {
			// Make all choices an array of layers
			if (!baseLayers[name].length)
				baseLayers[name] = [baseLayers[name]];

			const selectionEl = document.createElement('div'),
				inputId = 'l' + baseLayers[name][0].ol_uid + (name ? '-' + name : '');

			control.element.appendChild(selectionEl);
			selectionEl.innerHTML = //BEST investigate if name="baseLayer" is necessary
				'<input type="checkbox" name="baseLayer" id="' + inputId + '" value="' + name + '" ' + ' />' +
				'<label for="' + inputId + '">' + name + '</label>';
			selectionEl.firstChild.onclick = selectBaseLayer;
			baseLayers[name].inputEl = selectionEl.firstChild; // Mem it for further ops

			for (let l = 0; l < baseLayers[name].length; l++) {
				baseLayers[name][l].setVisible(false); // Don't begin to get the tiles yet
				map.addLayer(baseLayers[name][l]);
			}
		}

		// Init layers
		displayBaseLayers();

		// Attach html additional selector
		//BEST other id don't use the css
		const additionalSelector = document.getElementById(options.additionalSelectorId);
		if (additionalSelector) {
			control.element.appendChild(additionalSelector);
			// Unmask the selector if it has been @ the declaration
			additionalSelector.style.display = '';
		}
	};

	function selectBaseLayer(evt) {
		// Single layer
		if (!evt || !evt.ctrlKey || this.value == localStorage.myol_baselayer) {
			transparentBaseLayerName = '';
			localStorage.myol_baselayer = this.value;
		}
		// There is a second layer after the existing one
		else if (layerNames.indexOf(localStorage.myol_baselayer) <
			layerNames.indexOf(this.value)) {
			transparentBaseLayerName = this.value;
			// localStorage.myol_baselayer don't change
		}
		// There is a second layer before the existing one
		else {
			transparentBaseLayerName = localStorage.myol_baselayer;
			localStorage.myol_baselayer = this.value;
		}

		rangeContainerEl.firstChild.value = 50;
		displayBaseLayers();
	}

	function displayBaseLayers() {
		// Baselayer default is the first of the selection
		if (!baseLayers[localStorage.myol_baselayer])
			localStorage.myol_baselayer = layerNames[0];

		for (let name in baseLayers) {
			const visible =
				name == localStorage.myol_baselayer ||
				name == transparentBaseLayerName;

			// Write the checks
			baseLayers[name].inputEl.checked = visible;

			// Make the right layers visible
			for (let l = 0; l < baseLayers[name].length; l++) {
				baseLayers[name][l].setVisible(visible);
				baseLayers[name][l].setOpacity(1);
			}
		}

		displayTransparencyRange();
	}

	function displayTransparencyRange() {
		if (transparentBaseLayerName) {
			for (let l = 0; l < baseLayers[transparentBaseLayerName].length; l++)
				baseLayers[transparentBaseLayerName][l].setOpacity(
					rangeContainerEl.firstChild.value / 100
				);

			rangeContainerEl.className = 'myol-double-layer';
		} else
			rangeContainerEl.className = 'myol-single-layer';
	}

	return control;
}
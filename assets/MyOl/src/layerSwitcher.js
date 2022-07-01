/**
 * Layer switcher
 * Need to include layerSwitcher.css
 */
//BEST alt key to swith layers / transparency
function controlLayerSwitcher(baseLayers, options) {
	options = options || {};

	const control = new ol.control.Control({
			element: document.createElement('div'),
		}),
		baseLayers = Object.fromEntries(
			Object.entries(layers || layersCollection())
			.filter(([_, v]) => v != null) // Remove empty layers
		),
		layerNames = Object.keys(baseLayers),
		baselayer = location.href.match(/baselayer=([^\&]+)/);
	let transparentBaseLayerName = '';

	// Get baselayer from url ?
	if (baselayer)
		localStorage.myol_baselayer = decodeURI(baselayer[1]);

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
		for (let name in baseLayers) {
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

			for (let l = 0; l < baseLayers[name].length; l++) {
				baseLayers[name][l].setVisible(false); // Don't begin to get the tiles yet
				map.addLayer(baseLayers[name][l]);
			}
		}

		displayBaseLayers(); // Init layers

		// Attach html additional selector
		const additionalSelector = document.getElementById(
			options.additionalSelectorId ||
			'additional-selector'
		);

		//BEST other id don't use the css
		if (additionalSelector) {
			control.element.appendChild(additionalSelector);
			// Unmask the selector if it has been @ the declaration
			additionalSelector.style.display = '';
		}
	};

	function selectBaseLayer(evt) {
		// 1 seule couche
		if (!evt || !evt.ctrlKey || this.value == localStorage.myol_baselayer) {
			transparentBaseLayerName = '';
			localStorage.myol_baselayer = this.value;
		}
		// Il y a une deuxième couche aprés celle existante
		else if (layerNames.indexOf(localStorage.myol_baselayer) <
			layerNames.indexOf(this.value)) {
			transparentBaseLayerName = this.value;
			// localStorage.myol_baselayer don't change
		}
		// Il y a une deuxième couche avant celle existante
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

			rangeContainerEl.className = 'double-layer';
		} else
			rangeContainerEl.className = 'single-layer';
	}

	return control;
}
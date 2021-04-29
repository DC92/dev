/**
 * Layer switcher
 */
function controlLayerSwitcher(options) {
	const control = new ol.control.Control({
			element: document.createElement('div'),
		}),
		layerNames = Object.keys(options.baseLayers),
		match = document.cookie.match(/baselayer=([^;]+)/);

	var selectedBaseLayerName = match ? match[1] : layerNames[0],
		lastBaseLayerName = '',
		transparentBaseLayerName = '';

	// If the cookie doesn't correspond to an existing layer
	if (typeof options.baseLayers[selectedBaseLayerName] == 'undefined')
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

		// Build html baselayers selector
		for (const name in options.baseLayers)
			if (options.baseLayers[name]) { // Don't dispatch null layers (whose declaraton failed)
				const layer = options.baseLayers[name];
				layer.inputEl = // Mem it for further ops
					addSelection('baseLayer', layer.ol_uid, name, name, selectBaseLayer);
				layer.setVisible(false); // Don't begin to get the tiles yet
				map.addLayer(layer);
			}

		// Build html overlays selector
		//TODO comment initialiser avant les cookies ?
		for (const name of Object.keys(options.overlays || {})) {
			control.element.appendChild(document.createElement('hr'));

			const layer = options.overlays[name],
				subsets = layer.options.subsets,
				match = document.cookie.match(new RegExp(name + '=([0-9,]*)')),
				subItems = match ? match[1].split(',') : [],
				firstCheckboxEl = addSelection(name, layer.ol_uid, name, '', selectOverlay, 'main-overlay');

			firstCheckboxEl.checked = true;
			for (const s of Object.keys(subsets || {})) {
				const cookieSubsetChecked = subItems.indexOf(subsets[s].toString()) != -1;
				addSelection(name, layer.ol_uid, s, subsets[s], selectOverlay, 'sub-overlay')
					.checked = cookieSubsetChecked;

				if (!cookieSubsetChecked)
					firstCheckboxEl.checked = false;
			}

			// Assign the selector
			layer.options.selectorName = name; //TODO DELETE when no more permanentCheckboxList

			// Silently add the layer
			layer.setVisible(false);
			map.addLayer(layer);

			displayOverlay(layer);
		}

		displayBaseLayers(); // Init layers
	};

	function addSelection(group, uid, name, value, selectAction, className) {
		const el = document.createElement('div'),
			inputId = 'l' + uid + (value ? '-' + value : '');

		control.element.appendChild(el);
		if (className)
			el.className = className;
		el.innerHTML =
			'<input type="checkbox" name="' + group +
			'" id="' + inputId + '" value="' + value + '" ' + ' />' +
			'<label for="' + inputId + '">' + name + '</label>';
		el.firstChild.onclick = selectAction;

		return el.firstChild;
	}

	function displayBaseLayers() {
		// Refresh layers visibility & opacity
		for (let name in options.baseLayers)
			if (options.baseLayers[name]) {
				options.baseLayers[name].inputEl.checked = false;
				options.baseLayers[name].setVisible(false);
				options.baseLayers[name].setOpacity(1);
			}

		options.baseLayers[selectedBaseLayerName].inputEl.checked = true;
		options.baseLayers[selectedBaseLayerName].setVisible(true);
		if (lastBaseLayerName) {
			options.baseLayers[lastBaseLayerName].inputEl.checked = true;
			options.baseLayers[lastBaseLayerName].setVisible(true);
		}
		displayTransparencyRange();
	}

	function displayTransparencyRange() {
		if (transparentBaseLayerName) {
			options.baseLayers[transparentBaseLayerName].setOpacity(
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

			options.baseLayers[transparentBaseLayerName].inputEl.checked = true;
			rangeContainerEl.firstChild.value = 50;
		} else
			lastBaseLayerName =
			transparentBaseLayerName = '';

		selectedBaseLayerName = this.value;
		options.baseLayers[selectedBaseLayerName].inputEl.checked = true;

		displayBaseLayers();
	}

	function selectOverlay() {
		const inputs = document.getElementsByName(this.name),
			layer = options.overlays[this.name],
			sel = [];

		// Global & sub choice checkboxes correlation
		if (this.id.includes('-'))
			inputs[0].checked = true;
		for (let i = 0; i < inputs.length; i++) {
			if (!this.id.includes('-'))
				inputs[i].checked = this.checked;
			if (i && inputs[i].checked)
				sel.push(inputs[i].value);
			if (!inputs[i].checked)
				inputs[0].checked = false;
		}

		displayOverlay(layer);
	}

	function displayOverlay(layer) {
		if (layer.options.urlSuffix) {
			layer.getSource().loadedExtentsRtree_.clear(); // Force the loading of all areas
			layer.getSource().clear(); // Redraw the layer
			layer.setVisible(true);
		} else
			layer.setVisible(false);

		// Set each overlay cookie (set = '' if no selection)
		document.cookie = this.name + '=' + layer.options.urlSuffix + '; path=/; SameSite=Secure; expires=' +
			new Date(2100, 0).toUTCString();
	}

	return control;
}
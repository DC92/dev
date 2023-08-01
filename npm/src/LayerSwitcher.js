/**
 * LayerSwitcher.js
 */
import './layerSwitcher.css';
import * as myControl from './MyControl';


//BEST how do we do on touch terminal ? alt key to switch layers / transparency
//BEST no lift when open/close submenu
//BEST make it a class
export default function LayerSwitcher(options) {
	const control = myControl.myButton({
			className: 'myol-button-switcher',
			label: '&#x274F;',
			submenuHTML: '<div id="myol-ls-range">' +
				'<input type="range" title="Glisser pour faire varier la tranparence">' +
				'<span>Ctrl+click: multicouches</span>' +
				'</div>',
			render: render,
			...options,
		}),
		baseLayers = Object.fromEntries(
			Object.entries(options.layers)
			.filter(([_, v]) => v && v.getMaxResolution()) //HACK Remove invalid layers
		),
		layerNames = Object.keys(baseLayers),
		baselayer = location.href.match(/baselayer=([^\&]+)/);

	let transparentBaseLayerName,
		rangeContainerEl;

	// Get baselayer from url if any
	if (baselayer)
		localStorage.myol_baselayer = decodeURI(baselayer[1]);

	// HACK run when the control is attached to the map
	function render(evt) {
		if (!control.render) // Only once
			return;
		control.render = null;

		const map = evt.target;

		// Hide the selector when the cursor is out of the selector
		map.on('pointermove', function(evt) {
			const max_x = map.getTargetElement().offsetWidth - control.element.offsetWidth - 20,
				max_y = control.element.offsetHeight + 20;

			if (evt.pixel[0] < max_x || evt.pixel[1] > max_y)
				control.element.classList.remove('myol-button-switcher-open');
		});

		// Build html transparency slider
		rangeContainerEl = document.getElementById('myol-ls-range');
		rangeContainerEl.firstChild.oninput = displayTransparencyRange;

		// Build html baselayers selectors
		for (let name in baseLayers) {
			const labelEl = document.createElement('label');

			labelEl.innerHTML = '<input type="checkbox" value="' + name + '" ' + ' />' + name;
			labelEl.firstChild.onclick = selectBaseLayer; //BEST resorb all firstChild
			control.submenuEl.appendChild(labelEl);

			//TODO BUG ???			baseLayers[name].setVisible(false); // Don't begin to get the tiles yet
			map.addLayer(baseLayers[name]);

			// Mem it for further ops
			baseLayers[name].inputEl = labelEl.firstChild; //BEST resorb
		}

		// Init layers
		displayBaseLayers();

		// Attach html additional selector
		const selectExtEl = document.getElementById(options.selectExtId);

		if (selectExtEl) {
			selectExtEl.classList.add('select-ext');
			control.submenuEl.appendChild(selectExtEl);
			// Unmask the selector if it has been @ the declaration
			selectExtEl.style.display = '';
		}
	}

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
			baseLayers[name].setVisible(visible);
			baseLayers[name].setOpacity(1);
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
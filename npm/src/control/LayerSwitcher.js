/**
 * LayerSwitcher.js
 */
import MyButton from './MyControl';
import './layerSwitcher.css';

//BEST how do we do on touch terminal ? alt key to switch layers / transparency
//BEST keep open on click (as other buttons)
export default class LayerSwitcher extends MyButton {
	constructor(options) {
		super({
			// MyButton options
			className: 'myol-button-switcher',
			label: '&#x274F;',
			subMenuHTML: '<div id="myol-ls-range">' +
				'<input type="range" title="Glisser pour faire varier la tranparence">' +
				'<span>Ctrl+click: multicouches</span>' +
				'</div>',

			...options,
		});

		this.baseLayers = Object.fromEntries(
			Object.entries(options.layers)
			.filter(([_, v]) => v && !v.getProperties().hidden)
		);
		this.layerNames = Object.keys(this.baseLayers);
		this.baselayer = location.href.match(/this.baselayer=([^\&]+)/);

		// Get baselayer from url if any
		if (this.baselayer)
			localStorage.myol_baselayer = decodeURI(this.baselayer[1]);
	}

	setMap(map) {
		super.setMap(map);

		// Hide the selector when the cursor is out of the selector
		map.on('pointermove', evt => {
			const max_x = map.getTargetElement().offsetWidth - this.element.offsetWidth - 20,
				max_y = this.element.offsetHeight + 20;

			if (evt.pixel[0] < max_x || evt.pixel[1] > max_y)
				this.element.classList.remove('myol-button-switcher-open');
		});

		// Build html transparency slider
		this.rangeContainerEl = document.getElementById('myol-ls-range');
		this.rangeContainerEl.firstChild.oninput = () => this.displayTransparencyRange();

		// Build html this.baseLayers selectors
		for (let name in this.baseLayers) {
			const labelEl = document.createElement('label');

			labelEl.innerHTML = '<input type="checkbox" value="' + name + '" ' + ' />' + name;
			labelEl.firstChild.onclick = evt => this.selectBaseLayer(evt); //BEST resorb all firstChild
			this.subMenuEl.appendChild(labelEl);

			this.baseLayers[name].setVisible(false); // Don't begin to get the tiles yet. Necessary for Bing
			map.addLayer(this.baseLayers[name]);

			// Mem it for further ops
			this.baseLayers[name].inputEl = labelEl.firstChild; //BEST resorb
		}

		// Init layers
		this.displayBaseLayers();

		// Attach html additional selector
		const selectExtEl = document.getElementById(this.options.selectExtId);

		if (selectExtEl) {
			selectExtEl.classList.add('select-ext');
			this.subMenuEl.appendChild(selectExtEl);
			// Unmask the selector if it has been at the declaration
			selectExtEl.style.display = '';
		}
	}

	selectBaseLayer(evt) {
		// Single layer
		if (!evt || !evt.ctrlKey || this.value == localStorage.myol_baselayer) {
			this.transparentBaseLayerName = '';
			localStorage.myol_baselayer = evt.target.value;
		}
		// There is a second layer after the existing one
		else if (this.layerNames.indexOf(localStorage.myol_baselayer) <
			this.layerNames.indexOf(this.value)) {
			this.transparentBaseLayerName = evt.target.value;
			// localStorage.myol_baselayer don't change
		}
		// There is a second layer before the existing one
		else {
			this.transparentBaseLayerName = localStorage.myol_baselayer;
			localStorage.myol_baselayer = evt.target.value;
		}

		this.rangeContainerEl.firstChild.value = 50;
		this.displayBaseLayers();
	}

	displayBaseLayers() {
		// Baselayer default is the first of the selection
		if (!this.baseLayers[localStorage.myol_baselayer])
			localStorage.myol_baselayer = this.layerNames[0];

		for (let name in this.baseLayers) {
			const visible =
				name == localStorage.myol_baselayer ||
				name == this.transparentBaseLayerName;

			// Write the checks
			this.baseLayers[name].inputEl.checked = visible;

			// Make the right layers visible
			this.baseLayers[name].setVisible(visible);
			this.baseLayers[name].setOpacity(1);
		}

		this.displayTransparencyRange();
	}

	displayTransparencyRange() { //TODO BUG don't work
		if (this.transparentBaseLayerName) {
			for (let l = 0; l < this.baseLayers[this.transparentBaseLayerName].length; l++)
				this.baseLayers[this.transparentBaseLayerName][l].setOpacity(
					this.rangeContainerEl.firstChild.value / 100
				);

			this.rangeContainerEl.className = 'myol-double-layer';
		} else
			this.rangeContainerEl.className = 'myol-single-layer';
	}

}
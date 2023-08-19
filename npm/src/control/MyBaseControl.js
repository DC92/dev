/**
 * Controls.js
 * Add some usefull controls with buttons
 */

import ol from '../../src/ol';

/**
 * Control button
 * Abstract class to be used by other control buttons definitions
 */
export class MyBaseControl extends ol.control.Control {
	constructor(options) {
		super({
			element: document.createElement('div'),
			...options,
		});

		this.options = options || {}; // Mem for further use
	}
}
export default MyBaseControl;

/**
 * Control to display the length & height difference of an hovered line
 */
export class LengthLine extends MyBaseControl {
	constructor() {
		super(); //HACK button not visible

		this.element.className = 'myol-length-line';
	}

	setMap(map) {
		super.setMap(map);

		map.on('pointermove', evt => {
			this.element.innerHTML = ''; // Clear the measure if hover no feature

			// Find new features to hover
			map.forEachFeatureAtPixel(
				evt.pixel,
				feature => this.calculateLength(feature), {
					hitTolerance: 6, // Default is 0
				});
		});
	}

	//BEST calculate distance to the ends
	calculateLength(feature) {
		if (feature) {
			let geometry = feature.getGeometry(),
				length = ol.sphere.getLength(geometry),
				fcs = this.getFlatCoordinates(geometry),
				denivPos = 0,
				denivNeg = 0;

			// Height difference calculation
			for (let c = 5; c < fcs.length; c += 3) {
				const d = fcs[c] - fcs[c - 3];

				if (d > 0)
					denivPos += d;
				else
					denivNeg -= d;
			}

			// Display
			if (length) {
				this.element.innerHTML =
					// Line length
					length < 1000 ?
					(Math.round(length)) + ' m' :
					(Math.round(length / 10) / 100) + ' km' +
					// Height difference
					(denivPos ? ' +' + denivPos + ' m' : '') +
					(denivNeg ? ' -' + denivNeg + ' m' : '');

				return false; // Continue detection (for editor that has temporary layers)
			}
		}
	}

	getFlatCoordinates(geometry) {
		let fcs = [];

		if (geometry.stride == 3)
			fcs = geometry.flatCoordinates;

		if (geometry.getType() == 'GeometryCollection')
			for (let g of geometry.getGeometries())
				fcs.push(...this.getFlatCoordinates(g));

		return fcs;
	}
}

/**
 * Control to display the mouse position
 */
export class MyMousePosition extends ol.control.MousePosition {
	constructor(options) {
		super({
			// From MousePosition options
			className: 'myol-coordinate',
			projection: 'EPSG:4326',
			placeholder: String.fromCharCode(0), // Hide control when mouse is out of the map

			coordinateFormat: mouse => {
				//BEST find better than window.gpsValues to share info
				if (window.gpsValues && window.gpsValues.position) {
					const ll4326 = ol.proj.transform(window.gpsValues.position, 'EPSG:3857', 'EPSG:4326'),
						distance = ol.sphere.getDistance(mouse, ll4326);

					return distance < 1000 ?
						(Math.round(distance)) + ' m' :
						(Math.round(distance / 10) / 100) + ' km';
				} else
					return ol.coordinate.createStringXY(4)(mouse);
			},

			...options,
		});
	}
}

/**
 * Permalink control
 * "map" url hash or localStorage: zoom=<ZOOM> lon=<LON> lat=<LAT>
 * Don't set view when you declare the map
 */
export class Permalink extends MyBaseControl {
	constructor(options) {
		super({
			// Permalink options
			init: true, // {true | false} use url hash or localStorage to position the map.
			setUrl: false, // {true | false} Change url hash when moving the map.
			display: false, // {true | false} Display permalink link the map.
			hash: '?', // {?, #} the permalink delimiter after the url
			//BEST init with bbox option

			...options,
		});

		if (this.options.display) {
			this.element.className = 'myol-permalink';
			this.aEl = document.createElement('a');
			this.aEl.innerHTML = 'Permalink';
			this.aEl.title = 'Generate a link with map zoom & position';
			this.element.appendChild(this.aEl);
		}
	}

	render(evt) {
		const view = evt.map.getView(),
			urlMod = location.href.replace( // Get value from params with priority url / ? / #
				/map=([0-9\.]+)\/(-?[0-9\.]+)\/(-?[0-9\.]+)/, // map=<zoom>/<lon>/<lat>
				'zoom=$1&lon=$2&lat=$3' // zoom=<zoom>&lon=<lon>&lat=<lat>
			) +
			// Last values
			'zoom=' + localStorage.myol_zoom +
			'lon=' + localStorage.myol_lon +
			'lat=' + localStorage.myol_lat +
			// Default
			'zoom=6&lon=2&lat=47';


		// Set center & zoom at the init
		if (this.options.init) {
			this.options.init = false; // Only once

			view.setZoom(urlMod.match(/zoom=([0-9\.]+)/)[1]);

			view.setCenter(ol.proj.transform([
				urlMod.match(/lon=(-?[0-9\.]+)/)[1],
				urlMod.match(/lat=(-?[0-9\.]+)/)[1],
			], 'EPSG:4326', 'EPSG:3857'));
		}

		// Set the permalink with current map zoom & position
		if (view.getCenter()) {
			const ll4326 = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
				newParams = 'map=' +
				(localStorage.myol_zoom = Math.round(view.getZoom() * 10) / 10) + '/' +
				(localStorage.myol_lon = Math.round(ll4326[0] * 10000) / 10000) + '/' +
				(localStorage.myol_lat = Math.round(ll4326[1] * 10000) / 10000);

			if (this.options.display)
				this.aEl.href = this.options.hash + newParams;

			if (this.options.setUrl)
				location.href = '#' + newParams;
		}
	}
}

/**
 * Control to display set preload of depth upper level tiles
 * This prepares the browser to become offline
 */
export class TilesBuffer extends MyBaseControl {
	constructor(options) {
		super({
			depth: 2,
			...options,
		});
	}

	setMap(map) {
		super.setMap(map);

		// Action on each layer
		//BEST too much load on basic browsing
		map.on('precompose', () => {
			map.getLayers().forEach(layer => {
				if (typeof layer.setPreload == 'function')
					layer.setPreload(this.options.depth);
			});
		});
	}
}
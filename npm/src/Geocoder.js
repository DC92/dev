/**
 * Geocoder
 * From https://github.com/jonataswalker/ol-geocoder
 * Corrected https://github.com/kirtan-desai/ol-geocoder
 */
//TODO BUG avec Ol 7.4.0
//BEST get it from github

// Geocoder
import '../geocoder/dist/ol-geocoder.css';
import '../src/Geocoder.css';
import Geocoder from '../geocoder/src/base';

// myol
import {
	controlButton,
} from './Controls';


export function controlGeocoder(options) {
	const geocoder = new Geocoder('nominatim', {
			placeholder: 'Recherche par nom sur la carte', // Initialization of the input field
			...options,
		}),
		controlEl = geocoder.element.firstElementChild;

	// Avoid submit of a form including the map
	geocoder.element.getElementsByTagName('input')[0]
		.addEventListener('keypress', evt =>
			evt.stopImmediatePropagation()
		);

	geocoder.on('addresschosen', evt =>
		evt.target.getMap().getView().fit(evt.bbox)
	);

	// Close other opened buttons when hover with a mouse
	geocoder.element.addEventListener('pointerover', () => {
		for (let el of document.getElementsByClassName('myol-button-selected'))
			el.classList.remove('myol-button-selected');
	});

	// Close submenu when hover another button
	document.addEventListener('pointerout', evt => {
		const hoveredEl = document.elementFromPoint(evt.x, evt.y);

		if (hoveredEl && hoveredEl.tagName == 'BUTTON')
			controlEl.classList.remove('gcd-gl-expanded');
	});

	return geocoder;
}
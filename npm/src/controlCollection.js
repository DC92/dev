/**
 * controlCollection.js
 * Add some usefull controls
 */

// Openlayers
import Attribution from 'ol/control/Attribution';
import FullScreen from 'ol/control/FullScreen';
import MousePosition from 'ol/control/MousePosition';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';

// MyOl
import {
	controlButton,
	controlLengthLine,
	controlMousePosition,
	controlPermalink,
	print,
} from './myControl';
import {
	load,
	download,
} from './Files';
import {
	controlGeocoder,
} from './Geocoder';
import {
	controlGPS,
} from './Geolocation';


/**
 * Help control
 * Requires controlButton
 * Display help contained in <TAG id="<options.submenuId>">
 */
//BEST make it a class
export function controlHelp(options) {
	return controlButton({
		label: '?',
		...options,
	});
}

/**
 * Controls examples
 */
export function controlCollection(opt) {
	const options = {
		supplementaryControls: [], //TODO resorb
		...opt,
	};

	return [
		// Top left
		new Zoom(options.Zoom),
		new FullScreen(options.FullScreen),
		controlGeocoder(options.Geocoder),
		controlGPS(options.GPS),
		load(options.load),
		download(options.download),
		print(options.Print),
		controlHelp(options.Help),

		// Bottom left
		controlLengthLine(options.LengthLine),
		controlMousePosition(options.Mouseposition),
		new ScaleLine(options.ScaleLine),

		// Bottom right
		controlPermalink(options.Permalink),
		new Attribution(options.Attribution),

		...options.supplementaryControls
	];
}
/**
 * Add some usefull controls
 */

// Openlayers
import 'ol/ol.css';
import Attribution from 'ol/control/Attribution.js';
import FullScreen from 'ol/control/FullScreen.js';
import MousePosition from 'ol/control/MousePosition.js';
import ScaleLine from 'ol/control/ScaleLine.js';
import Zoom from 'ol/control/Zoom.js';

// MyOl
import {
	controlButton,
	controlGeocoder,
	controlLengthLine,
	controlMousePosition,
	controlPermalink,
	controlPrint,
} from './Controls.js';
import {
	controlLoadGPX,
	controlDownload,
} from './Files.js';
import {
	controlGPS,
} from './Geolocation.js';


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
export function controlsCollection(opt) {
	const options = {
		supplementaryControls: [], //BEST resorb
		...opt,
	};

	return [
		// Top left
		new Zoom(options.Zoom),
		new FullScreen(options.FullScreen),
		controlGeocoder(options.Geocoder), //TODO BUG pas de geocodeur
		controlGPS(options.GPS),
		controlLoadGPX(options.LoadGPX),
		controlDownload(options.Download),
		controlPrint(options.Print),
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
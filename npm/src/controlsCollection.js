/**
 * Add some usefull controls
 * Need to include controls.css
 */
import Attribution from '../node_modules/ol/control/Attribution.js';
import FullScreen from '../node_modules/ol/control/FullScreen.js';
import MousePosition from '../node_modules/ol/control/MousePosition.js';
import ScaleLine from '../node_modules/ol/control/ScaleLine.js';
import Zoom from '../node_modules/ol/control/Zoom.js';
import {
	controlButton,
	controlGeocoder,
	controlLengthLine,
	controlMousePosition,
	controlPermalink,
	controlPrint,
} from '../src/Controls.js';
import {
	controlLoadGPX,
	controlDownload,
} from '../src/Files.js';
import {
	controlGPS,
} from '../src/Geolocation.js';


/**
 * Help control
 * Requires controlButton
 * Display help contained in <TAG id="<options.submenuId>">
 */
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
		controlGeocoder(options.Geocoder),
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
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
	myButton,
	lengthLine,
	mousePosition,
	permalink,
	print,
} from './MyControl';
import * as controlFiles from '../src/Files';
import MyGeocoder from './MyGeocoder';
import MyGeolocation from './MyGeolocation';


/**
 * Help control
 * Requires myButton
 * Display help contained in <TAG id="<options.submenuId>">
 */
//BEST make it a class
export function Help(options) {
	return myButton({
		label: '?',
		...options,
	});
}

/**
 * Controls examples
 */
export function collection(opt) {
	const options = {
		supplementaryControls: [], //BEST resorb
		...opt,
	};

	return [
		// Top left
		new Zoom(options.Zoom),
		new FullScreen(options.FullScreen),
		new MyGeocoder(options.Geocoder),
		new MyGeolocation(options.Geolocation),
		new controlFiles.Load(options.load),
		new controlFiles.Download(options.download),
		print(options.Print),
		Help(options.Help),

		// Bottom left
		lengthLine(options.LengthLine),
		mousePosition(options.Mouseposition),
		new ScaleLine(options.ScaleLine),

		// Bottom right
		permalink(options.Permalink),
		new Attribution(options.Attribution),

		...options.supplementaryControls
	];
}

export default collection;
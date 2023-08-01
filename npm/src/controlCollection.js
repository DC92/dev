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
import MyGeocoder from './MyGeocoder';
import MyGeolocation from './MyGeolocation';
import * as controlFiles from '../src/Files';
import * as myControl from './MyControl';


/**
 * Help control
 * Display help contained in <TAG id="<options.submenuId>">
 */
//BEST make it a class
export function Help(options) {
	return myControl.myButton({
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
		myControl.print(options.Print),
		Help(options.Help),

		// Bottom left
		myControl.lengthLine(options.LengthLine),
		myControl.mousePosition(options.Mouseposition),
		new ScaleLine(options.ScaleLine),

		// Bottom right
		myControl.permalink(options.Permalink),
		new Attribution(options.Attribution),

		...options.supplementaryControls
	];
}

export default collection;
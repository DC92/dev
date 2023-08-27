/**
 * This file defines the myol.control exports
 */

import * as myButton from './MyButton';
import * as myControl from './MyControl';
import Editor from './Editor';
import LayerSwitcher from './LayerSwitcher';
import MyGeocoder from './MyGeocoder';
import MyGeolocation from './MyGeolocation';
import ol from '../../src/ol';

export default {
	...myButton,
	...myControl,
	Editor: Editor,
	LayerSwitcher: LayerSwitcher,
	MyGeocoder: MyGeocoder,
	MyGeolocation: MyGeolocation,
	collection,
};

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
		new ol.control.Zoom(options.zoom),
		new ol.control.FullScreen(options.fullScreen),
		new MyGeocoder(options.geocoder),
		new MyGeolocation(options.geolocation),
		new myButton.Load(options.load),
		new myButton.Download(options.download),
		new myButton.Print(options.print),

		// Bottom left
		new myControl.LengthLine(options.lengthLine),
		new myControl.MyMousePosition(options.myMouseposition),
		new ol.control.ScaleLine(options.scaleLine),

		// Bottom right
		new ol.control.Attribution(options.attribution),

		...options.supplementaryControls,
	];
}
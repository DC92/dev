 // This file defines the myol.control exports

 import Editor from './Editor';
 import LayerSwitcher from './LayerSwitcher';
 import MyGeocoder from './MyGeocoder';
 import * as myControl from './MyControl';

 export default {
 	Editor: Editor,
 	LayerSwitcher: LayerSwitcher,
 	MyGeocoder: MyGeocoder,
 	...myControl,
 };
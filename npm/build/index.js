/**
 * @module myol
 */

import '../node_modules/ol/ol.css';

export {default as View} from '../node_modules/ol/View.js';
export {default as TileLayer } from '../node_modules/ol/layer/Tile.js';
export {default as XYZ} from 'ol/source/XYZ';

import '../src/controls.css';
import '../src/editor.css';
import '../src/layerSwitcher.css';

export {default as MyMap} from '../src/MyMap.js';

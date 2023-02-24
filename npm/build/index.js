// This file defines the contents of the myol.js myol.css, myol.js & myol.css libraries
 
// openlayers.org
import 'ol/ol.css';
export * from 'ol';

// MyOl
import '../src/controls.css';
import '../src/layerSwitcher.css';
import '../src/editor.css';
export * from '../src/Controls.js';
export * from '../src/Files.js';
export * from '../src/Geolocation.js';
export * from '../src/Marker.js';
export * from '../src/layerSwitcher.js';
export * from '../src/TileLayerCollection.js';
export * from '../src/VectorLayer.js';
export * from '../src/VectorLayerCollection.js';
export * from '../src/editor.js';

// Geocoder
import '@kirtandesai/ol-geocoder/dist/ol-geocoder.css';
import '@kirtandesai/ol-geocoder/dist/ol-geocoder-debug.js';

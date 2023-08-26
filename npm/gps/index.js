/* global ol, myol */ // eslint context

//TODO // Force https to allow PWA and geolocation
/*const url =
	(location.hostname == 'localhost' ? 'http://' : 'https://') +
	location.hostname +
	location.pathname +
	// Force full script name of short url to allow PWA
	(location.href.search('index') == -1 ? 'index.php' : '') +
	location.search +
	location.hash;

//BEST risk of loop !
if (location.href != url)
	location.replace(url);
*/

var gpxFiles = [ /*GPXFILES*/ ];

console.log('MyGPS version LAST_CHANGE_TIME'); 

// Map
//TODO full screen => no status bar
	console.log('Display map');
var loadControl = new myol.control.Load(),
	map = new ol.Map({
		target: 'map',
		view: new ol.View({
			constrainResolution: true, // Force zoom on the available tile's definition
		}),
		controls: [
			// Top left
			//new ol.control.Zoom( ),
			new myol.control.MyGeocoder(),
			new myol.control.MyGeolocation(),
			loadControl,
			new myol.control.Download(),
			new myol.control.MyButton({ // Help
				label: '?',
				subMenuId: 'myol-help-gps',
			}),

			// Top right
			new myol.control.LayerSwitcher({
				layers: myol.layer.tile.collection(),
			}),

			// Bottom left
			new myol.control.LengthLine(),
			new myol.control.MyMousePosition(),
			new ol.control.ScaleLine(),

			// Bottom right
			new myol.control.Permalink(), //TODO test
			new ol.control.Attribution(),

			// No button
			new myol.control.TilesBuffer(),
		],
	});

// Load server .gpx file from url #name (part of filename, case insensitive
if (location.hash) {
	const initFileName = gpxFiles.find(fn =>
		fn.toLowerCase()
		.includes(
			location.hash.replace('#', '')
			.toLowerCase()
		)
	);

	if (initFileName)
		loadControl.loadUrl(initFileName);
}

// Add a menu to load .gpx files included in the gps/... directories
if (gpxFiles) {
	const tracesEl = document.getElementById('myol-traces-gps');

	gpxFiles.forEach(f => {
		const name = f.match(/([^/]*)\./);

		if (name)
			tracesEl.insertAdjacentHTML(
				'beforeend',
				'<p><a onclick="loadControl.loadUrl(\'' + f + '\')">' + name[1] + '</a></p>'
			);
	});

	map.addControl(
		new myol.control.MyButton({
			label: '&#128694;',
			subMenuId: 'myol-traces-gps',
		})
	);
}

// Ask to reload the PWA when a new version is loaded
//TODO display the control once when the server update
//TODO not always trigger when SW change
navigator.serviceWorker.addEventListener('controllerchange', () => {
	console.log('PWA controllerchange');
	map.addControl(
	new myol.control.MyButton({
		label: '&#127381;',
		subMenuHTML: '<p>Une nouvelle version</p>' +
			'<p>ou de nouvelles traces</p>' +
			'<p>sont disponibles.</p>' +
			'<a href="">Recharger la page</a>',
	}));   
});

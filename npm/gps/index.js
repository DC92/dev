/* global ol, myol, gpxFiles */ // eslint context

const url =
	// Force https to allow PWA and geolocation
	(location.hostname == 'localhost' ? 'http://' : 'https://') +
	location.hostname +
	location.pathname +
	// Force full script name of short url to allow PWA
	(location.href.search('index') == -1 ? 'index.php' : '') +
	location.search +
	location.hash;

if (location.href != url)
	location.replace(url);

// Ask to reload the PWA when a new version is loaded
navigator.serviceWorker.addEventListener('controllerchange', function() {
	map.addControl(
		new myol.control.MyButton({
			label: '&#127381;',
			subMenuHTML: '<p>Une nouvelle version</p>' +
				'<p>ou de nouvelles traces</p>' +
				'<p>sont disponibles.</p>' +
				'<a href="">Recharger la page</a>',
		}),
	);
});

// Map
//TODO full screen => no status bar
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
if (gpxFiles && location.hash)
	loadControl.loadUrl(gpxFiles.find(s =>
		s.toLowerCase()
		.includes(
			location.hash.replace('#', '')
			.toLowerCase()
		)
	));

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
// Validators adapters
/* jshint esversion: 6 */
if (!ol) var ol = {};

//HACK for some mobiles touch functions (IOS)
if (window.PointerEvent === undefined) {
	const script = document.createElement('script');
	script.src = 'https://unpkg.com/elm-pep';
	document.head.appendChild(script);
}

/**
 * Debug facilities on mobile
 */
//HACK use hash ## for error alerts
if (!location.hash.indexOf('##'))
	window.addEventListener('error', function(evt) {
		alert(evt.filename + ' ' + evt.lineno + ':' + evt.colno + '\n' + evt.message);
	});
//HACK use hash ### to route all console logs on alerts
if (location.hash == '###')
	console.log = function(message) {
		alert(message);
	};

/**
 * Display OL version
 */
try {
	new ol.style.Icon(); // Try incorrect action
} catch (err) { // to get Assert url
	console.log('Ol ' + err.message.match('/v([0-9\.]+)/')[1]);
}

/**
 * Load url ?name=value&name=value and #name=value&name=value in localstorage.myol_name
 */
for (let v of location.href.matchAll(/([a-z]+)=([^?#=]+)/g))
	localStorage['myol_' + v[1]] = v[2];

/**
 * Json parsing errors log
 */
//BEST implement on layerVector.js & editor
function JSONparse(json) {
	try {
		return JSON.parse(json);
	} catch (returnCode) {
		console.log(returnCode + ' parsing : "' + json + '" ' + new Error().stack);
	}
}

/**
 * Icon extension depending on the OS
 */
function iconCanvasExt() {
	//TODO OBSOLETE navigator.userAgent => navigator.userAgentData
	const iOSVersion = navigator.userAgent.match(/iPhone OS ([0-9]+)/);
	return iOSVersion && iOSVersion[1] < 13 ? 'png' : 'svg';
}

/**
 * Warn layers when added to the map
 */
//BEST DELETE (used by editor)
ol.Map.prototype.handlePostRender = function() {
	ol.PluggableMap.prototype.handlePostRender.call(this);

	const map = this;
	map.getLayers().forEach(function(layer) {
		if (!layer.map_) {
			layer.map_ = map;

			layer.dispatchEvent({
				type: 'myol:onadd',
				map: map,
			});
		}
	});
};
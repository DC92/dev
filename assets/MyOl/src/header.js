// Ease validators
/* jshint esversion: 6 */ //BEST accept spread operator
if (!ol) var ol = {};

//TODO integration to GeoBB . Chemineur

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
 * Display misc values
 */
(async function() {
	let data = [];

	// OL version
	try {
		new ol.style.Icon(); // Try incorrect action
	} catch (err) { // to get Assert url
		data.push('Ol ' + err.message.match('/v([0-9\.]+)/')[1]);
	}

	// myol storages in the subdomain
	['localStorage', 'sessionStorage'].forEach(s => {
		if (window[s].length)
			data.push(s + ':');

		Object.keys(window[s])
			.filter(k => k.substring(0, 5) == 'myol_')
			.forEach(k => data.push('  ' + k + ': ' + window[s].getItem(k)));
	});

	// Registered service workers in the scope
	if ('serviceWorker' in navigator)
		await navigator.serviceWorker.getRegistrations().then(registrations => {
			if (registrations.length) {
				data.push('service-worker:');

				for (let registration of registrations) {
					if (registration.active)
						data.push('  ' + registration.active.scriptURL);
					//registration.unregister(); // For test purposes
				}
			}
		});

	await caches.keys().then(function(names) {
		if (names.length) {
			data.push('caches:');

			for (let name of names) {
				data.push('  ' + name);
				//caches.delete(name); // For test purposes
			}
		}
	});

	// Final display
	console.log(data.join('\n'));
})();

/**
 * Warn layers when added to the map
 */
//BEST DELETE (used by marker.js & editor.js)
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

/**
 * Json parsing errors log
 */
//BEST implement on layerVectorCollection.js & editor.js
function JSONparse(json) {
	try {
		return JSON.parse(json);
	} catch (returnCode) {
		console.log(returnCode + ' parsing : "' + json + '" ' + new Error().stack);
	}
}

/**
 * IOS 12 support
 */
//HACK for pointer events (IOS < 13)
if (window.PointerEvent === undefined) {
	const script = document.createElement('script');
	script.src = 'https://unpkg.com/elm-pep';
	document.head.appendChild(script);
}

// Icon extension depending on the OS (IOS 12 dosn't support SVG)
function iconCanvasExt() {
	//BEST OBSOLETE navigator.userAgent => navigator.userAgentData
	const iOSVersion = navigator.userAgent.match(/iPhone OS ([0-9]+)/);
	return iOSVersion && iOSVersion[1] < 13 ? 'png' : 'svg';
}
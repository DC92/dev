// Ease validators
/* jshint esversion: 6 */ //BEST accept spread operator
if (!ol) var ol = {};

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
	let data = ['Openlayers '+ol.version];

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
				data.push('service-workers:'); //BEST BUG displayed event when we have nothing

				for (let registration of registrations) {
					if (registration.active) {
						data.push('  ' + registration.active.scriptURL);

						// TEMPORARY : Delete previous version of MyOl service worker
						if (registration.active.scriptURL.includes('url_path'))
							registration.unregister()
							.then(console.log('SW ' + registration.active.scriptURL + ' deleted'));
					}
				}
			}
		});

	if (typeof caches == 'object')
		await caches.keys().then(function(names) {
			if (names.length) {
				data.push('caches:');

				for (let name of names)
					data.push('  ' + name);
			}
		});

	// Final display
	console.info(data.join('\n'));
})();

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
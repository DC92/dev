/* jshint esversion: 6 */

/* Fonctions liées à la carte */
function scanCarte() {
	$('.carte').each(function(index, el) {
		const ll = ol.proj.transform(eval('[' + el.textContent + ']'), 'EPSG:4326', 'EPSG:3857');
		el.innerHTML = null; // Erase the DIV

		new ol.Map({
			layers: [
				new ol.layer.Tile({
					source: new ol.source.OSM(),
				}),
				new ol.layer.Vector({
					source: new ol.source.Vector({
						features: [
							new ol.Feature({
								geometry: new ol.geom.Point(ll),
							}),
						]
					}),
					style: new ol.style.Style({
						image: new ol.style.Icon(({
							src: 'ext/Dominique92/Gym/styles/all/theme/images/ballon-rose.png',
							anchor: [0.5, 0.8],
						})),
					}),
				}),
			],
			target: el,
			controls: [], // No zoom
			view: new ol.View({
				center: ll,
				zoom: 17
			})
		});
	});
}
scanCarte();

/* Fonctions liées à la page d'accueil */
function initMenu(menu, defaut) {
	// Display hash command at the beginning
	const hash = decodeURI(window.location.hash.substr(1) || defaut);
	$.each(menu, function(index, value) {
		if (value == hash)
			displayAjax(value, index);
		if (typeof value == 'object')
			$.each(value, function(subIndex, subValue) {
				if (subValue == hash) {
					displayAjax(value, index);
					ajax('viewtopic.php?template=viewtopic&p=' + subValue);
				}
			});
	});
}

function displayMenu(options) {
	const el = $('<ul>').attr('class', 'menu');
	if (options.titre)
		el.append($('<h2>').text(options.titre));

	$.each(options.menu, function(index, value) {
		// Build LABEL & IL for the item
		const label = $('<label>').text(index),
			il = $('<il>').append(label).css({
				background: color(),
			});
		el.append(il);

		il.click(function() {
			window.location.hash = typeof value == 'number' ?
				value :
				options.menuItem[index];
			displayAjax(value, index, options.titre);
		});
	});
	return el;
}

function displayAjax(value, titre, keepTitle) {
	// Remove the ajax tmp blocks
	$('.ajax-temp').remove();

	// Remove the submenu if we click on one item of the main menu
	if (!keepTitle)
		$('#submenu').remove();

	// Add the submenu if any
	if (typeof value == 'object') {
		$('#bandeau').append(
			displayMenu({
				menu: value,
				titre: titre,
			}).attr('id', 'submenu')
		);
		ajax('viewtopic.php?template=viewtopic&p=' + menuItem[titre]);
		// Display ajax block if available
	} else
		ajax('viewtopic.php?template=viewtopic&p=' + value);
}

// Load url data on an element
function ajax(url) {
	$.get(url, function(data) {
		// Build the DIV to display the ajax result
		const ela = $('<div>')
			.attr('class', 'ajax-temp')
			.html(data);
		$('body').append(ela);
		scanCarte();
	});
}

function color() {
	const saturation = 80; // on 255
	window.colorAngle = window.colorAngle ? window.colorAngle + 2.36 : 1;
	let color = '#';
	for (let angle = 0; angle < 6; angle += Math.PI * 0.66)
		color += (0x1ff - saturation + saturation * Math.sin(window.colorAngle + angle))
		.toString(16).substring(1, 3);
	return color;
}

function norm(s) {
	return s.normalize('NFKD').replace(/[\u0000-\u002F]|[\u003A-\u0040]|[\u005B-\u0060]|[\u007B-\u036F]/g, '').toLowerCase();
}

/* Fonctions d'exécution des bbCODES */
function loadUrl(url) {
	const match = window.location.href.match(/([a-z]+)\.php/);
	if (match.length == 2 && match[1] == 'index')
		window.location.href = url;
}
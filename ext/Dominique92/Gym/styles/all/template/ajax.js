/* jshint esversion: 6 */

function initMenu() {
	const hashPostId = window.location.hash.substr(1) || Object.keys(menu[0])[0];

	// Affiche un éventuel sous-menu
	$('#bandeau').append(displayMenu(
		menu[hashPostId], // sous-menu
		menu[0][hashPostId], // Titre
		'submenu' // Id
	));

	// Affiche une éventuelle page
	$('.ajax-temp').remove();
	ajax('viewtopic.php?template=viewtopic&p=' + hashPostId);

	// Si c'est le sous-menu
	$.each(menu, function(index, value) {
		if (parseInt(index) && value[hashPostId]) {
			$('#bandeau').append(displayMenu(
				menu[index], // sous-menu
				menu[index][hashPostId], // Titre
				'submenu' // Id
			));
		}
	});
}

function displayMenu(list, titre, id) {
	$('#submenu').remove();

	const el = $('<ul>').attr('class', 'menu');
	if (titre)
		el.append($('<h2>').text(titre));
	if (id)
		el.attr('id', id);

	$.each(list, function(index, value) {
		el.append($('<il>')
			.append($('<label>').text(value))
			.css({
				background: color(),
			})
			.click(function() {
				window.location.hash = index;
			}));
	});

	return el;
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

// Load url data on an element
function ajax(url, el) {
	$.get(url, function(data) {
		// Build the DIV to display the ajax result
		const ela = $('<div>')
			.attr('class', 'ajax-temp')
			.html(data);
		$(el || 'body').append(ela);

		// Expansion des bbcodes complexes
		$('.include').each(function(index, el) {
			if (el.innerHTML.indexOf('<') == -1) { // Don't loop when receiving the request !
				const url = el.innerText;
				el.innerHTML = ''; // Erase the DIV to don't loop
				ajax(url, el);
			}
		});

		$('.carte').each(function(index, el) {
			if (el.innerText) {
				const ll = ol.proj.transform(eval('[' + el.textContent + ']'), 'EPSG:4326', 'EPSG:3857');
				el.innerHTML = null; // Erase the DIV to init the map only once

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
			}
		});
	});
}

/* Fonctions d'exécution des bbCODES */
function loadUrl(url) {
	const match = window.location.href.match(/([a-z]+)\.php/);
	if (match.length == 2 && match[1] == 'index')
		window.location.href = url;
}

/* Posting.php */
function displayCalendar() {
	const elDay = document.getElementById('gym_jour'),
		elo = document.getElementById('gym_scolaire'),
		els = document.getElementById('liste_semaines');

	if (elDay && elo && els) {
		let lastMonth = 0;
		for (let week = 0; week < 44; week++) {
			const elb = document.getElementById('gym_br_' + week),
				elm = document.getElementById('gym_mois_' + week),
				eld = document.getElementById('gym_date_' + week),
				date = new Date(new Date().getFullYear(), -4); // Sept 1st
			date.setDate(date.getDate() + parseInt(elDay.value, 10) + 1 - date.getDay() + week * 7); // Day of the week
			eld.innerHTML = date.getDate();

			if (lastMonth != date.getMonth()) { // Début de mois
				elb.style.display = '';
				elm.innerHTML = date.toLocaleString('fr-FR', {
					month: 'long'
				}) + ': ';
			} else { // Suite de mois
				elb.style.display = 'none';
				elm.innerHTML = '';
			}
			// Hide week calendar if "scolaire"
			els.style.display = elo.checked ? 'none' : '';

			lastMonth = date.getMonth();
		}
	}
}
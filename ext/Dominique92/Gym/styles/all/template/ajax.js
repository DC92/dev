/* jshint esversion: 6 */
function refreshMenu(evt) {
	const menu = evt.data,
		titres = {},
		pagePostId = window.location.hash.substr(1) ||
		parseInt(Object.keys(menu[0])[0].slice(-3)); // Premier menu par défaut

	// Find menu item
	$.each(menu, function(menuPostId, items) {
		$.each(items, function(index, value) {
			titres[parseInt(index.slice(-3))] = {
				menuPostId: parseInt(menuPostId),
				titre: value,
			};
		});
	});

	// Menu principal (permanent)
	if (evt.type == 'load')
		displayMenu($('#menu'), menu[0]);

	// Clean variable areas	
	$('#titre').html('');
	$('#sous-menu').html('');
	$('#page').html('');

	// Choix dans un sous-menu
	const subMenuPostId = titres[pagePostId].menuPostId;
	if (subMenuPostId) {
		$('#titre').html('<h2>' + titres[subMenuPostId].titre + '</h2>');
		displayMenu($('#sous-menu'), menu[subMenuPostId]);
		ajax('#page', 'viewtopic.php?template=viewtopic&p=' + pagePostId);
	}
	// Choix d'un sous-menu
	else if (menu[pagePostId]) {
		ajax('#titre', 'viewtopic.php?template=viewtopic&p=' + pagePostId);
		displayMenu($('#sous-menu'), menu[pagePostId]);
	}
	// Choix d'une page
	else
		ajax('#page', 'viewtopic.php?template=viewtopic&p=' + pagePostId);
}

function displayMenu(elMenu, items) {
	const elUL = $('<ul>').attr('class', 'menu');
	elMenu.append(elUL);

	window.colorAngle = items.length; // Always same colors for each submenu
	const saturation = 80; // on 255

	$.each(items, function(index, value) {
		elUL.append($('<il>')
			.append($('<label>').text(value))
			.css({
				background: function() { // Random color
					window.colorAngle = window.colorAngle ? window.colorAngle + 2.36 : 1;
					let color = '#';
					for (let angle = 0; angle < 6; angle += Math.PI * 0.66)
						color += (0x1ff - saturation + saturation * Math.sin(window.colorAngle + angle))
						.toString(16).substring(1, 3);
					return color;
				},
			})
			.click(function() {
				window.location.hash = parseInt(index) ? index % 1000 : '';
			}));
	});
}

// Load url data on an element
function ajax(el, url) {
	$.get(url, function(data) {
		$(el).html(data);

		// Expansion des bbcodes complexes
		$('.include').each(function(index, elBBcode) {
			if (elBBcode.innerHTML.indexOf('<') == -1) { // Don't loop when receiving the request !
				const url = elBBcode.innerText;
				elBBcode.innerHTML = ''; // Erase the BBcode DIV to don't loop
				if (url.charAt(0) == '@')
					window.location.href = url.substr(1);
				else
					ajax(elBBcode, url);
			}
		});

		$('.carte').each(function(index, elCarte) {
			if (elCarte.innerText) {
				const ll = ol.proj.transform(eval('[' + elCarte.textContent + ']'), 'EPSG:4326', 'EPSG:3857');
				elCarte.innerHTML = null; // Erase the DIV to init the map only once

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
					target: elCarte,
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
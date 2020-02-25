/* jshint esversion: 6 */

// DEBUG
if (window.location.hash.substr(1, 1) == '0' && window.location.hash.length > 2) {
	window.addEventListener('error', function(evt) {
		alert(evt.filename + ' ' + evt.lineno + ':' + evt.colno + '\n' + evt.message);
	});
	console.log = function(message) {
		alert(message);
	};
}

function refreshMenu(evt) {
	const menu = evt.data,
		titres = {},
		pagePostId =
		parseInt(window.location.hash.substr(1)) ||
		parseInt(Object.keys(menu[0])[0].slice(-3)); // Premier menu par défaut

	// Find menu item
	$.each(menu, function(menuPostId, items) {
		$.each(items, function(index, value) {
			titres[parseInt(index.slice(-3))] = {
				menuPostId: parseInt(menuPostId),
				titre: value,
				topic: parseInt(index.substr(-6, 3)),
			};
		});
	});

	// Menu principal (permanent)
	if (evt.type == 'load')
		displayMenu($('#menu'), menu[0], 'posting.php?mode=post&f=2');

	// Clean variable areas	
	$('#titre').html('');
	$('#sous-menu').html('');
	$('#page').html('');

	// Sous menu du menu
	if (menu[pagePostId]) {
		ajax('#titre', 'viewtopic.php?template=viewtopic&p=' + pagePostId);
		displayMenu($('#sous-menu'), menu[pagePostId], 'posting.php?mode=reply&f=2&t=' + titres[pagePostId].topic);
	}
	// Page d'un menu
	else if (titres[pagePostId]) {
		const menuPostId = titres[pagePostId].menuPostId;

		// Page du sous menu
		if (titres[menuPostId]) {
			$('#titre').html('<h2>' + titres[menuPostId].titre + '</h2>');
			displayMenu($('#sous-menu'), menu[menuPostId], titres[pagePostId].topic);
		}
		ajax('#page', 'viewtopic.php?template=viewtopic&p=' + pagePostId);
	}
	// Page sans menu
	else
		ajax('#page', 'viewtopic.php?template=viewtopic&p=' + pagePostId);
}

function displayMenu(elMenu, items, addUrl) {
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
	// Commande ajout
	if (moderateurLogged)
		elUL.append($('<il>').html(
			'<a title="Ajouter un item au menu" href="' + addUrl + '">' +
			'<i class="icon fa-commenting-o fa-fw" aria-hidden="true"></i></a>'));
}

// Load url data on an element
function ajax(el, url) {
	$.get(url, function(data) {
		$(el).html(data);

		// BBCodes d'inclusion d'un bloc ajax ou de saut vers une url
		$('.include').each(function(index, elBBCode) {
			$(elBBCode).removeClass('include'); // Don't loop

			const url = elBBCode.innerText;
			elBBCode.innerHTML = '';
			if (url.charAt(0) == ':')
				window.location.href = url.substr(1);
			else
				ajax(elBBCode, url);
		});

		// BBCodes ajout d'une carte
		$('.carte').each(function(index, elCarte) {
			if (elCarte.innerText) {
				const ll = ol.proj.transform(eval('[' + elCarte.textContent + ']'), 'EPSG:4326', 'EPSG:3857');
				elCarte.innerHTML = null; // Don't loop

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

// Posting.php
function displayCalendar(elDayValue) {
	for (let week = 0; week < 52; week++) { // Numéro depuis le 1er septembre
		const date = new Date(new Date().getFullYear(), -4); // 1er septembre
		date.setDate(date.getDate() + parseInt(elDayValue || 0, 10) + 1 - date.getDay() + week * 7); // Jour de la semaine
		$('#calendrier_semaine_' + week).text(date.getDate());
		$('#calendrier_semaine_td_' + week).appendTo('#calendrier_mois_' + date.getMonth());
	}
}

function displayInputCalendar() {
	if (!$('#gym_scolaire')[0].checked)
		$('#liste_semaines')[0].style.display = 'block';;
	displayCalendar($('#gym_jour').val());
}
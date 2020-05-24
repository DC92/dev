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

// BBCode ajout d'un calendrier
$('.calendrier').each(function(index, elCal) {
	const semaines = $(elCal).attr('data-semaines').split(','),
		nowhere = $('#cal_mois_7');

	for (let week = 0; week < 52; week++) {
		const td = $('<td id="cal_s' + week + '"><span/></td>');
		td.appendTo(nowhere); // Attach it to be able to get it
		if ($('body#phpbb').length) { // posting
			const input = $('<input type="checkbox" value="' + week + '" name="gym_semaines[]" />');
			input.appendTo(td);
			if (semaines.includes(week.toString()))
				input.attr('checked', 'checked');
		} else { // viewtopic
			if (semaines.includes(week.toString()))
				td.addClass('selected');
		}
	}
	displayCalendar(elCal);

	// Ajoute une case aux mois n'ayant que 4 jours de ce type
	if (!$('body#phpbb').length) // viewtopic
		$('.calendrier tr').each(function() {
			if ($(this).children().length == 5)
				$('<td>').appendTo($(this));
		});
});

function displayCalendar(elCal) {
	// Marque le jour et attribue au mois
	//TODO BUG n'initialise pas les chiffres quand scolaire est coché
	const jour = parseInt(elCal.value || $(elCal).attr('data-jour') || 0, 10);
	for (let week = 0; week < 52; week++) {
		const wEl = $('#cal_s' + week),
			date = new Date(new Date().getFullYear(), -5); // 1er aout
		date.setDate(date.getDate() - date.getDay() + jour + 1 + week * 7); // Jour de la semaine
		wEl.appendTo('#cal_mois_' + date.getMonth());
		wEl.children().html(date.getDate());
	}
}

function displayInputCalendar(elCal) {
	displayCalendar(elCal);

	// Bascule scolaire / calendrier
	$('#edit_semaines')[0].style.display =
		$('#gym_scolaire')[0].checked ? 'none' : 'block';
}

// BBCode ajout d'une carte
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
							src: 'ext/Dominique92/Gym/styles/prosilver/theme/images/ballon-rose.png',
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

// Slideshow
setInterval(function() {
	$('.slideshow ul').animate({
			marginLeft: -400,
		},
		800,
		function() {
			$(this).css({
				marginLeft: 0,
			}).find('li:last').after($(this).find('li:first'));
		}
	);
}, 5000);

// Sous-menus déroulants ne dépassent pas à droite
function submenuPos() {
	$('.submenu').each(function(index, el) {
		const ww = $(window).width(),
			elw = $(el).width(),
			pp = $(el).parent().position();
		$(el).css({
			top: pp.top,
			left: Math.min(pp.left, ww - elw)
		});
	});
}
submenuPos();
$(window).on('resize', submenuPos);
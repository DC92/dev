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

// Scrool to the top at load (for sticky menu)
/*//TODO DELETE
window.onbeforeunload = function() {
	window.scrollTo(0, 0);
};*/

// Sous-menus déroulants flotants
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

// BBCode ajout d'un calendrier
$('.calendrier').each(function(index, elCal) {
	for (let week = 0; week < 52; week++) {
		const jour = $(elCal).attr('data-jour'),
			elWeek = $('#' + elCal.id + '_' + week),
			date = new Date(new Date().getFullYear(), -5); // 1er aout
		// Jour de la semaine
		date.setDate(date.getDate() - date.getDay() + 1 + parseInt(jour || 0, 10) + week * 7);
		elWeek.children().text(date.getDate());
		elWeek.appendTo('#' + elCal.id + '_mois_' + date.getMonth());
	}

	// Ajoute une case aux mois n'ayant que 4 jours de ce type
	$('.calendrier tr').each(function() {
		if ($(this).children().length < 6)
			$('<td>').appendTo($(this));
	});
});
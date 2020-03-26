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

// BBCode d'inclusion d'un bloc ajax ou de saut vers une url
$('.include').each(function(index, elBBCode) {
	$(elBBCode).removeClass('include'); // Don't loop

	const url = elBBCode.innerText;
	elBBCode.innerHTML = '';
	if (url.charAt(0) == ':')
		window.location.href = url.substr(1);
	else
		$.get(url, function(data) {
			$(elBBCode).html(data);
		});
});

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

// Posting.php
function displayCalendar(post_id, jour) {
	// Numéros depuis le dimanche suivant le 1er aout (commence à 0)
	for (let week = 0; week < 52; week++) {
		const date = new Date(new Date().getFullYear(), -5); // 1er aout
		date.setDate(date.getDate() - date.getDay() + 1 + parseInt(jour || 0, 10) + week * 7); // Jour de la semaine
		$('#s_' + post_id + '_' + week).text(date.getDate());
		$('#tds_' + post_id + '_' + week).appendTo('#mois_' + post_id + '_' + date.getMonth());
	}
}
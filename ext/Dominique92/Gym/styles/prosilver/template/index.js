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
	const id = $(elCal).attr('data-id'),
		semaines = $(elCal).attr('data-semaines').split(','),
		nowhere = $('#cal' + id + '_m8');

	for (let week = 0; week < 52; week++) {
		const td = $('<td id="cal' + id + '_s' + week + '"><span/></td>');
		td.appendTo(nowhere); // Attach it to be able to get it
		if ($('body#phpbb').length) { // Is it a posting page ?
			const input = $('<input type="checkbox" value="' + week + '" name="gym_semaines[]" />');
			input.appendTo(td);

			if (semaines.includes(week.toString()))
				input.attr('checked', 'checked');
		} else { // It is a viewtopic page
			if (semaines.includes(week.toString()))
				td.addClass('selected');
		}
	}
	displayInputCalendar(
		elCal,
		parseInt($(elCal).attr('data-jour'), 10)
	);
});

// Change parameters
function changeDayCalendar() {
	displayInputCalendar(
		$('.calendrier')[0],
		parseInt($('#gym_jour option:selected')[0].value)
	);
}

// Display the posting calendar
function displayInputCalendar(elCal, jour) {
	let id = $(elCal).attr('data-id');

	for (let week = 0; week < 52; week++) {
		const date = new Date(annee_debut, 8 - 1, 3 + week * 7 + jour), // Jour suivant le lundi suivant le 1er aout annee_debut
			weekEl = $('#cal' + id + '_s' + week),
			monthEl = $('#cal' + id + '_m' + (1 + date.getMonth()));

		weekEl.appendTo(monthEl);
		weekEl.find('span').html(date.getDate());
	}

	// Ajoute une case aux mois n'ayant que 4 jours de ce type
	if (!$('body#phpbb').length) // viewtopic
		$('.calendrier tr').each(function() {
			if ($(this).children().length == 5)
				$('<td>').appendTo($(this));
		});

	// Affiche le calendrier si la coche scolaire n'est pas cochée
	const scolaireChecked = $('#gym_scolaire:checked').length;
	$('#edit_semaines').css('display', scolaireChecked ? 'none' : 'block');
}

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
			top: pp.bottom,
			left: Math.min(pp.left, ww - elw)
		});
	});
}
submenuPos();
$(window).on('resize', submenuPos);
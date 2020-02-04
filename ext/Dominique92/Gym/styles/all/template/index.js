/* Style de la page d'accueil spéciale */

const animateurs = {
	<!-- BEGIN liste_animateurs -->
		'{liste_animateurs.POST_SUBJECT}': 'viewtopic.php?template=viewtopic&p={liste_animateurs.POST_ID}',
	<!-- END liste_animateurs -->
},
categories = {
	<!-- BEGIN liste_categories -->
		'{liste_categories.POST_SUBJECT}': 'viewtopic.php?template=viewtopic&p={liste_categories.POST_ID}',
	<!-- END liste_categories -->
},
lieux = {
	<!-- BEGIN liste_lieux -->
		'{liste_lieux.POST_SUBJECT}': 'viewtopic.php?template=viewtopic&p={liste_lieux.POST_ID}',
	<!-- END liste_lieux -->
},
menu={
	'Présentation': 'viewtopic.php?template=viewtopic&p=1',
	'Actualités': '?template=actualites',
	'Activités': categories,
	'Lieux': lieux,
	'Horaires': '?template=horaires',
	'Animateur(rice)s': animateurs,
	'Informations': 'ajax.php?n=5&Informations',
	'Forum': '@viewforum.php?f=3',
};
$('#bandeau').append(displayMenu(menu));

/* jshint esversion: 6 */

// Display hash command at the beginning
const hash = norm(window.location.hash || 'presentation');
jQuery.each(menu, function(index, value) {
	if (norm(index) == hash)
		displayAjax(value, index);
});

function displayMenu(list, titre) {
	const el = $('<ul>').attr('class', 'menu');
	if (titre)
		el.append($('<h2>').text(titre));

	jQuery.each(list, function(index, value) {
		// Build LABEL & IL for the item
		const label = $('<label>').text(index),
			il = $('<il>').append(label).css({
				background: color(),
			});
		el.append(il);

		il.click(function() {
			window.location.hash = norm(index);
			displayAjax(value, index, titre);
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
	if (typeof value == 'object')
		$('#bandeau').append(
			displayMenu(value, titre).attr('id', 'submenu')
		);
	// Jump to @url
	else if (value.charAt(0) == '@') {
		$('body').html('<div>');
		window.location.href = value.substr(1);
	}
	// Display ajax block if available
	else
		ajax(value);
}

// Load url data on an element
function ajax(url) {
	$.get(url, function(data) {
		// Build the DIV to display the ajax result
		const ela = $('<div>')
			.attr('class', 'ajax-temp')
			.html(data);
		$('body').append(ela);
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
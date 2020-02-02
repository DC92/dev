/* Style de la page d'accueil spéciale */
/* jshint esversion: 6 */

function menu(list, titre) {
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
			menu(value, titre).attr('id', 'submenu')
		);

	// Display ajax block if available
	if (typeof value == 'string')
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
	const saturation = 80; // / 255
	window.colorAngle = window.colorAngle ? window.colorAngle + 2.36 : 1;
	let color = '#';
	for (let angle = 0; angle < 6; angle += Math.PI * 0.66)
		color += (0x1ff - saturation + saturation * Math.sin(window.colorAngle + angle))
		.toString(16).substring(1, 3);
	return color;
}

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
};

$('#bandeau').append(menu({
	'Présentation': 'ajax.php?n=8&Présentation',
	'Actualités': 'ajax.php?n=9&Actualités',
	'Activités': categories,
	'Lieux': lieux,
	'Horaires': '?template=horaires',
	'Animateur(rice)s': animateurs,
	'Informations': 'ajax.php?n=5&Informations',
}));

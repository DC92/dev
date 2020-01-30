/* Style de la page d'accueil spéciale */
/* jshint esversion: 6 */

function menu(list, titre) {
	const el = $('<ul>').attr('class', 'menu');
	if (titre)
		el.append($('<h2>').text(titre));

	for (let i in list) {
		// Build LABEL & IL for the item
		const col = color(),
			label = $('<label>').text(i),
			il = $('<il>').append(label).css({
				background: col,
			});
		el.append(il);

		il.click(function() {
			// Remove the ajax tmp blocks
			$('.ajax-temp').remove();

			// Remove the submenu if we click on one item of the main menu
			if (!titre)
				$('#submenu').remove();

			// Add the submenu if any
			if (typeof list[i] == 'object')
				$('#bandeau').append(
					menu(list[i], i).attr('id', 'submenu')
				);

			// Display ajax block if available
			if (typeof list[i] == 'string')
				ajax(list[i], i, col);
		});
	}
	return el;
}

// Load url data on an element
function ajax(url, titre, color) {
	$.get(url, function(data) {
		// Build the DIV to display the ajax result
		const ela = $('<div>')
			.attr('class', 'ajax-temp')
			.html(data);
		$('body').append(ela);

		// Measure the DIV
		const free = $('body').innerHeight() -
			$('#libre').position().top -
			ela.outerHeight();

		// Set a bit of CCS on the DIV
		ela.css({
	//		borderColor: color,
			marginTop: Math.max(0, free / 2 - 20),
		});
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
		'{liste_animateurs.POST_SUBJECT}': 'ajax.php?n=1&pid={liste_animateurs.POST_ID}',
	<!-- END liste_animateurs -->
},
categories = {
	<!-- BEGIN liste_categories -->
		'{liste_categories.POST_SUBJECT}': 'ajax.php?n=1&pid={liste_categories.POST_ID}',
	<!-- END liste_categories -->
},
lieux = {
	<!-- BEGIN liste_lieux -->
		'{liste_lieux.POST_SUBJECT}': 'ajax.php?n=1&pid={liste_lieux.POST_ID}',
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

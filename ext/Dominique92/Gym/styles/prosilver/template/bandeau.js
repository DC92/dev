FICHIER EN RESERVE POUR LE NOUVEAU BANDEAU

const bandeauEl = document.querySelector('.bandeau'),
	sousMenusEls = document.querySelectorAll('.bandeau ul');

if ('ontouchstart' in window) { // Touch screen
	window.addEventListener('load', initSousMenu);
	window.addEventListener('touchstart', actionneSousMenu);
	// Ne pas utiliser resize qui est déclenché par le clavier virtuel
} else { // Mouse screen
	window.addEventListener('load', initSousMenu);
	window.addEventListener('resize', initSousMenu);
	window.addEventListener('mouseover', actionneSousMenu);
}

function initSousMenu(evt) {
	// On réserve la place pour les icônes
	let nbIconesAPlacer = sousMenusEls.length,
		nbZonesReduites = 0;

	// On enlève le flex pour mesurer la vraie largeur de chaque zone
	bandeauEl.classList.add('bandeau-noflex');

	sousMenusEls.forEach(function(ulEl) { // Pour toutes les zones du bandeau
		// On efface la classe pour mesurer la vraie largeur de chaque zone
		ulEl.parentElement.classList = '';

		if (ulEl.parentElement.getBoundingClientRect().right >
			document.body.clientWidth - --nbIconesAPlacer * 28) // On réserve la place pour les icônes qui restent à placer à droite
			ulEl.parentElement.classList = nbZonesReduites++ ? // Une seule zone en cours de réduction
			'bandeau-etiquette-cachee' : // On cache les zones à droite
			'bandeau-etiquette-reduite';
	});

	// On repasse en flex pour voir le résultat
	bandeauEl.classList.remove('bandeau-noflex');
}

function actionneSousMenu(evt) {
	// Passe en https si on ouvre un formulaire de login
	if (evt.target.id == 'http-login')
		location.replace(location.href.replace('http:', 'https:'));

	// Cas où il y a un <span> dans le titre
	const target = evt.target.tagName == 'LI' ?
		evt.target :
		evt.target.parentElement;

	if (evt.type == 'touchstart' || // Touch screen : Ouvre / ferme le sous-menu
		!target || !target.classList.contains('sous-menu-ouvert')) // Souris : Ouvre seulement au survol
		sousMenusEls.forEach(function(ulEl) { // Pour toutes les zones du bandeau
			// Affiche le sous-menu
			if (!ulEl.parentElement.contains(target))
				ulEl.parentElement.classList.remove('sous-menu-ouvert');
			else if (target.parentElement.className == 'bandeau') // Pas dans le sous-menu
				ulEl.parentElement.classList.toggle('sous-menu-ouvert');

			// Recentre les sous-menu qui débordent de la fenêtre
			ulEl.classList.remove('sous-menu-a-droite'); // Reset avant mesure
			if (ulEl.getBoundingClientRect().width > document.body.clientWidth)
				ulEl.classList.add('sous-menu-a-gauche');
			else if (ulEl.getBoundingClientRect().right > document.body.clientWidth)
				ulEl.classList.add('sous-menu-a-droite');
			else
				ulEl.classList.remove('sous-menu-a-droite');
		});
}
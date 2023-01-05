// Force au moins une couche chemineur
if (!localStorage.myol_selectchem && scriptName == 'index')
	localStorage.myol_selectchem = 'all';

// Activer la couche correspondant au topic
if (typeof topic_category == 'string') {
	const ls = (localStorage.myol_selectchem || '').split(',');
	ls.push(topic_category);
	localStorage.myol_selectchem = [...new Set(ls)];
}

if (typeof map !== 'undefined') {
	layerVectorCollection({
		chemineur: {
			host: '', // Relative to this location
		}
	}).forEach(l => map.addLayer(l));
}

// Resize map
if (jQuery.ui)
	$(map.getTargetElement()).resizable({
		handles: 's,w,sw', // 2 côtés et 1 coin

		resize: function(event, ui) {
			ui.position.left = ui.originalPosition.left; // Reste à droite de la page
			map.updateSize(); // Reaffiche tout le nouveau <div>
		},
	});
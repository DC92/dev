// Force au moins une couche chemineur
//TODO edit trace sans fond de trace
if (!localStorage.myol_selectchem && scriptName == 'index')
	localStorage.myol_selectchem = 'all';

// Activer la couche correspondant au topic
if (typeof topic_category == 'string') {
	const ls = (localStorage.myol_selectchem || '').split(',');
	ls.push(topic_category);
	localStorage.myol_selectchem = [...new Set(ls)];
}

if (typeof map !== 'undefined') {
	// Generate a key unique on last 12 hours
	const version = (localStorage.lastPostingDate % 43200).toString(36);

	layerVectorCollection({
		chemineur: {
			host: '', // Relative to this location
			urlParams: {
				// Reload layer if posting called between
				//BEST move this to geoBB
				v: version,
			},
		}
	}).forEach(l => map.addLayer(l));
}

if (document.URL.includes('posting'))
	localStorage.lastPostingDate = Math.floor(Date.now() / 1000); // In seconds epoch

// Resize map
if (jQuery.ui)
	$(map.getTargetElement()).resizable({
		handles: 's,w,sw', // 2 côtés et 1 coin

		resize: function(event, ui) {
			ui.position.left = ui.originalPosition.left; // Reste à droite de la page
			map.updateSize(); // Reaffiche tout le nouveau <div>
		},
	});
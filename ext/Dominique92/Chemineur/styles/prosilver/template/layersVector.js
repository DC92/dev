// Force au moins une couche chemineur
//TODO edit trace sans fond de trace
if (!localStorage.myol_selectchem && scriptName == 'index')
	localStorage.myol_selectchem = 'all';

// Activate the layer corresponding to the topic
if (typeof topic_category == 'string') {
	const ls = (localStorage.myol_selectchem || '').split(',');
	ls.push(topic_category);
	localStorage.myol_selectchem = [...new Set(ls)];
}

if (typeof map !== 'undefined') {
	// Generate a key unique on the last 12 hours
	const version = (localStorage.lastPostingDate % 43200).toString(36);

	layerVectorCollection({
		chemineur: {
			host: '', // Relative to this location
			selectName: 'select-chem',
			noClick: true,
			urlParams: { //BEST move this to geoBB
				v: version, // Reload layer if posting called between
			},
		},
		wri: {
			selectName: 'select-wri',
		},
		osm: {
			selectName: 'select-osm',
		},
		prc: {
			selectName: 'select-prc',
		},
		c2c: {
			selectName: 'select-c2c',
		},
		alpages: {
			selectName: 'select-alpages',
		},
	}).forEach(l => map.addLayer(l));
}

if (document.URL.includes('posting'))
	localStorage.lastPostingDate = Math.floor(Date.now() / 1000); // In seconds epoch

// Resize map
if (jQuery.ui)
	$(map.getTargetElement()).resizable({
		handles: 's,w,sw', // 2 sides and 1 corner

		resize: function(event, ui) {
			ui.position.left = ui.originalPosition.left; // Reste à droite de la page
			map.updateSize(); // Repost all new <div>
		},
	});
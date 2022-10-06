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
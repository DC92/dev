// Resize map
$('#map').resizable({
	handles: 's,w,sw', // 2 côtés et 1 coin

	resize: function(event, ui) {
		$('#container-map').css('width', 'initial');
		$('#map').css('min-height', 'initial');
		$('#map .ol-viewport').css('padding-bottom', 'none');

		ui.position.left = ui.originalPosition.left; // Reste à droite de la page
		$('#map')[0]._map.updateSize(); // Recouvre tout le nouveau <div>
	},
});
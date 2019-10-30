// Script lié à la page d'acceuil
var map = new ol.Map({
	target: 'carte-accueil',
	controls: [new ol.control.Attribution({
		collapsible: false // Attribution always open
	})],
	layers: [
		// Le fond de carte
		layerOSM(
			'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
			'<a href="http://wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
		),
		// La couche "massifs"
		layerVectorURL({
			baseUrl: '/api/polygones?type_polygon=1',
			styleOptions: function(properties) {
				// Translates the color in RGBA to be transparent
				var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.couleur);
				return {
					fill: new ol.style.Fill({
						color: 'rgba(' + parseInt(cs[1], 16) + ',' + parseInt(cs[2], 16) + ',' + parseInt(cs[3], 16) + ',0.5)'
					}),
					stroke: new ol.style.Stroke({
						color: 'black'
					})
				};
			},
			hoverStyleOptions: function(properties) {
				return {
					fill: new ol.style.Fill({
						color: properties.couleur
					}),
					stroke: new ol.style.Stroke({
						color: 'black'
					})
				};
			},
			label: function(properties) {
				return '<a href="' + properties.lien + '">' + properties.nom + '<a>';
			},
			href: function(properties) {
				return properties.lien;
			}
		})
	]
});
map.getView().fit(ol.proj.transformExtent([<?=$vue->bbox?>], 'EPSG:4326', 'EPSG:3857'));
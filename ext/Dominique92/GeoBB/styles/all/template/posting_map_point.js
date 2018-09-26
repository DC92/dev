/*TODO*/


var map = new ol.Map({
	target: 'map',
	//	loadTilesWhileInteracting: true,
	controls: controlsCollection(),
	/*				view: new ol.View({
						center: ol.proj.fromLonLat([-4, 48]), // Bretagne
						//center: ol.proj.fromLonLat([-3.5, 48.25]), // France
						//center: ol.proj.fromLonLat([7, 47]), // Suisse
						//center: ol.proj.fromLonLat([9.2, 45.5]), // Milan
						//center: ol.proj.fromLonLat([7.07, 45.19]), // Rochemelon
						//center: ol.proj.fromLonLat([-.1, 51.5]), // Londres
						zoom: 8
					}),*/
	layers: overlays
});



var curseur = new L.Marker(
	map.getCenter(), // Valeur par défaut
	{
		draggable: true,
		riseOnHover: true,
		icon: L.icon({
			iconUrl: '{EXT_DIR}styles/all/theme/images/curseur.png',
			className: 'leaflet-move',
			iconAnchor: [15, 15]
		})
	}
);
curseur.coordinates('edit'); // Affiche / saisi les coordonnées
curseur.addTo(map);
map.setView(curseur._latlng, 15); // Centre la carte sur ce point

control.geocoder.addTo(map);

function gotogps () {
	control.gps.deactivate()
	control.gps.on('gps:located', function(e) {
		e.target._map.setView(e.latlng, 15, {
			reset: true
		});
		curseur.setLatLng(e.latlng);
	});
	control.gps.activate()
}

// Snap sur les autres objects vectoriels
curseur.snapediting = new L.Handler.MarkerSnap(map, curseur);
curseur.snapediting.addGuideLayer(gis);
curseur.snapediting.enable();

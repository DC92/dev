// Resize
$('#map').resizable({
	handles: 's,w,sw', // 2 côtés et 1 coin
	resize: function(evt, ui) {
		ui.position.left = ui.originalPosition.left; // Reste à droite de la page
	},
	stop: function(evt) {
		evt.target.map_.updateSize();
	}
});

/*
//TODO-CHEM complete chemineur
function postLabel(properties, feature, layer, pixel, ll4326) {
	var type = typeof layer.options_.type == 'function' ?
		layer.options_.type(properties, feature, layer, pixel, ll4326) :
		layer.options_.type || '',
		name = typeof layer.options_.name == 'function' ?
		layer.options_.name(properties, feature, layer, pixel, ll4326) :
		layer.options_.name || '';

	return ['<hr/><a title="Créer une fiche modifiable à partir du point" ' +
			'href="posting.php?mode=post', //TODO-BEST spécifique : passer en argument
			'type=' + type,
			'name=' + (name || type),
			'lon=' + Math.round(ll4326[0] * 100000) / 100000,
			'lat=' + Math.round(ll4326[0] * 100000) / 100000
		].join('&') +
		'">Créer une fiche</a>';
}
*/

var topicStyleOptions = {
		image: new ol.style.Circle({
			radius: 4,
			fill: new ol.style.Fill({
				color: 'red'
			})
		}),
		fill: new ol.style.Fill({
			color: 'rgba(255,196,196,0.5)'
		}),
		stroke: new ol.style.Stroke({
			color: 'red',
			width: 2
		})
	},
	editStyleOptions = {
		stroke: new ol.style.Stroke({
			color: 'red',
			width: 3
		})
	};

function layerStyleOptionsFunction(properties, id, hover) {
	if (properties.icon)
		return {
			image: new ol.style.Icon({
				src: properties.icon
			})
		};

	return {
		fill: new ol.style.Fill({
			color: 'rgba(255,255,255,'+(hover ? 0.65 : 0.4)+')'
		}),
		stroke: new ol.style.Stroke({
			color: hover ? 'red' : 'blue',
			width: hover ? 4 : 3
		})
	};
}

function geoLayer(idColor, idExclude, noHover) {
	return new ol.layer.LayerVectorURL({
		baseUrl: 'ext/Dominique92/GeoBB/gis.php?limit=10000&exclude=' + idExclude + '&',
		styleOptions: function(properties) {
			return layerStyleOptionsFunction(properties, idColor);
		},
		hoverStyleOptions: function(properties) {
			return layerStyleOptionsFunction(properties, idColor, !noHover);
		},
		label: function(properties) {
			return noHover ? null : '<a href="viewtopic.php?t=' + properties.id + '">' + properties.name + '<a>';
		},
		href: function(properties) {
			return 'viewtopic.php?t=' + properties.id;
		}
	});
}
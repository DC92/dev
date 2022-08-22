const baseLayers = {
		'Refuges.info': layerMRI(),
		'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'OpenTopo': layerOpenTopo(),
		'Outdoors': layerThunderforest('outdoors'),
		'IGN TOP25': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
			key: mapKeys.ign,
		}),
		'IGN V2': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels', // The key for the free layers
			format: 'image/png',
		}),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Photo IGN': layerIGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),
		'Photo ArcGIS': layerArcGIS('World_Imagery'),
		'Photo Bing': layerBing('Aerial'),
		'Photo Google': layerGoogle('s'),
	},

	controls = [
		new ol.control.Zoom(),
		new ol.control.FullScreen(),
		controlGeocoder(),
		controlGPS(),
		controlLoadGPX(),
		controlDownload(),
		controlPrint(),
		controlLayerSwitcher(baseLayers),
		controlMousePosition(),
		new ol.control.ScaleLine(),
		controlPermalink({ // Permet de garder le même réglage de carte
			display: true,
			init: <?=$vue->polygone->id_polygone?'false':'true'?>, // On cadre le massif
		}),
		new ol.control.Attribution({
			collapsed: false,
		}),
	],
	wriInput = document.getElementById('selecteur-wri'),
	massifInput = document.getElementById('selecteur-massif'),
	massifsInput = document.getElementById('selecteur-massifs'),

	layersPointsMassif = [
		// Les points d'un massif
		layerWri({
			host: '<?=$config_wri["sous_dossier_installation"]?>',
			selectorName: 'selecteur-wri',
			massif: <?=$vue->polygone->id_polygone?>,
			nb_points: 'all',
			distanceMinCluster: 30,
			styleOptionsFunction: styleOptionsEtiquette,
			attribution: null,
		}),
		// Contour d'un massif ou d'une zone
		layerVector({
			url: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?massif=<?=$vue->polygone->id_polygone?>',
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 2,
				}),
			}),
		}),
	],

	// Points WRI avec bbox et cluster
	layersPointsWri = layersWri({
		host: '<?=$config_wri["sous_dossier_installation"]?>',
		selectorName: 'selecteur-wri',
	}),

	layers = [
		// Refuges.info
		...layersPointsMassif,
		...layersPointsWri,

		// Les massifs
		layerWriAreas({
			host: '<?=$config_wri["sous_dossier_installation"]?>',
			selectorName: 'selecteur-massifs',
		}),

		// Overpass
		layerOverpass({
			selectorName: 'selecteur-osm',
			distanceMinCluster: 30,
			maxResolution: 100,
		}),

		// Pyrenees-refuges.com
		layerPyreneesRefuges({
			selectorName: 'selecteur-prc',
			distanceMinCluster: 30,
		}),

		// CampToCamp
		layerC2C({
			selectorName: 'selecteur-c2c',
			distanceMinCluster: 30,
		}),

		// Chemineur
		...layersGeoBB({
			host: '//chemineur.fr/',
			selectorName: 'selecteur-chemineur',
			attribution: 'Chemineur',
		}),

		// Alpages.info
		layerGeoBB({
			host: '//alpages.info/',
			selectorName: 'selecteur-alpages',
			argSelName: 'forums',
			distanceMinCluster: 30,
			attribution: 'Alpages',
		}),
	],

	map = new ol.Map({
		target: 'carte-nav',
		view: new ol.View({
			enableRotation: false,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: controls,
		layers: layers,
	});

if (massifsInput) {
	massifsInput.checked = <?=$vue->contenu?'true':'false'?>;
  selectionMassif(true);
	massifsInput.dispatchEvent(new Event('click'));
}

// Initialiser l'affichage des points et des massifs suivant le type de carte (zone ou massif)
if (wriInput) {
	wriInput.checked = true;
	wriInput.dispatchEvent(new Event('click')); // Resynchronise le détail des types de points
}
if (massifInput) {
	massifInput.checked = true;
	//massifInput.dispatchEvent(new Event('click'));
}

function selectionMassif(check) {
	layersPointsMassif.forEach(l => l.setVisible(check));
	layersPointsWri.forEach(l => l.setVisible(!check));
}

function styleOptionsEtiquette(feature, properties) {
	return {
		...styleOptionsLabel(properties.name, properties, true),
		...styleOptionsIcon(properties.icon),
	};
}

/*DCMM*/{var _r=' ',_v='<?=$vue->contenu?'true':'false'?>';if(typeof _v=='array'||typeof _v=='object'){for(let _i in _v)if(typeof _v[_i]!='function'&&_v[_i])_r+=_i+'='+typeof _v[_i]+' '+_v[_i]+' '+(_v[_i]&&_v[_i].CLASS_NAME?'('+_v[_i].CLASS_NAME+')':'')+"\n"}else _r+=_v;console.log(_r)}

if(0)
if (massifsInput) {
<?php if ($vue->contenu) { ?>
	massifsInput.checked = true;
	selectionMassif(true);
	massifsInput.dispatchEvent(new Event('click'));
<?php } else { ?>
<?php } ?>
}

// Centrer sur la zone du polygone
<?if ($vue->polygone->id_polygone) { ?>
	map.getView().fit(ol.proj.transformExtent([
		<?=$vue->polygone->ouest?>,
		<?=$vue->polygone->sud?>,
		<?=$vue->polygone->est?>,
		<?=$vue->polygone->nord?>,
	], 'EPSG:4326', 'EPSG:3857'));
<? } ?>


import TileLayer from 'ol/layer/Tile';

// OpenStreetMap & co
export class OsmTileLayer extends TileLayer {
  constructor(options) {
    super({
		source: new ol.source.XYZ({
			url: '//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
			maxZoom: 21,
			attributions: ol.source.OSM.ATTRIBUTION,
			...options,
		}),
			...options,
	});
  }
}

export class MriTileLayer extends OsmTileLayer {
  constructor(options) {
    super({
		url: '//maps.refuges.info/hiking/{z}/{x}/{y}.png',
		attributions: '<a href="//wiki.openstreetmap.org/wiki/Hiking/mri">Refuges.info</a>',
			...options,
	});
  }
}

//TODO+ Inhiber rotation carte quand pas de GPS
//BEST faire un tableau et mettre dans la création de la map
map.addLayer(layerWri({
	selectorName: 'wri-features',
	distance: 30,
}));
map.addLayer(layerPyreneesRefuges({
	selectorName: 'prc-features',
	distance: 30,
}));
map.addLayer(layerGeoBB({
	host: '//alpages.info/',
	selectorName: 'alp-features',
	argSelName: 'forums',
	distance: 30,
	attribution: 'Alpages',
}));
map.addLayer(layerC2C({
	selectorName: 'c2c-features',
}));
map.addLayer(layerOverpass({
	selectorName: 'osm-features',
	symbols: {
		hotel: 'City Hall',
		guest_house: 'City Hall',
		chalet: 'City Hall',
		hostel: 'City Hall',
		apartment: 'City Hall',
		alpine_hut: 'Residence',
		cabin: 'Lodge',
		shelter: 'Fishing Hot Spot Facility',
		basic_hut: 'Fishing Hot Spot Facility',
		camp_site: 'Campground',
		drinking_water: 'Drinking Water',
		watering_place: 'Drinking Water',
		fountain: 'Drinking Water',
		water_point: 'Drinking Water',
		spring: 'Drinking Water',
		water_well: 'Drinking Water',
		bus_stop: 'Ground Transportation',
		parking: 'Parking Area',
		restaurant: 'Restaurant',
		shop: 'Shopping Center',
		toilets: 'Restroom',
		internet_access: 'Oil Field',
		telephone: 'Telephone',
	},
}));
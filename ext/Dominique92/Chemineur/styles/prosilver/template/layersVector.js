map.addLayer(layerVectorCluster(
	layerWriPoi({
		selectorName: 'wri-features',
		maxResolution: 300,
	})
));
map.addLayer(layerVectorCluster(
	layerPyreneesRefuges({
		selectorName: 'prc-features',
	})
));
map.addLayer(layerAlpages({
	selectorName: 'alp-features',
}));
map.addLayer(layerC2C({
	selectorName: 'c2c-features',
}));
map.addLayer(layerOSM({
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
/**
 * Some usefull style functions
 * These functions return an area of style options to be transformed into an area of Style
 * They all take 2 arguments :
 *   feature : to be displayed
 *   layer : that owns the feature
 */

//BEST verify if all are used
import Icon from 'ol/style/Icon';
import * as olExtent from 'ol/extent';
import * as style from 'ol/style';


// Basic style to display a geo vector layer based on standard properties
export function basic(feature, layer) {
	const properties = feature.getProperties();

	return [{
		// Point
		image: properties.icon ? new Icon({
			src: properties.icon,
		}) : null,

		// Lines
		stroke: new style.Stroke({
			color: 'blue',
			width: 2,
		}),

		// Polygons
		fill: new style.Fill({
			color: 'rgba(0,0,256,0.3)',
		}),

		// properties.label if any
		...label(...arguments),
	}];
}

// Display a label with properties.label
export function label(feature, layer) {
	const properties = feature.getProperties();

	if (properties.label) {
		const featureArea = olExtent.getArea(feature.getGeometry().getExtent()),
			elLabel = document.createElement('span');

		elLabel.innerHTML = properties.label; //HACK to render the html entities in the canvas

		return {
			text: new style.Text({
				text: elLabel.innerHTML,
				overflow: properties.overflow, // Display label even if not contained in polygon
				textBaseline: featureArea ? 'middle' : 'bottom',
				offsetY: featureArea ? 0 : -13, // Above the icon
				padding: [1, 1, -1, 3],
				//BEST line & poly label following the cursor
				font: '12px Verdana',
				fill: new style.Fill({
					color: 'black',
				}),
				backgroundFill: new style.Fill({
					color: 'white',
				}),
				backgroundStroke: new style.Stroke({
					color: 'blue',
				}),
			}),
		};
	}
}

// Display a circle with the number of features on the cluster
export function cluster(feature, layer) {
	//TODO pourquoi itère sur render ?
	return [{
		image: new style.Circle({
			radius: 14,
			stroke: new style.Stroke({
				color: 'blue',
			}),
			fill: new style.Fill({
				color: 'white',
			}),
		}),
		text: new style.Text({
			text: feature.getProperties().cluster.toString(),
			font: '12px Verdana',
		}),
	}];
}

// Display a line of features contained into a cluster
export function spreadCluster(feature, layer) {
	let properties = feature.getProperties(),
		x = 0.95 + 0.45 * properties.cluster,
		labelList = [],
		stylesOptions = [];

	properties.features.forEach(f => {
		const p = f.getProperties();

		layer.options.basicStylesOptions(f, layer)
			.forEach(so => {
				if (so.image) {
					so.image.setAnchor([x -= 0.9, 0.5]);
					f.setProperties({ // Mem the shift for hover detection
						xLeft: (1 - x) * so.image.getImage().width,
					}, true);
					stylesOptions.push({
						image: so.image,
					});
				}
			});

		if (p.label)
			labelList.push(p.label);
	});

	if (labelList.length) {
		feature.setProperties({ // Mem the shift for hover detection
			label: labelList.join('\n'),
		}, true);

		stylesOptions.push(label(feature, layer));
	}

	return stylesOptions;
}

// Display the detailed information of a cluster based on standard properties
export function details(feature, layer) {
	const properties = feature.getProperties();

	feature.setProperties({
		overflow: true, // Display label even if not contained in polygon
		label: agregateText([
			properties.name,
			agregateText([
				properties.ele ? parseInt(properties.ele) + ' m' : null,
				properties.bed ? parseInt(properties.bed) + '\u255E\u2550\u2555' : null,
			], ', '),
			properties.type,
			properties.cluster ? null : properties.attribution || layer.options.attribution,
		]),
	}, true);

	return label(...arguments);
}

// Display the basic hovered features
export function hover(feature, layer) {
	return {
		...details(...arguments),

		stroke: new style.Stroke({
			color: 'red',
			width: 2,
		}),
	};
}

// Simplify & aggregate an array of lines
export function agregateText(lines, glue) {
	return lines
		.filter(Boolean) // Avoid empty lines
		.map(l => l.toString().replace('_', ' ').trim())
		.map(l => l[0].toUpperCase() + l.substring(1))
		.join(glue || '\n');
}
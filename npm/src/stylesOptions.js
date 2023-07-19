/**
 * Some usefull style functions
 */

import Icon from 'ol/style/Icon';
import * as extent from 'ol/extent';
import * as style from 'ol/style';


export function basic(feature, layer) {
	const properties = layer.options.convertProperties(feature.getProperties());

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

		// Areas
		fill: new style.Fill({
			color: 'rgba(0,0,256,0.3)',
		}),

		// properties.label if any
		...label(...arguments),
	}];
}

export function label(feature, layer) {
	const properties = feature.getProperties();

	if (properties.label) {
		const featureArea = extent.getArea(feature.getGeometry().getExtent()),
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
			zIndex: 100,
		};
	}
}

export function cluster(feature, layer) {
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

export function spreadCluster(feature, layer) {
	let properties = feature.getProperties(),
		x = 0.95 + 0.45 * properties.cluster,
		so = [];

	if (properties.features)
		properties.features.forEach(f => {
			const stylesOptions = layer.options.basic(...arguments);

			if (stylesOptions.length) {
				const image = stylesOptions[0].image; //TODO test

				if (image) {
					image.setAnchor([x -= 0.9, 0.5]);
					f.setProperties({ // Mem the shift for hover detection
						xLeft: (1 - x) * image.getImage().width,
					}, true);
					so.push({
						image: image,
					});
				}
			}
		});

	so.push(layer.options.labelStylesOptions(...arguments));

	return so;
}

export function hover(feature, layer) {
	const properties = layer.options.convertProperties(feature.getProperties());

	feature.setProperties({
		overflow: true, // Display label even if not contained in polygon
		label: agregateText([
			properties.name,
			agregateText([
				properties.ele && properties.ele ? parseInt(properties.ele) + ' m' : null,
				properties.bed && properties.bed ? parseInt(properties.bed) + '\u255E\u2550\u2555' : null,
			], ', '),
			properties.type,
			properties.cluster ? null : properties.attribution,
		]),
	}, true);

	return {
		...label(feature, layer),

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
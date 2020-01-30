/* jshint esversion: 6 */
function menu(list, titre) {
	const el = $('<ul>').attr('class', 'menu');
	if (titre)
		el.append($('<h2>').text(titre));

	for (let i in list) {
		// Build LABEL & IL for the item
		const col = color(),
			label = $('<label>').text(i),
			il = $('<il>').append(label).css({
				background: col,
			});
		el.append(il);

		il.click(function() {
			// Remove the ajax tmp blocks
			$('.ajax-temp').remove();

			// Remove the submenu if we click on one item of the main menu
			if (!titre)
				$('#submenu').remove();

			// Add the submenu if any
			if (typeof list[i] == 'object')
				$('#bandeau').append(
					menu(list[i], i).attr('id', 'submenu')
				);

			// Display ajax block if available
			if (typeof list[i] == 'string')
				ajax(list[i], i, col);
		});
	}
	return el;
}

// Load url data on an element
function ajax(url, titre, color) {
	$.get(url, function(data) {
		// Build the DIV to display the ajax result
		const ela = $('<div>')
			.attr('class', 'ajax-temp')
			.html('<h4>' + titre + '</h4>' + data);
		$('body').append(ela);

		// Measure the DIV
		const free = $('body').innerHeight() -
			$('#libre').position().top -
			ela.outerHeight();

		// Set a bit of CCS on the DIV
		ela.css({
			borderColor: color,
			marginTop: Math.max(0, free / 2 - 20),
		});
	});
}

function color() {
	const saturation = 80; // / 255
	window.colorAngle = window.colorAngle ? window.colorAngle + 2.36 : 1;
	let color = '#';
	for (let angle = 0; angle < 6; angle += Math.PI * 0.66)
		color += (0x1ff - saturation + saturation * Math.sin(window.colorAngle + angle))
		.toString(16).substring(1, 3);
	return color;
}

$('#bandeau').append(menu({
	'Présentation': 'ajax.php?n=8&Présentation',
	'Actualités': 'ajax.php?n=9&Actualités',
	'Activités': categories,
	'Lieux': lieux,
	'Horaires': 'ajax.php?n=3&Horaires',
	'Animateur(rice)s': animateurs,
	'Informations': 'ajax.php?n=5&Informations',
}));

////////////////////////////////////////////////////////////////////////////////
/*
function ballon(menuName, label, content) {
	const menu = $('#' + menuName),
		el = $('<ul/>')
		//.draggable()
		.css({
			background: color(),
			//	height: '1.6em',
		})

		.click(function() {
			// Reset all the buttons position
			menu.children('div').each(function() {
				// Remove ajax from all DIV if any
				$(this).children('div').remove();

				// Resize the DIV
				$(this).css({
					position: 'static',
					height: 'auto',
					width: 'auto',
				});
			});

			// Load the ajax content
			if (typeof content == 'string')
				ajax(el, content);
		});

	// Add to the menu
	menu.append(el); //+  + '</h4>'
	el.append($('<label/>').text(label));

	if (typeof content == 'object') {
		const ul = $('<ul/>')
		el.append(ul);
		for (let c in content)
			ul.append($('<li/>').text(c)
				.click(function() {
					ajax(ul, content[c]);
				}));
	}
}

function bandeau(menu, ballons) {
	for (let label in ballons)
		ballon(menu, label, ballons[label]);

	if (0)
		animateMenu(menu, {
			height: '1em',
		});
}

const salles = {
	'Atrium - Maurice Béjart': 'ajax.php?titi',
	'Atrium - Tchaïkovski': 'ajax.php?titi',
	'Ferdinand Buisson': 'ajax.php?titi',
	'Gymnase Halimi': 'ajax.php?titi',
	'Jean Jaurès - Piste d’Athlétisme': 'ajax.php?titi',
	'Jean Jaurès - Léo Lagrange': 'ajax.php?titi',
	'Paul Bert': 'ajax.php?titi',
};

bandeau('menu', {
	'Présentation': 'ajax.php?titi',
	'Actualités': 'ajax.php?titi',
	'Activités': 'ajax.php?titi',
	'Lieux': salles,
	'Horaires': 'ajax.php?titixxx',
	'Animateur(rice)s': 'ajax.php?titi-vvv-vvv-vvv-vvv-vvv-vvv',
	'Informations': 'ajax.php?titi',
});

// Animate to a new item CSS
function animateMenu(menuName, itemsCss) {
	const menu = $('#' + menuName);

	// Mem existing positions
	menu.children('div').each(function() {
		this.startCss = $(this).position();
		this.startCss.width = $(this).width();
		this.startCss.height = $(this).height();
	});

	// Set destination positions
	menu.children('div').each(function() {
		$(this).css(itemsCss || {});
	});

	// Mem destination positions
	menu.children('div').each(function() {
		this.endCss = $(this).position();
		this.endCss.width = $(this).width();
		this.endCss.height = $(this).height();
	});

	// Replay from start to end
	menu.children('div').each(function() {
		if ($(this).css('position') == 'static') {
			// Restart initial CSS
			$(this).css(this.startCss);

			// Set new position to animate
			setTimeout(function() {
				$(this).css(this.endCss);
			}.bind(this), 1);
		}
	});
}
*/
////////////////////////////////////////////////////////////////////////////////
function wwwballon(menu, titre, content) {
//animateMenu(menu);


/*
		// Measure the position
		const w = el.width(),
			h = el.height();
		// Restart @ the initial position for entry scrool
		$(this).css({
			width: 0,
			height: 0,
		});
		// Then move slowly to the destination
		$(this).css({
			width: w,
			height: h,
		//	top: $(this).position().top,
		//	left: $(this).position().left,
		});*/

el		.click(function (a) {
		if ($(this).css('position') == 'static') {
//animateMenu(menu);
/*			// Reset the other buttons
			$('#' + menu).children('div').each(function() {
				$(this).css({ // Resize css
					position: 'static',
					height: 'auto',
					width: 'auto',
				});
			});
			// Now mem the pixel position to prepare the transition
			$('#' + menu).children('div').each(function() {
				$(this).css({ // Now, resize in pixels
					top: $(this).position().top,
					left: $(this).position().left,
					width: $(this).width(),
					height: $(this).height(),
				});
			});*/

			//			$('#'+menu).children('div').each(reset); // Reset all the buttons position

switch(typeof content){
case 'object':
bandeau ('sous-menu', content);
$('#sous-menu').css({
				position: 'absolute',
				top: $(window).height() / 3,
				left: $(window).width() / 4,
				width: $(window).width() / 2,
});
	animateMenu('sous-menu',{
		height: 'auto',
		width: 'auto',
	});
break;

case 'string':
			// Aproching position waiting for the full ajax
			$(this).css({
				position: 'absolute',
				top: $(window).height() / 3,
				left: $(window).width() / 2,
			});
			
		}
		}
	});
}

/*function memCss (el){
		el.memCss = el.position();
			el.memCss.width = el.width();
			el.memCss.height = el.height()	;
			return el.memCss;
}*/

	/*
		const item = ;
		
		const startCss = item.position();
			startCss.width = item.width();
			startCss.height = item.height()	;

		// Measure the targeted auto position
		item.css({
			position: 'static',
			width: 'auto',
			height: 'auto',
		});
		const endCss = item.position();
			endCss.width = item.width();
			endCss.height = item.height();
			*/
		// Then move slowly to the destination
/*	 menu.css({
			position: menuPosition,
	 });*/

	/*	$(this).css({
			width: w,
			height: h,*/
		//	top: $(this).position().top,
		//	left: $(this).position().left,
//		});
// Repositionne en pixels pour pouvoir gérér la transition
/*
function WWWreset() {
	if ($(this).css('position') == 'static') {
		// Simulate the final position
		//if(0)
		$(this).css({
			width: 'auto',
			height: 'auto',
		});
		// Measure the position
		const w = $(this).width(),
			h = $(this).height();
		// Restart @ the initial position for entry scrool
		$(this).css({
			width: 0,
			height: 0,
		});
		// Then move slowly
		$(this).css({
			width: w,
			height: h,
		//	top: $(this).position().top,
			left: $(this).position().left,
			cursor: 'pointer',
		});
	}
}*/

	// Start expanding
/*	if(0)
$('#' + menu).children('div').each(function () {
		// Measure the auto position
		const w = $(this).width(),
			h = $(this).height();
		// Restart tinny size for expanding effect
		$(this).css({
			width: 0,
			height: 0,
		});
		$(this).position();//HACK compute something in the JQ !
		// Then move slowly to the destination
		$(this).css({
			width: w,
			height: h,
		//	top: $(this).position().top,
		//	left: $(this).position().left,
		});
});*/

// Animate from existing CSS to the basic static position
// As static / auto is not numéric, it should not animate !
function WWWanimateMenu(menuName, itemsCss, menuCss) {
	const menu = $('#' + menuName),
	  menuStartPosition=menu.position();
	
		// Mem existing positions
	menu.children('div').each(function () {
		this.startCss = $(this).position();
		this.startCss.width = $(this).width();
		this.startCss.height = $(this).height()	;
	});
	
	// Set destination positions
	menuCss=menuCss||{};
	//menuCss.position='static';
	menu.css(menuCss);
	menu.children('div').each(function () {
		$(this).css(itemsCss||{});
	});
	
	// Mem destination positions
	const  menuEndPosition=menu.position();
	menu.children('div').each(function () {
		this.endCss = $(this).position();
		this.endCss.width = $(this).width();
		this.endCss.height = $(this).height()	;
	});
	
	// Replay from start to end
	menu.children('div').each(function () {
		//this.startCss.top+=menuStartPosition.top-menuEndPosition.top;
		$(this).css(this.startCss);		// Restart initial CSS
		//$(this).position();//HACK compute something in the JQ to take startScc for animation
		const endCss=this.endCss;
		const ttiiss = $(this);
		setTimeout(function(){
			ttiiss.css(endCss);// Set new position to animate
		}, 1);
	});
}


//bandeau ('sous-menu', );

//TODO commentaires sur diapos

var srcs,
	slide = [],
	thumb = [];

function loadimg(i) {
	// Preload images
	let img = document.createElement('img');
	img.src = srcs[i];

	// Loop until the end of the image list
	img.onload = function() {
		if (i + 1 < srcs.length)
			loadimg(i + 1);
	}

	// Create the display element
	slide[i] = document.createElement('p');
	slide[i].style.backgroundImage = 'url("' + srcs[i] + '")';

	// Add the thumbnail to the thumbs
	thumb[i] = document.createElement('a');
	thumb[i].style.backgroundImage = 'url("' + srcs[i] + '")';
	thumb[i].title = 'Voir ' + srcs[i];
	thumb[i].onclick = function() {
		display(i);
	};
	el('thumbs').appendChild(thumb[i]);
}

var current = -1,
	timer = 0;

function display(i) {
	// If called by timer
	if (i === undefined)
		i = current + 1 >= srcs.length ? 0 : current + 1;

	// Display if exists
	current = i;

	// Insert the new slide
	el('slide').appendChild(slide[i]);

	// Reset scroll if any
	if (timer) {
		clearInterval(timer);
		timer = setInterval(display, 5000);
	}

	// Highligh the last displayed thumbnail
	for (let j = 0; j < thumb.length; j++)
		thumb[j].className = i == j ? 'highlighted' : '';

	// Download refs
	el('download').download = srcs[i];
	el('download').href = srcs[i];

	// Display or not the prev / next buttons
	el('prev').style.display = i > 0 ? 'block' : 'none';
	el('next').style.display = i < srcs.length - 1 ? 'block' : 'none';
}

function switchScroll() {
	if (!timer) {
		timer = setInterval(display, 5000); // Scroll at time interval
		el('buttons').className = 'scroll';
	} else {
		clearInterval(timer);
		timer = 0;
		el('buttons').className = '';
	}
}

function showButtons(init) {
	if (init)
		el('slide').className = 'show-buttons';

	var timerButtons = 0,
		nbMoves = 0; // Avoid show buttons on window change 
	
	window.onmousemove = function() {
		if (nbMoves++ > 5) {
			nbMoves = 0;
			el('slide').className = 'show-buttons';

			if (timerButtons)
				clearTimeout(timerButtons);

			timerButtons = setTimeout(function() {
				el('slide').className = '';
			}, 1500);
		}
	};
};

function fullscreen() {
	if (document.body.requestFullscreen)
		document.body.requestFullscreen();
	else if (document.body.webkitRequestFullscreen)
		document.body.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
	else if (document.body.mozRequestFullScreenWithKeys)
		document.body.mozRequestFullScreenWithKeys();
	else if (document.body.mozRequestFullScreen)
		document.body.mozRequestFullScreen();
	else if (document.body.msRequestFullscreen)
		document.body.msRequestFullscreen();
}

function exitFullscreen() {
	if (document.body.exitFullscreen)
		document.body.exitFullscreen();
	else if (document.body.webkitExitFullscreen)
		document.body.webkitExitFullscreen();
	else if (document.body.mozCancelFullScreen)
		document.body.mozCancelFullScreen();
	else if (document.body.msExitFullscreen)
		document.body.msExitFullscreen();
}

function el(id) {
	return document.getElementById(id);
}

// Preload all images on the beginning
function init(s) {
	srcs = s;
	loadimg(0);
	display();
	showButtons(true);
}

// Run full screen
function runFS(s) {
	srcs = s;
	loadimg(0);
	display();
	showButtons();
	switchScroll();
	fullscreen();
}

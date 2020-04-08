/** OPENLAYERS ADAPTATION
 * © Dominique Cavailhez 2020
 * https://github.com/Dominique92
 *
 * Provide a minimal nice slideshow
 * from a JS array defining the images & text
 */
/* jshint esversion: 6 */
var scrollDelay = 5000, // Milliseconds
	buttonsDelay = 1500,
	images = [],
	thumb = [],
	current = -1,
	timer,
	timerButtons;

// Start slide show
sliderLoadimg(0);
sliderShowButtons();
sliderDisplay();

function sliderLoadimg(i) {
	// Preload images
	$('<img>').attr({
			src: slides[i][0]
		})
		.on('load', function() { // Loop until the end of the image list
			if (i + 1 < slides.length)
				sliderLoadimg(i + 1);
		});

	// Create the display element
	images[i] = $('<div>').css('backgroundImage', 'url("' + slides[i][0] + '")');

	// Add the thumbnail to the thumbs
	thumb[i] = $('<a>')
		.css('backgroundImage', 'url("' + slides[i][0] + '")')
		.attr({
			title: 'Voir ' + slides[i][1]
		})
		.on('click', function() {
			sliderDisplay(i);
		});
	$('#slider-thumbs').append(thumb[i]);
}

function sliderDisplay(i) {
	if (i === undefined)
		i = current + 1 >= slides.length ? 0 : current + 1;
	current = i;

	// Reset slider-scroll if any
	if (timer) {
		clearInterval(timer);
		timer = setInterval(sliderDisplay, scrollDelay);
	}

	// Insert the new images
	$('#slider-show').append(images[i]);
	$('#slider-title').html(slides[i][1] || '');

	// Highlight the displayed thumbnail
	for (let j = 0; j < thumb.length; j++)
		thumb[j][i == j ? 'addClass' : 'removeClass']('highlighted');

	// Display buttons
	$('#slider-download').attr('href', slides[i][0]).attr('slider-download', slides[i][0]);
	$('#slider-previous').css('display', i > 0 ? 'block' : 'none'); //style. = ;
	$('#slider-next').css('display', i < slides.length - 1 ? 'block' : 'none'); //style. = ;
}

function sliderSwitchScroll() {
	if (!timer) {
		timer = setInterval(sliderDisplay, scrollDelay);
		$('#slider-buttons').addClass('slider-scroll');
	} else {
		clearInterval(timer);
		timer = 0;
		$('#slider-buttons').removeClass('slider-scroll');
	}
}

function sliderShowButtons() {
	$('#slider-show').addClass('show-buttons');

	window.onmousemove = function() {
		$('#slider-show').removeClass('show-buttons').addClass('show-buttons');

		if (timerButtons)
			clearTimeout(timerButtons);
		timerButtons = setTimeout(function() {
			$('#slider-show').removeClass('show-buttons');
		}, buttonsDelay);
	};
}

function sliderFullScreen() {
	if (document.body.requestFullscreen) {
		document.body.requestFullscreen();
	} else if (document.body.msRequestFullscreen) {
		document.body.msRequestFullscreen();
	} else if (document.body.webkitRequestFullscreen) {
		document.body.webkitRequestFullscreen();
	}
	sliderShowButtons();
}

function sliderExitFullScreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
	sliderShowButtons();
}
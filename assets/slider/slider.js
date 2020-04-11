/** OPENLAYERS ADAPTATION
 * © Dominique Cavailhez 2020
 * https://github.com/Dominique92
 *
 * Provide a minimal nice slideshow
 * from a JS array defining the sliderDivSlides & text
 *
 * jshint esversion: 6
 */

var sliderScrollDelay = 5000, // Milliseconds
	sliderShowButtonsDelay = 1500,
	sliderDivSlides = [],
	sliderThumbs = [],
	sliderCurrentImage = -1,
	sliderScrollTimer,
	sliderShowButtonsTimer;

// Buttons previous / next / play / stop
$('#slider')
	.append($('<p id="slider-thumbs">'))
	.append($('<p id="slider-comment">'))
	.append(
		$('<a id="slider-next">')
		.attr('title', 'Suivant')
		.click(function() {
			sliderDisplay(sliderCurrentImage + 1);
		}))
	.append(
		$('<a id="slider-previous">')
		.attr('title', 'Précédent')
		.click(function() {
			sliderDisplay(sliderCurrentImage - 1);
		}))
	.append(
		$('<a id="slider-play">')
		.attr('title', 'Défilement')
		.click(sliderSwitchScroll))
	.append(
		$('<a id="slider-stop">')
		.attr('title', 'Pause')
		.click(sliderSwitchScroll)
	)
	.append(
		$('<a id="slider-download">')
		.attr('title', "Télécharger l'image courante")
	)
	.on('mousemove', showButtons);

// Full screen
var sliderEl = $('#slider')[0],
	sliderFullScreen =
	sliderEl.webkitRequestFullScreen || // Chrome, Opera Win10 & Android, Brave, Edge Win10 & Android
	sliderEl.mozRequestFullScreen || // FF Win10 & Android
	sliderEl.msRequestFullscreen, // IE11
	sliderExitFullScreen =
	document.webkitExitFullscreen ||
	document.mozCancelFullScreen ||
	document.msExitFullscreen;

if (sliderFullScreen)
	$('#slider').append(
		$('<a id="slider-fullscreen">')
		.attr('title', 'Plein écran')
		.click(function() {
			if (window.screenTop || window.innerHeight != screen.height) // Normal window
				sliderFullScreen.call($('#slider')[0]);
			else // Full screen
				sliderExitFullScreen.call(document);
		})
	);

// Start slide show
showButtons();
sliderLoadimg(0);
sliderSwitchScroll();

function sliderLoadimg(i) {
	// Preload sliderDivSlides
	$('<img>').attr({
			src: slides[i][0]
		})
		.on('load', function() { // Loop until the end of the image list
			if (i + 1 < slides.length)
				sliderLoadimg(i + 1);
		});

	// Create the display element
	sliderDivSlides[i] = $('<div>').css('backgroundImage', 'url("' + slides[i][0] + '")');

	// Add the thumbnail to the thumbs
	sliderThumbs[i] = $('<a>')
		.css('backgroundImage', 'url("' + slides[i][0] + '")')
		.attr({
			title: 'Voir ' + slides[i][1]
		})
		.on('click', function() {
			sliderDisplay(i);
		});
	$('#slider-thumbs').append(sliderThumbs[i]);
}


function sliderDisplay(i) {
	if (i === undefined)
		i = sliderCurrentImage + 1;
	sliderCurrentImage = i = i % slides.length;

	// Reset show-play if any
	if (sliderScrollTimer) {
		clearInterval(sliderScrollTimer);
		sliderScrollTimer = setInterval(sliderDisplay, sliderScrollDelay);
	}

	// Insert the new sliderDivSlides
	$('#slider').append(sliderDivSlides[i]);
	$('#slider-comment').html(slides[i].length > 1 ? slides[i][1] : '');

	// Highlight the displayed thumbnail
	for (let j = 0; j < sliderThumbs.length; j++)
		sliderThumbs[j][i == j ? 'addClass' : 'removeClass']('highlighted');

	$('#slider-download').attr('href', slides[i][0]).attr('download', 'diapo_' + i + '.jpg').attr('target', '_blank');

	// Hide frist previous & last next buttons
	$('#slider-previous').css('display', i > 0 ? 'block' : 'none'); //style. = ;
	$('#slider-next').css('display', i < slides.length - 1 ? 'block' : 'none'); //style. = ;
}

function sliderSwitchScroll() {
	if (!sliderScrollTimer) {
		// On était en stop
		sliderDisplay();
		sliderScrollTimer = setInterval(sliderDisplay, sliderScrollDelay);
		$('#slider').addClass('show-play');
	} else {
		// On était en play
		clearInterval(sliderScrollTimer);
		sliderScrollTimer = 0;
		$('#slider').removeClass('show-play');
	}
}

function showButtons() {
	$('#slider').addClass('show-buttons');

	if (sliderShowButtonsTimer)
		clearTimeout(sliderShowButtonsTimer);

	sliderShowButtonsTimer = setTimeout(function() {
		$('#slider').removeClass('show-buttons');
	}, sliderShowButtonsDelay);
}
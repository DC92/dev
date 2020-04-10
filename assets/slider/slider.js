/** OPENLAYERS ADAPTATION
 * © Dominique Cavailhez 2020
 * https://github.com/Dominique92
 *
 * Provide a minimal nice slideshow
 * from a JS array defining the images & text
 */
/* jshint esversion: 6 */

/* //TODO
position du fullscreen pas claire
démarrage du show au bout d'une tempo au début
Download ne marche pas si https://stackoverflow.com/questions/23872902/chrome-download-attribute-not-working/35290284
*/

/*
console.log = function(message) {
	alert(message);
};
*/
var scrollDelay = 5000, // Milliseconds
	buttonsDelay = 1500,
	images = [],
	thumb = [],
	current = -1,
	timer,
	timerButtons;

// Buttons previous / next / play / stop
$('#slider')
	.append($('<p id="slider-thumbs">'))
	.append($('<p id="slider-comment">'))
	.append(
		$('<a id="slider-next">')
		.attr('title', 'Suivant')
		.click(function() {
			sliderDisplay(current + 1);
		}))
	.append(
		$('<a id="slider-previous">')
		.attr('title', 'Précédent')
		.click(function() {
			sliderDisplay(current - 1);
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
sliderDisplay();

function sliderSwitchScroll() {
	if (!timer) {
		// On était en stop
		sliderDisplay();
		timer = setInterval(sliderDisplay, scrollDelay);
		$('#slider').addClass('show-play');
	} else {
		// On était en play
		clearInterval(timer);
		timer = 0;
		$('#slider').removeClass('show-play');
	}
}

function showButtons() {
	$('#slider').addClass('show-buttons');

	if (timerButtons)
		clearTimeout(timerButtons);

	timerButtons = setTimeout(function() {
		$('#slider').removeClass('show-buttons');
	}, buttonsDelay);
}

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
		i = current + 1;
	current = i = i % slides.length;

	// Reset show-play if any
	if (timer) {
		clearInterval(timer);
		timer = setInterval(sliderDisplay, scrollDelay);
	}

	// Insert the new images
	$('#slider').append(images[i]);
	$('#slider-comment').html(slides[i].length > 1 ? slides[i][1] : '');

	// Highlight the displayed thumbnail
	for (let j = 0; j < thumb.length; j++)
		thumb[j][i == j ? 'addClass' : 'removeClass']('highlighted');

	$('#slider-download').attr('href', slides[i][0]).attr('download', 'diapo_' + i);

	// Hide frist previous & last next buttons
	$('#slider-previous').css('display', i > 0 ? 'block' : 'none'); //style. = ;
	$('#slider-next').css('display', i < slides.length - 1 ? 'block' : 'none'); //style. = ;
}
/**
 * Request to fullscreen an element.
 * @param {HTMLElement} element Element to request fullscreen
 */
function requestFullScreen(element) {
	if (element.requestFullscreen) {
		element.requestFullscreen();
	} else if (element['msRequestFullscreen']) {
		element['msRequestFullscreen']();
	} else if (element['webkitRequestFullscreen']) {
		element['webkitRequestFullscreen']();
	}
}

/**
 * Exit fullscreen.
 */
function exitFullScreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document['msExitFullscreen']) {
		document['msExitFullscreen']();
	} else if (document['webkitExitFullscreen']) {
		document['webkitExitFullscreen']();
	}
}

function full(el, album, page) {
	requestFullScreen (el.parentElement);
}
/* jshint esversion: 6 */
var p = 0;

function page(delta) {
	if (!isNaN(delta))
		p += delta;
	window.location = '#' + (2 * p + 1);

	// Page contents
	$('#left  div').html(gallerie[p].text);
	$('#full div').html(gallerie[p].text);
	$('#right img').attr('src', gallerie[p].img);
	$('#next-img').attr('src', gallerie[p + 1].img); // Next img anticipation

	// Page numbers
	$('#left-number').html(2 * p || '');
	$('#right-number').html(2 * p + 1);

	// Navigation
	$('#prev-page').css('display', p ? '' : 'none');
	$('#next-page').css('display', gallerie[p + 1] !== undefined ? '' : 'none');
	$('#prev-page-full').css('display', p ? '' : 'none');
	$('#next-page-full').css('display', gallerie[p + 1] !== undefined ? '' : 'none');
}

function full() {
	const el = $('#right')[0];
	if (el.requestFullscreen)
		el.requestFullscreen();
	else if (el.msRequestFullscreen)
		el.msRequestFullscreen();
	else if (el.webkitRequestFullscreen)
		el.webkitRequestFullscreen();
}
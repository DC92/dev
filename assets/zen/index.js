// DEBUG
/* jshint esversion: 6 */
if (window.screen.width == window.outerWidth) { // Si mobile
	window.addEventListener('error', function(evt) {
		alert('ERROR ' + evt.filename + ' ' + evt.lineno + ':' + evt.colno + '\n' + evt.message);
	});
	console.log = function(message) {
		alert('CONSOLE ' + message);
	};
}

//****************************************************************
// Ecran d'accueil, activations nécéssitant une action utilisateur
function init(el) {
	el.style.display = 'none';

	const fs = document.body.requestFullscreen || document.body.webkitRequestFullScreen;
	if (fs &&
		window.screen.width == window.outerWidth) // Si mobile
		fs();

	randomSound();
	setInterval(randomSound, 1000);
}

//**********************
// Mesure de la rotation
var deviceOrientation = {},
	lastOrientation = {};

// Actualise la position quand elle change
window.addEventListener('deviceorientation', function(evt) {
	deviceOrientation = evt;
});

function derive(k) {
	let dor = deviceOrientation[k] - lastOrientation[k];
	if (dor < 180) dor += 360;
	if (dor > 180) dor -= 360;
	return isNaN(dor) ? 0 :
		Math.abs(dor);
}

// Récupère la rotation depuis la dernière fois (en °)
function deltaRotation() {
	const r = Math.hypot(Math.hypot(derive('alpha'), derive('beta')), derive('gamma'));
	lastOrientation = deviceOrientation;
	return r;
}

//*******************
// Diffusion des sons
const delai = 8,
	ems_r = 0.1 / delai, // Probabilité d'échanger main/second au repos (secondes)
	es_c = 0.2 / delai, // Probabilité d'échanger second au repos et calme
	ps_ms = 0.2, // Probabilité de diffuser le second
	r_bc = 0.1, // Limite basse rotation au calme
	r_hc = 3, // Limite haute rotation au calme
	r_ha = 15; // Limite haute rotation agitée

var main = 'champs',
	second = 'foret',
	son = randomArray(sons[main]),
	compteur = delai;

function randomSound() {
	const rotation = deltaRotation(),
		// Probabilité d'échanger main/second
		p_ms = Math.max(ems_r * (1 - rotation / r_bc), (rotation - r_hc) / (r_ha - r_hc)),
		// Probabilité d'échanger second
		p_es = Math.max(es_c, (rotation - r_hc) / (r_ha - r_hc));

	// Echange main/second
	if (Math.random() < p_ms) {
		const tmp = main;
		main = second;
		second = tmp;
		compteur = delai; // On change le son tout de suite
	}

	// Randomisation du second
	if (Math.random() < p_es) {
		second = randomArray(liaisons[main]);
	}

	// Choix du son diffusé (main/second)
	if (compteur++ >= delai) {
		const nom = Math.random() > ps_ms ? main : second;
		son = randomArray(sons[nom]);
		mp3(son);
		compteur = 0;
	}

	const trace = document.getElementById('trace');
	if (trace)
		//	trace.innerHTML = deltaRotation (); 
		trace.innerHTML = [
			'=== ',
			main,
			second,
			son,
			'rotation ' + rotation,
			'p_ms ' + p_ms,
			'p_es ' + p_es,
		].join('<br/>');
}

function randomArray(a) {
	return a[Math.floor(Math.random() * a.length)];
}

// Joue un fichier MP3
//TODO entrée et sortie progressive
const audioContext = new(window.AudioContext || window.webkitAudioContext)();

function mp3(file) {
	const source = audioContext.createBufferSource(),
		panner = audioContext.createPanner();
	panner.connect(audioContext.destination);
	source.connect(panner);

	const angle = Math.random() * 2 * Math.PI;
	panner.setPosition(Math.sin(angle), 0, Math.cos(angle));
	//	panner.setPosition(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);

	window.fetch(file)
		.then(function(response) {
			return response.arrayBuffer();
		})
		.then(function(arrayBuffer) {
			return audioContext.decodeAudioData(arrayBuffer);
		})
		.then(function(audioBuffer) {
			source.buffer = audioBuffer;
			source.start();
		});
	return source;
}
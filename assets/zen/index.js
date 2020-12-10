// DEBUG
if (window.location.hash.substr(1, 1) == '0' && window.location.hash.length > 2) {
	window.addEventListener('error', function(evt) {
		alert(evt.filename + ' ' + evt.lineno + ':' + evt.colno + '\n' + evt.message);
	});
	console.log = function(message) {
		alert(message);
	};
}

//**************************************************************************
// Accueil
function boot () {
	if(window. screen.width ==window.outerWidth) // Si mobile
document.body.webkitRequestFullScreen ();

 document.getElementById('boot').style.display = 'none';
 
randomSound();
setInterval(randomSound, delai * 1000);
}

//**************************************************************************
// Mesure de l'accélération
//IOS [Homescreen] => [Settings] => [Safari] => enable the motion/orientation access setting
var demiVie = 1, // Secondes
	max = 0.5, // Au delà, c'est un choc
	date = 0,
	hypotLisse = 0,
	hypotIntgrate = 0,
	filtreBas = 0.3, // Secondes
	passeBas = 0,
	passeBasIntegre = 0,
	mouvements = 0,
	bruit = 0,
	capteurs = document.getElementById('capteurs');

window.addEventListener('devicemotion', function(evt) {
	const acceletation = Math.hypot(Math.hypot(evt.acceleration.x, evt.acceleration.y), evt.acceleration.z),
		dt = (evt.timeStamp - date) / 1000,
		ratio = dt / demiVie;
	date = evt.timeStamp; // Pour la prochaine fois

		capteurs.innerHTML = '.'.repeat(acceletation * 30);

	hypotIntgrate += (acceletation - bruit) * dt;

	passeBas = lissage(passeBas, acceletation, filtreBas, max);
	passeBasIntegre += (passeBas) * dt;
	bruit = lissage(bruit, passeBas, ratio / 3, passeBas * 3);

	hypotLisse = lissage(hypotLisse, acceletation, ratio, max + bruit);
	mouvements = Math.max((hypotLisse - bruit) / max, 0);

	//	log.innerHTML = hypotLisse+'</br>'+bruit+'</br>'+ Math.round(mouvements*100)/10;
//	if (log)
//		log.innerHTML = passeBasIntegre;
}, true);

function lissage(valeur, update, ratio, max) {
	valeur = valeur ?
		valeur * (1 - ratio) + update * ratio :
		update;

	if (max && valeur > max)
		valeur = max;

	return valeur;
}

//*******************
// Diffusion des sons
var audioContext = new(window.AudioContext || window.webkitAudioContext)(),
	sortie = audioContext.destination,
	main = 'champs',
	second = 'foret',
	balance = 1, // < 0.5 : bascule et revient à > 0.5 / > 1 change le second
	delai = 8,
	trace = document.getElementById('trace');

//**********
// Functions
function randomSound() {
	balance += Math.random() - mouvements;
	if (balance < 0.5) {
		const tmp = main;
		main = second;
		second = tmp;
		balance = 1 - balance;
	}
	if (balance > 1) {
		second = randomArray(liaisons[main]);
		balance = 1;
	}

	const nom = Math.random() < balance ? main : second,
		file = randomArray(sons[nom]);

	mp3(file);
//	if (trace)
//		trace.innerHTML = main + ' ' + second + ' ' + file + ' ' + balance;
}

function randomArray(a) {
	return a[Math.floor(Math.random() * a.length)];
}

function mp3(file, out) {
	const source = audioContext.createBufferSource(),
		panner = audioContext.createPanner();
	panner.connect(out || sortie);
	source.connect(panner);

	const angle = Math.random() * 2 * Math.PI;
	panner.setPosition(Math.sin(angle), 0, Math.cos(angle));
	//	panner.setPosition(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1);

	window.fetch(file)
		.then(response => response.arrayBuffer())
		.then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
		.then(audioBuffer => {
			source.buffer = audioBuffer;
			source.start();
		});
	return source;
}

// Mesure du spectre
/*
var log = document.getElementById('log'),
	inertie = 2, // Secondes
	progression = .9, // Progression logarithmique des fréquences
	nbMesures = 40,
	dateDernierEchantillon,
	fourier,
	barres,
	fourierTmp= {};
		for (let o = 1; o <= nbMesures; o++)
			fourierTmp[o]=[0,0];

window.addEventListener('devicemotion', function(evt) {
	const acceletation = Math.hypot(Math.hypot(evt.acceleration.x, evt.acceleration.y), evt.acceleration.z),
		 dti = Math.min(100,evt.timeStamp-dateDernierEchantillon)/1000/inertie;
	
		fourier = {};
		barres = {};
		for (let o = 1; o <= nbMesures; o++){
			const ot = 2*Math.PI*Math.pow(progression,o)*evt.timeStamp;
			fourierTmp[o][0]=(fourierTmp[o][0]||0)*(1-dti)+acceletation*Math.sin(ot)*dti;
			fourierTmp[o][1]=(fourierTmp[o][1]||0)*(1-dti)+acceletation*Math.cos(ot)*dti;
			fourier[o]=Math.hypot(fourierTmp[o][0],fourierTmp[o][1]);
			barres[o]=Math.round(1/Math.pow(progression,o)*10)/10+'.'.repeat(fourier[o]*1000);
		}
{var _r='',_v=barres;if(typeof _v=='array'||typeof _v=='object'){for(_i in _v)if(typeof _v[_i]!='function'&&_v[_i])_r+=_i+'='+typeof _v[_i]+' '+_v[_i]+' '+(_v[_i]&&_v[_i].CLASS_NAME?'('+_v[_i].CLASS_NAME+')':'')+"\n"}else _r+=_v;log.innerHTML =_r}
		dateDernierEchantillon=evt.timeStamp;
}, true);
*/
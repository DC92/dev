// Print the inner code of the previous <script> tag

const pre = document.createElement('pre'),
	scripts = document.getElementsByTagName('script'),
	text = document.createTextNode(
		scripts[scripts.length - 2].innerHTML
	);

pre.appendChild(text);
document.body.appendChild(pre);
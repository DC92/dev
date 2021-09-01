// Print the inner code of the previous <script> tag

const title = document.createElement('h4'),
	pre = document.createElement('pre'),
	scripts = document.getElementsByTagName('script');

document.body.appendChild(title);
title.innerHTML = 'Related code:';
title.style.margin = 0;

document.body.appendChild(pre);
pre.innerHTML = scripts[scripts.length - 2].innerHTML;
pre.style.margin = 0;
/**
 * Manages checkboxes inputs having the same name
 * selectorName {string}
 * callback {function(list)} action when the button is clicked
 *
 * Mem the checkboxes in cookies / recover it from the cookies, url args or hash
 * Manages a global flip-flop of the same named <input> checkboxes
 */
function memCheckbox(selectorName, callback) {
	//TODO BUG ne mémorise que le callback de la dernière déclaration
	const request = // Search values in cookies & args
		window.location.search + ';' + // Priority to the url args ?selector=1,2,3
		window.location.hash + ';' + // Then the hash #selector=1,2,3
		document.cookie, // Then the cookies

		match = request.match(new RegExp(selectorName + '=([^;]*)')),
		inputEls = document.getElementsByName(selectorName || '');

	// Set the <inputs> accordingly with the cookies or url args
	if (inputEls)
		for (let e = 0; e < inputEls.length; e++) { //HACK el.forEach is not supported by IE/Edge
			// Set inputs following cookies & args
			if (match)
				inputEls[e].checked =
				match[1].split(',').includes(inputEls[e].value) || // That one is declared
				match[1].split(',').includes('on'); // The "all (= "on") is set

			// Attach the action
			inputEls[e].onclick = onClick;

			// Compute the all check && init the cookies if data has been given by the url
			checkEl(inputEls[e]);
		}

	const list = readList();

	if (typeof callback == 'function')
		callback(list);

	return list;

	function onClick(evt) {
		checkEl(evt.target); // Do the "all" check verification

		const list = readList();

		// Mem the data in the cookie
		if (selectorName)
			document.cookie = selectorName + '=' + list.join(',') +
			'; path=/; SameSite=Secure; expires=' +
			new Date(2100, 0).toUTCString(); // Keep over all session

		if (typeof callback == 'function')
			callback(list);
	}

	// Check on <input> & set the "All" input accordingly
	function checkEl(target) {
		let allIndex = -1, // Index of the "all" <input> if any
			allCheck = true; // Are all others checked ?

		for (let e = 0; e < inputEls.length; e++) {
			if (target.value == 'on') // If the "all" <input> is checked (who has a default value = "on")
				inputEls[e].checked = target.checked; // Force all the others to the same
			else if (inputEls[e].value == 'on') // The "all" <input>
				allIndex = e;
			else if (!inputEls[e].checked)
				allCheck = false; // Uncheck the "all" <input> if one other is unchecked	
		}

		// Check the "all" <input> if all others are
		if (allIndex != -1)
			inputEls[allIndex].checked = allCheck;
	}

	function readList() {
		// Specific case of a single on/off <input>
		if (inputEls.length == 1)
			return [inputEls[0].checked];

		// Read each <input> checkbox
		const list = [];

		for (let e = 0; e < inputEls.length; e++)
			if (inputEls[e].checked &&
				inputEls[e].value != 'on')
				list.push(inputEls[e].value);

		return list;
	}
}
/**
 * Manages checkboxes inputs having the same name
 * selectorName {string}
 * callback {function(list)} action when the button is clicked
 *
 * Mem the checkboxes in cookies / recover it from the cookies, url args or hash
 * Manages a global flip-flop of the same named <input> checkboxes
 */
function memCheckbox(selectorName, callback) {
	// Search values in cookies & args
	const inputEls = document.getElementsByName(selectorName || ''),
		request = window.location.search + ';' + // Priority to the url args ?selector=1,2,3
		window.location.hash + ';' + // Then the hash #selector=1,2,3
		document.cookie, // Then the cookies
		match = request.match(new RegExp(selectorName + '=([^;]*)'));

	if (inputEls)
		for (let e = 0; e < inputEls.length; e++) { //HACK el.forEach is not supported by IE/Edge
			// Check following cookies & args
			if (match)
				inputEls[e].checked =
				match[1].split(',').includes(inputEls[e].value) || // That one is declared
				match[1].split(',').includes('on'); // The "all (= "on") is set

			// Attach the action
			inputEls[e].addEventListener('click', onClick);
		}

	// Init the cookies if data has been given by the url
	onClick();

	function onClick(evt) {
		const list = []; // List of checked values
		let allIndex = -1, // Index of the "all" <input> if any
			allCheck = true; // Are all others checked ?

		if (evt)
			for (let e = 0; e < inputEls.length; e++) {
				if (evt.target.value == 'on') // If the "all" <input> is checked (who has a default value = "on")
					inputEls[e].checked = evt.target.checked; // Force all the others to the same
				else if (inputEls[e].value == 'on') // The "all" <input>
					allIndex = e;
				else if (!inputEls[e].checked)
					allCheck = false; // Uncheck the "all" <input> if one other is unchecked	
			}

		// Check the "all" <input> if all others are
		if (allIndex != -1)
			inputEls[allIndex].checked = allCheck;

		// Get the values of all checked inputs
		for (let e = 0; e < inputEls.length; e++)
			if (inputEls[e].checked) // List checked elements
				list.push(inputEls[e].value);

		if (typeof callback == 'function')
			callback(list);

		// Mem the data in the cookie
		if (selectorName)
			document.cookie = selectorName + '=' + list.join(',') +
			'; path=/; SameSite=Secure; expires=' +
			new Date(2100, 0).toUTCString(); // Keep over all session
	}
}
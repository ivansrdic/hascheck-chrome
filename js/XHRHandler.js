/**
 * Creates a new XMLHttpRequest
 */
function createXMLRequest(editorID) {
	clearTimeout(editors[editorID].timeoutHandle);	

	var diff = textDiff(editors[editorID].inputValue, editors[editorID].newInputValue);
	
	var output = editors[editorID].newInputValue.slice(diff[0], diff[0] + diff[2]);

	if(output) {
		var xhr = new XMLHttpRequest();
		addReadyStateChangeHandler(editorID, xhr);
		xhr.open("POST", "https://hacheck.tel.fer.hr/xml.pl", true);
		xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xhr.send("textarea=" + output);
		requestTime = (new Date).getTime();
	}
	editors[editorID].inputValue = editors[editorID].newInputValue;
}

/**
 * Gets the difference between two strings in whole words.
 * @param  {String} a first string - in this case the old input
 * @param  {String} b second string - in this case the new input
 * @return {Array} [beggining of difference, length of difference in a, length of difference in b]
 */
function textDiff(a, b) {
	for (var c = 0,	d = a.length, e = b.length; a[c] && a[c] == b[c]; c++);
	for (; d > c & e > c & a[d - 1] == b[e - 1]; d--) e--;
	while(c>0 && new RegExp("([a-zčćžšđA-ZČĆŽŠĐ])").test(b[c-1])) c--;
	while(e<(b.length-1) && new RegExp("([a-zčćžšđA-ZČĆŽŠĐ])").test(b[e])) e++;
	return [c, d - c, e - c];
}

/**
 * Checks if the ready state change signals a successful connection with the server and gets the response
 * @param  {[type]} xhrEvent Event triggered by a readystate change of the XMLHttpRequest
 */
function addReadyStateChangeHandler(editorID, xhr) {
	xhr.onreadystatechange = function(xhrEvent) {
		//try {
			if(xhrEvent.target.readyState == 4) {
				if(xhrEvent.target.status == 200) {
					checkErrors(editorID, xhrEvent.target);
				} else {
					console.log("Xml request error code " + xhrEvent.target.status + ". Problem connecting to the hashcheck server.");
				}				
			}
		//} catch (e) {
		//	 console.log("Caught Exception: " + e.description);
		//}
	}
}
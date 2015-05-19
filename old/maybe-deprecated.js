/*
** JSON is abot 30% faster
 */

//xhr.open("POST", "https://hacheck.tel.fer.hr/xml.pl", true); XML
//checkErrorsXML(editorID, xhrEvent.target); XML
function checkErrorsXML(editorID, response) {
	console.log((new Date).getTime() - requestTime);
	var newErrors = response.responseXML.getElementsByTagName("results")[0].children;
	var errorExists = false;
	var tmpErrorCount;
	if(editors[editorID].contentEditable) {
		var textNodes = getTextNodes(editorID);
		var newTextNodes;
	}
	for(var i = 0; i < newErrors.length; i++) {
		for(var j = 0; j < errors.length; j++) {
			if(errors[j].suspicious == newErrors[i].getElementsByTagName("suspicious")[0].textContent) {
				errorExists = true;
				tmpErrorCount = errorCount;
				errorCount = j;
				break;
			}
		}
		if(!errorExists) {
			errors.push(new Error(newErrors[i].getElementsByTagName("length")[0].textContent, newErrors[i].getElementsByTagName("suspicious")[0].textContent));
			if(newErrors[i].getElementsByTagName("suggestions")[0]) {
				for(var k = 0; k < newErrors[i].getElementsByTagName("suggestions")[0].children.length && k < 5; k++) {
					errors[errorCount].suggestions.push(newErrors[i].getElementsByTagName("suggestions")[0].children[k].textContent);
				}
			} else {
				errors[errorCount].suggestions = null;
			}
		}
		if(!errors[errorCount].ignored) {
			if(!editors[editorID].contentEditable) {
				editors[editorID].editorDiv.innerHTML = editors[editorID].editorDiv.innerHTML.replace(newBoundaryRegExp(errors[errorCount].suspicious, "g"), 
														'$1<span data-error-number="' + errorCount + '" data-hovered="false" class="hascheck-error">$2</span>');
			} else {
				for (var m = 0; m < textNodes.length; m++) {
					if(textNodes[m].parentNode.className.indexOf("hascheck-error") == -1) {
						if(newBoundaryRegExp(errors[errorCount].suspicious, "g").test(textNodes[m].textContent)) {
							newTextNodes = markError(editorID, textNodes[m], errorCount);
							textNodes[m] = newTextNodes[1];
							textNodes.splice(m, 0, newTextNodes[0]);
						}
					}
				}
				
			}
		}
		if(errorExists) {
			errorCount = tmpErrorCount;
			errorExists = false;
		} else {
			errorCount++;
		}
	}
	getElements(editorID);
	console.log((new Date).getTime() - requestTime);
}
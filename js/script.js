/**
*** TODO: 	uredi main.html, google docs?, uljepšaj kod - OOP, fizička odvojenost itd.
 */

var requestTime;
var loader;

/**
*** Gets input value from contentscript oninput event listener and find the new part of the input.
 */
function getInputValue(newTextbox) {
	var editorID = null;
	//If the event fired was from input instead of others, get the textbox.
	if(newTextbox != null) {
		if(newTextbox.getAttribute('data-hascheck') == null) {
			editorID = editors.length;
			editors.push(new Editor(newTextbox, editors.length));
			prepareEditor(editorID);
			if(editorID == 0) preparePopup(editorID);
		} else {
			editorID = newTextbox.getAttribute('data-hascheck-editor-id');
		}
	}

	//If there is no new input after 2000ms send new input to server.
	clearTimeout(editors[editorID].timeoutHandle);
	editors[editorID].timeoutHandle = setTimeout(createXMLRequest, 2000, editorID);

	//If the textbox is a div or body(inside iframe), remove all span/div tags (those are the only ones that should be there), else it is a textarea or input
	if(!editors[editorID].contentEditable) {
		editors[editorID].newInputValue = editors[editorID].textbox.value;
		editors[editorID].editorDiv.innerHTML = editors[editorID].newInputValue;
		if(editors[editorID].newInputValue.substr(editors[editorID].newInputValue.length-1) == "\n") editors[editorID].editorDiv.innerHTML += "\n";
		markErrors(editorID);
	} else {
		editors[editorID].newInputValue = editors[editorID].textbox.innerText;
	}

	refreshEditorDivSize(editorID);
	refreshEditorDivScroll(editorID);
	refreshEditorDivPosition(editorID);

	//Splits the new input by whitespace to determine the number of words.
	var arr = editors[editorID].newInputValue.match(newBoundaryRegExp("[a-zčćžšđA-ZČĆŽŠĐ]+", "g"));
	if((arr != null) && (arr.length % 5 == 0)) {
		if(!editors[editorID].length) {
			createXMLRequest(editorID);
			editors[editorID].length = true;
		}
	} else {
		editors[editorID].length = false;
	}
}

function newBoundaryRegExp(search, flags) {
	return new RegExp('(^|[^a-zčćžšđA-ZČĆŽŠĐ])(' + search + ')(?=$|[^a-zčćžšđA-ZČĆŽŠĐ])', flags);
}

// TODO: Enable faster error marking? 

function markErrors(editorID) {
	if(!editors[editorID].contentEditable) {
		var newInnerHTML = editors[editorID].editorDiv.innerHTML;
		for (var i = 0; i < errors.length; i++) {
			if(!errors[i].ignored) {
				newInnerHTML = newInnerHTML.replace(newBoundaryRegExp(errors[i].suspicious, "g"), 
											'$1<span data-error-number="' + i + '" data-hovered="false" data-hover-set="false" class="hascheck-error">$2</span>');
			}
		};
		editors[editorID].editorDiv.innerHTML = newInnerHTML;
	} else {/*
		var textNodes = getTextNodes(editorID);
		var newTextNodes;
		for (var i = 0; i < errors.length; i++) {
			if(!errors[i].ignored) {
				for(var j = 0; j < textNodes.length; j++) {
					if(textNodes[j].parentNode.className.indexOf("hascheck-error") == -1) {
						if(newBoundaryRegExp(errors[i].suspicious, "g").test(textNodes[j].textContent)) {
							newTextNodes = markError(editorID, textNodes[j], i);
							textNodes[j] = newTextNodes[1];
							textNodes.splice(j, 0, newTextNodes[0]);			
						}
					}
				}
			}
		}*/
	}

	getElements(editorID);
}

/**
*** Prepares the style of the textbox and places a background editor div.
 */
function prepareEditor(editorID) {
	if(editors[editorID].textbox.tagName == "DIV" || editors[editorID].textbox.tagName == "BODY") editors[editorID].contentEditable = true;
	editors[editorID].currentDocument = editors[editorID].textbox.ownerDocument;
	editors[editorID].textbox.setAttribute('data-hascheck', 'true');
	editors[editorID].textbox.setAttribute('data-hascheck-editor-id', editorID);
	if(!editors[editorID].contentEditable) {
		editors[editorID].editorDiv = editors[editorID].currentDocument.createElement("div");
		editors[editorID].editorDiv.className = 'hascheck-editor-div';
		editors[editorID].editorDiv.setAttribute('data-hascheck-editor-id', editorID);
		var style = editors[editorID].currentDocument.defaultView.getComputedStyle(editors[editorID].textbox, null);

		editors[editorID].editorDiv.style.cssText = editors[editorID].textbox.style.cssText + " font-family: " + style.getPropertyValue('font-family') + 
								"; font-size: " + style.getPropertyValue('font-size') + "; text-align: " + style.getPropertyValue('text-align') + 
								"; padding: " + style.getPropertyValue('padding') + "; border: " + style.getPropertyValue('border') + 
								"; border-width: " + style.getPropertyValue('border-width') +  "; border-style: " + style.getPropertyValue('border-style') + 
								/*"; margin: " + style.getPropertyValue('margin') +*/ "; top: " + editors[editorID].textbox.offsetTop + "px; left: " + editors[editorID].textbox.offsetLeft + 
								"px; height: " + (editors[editorID].textbox.clientHeight - style.getPropertyValue('padding-top').replace("px", "") - style.getPropertyValue('padding-bottom').replace("px", "")) + 
								"px; width: " + (editors[editorID].textbox.clientWidth - style.getPropertyValue('padding-right').replace("px", "") - style.getPropertyValue('padding-left').replace("px", "")) +
								"px; background: " + style.getPropertyValue('background-color') + ";";
		if(editors[editorID].textbox.tagName == "INPUT") {
			editors[editorID].editorDiv.style.cssText = editors[editorID].editorDiv.style.cssText + " line-height: " + (editors[editorID].textbox.clientHeight - style.getPropertyValue('padding-top').replace("px", "") - style.getPropertyValue('padding-bottom').replace("px", "")) + "px;";
		} else {
			editors[editorID].editorDiv.style.cssText = editors[editorID].editorDiv.style.cssText + " line-height: " + style.getPropertyValue('line-height') + ";";
		}
		editors[editorID].textbox.parentNode.insertBefore(editors[editorID].editorDiv, editors[editorID].textbox);
		editors[editorID].textbox.style.cssText = editors[editorID].textbox.style.cssText + "z-index: 1; position: relative; transition: none; background: transparent !important;";
	} else {
		
		editors[editorID].editorDiv = editors[editorID].textbox;
		editors[editorID].textbox.addEventListener("keypress", function(e) {
			var node = editors[editorID].currentDocument.getSelection().anchorNode.parentNode;
			if(node.className.indexOf("hascheck-error") > -1) {
				var character = String.fromCharCode(e.charCode);
				if(character.match(/[^a-zčćžšđA-ZČĆŽŠĐ]/g)) {
					var offset = editors[editorID].currentDocument.getSelection().anchorOffset;
					var textnode;
					if(character != " ") {
						textNode = editors[editorID].currentDocument.createTextNode(character);
					} else {
						textNode = editors[editorID].currentDocument.createTextNode("\u00a0");
					}
					if(offset == 0) {
						
						node.parentNode.insertBefore(textNode, node);
						e.preventDefault();
						editors[editorID].flag = true;
					} else if(offset == node.innerText.length) {
						var position = node.innerText.length;
						node.parentNode.insertBefore(textNode, node.nextSibling);
						var sel = editors[editorID].currentDocument.getSelection();
						var range = editors[editorID].currentDocument.createRange();
			            range.setStart(textNode, 1);
			            range.setEnd(textNode, 1);
			            sel.removeAllRanges();
			            sel.addRange(range);
						e.preventDefault();
						editors[editorID].flag = true;
					}
				}
			}
		});
		editors[editorID].textbox.addEventListener("input", function(e) {
			if(!editors[editorID].flag) {
				var node = editors[editorID].currentDocument.getSelection().anchorNode.parentNode;
				if(node.className.indexOf("hascheck-error") > -1) {
					var position = editors[editorID].currentDocument.getSelection().anchorOffset;
					var textNode = editors[editorID].currentDocument.createTextNode(node.innerText);
					node.parentNode.insertBefore(textNode, node);
					node.parentNode.removeChild(node);
					var sel = editors[editorID].currentDocument.getSelection();
					var range = sel.getRangeAt(0);
		            range.deleteContents();

		            range.setStart(textNode, position);
		            range.setEnd(textNode, position);
		            sel.removeAllRanges();
		            sel.addRange(range);
				}
			}
			editors[editorID].flag = false;
		});
	}
	if(editorID == 0) prepareLoader(editorID);
	editors[editorID].textbox.addEventListener("mousemove", checkHoverEvent);
	editors[editorID].textbox.addEventListener("mouseout", checkHoverEvent);
	editors[editorID].textbox.addEventListener("scroll", function(e) {
		if(!editors[editorID].contentEditable) {
			editors[editorID].editorDiv.scrollTop = editors[editorID].textbox.scrollTop;
			editors[editorID].editorDiv.scrollLeft = editors[editorID].textbox.scrollLeft;
		}
		refreshLoader(editorID);
	});
}

/**
*** Refreshes the scroll value of the background editor div.
 */
function refreshEditorDivScroll(editorID) {
	if(!editors[editorID].contentEditable) {
		editors[editorID].editorDiv.scrollTop = editors[editorID].textbox.scrollTop;
		editors[editorID].editorDiv.scrollLeft = editors[editorID].textbox.scrollLeft;
	}
	refreshLoader(editorID);
}

/**
*** Refreshes the size of the background editor div.
 */
function refreshEditorDivSize(editorID) {
	if(!editors[editorID].contentEditable) {
		var style = editors[editorID].currentDocument.defaultView.getComputedStyle(editors[editorID].textbox, null);
		editors[editorID].editorDiv.style.width = (editors[editorID].textbox.clientWidth - style.getPropertyValue('padding-left').replace("px", "") - style.getPropertyValue('padding-right').replace("px", "")) + "px";
		editors[editorID].editorDiv.style.height = (editors[editorID].textbox.clientHeight - style.getPropertyValue('padding-top').replace("px", "") - style.getPropertyValue('padding-bottom').replace("px", "")) + "px";
	}

	refreshLoader(editorID);
}

function refreshEditorDivPosition(editorID) {
	if(!editors[editorID].contentEditable) {
		var style = editors[editorID].currentDocument.defaultView.getComputedStyle(editors[editorID].textbox, null);
		editors[editorID].editorDiv.style.top = (editors[editorID].textbox.offsetTop) + "px";
		editors[editorID].editorDiv.style.left = (editors[editorID].textbox.offsetLeft) + "px";
	}
	var position = editors[editorID].textbox.getBoundingClientRect();
	editors[editorID].editorDiv.positionX = position.left;
	editors[editorID].editorDiv.positionY = position.top;

	refreshLoader(editorID);
}

/**
*** Prepares the style of the popup.
 */
var errorPopup;
function preparePopup(editorID) {
	errorPopup = editors[editorID].currentDocument.createElement("div");
	errorPopup.className = "hascheck-popup";
	errorPopup.addEventListener("mouseover", function(e) {
		clearTimeout(editors[editorID].mouseoutTimer);
	});
	errorPopup.addEventListener("mouseout", function(e) {
		clearTimeout(editors[editorID].mouseoutTimer);
		editors[editorID].mouseoutTimer = setTimeout(function() {
			errorPopup.style.display = "none";
			hovered.className = hovered.className.replace(/(?:^|\s)hascheck-error-hovered-line hascheck-error-hovered-background(?!\S)/g , '');
			hovered.setAttribute('data-hovered', 'false');
		}, 800);
	});
	var errorPopupFooter = editors[editorID].currentDocument.createElement("div");
	errorPopupFooter.className = "hascheck-popup-footer";
	var span = editors[editorID].currentDocument.createElement("span");
	span.innerHTML = '<a href="https://hacheck.tel.fer.hr/">Ispravljeno hašekom</a>';
	errorPopupFooter.appendChild(span);
	span = editors[editorID].currentDocument.createElement("span");
	span.id = "hascheck-add";
	span.innerHTML = '<a>Dodaj u rječnik</a>'
	errorPopupFooter.appendChild(span);
	span = editors[editorID].currentDocument.createElement("span");
	span.id = "hascheck-ignore";
	span.innerHTML = '<a>Ignoriraj</a>'
	errorPopupFooter.appendChild(span);
	errorPopup.appendChild(errorPopupFooter);
	editors[editorID].currentDocument.body.parentNode.insertBefore(errorPopup, editors[editorID].currentDocument.body.nextSibling);
	errorPopup.lastChild.lastChild.addEventListener("click", function() {
		errors[hovered.getAttribute('data-error-number')].ignored = true;
		for(var i = 0; i < editors.length; i++) {
			var ignoredErrorElements = editors[i].editorDiv.getElementsByTagName("SPAN");
			var len = ignoredErrorElements.length
			for(var j = 0; j < len; j++) if(ignoredErrorElements[0].getAttribute('data-error-number') == hovered.getAttribute('data-error-number')) ignoredErrorElements[0].outerHTML = ignoredErrorElements[0].innerHTML;
		}
		errorPopup.style.display = "none";
	}, true);
}

function refreshPopup(editorID, errorSpan) {
	var error = errors[errorSpan.getAttribute('data-error-number')]
	var list = editors[editorID].currentDocument.createElement('ul');
	var listItem;

	errorPopup.style.left = (errorSpan.offsetLeft + editors[editorID].editorDiv.positionX - editors[editorID].editorDiv.scrollLeft + editors[editorID].currentDocument.defaultView.pageXOffset) + "px";
	errorPopup.style.top = (errorSpan.offsetTop + editors[editorID].editorDiv.positionY - editors[editorID].editorDiv.scrollTop + editors[editorID].currentDocument.defaultView.pageYOffset + 13) + "px";
	if(errorPopup.children[0].tagName == "UL") {
		errorPopup.removeChild(errorPopup.children[0]);
	}
	if(error.suggestions) {
		for (var i = 0; i < error.suggestions.length; i++) {
			listItem = editors[editorID].currentDocument.createElement('li');
			listItem.innerHTML = '<span class="error">' + error.suspicious + '</span><span class="arrow"> → </span><span class="correction">' + error.suggestions[i] + '</span>';
			
			listItem.addEventListener('click', function (e) {
				if(e.target.tagName == "SPAN") {
					if(e.target.className == "correction") {
						hovered.outerHTML = e.target.textContent;
					} else {
						hovered.outerHTML = e.target.parentElement.children[2].textContent;
					}

					if(!editors[editorID].contentEditable) {
						editors[editorID].textbox.value = editors[editorID].editorDiv.textContent;
						inputValue = editors[editorID].textbox.value;
					} else {
						inputValue = editors[editorID].textbox.textContent;
					}
					errorPopup.style.display = "none";
					setTimeout(function(editorID) {
						clearTimeout(editors[editorID].mouseoutTimer);
					}, 500, editorID);
				}
			});
			list.appendChild(listItem);
		};
	} else {
		list.innerHTML = 'Nema prijedloga';
	}

	errorPopup.insertBefore(list, errorPopup.firstChild);
	errorPopup.style.display = "block";
	if(((errorPopup.clientHeight + errorPopup.offsetTop - editors[editorID].currentDocument.defaultView.pageYOffset - editors[editorID].currentDocument.defaultView.innerHeight - 50) > 0) && ((errorPopup.clientHeight + errorPopup.offsetTop - editors[editorID].currentDocument.defaultView.pageYOffset - editors[editorID].currentDocument.defaultView.innerHeight - 50) > (errorPopup.clientHeight - errorPopup.offsetTop + 16 + editors[editorID].currentDocument.defaultView.pageYOffset))) {
		errorPopup.style.top = (errorSpan.offsetTop + editors[editorID].editorDiv.positionY - editors[editorID].editorDiv.scrollTop + editors[editorID].currentDocument.defaultView.pageYOffset - errorPopup.clientHeight - 3) + "px";
	}
	if(editors[editorID].currentDocument.defaultView.innerWidth - errorPopup.offsetLeft - errorPopup.clientWidth < 0) {
		errorPopup.style.left = (errorPopup.offsetLeft + (editors[editorID].currentDocument.defaultView.innerWidth - errorPopup.offsetLeft - errorPopup.clientWidth)) + "px";
	}
}

/**
*** Checks hover events using mouse position and element position.
 */
var hovered;
function checkHoverEvent(e) {
	var element = e.target;
	while(element.getAttribute('data-hascheck-editor-id') == null) element = element.parentNode;
	var editorID = element.getAttribute('data-hascheck-editor-id');
	refreshEditorDivSize(editorID);
	refreshEditorDivPosition(editorID);

	// TODO: hover nakon 200ms?
	if(editors[editorID].elements != null) {
		for (var i = 0; i < editors[editorID].elements.length; i++) {
			if(editors[editorID].elements[i].getAttribute('data-error-number') < errors.length) {
				if((e.pageX - editors[editorID].editorDiv.positionX + editors[editorID].editorDiv.scrollLeft - editors[editorID].currentDocument.defaultView.pageXOffset) >= editors[editorID].elements[i].offsetLeft
					&& (e.pageX - editors[editorID].editorDiv.positionX + editors[editorID].editorDiv.scrollLeft - editors[editorID].currentDocument.defaultView.pageXOffset) <= (editors[editorID].elements[i].offsetLeft + editors[editorID].elements[i].offsetWidth)
					&& (e.pageY - editors[editorID].editorDiv.positionY + editors[editorID].editorDiv.scrollTop - editors[editorID].currentDocument.defaultView.pageYOffset) >= editors[editorID].elements[i].offsetTop
					&& (e.pageY - editors[editorID].editorDiv.positionY + editors[editorID].editorDiv.scrollTop - editors[editorID].currentDocument.defaultView.pageYOffset) <= (editors[editorID].elements[i].offsetTop + editors[editorID].elements[i].offsetHeight)) {
					clearTimeout(editors[editorID].mouseoutTimer);
					if(editors[editorID].elements[i].getAttribute('data-hovered') == 'false') {
						if(hovered) {
							hovered.setAttribute('data-hovered', 'false');
							hovered.className = hovered.className.replace(/(?:^|\s)hascheck-error-hovered-line hascheck-error-hovered-background(?!\S)/g , '');
						}
						
						editors[editorID].elements[i].setAttribute('data-hovered', 'true');

						hovered = editors[editorID].elements[i];
						hovered.className += " hascheck-error-hovered-line hascheck-error-hovered-background";

						refreshPopup(editorID, editors[editorID].elements[i]);
					}
				}

				if(editors[editorID].elements[i].getAttribute('data-hovered') == 'true') {
					if(!((e.pageX - editors[editorID].editorDiv.positionX + editors[editorID].editorDiv.scrollLeft - editors[editorID].currentDocument.defaultView.pageXOffset) >= editors[editorID].elements[i].offsetLeft
						&& (e.pageX - editors[editorID].editorDiv.positionX + editors[editorID].editorDiv.scrollLeft - editors[editorID].currentDocument.defaultView.pageXOffset) <= (editors[editorID].elements[i].offsetLeft + editors[editorID].elements[i].offsetWidth)
						&& (e.pageY - editors[editorID].editorDiv.positionY + editors[editorID].editorDiv.scrollTop - editors[editorID].currentDocument.defaultView.pageYOffset) >= editors[editorID].elements[i].offsetTop
						&& (e.pageY - editors[editorID].editorDiv.positionY + editors[editorID].editorDiv.scrollTop - editors[editorID].currentDocument.defaultView.pageYOffset) <= (editors[editorID].elements[i].offsetTop + editors[editorID].elements[i].offsetHeight))) {
						clearTimeout(editors[editorID].mouseoutTimer);
						editors[editorID].mouseoutTimer = setTimeout(function() {
							errorPopup.style.display = "none";
							if(hovered) {
								hovered.className = hovered.className.replace(/(?:^|\s)hascheck-error-hovered-line hascheck-error-hovered-background(?!\S)/g , '');
								hovered.setAttribute('data-hovered', 'false');
							}
						}, 800);
					}
				}
			}
		}
	}
}

var errors = new Errors();
var errorCount = 0;
function checkErrors(editorID, response) {
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
}

/**
 * Marks the error and correctly positions the caret
 * @param  {Node} textNode   the text node containing the error
 * @param  {Integer}   errorCount index of error in errors array
 * @return {Array}   array containing two new text nodes surrounding the error
 */
function markError(editorID, textNode, errorCount) {
	var indexOfError;
	var span;
	var newTextNodes = new Array();
	var position = editors[editorID].currentDocument.getSelection().anchorOffset;
	var node = editors[editorID].currentDocument.getSelection().anchorNode;

	indexOfError = textNode.textContent.indexOf(errors[errorCount].suspicious);


	span = editors[editorID].currentDocument.createElement("span");
	span.setAttribute('data-error-number', errorCount);
	span.setAttribute('data-hovered', false);
	span.className = "hascheck-error";
	span.innerText = errors[errorCount].suspicious;

	newTextNodes.push(editors[editorID].currentDocument.createTextNode(textNode.textContent.slice(0, indexOfError)));
	textNode.parentNode.insertBefore(newTextNodes[0], textNode);
	textNode.parentNode.insertBefore(span, textNode);
	newTextNodes.push(editors[editorID].currentDocument.createTextNode(textNode.textContent.slice(indexOfError + errors[errorCount].suspicious.length)));
	textNode.parentNode.insertBefore(newTextNodes[1], textNode.nextSibling);
	textNode.parentNode.removeChild(textNode);


	if(node == textNode) {
		var sel = editors[editorID].currentDocument.getSelection();
		var range = sel.getRangeAt(0);
	    range.deleteContents();
		if(position < indexOfError) {
		    range.setStart(newTextNodes[0], position);
		    range.setEnd(newTextNodes[0], position);
		    editors[editorID].currentDocument.getSelection().anchorNode = newTextNodes[0];
		} else if(position > indexOfError + errors[errorCount].suspicious.length) {
			range.setStart(newTextNodes[1], position-(indexOfError + errors[errorCount].suspicious.length));
		    range.setEnd(newTextNodes[1], position-(indexOfError + errors[errorCount].suspicious.length));
		    editors[editorID].currentDocument.getSelection().anchorNode = newTextNodes[1];
		} else {
		    range.setStart(span.firstChild, position-indexOfError);
		    range.setEnd(span.firstChild, position-indexOfError);
		    editors[editorID].currentDocument.getSelection().anchorNode = span.firstChild;
		}
		sel.removeAllRanges();
		sel.addRange(range);
	}

	return newTextNodes;
}

/**
 * Using the TreeWalker API gets all the textnodes inside an element
 * @param  {Node} container element of textnodes
 */
function getTextNodes(editorID) {
	var n, a=[], walk=editors[editorID].currentDocument.createTreeWalker(editors[editorID].editorDiv,NodeFilter.SHOW_TEXT,null,false);
	while(n=walk.nextNode()) a.push(n);
	return a;
}

/**
 * Gets all marked errors and if needed gives a new reference for the hovered error 
 */
function getElements(editorID) {
	editors[editorID].elements = editors[editorID].editorDiv.getElementsByClassName("hascheck-error");
	for (var i = 0; i < editors[editorID].elements.length; i++) {
		if(hovered && editors[editorID].elements[i].outerHTML == hovered.outerHTML) {
			hovered = editors[editorID].elements[i];
		}
	};
}
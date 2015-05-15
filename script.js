/**
*** TODO: 	ako je div ili body piši u njega(ne stvaraj editorDiv) i ubrzaj (ne pretražuje sve), iframe, uredi main.html, google docs?, uljepšaj kod - OOP, 
*** 		fizička odvojenost itd.
 */
function Error(length, suspicious, suggestions) {
	this.ignored = false;
	this.length = length;
	this.suspicious = suspicious;
	this.suggestions = new Array();
}

function Errors() {
}
Errors.prototype = Array.prototype;

var requestTime;

window.addEventListener("input", function(e) {
	if(e.target.getAttribute('type') != "password" && e.target.getAttribute('type') != "email"/* && (e.target.tagName == "TEXTAREA" || (e.target.offsetHeight > 20 && e.target.offsetWidth > 50))*/) {
		getInputValue(e.target);
	}
}, true);

window.addEventListener("DOMNodeInserted", function(e) {
	if(e.target.tagName == "IFRAME"){
		var IFrame = e.target;
		IFrame.addEventListener("load", function(e) {
			var loadedIFrame = e.target;
			loadedIFrame.contentWindow.document.getElementsByTagName("head")[0].innerHTML += '<link rel="stylesheet" type="text/css" href="' + chrome.extension.getURL("main.css") + '" />';
			loadedIFrame.contentWindow.addEventListener("input", function(e) {
				getInputValue(e.target);
			}, true);
		})
	}
}, true);
/*
window.addEventListener("load", function() {
	console.log(document.getElementsByClassName("goog-inline-block kix-lineview-text-block")[0]);
	document.getElementsByClassName("goog-inline-block kix-lineview-text-block")[0].addEventListener("keydown", function(e) {
		console.log(e.target);
	}, true);
}, true);*/


window.addEventListener("submit", function() {
	if (typeof textbox !== "undefined" && ((typeof textbox.value != "undefined" && textbox.value == "") || (typeof textbox.textContent != "undefined" && textbox.textContent == ""))) {
    	getInputValue(null);
    }
}, true);

window.addEventListener("mouseup", function() {
	setTimeout(function() {
		if (typeof textbox !== "undefined" && ((typeof textbox.value != "undefined" && textbox.value == "") || (typeof textbox.textContent != "undefined" && textbox.textContent == ""))) {
	    	getInputValue(null);
	    }
	}, 10);
}, true);

window.addEventListener("keyup", function(e) {
    if (e.keyCode == 13 && typeof textbox !== "undefined" && ((typeof textbox.value != "undefined" && textbox.value == "") || (typeof textbox.textContent != "undefined" && textbox.textContent == ""))) {
    	getInputValue(e.target);
    }
}, true);

/**
*** Gets input value from contentscript oninput event listener and find the new part of the input.
 */
var timeoutHandle = null;
var textbox;
var editorDiv;
var inputValue = "", newInputValue = "";
var length = false;

function getInputValue(tb) {
	//If there is no new input after 2000ms send new input to server.
	clearTimeout(timeoutHandle);
	timeoutHandle = setTimeout(createXmlRequest, 2000);

	//If the event fired was from input instead of others, get the textbox.
	if(tb != null) {
		textbox = tb;
		if(textbox.getAttribute('data-hashcheck') == null) {
			prepareTextbox();
			preparePopup();
		} else {
			editorDiv = textbox.previousSibling;
		}
	}

	//If the textbox is a div or body(inside iframe), remove all span/div tags (those are the only ones that should be there), else it is a textarea or input
	if(textbox.tagName != "DIV" && textbox.tagName != "BODY") {
		newInputValue = textbox.value;
		editorDiv.innerHTML = newInputValue;
		refreshEditorDivSize();
		refreshEditorDivPosition();
		refreshEditorDivScroll();
	} else {
		newInputValue = textbox.innerText;
		editorDiv = textbox;
	}

	markErrors();
	//Splits the new input by whitespace to determine the number of words.
	var arr = newInputValue.match(new RegExp('(^|[^a-zčćžšđA-ZČĆŽŠĐ])([a-zčćžšđA-ZČĆŽŠĐ]+)(?=^|[^a-zčćžšđA-ZČĆŽŠĐ])', 'g'));
	if((arr != null) && (arr.length % 5 == 0)) {
		if(!length) {
			createXmlRequest();
			length = true;
		}
	} else {
		length = false;
	}
}

function markErrors() {
	if(textbox.tagName != "DIV" && textbox.tagName != "BODY") {
		var newInnerHTML = editorDiv.innerHTML;
		for (var i = 0; i < errors.length; i++) {
			if(!errors[i].ignored) {
				newInnerHTML = newInnerHTML.replace(new RegExp('(^|[^a-zčćžšđA-ZČĆŽŠĐ])('+errors[i].suspicious+')(?=^|[^a-zčćžšđA-ZČĆŽŠĐ])', 'gi'), 
															'$1<span data-error-number="' + i + '" data-hovered="false" data-hover-set="false" class="hashcheck-error">$2</span>');
			}
		};
		editorDiv.innerHTML = newInnerHTML;
	}
	//setElementPosition();
	getElements();
	/*var children;
	for (var i = 0; i < errors.length; i++) {
		if(!errors[i].ignored) {
			children = getTextNodes(editorDiv);
			for(var j = 0; j < children.length; j++) {
				//newChildren = markError(children[j], i);
				//children[j] = newChildren[1];
				//children.splice(j, 0, newChildren[0]);
				
				//console.log(children[j]);
				//console.log(children[j].innerHTML.match(new RegExp('(^|[^a-zčćžšđA-ZČĆŽŠĐ])('+errors[i].suspicious+')(?=^|[^a-zčćžšđA-ZČĆŽŠĐ])', 'g')));
			}
			//newInnerHTML = newInnerHTML.replace(new RegExp('(^|[^a-zčćžšđA-ZČĆŽŠĐ])('+errors[i].suspicious+')(?=^|[^a-zčćžšđA-ZČĆŽŠĐ])', 'gi'), 
			//											'$1<span data-error-number="' + i + '" data-hovered="false" data-hover-set="false" class="hashcheck-error">$2</span>');
		}
	};
	//setElementPosition();
	getElements();*/
}

/**
*** Prepares the style of the textbox and places a background editor div.
 */
var mouseOutTimer;
var flag = false;
function prepareTextbox() {
	textbox.setAttribute('data-hashcheck', 'true');
	if(textbox.tagName != "DIV" && textbox.tagName != "BODY") {
		editorDiv = textbox.ownerDocument.createElement("div");
		editorDiv.id = 'hashcheck';
		var style = textbox.ownerDocument.defaultView.getComputedStyle(textbox, null);

		editorDiv.style.cssText = textbox.style.cssText + " font-family: " + style.getPropertyValue('font-family') + 
								"; font-size: " + style.getPropertyValue('font-size') + "; text-align: " + style.getPropertyValue('text-align') + "; line-height: " + style.getPropertyValue('line-height') + 
								"; padding: " + style.getPropertyValue('padding') + "; border: " + style.getPropertyValue('border') + 
								"; border-width: " + style.getPropertyValue('border-width') +  "; border-style: " + style.getPropertyValue('border-style') + 
								/*"; margin: " + style.getPropertyValue('margin') + */"; top: " + textbox.offsetTop + "px; left: " + textbox.offsetLeft + 
								"px; height: " + textbox.offsetHeight  + "px; width: " + textbox.offsetWidth  
								+ "px; background: " + style.getPropertyValue('background-color') + ";";
		textbox.parentNode.insertBefore(editorDiv, textbox);
	}
	//overflow: auto;
	textbox.style.cssText = textbox.style.cssText + "z-index: 1; position: relative; transition: none;     background: transparent !important;";

	/*textbox.addEventListener("keydown", function() {
		console.log(textbox.ownerDocument.getSelection().anchorNode.parentNode.tagName); 
	});*/
	/*textbox.addEventListener("keydown", function(e) {
		var node = textbox.ownerDocument.getSelection().anchorNode.parentNode;
		if(node.className.indexOf("hashcheck-error") > -1) {
			if(e.keyCode == 32) {
				var offset = textbox.ownerDocument.getSelection().anchorOffset;
				if(offset == 0) {
					node.parentNode.insertBefore(textbox.ownerDocument.createTextNode("\u00a0"), node);
					e.preventDefault();
					flag = true;
				} else if(offset == node.innerText.length) {
					var position = node.innerText.length;
					var textNode = textbox.ownerDocument.createTextNode("\u00a0");
					node.parentNode.insertBefore(textNode, node.nextSibling);
					var sel = textbox.ownerDocument.getSelection();
					var range = document.createRange();
		            range.setStart(textNode, 1);
		            range.setEnd(textNode, 1);
		            sel.removeAllRanges();
		            sel.addRange(range);
					e.preventDefault();
					flag = true;
				}
			}
		}
	});*/
	textbox.addEventListener("keypress", function(e) {
		var node = textbox.ownerDocument.getSelection().anchorNode.parentNode;
		if(node.className.indexOf("hashcheck-error") > -1) {
			var character = String.fromCharCode(e.charCode);
			if(character.match(/[^a-zčćžšđA-ZČĆŽŠĐ]/g)) {
				var offset = textbox.ownerDocument.getSelection().anchorOffset;
				var textnode;
				if(character != " ") {
					textNode = textbox.ownerDocument.createTextNode(character);
				} else {
					textNode = textbox.ownerDocument.createTextNode("\u00a0");
				}
				if(offset == 0) {
					
					node.parentNode.insertBefore(textNode, node);
					e.preventDefault();
					flag = true;
				} else if(offset == node.innerText.length) {
					var position = node.innerText.length;
					node.parentNode.insertBefore(textNode, node.nextSibling);
					var sel = textbox.ownerDocument.getSelection();
					var range = textbox.ownerDocument.createRange();
		            range.setStart(textNode, 1);
		            range.setEnd(textNode, 1);
		            sel.removeAllRanges();
		            sel.addRange(range);
					e.preventDefault();
					flag = true;
				}
			}
		}
	});
	textbox.addEventListener("input", function(e) {
		var node = textbox.ownerDocument.getSelection().anchorNode.parentNode;
		if(!flag && node.className.indexOf("hashcheck-error") > -1) {
			var position = textbox.ownerDocument.getSelection().anchorOffset;
			var textNode = textbox.ownerDocument.createTextNode(node.innerText);
			node.parentNode.insertBefore(textNode, node);
			node.parentNode.removeChild(node);
			var sel = textbox.ownerDocument.getSelection();
			var range = sel.getRangeAt(0);
            range.deleteContents();

            range.setStart(textNode, position);
            range.setEnd(textNode, position);
            sel.removeAllRanges();
            sel.addRange(range);
		}
		flag = false;
	});
	textbox.addEventListener("mousemove", checkHoverEvent);
	textbox.addEventListener("mouseout", checkHoverEvent);
	textbox.addEventListener("scroll", refreshEditorDivScroll);
}

/**
*** Refreshes the scroll value of the background editor div.
 */
function refreshEditorDivScroll() {
	if(textbox.tagName != "DIV" && textbox.tagName != "BODY") {
		editorDiv.scrollTop = textbox.scrollTop;
		editorDiv.scrollLeft = textbox.scrollLeft;
	}
}

/**
*** Refreshes the size of the background editor div.
 */
function refreshEditorDivSize() {
	if(textbox.tagName != "DIV" && textbox.tagName != "BODY") {
		editorDiv.style.width = textbox.offsetWidth + "px";
		editorDiv.style.height = textbox.offsetHeight + "px";
	}
}

function refreshEditorDivPosition() {
	if(textbox.tagName != "DIV" && textbox.tagName != "BODY") {
		editorDiv.style.top = textbox.offsetTop + "px";
		editorDiv.style.left = textbox.offsetLeft + "px";
	}

	var position = editorDiv.getBoundingClientRect();
	editorDiv.positionX = position.left;
	editorDiv.positionY = position.top;
}

/**
*** Prepares the style of the popup.
 */
var errorPopup;
function preparePopup() {
	errorPopup = textbox.ownerDocument.createElement("div");
	errorPopup.className = "hashcheck-popup";
	errorPopup.addEventListener("mouseover", function(e) {
		clearTimeout(mouseOutTimer);
	});
	errorPopup.addEventListener("mouseout", function(e) {
		clearTimeout(mouseOutTimer);
		mouseOutTimer = setTimeout(function() {
			errorPopup.style.display = "none";
			hovered.className = hovered.className.replace(/(?:^|\s)hashcheck-error-hovered-line hashcheck-error-hovered-background(?!\S)/g , '');
			hovered.setAttribute('data-hovered', 'false');
		}, 800);
	});
	var errorPopupFooter = textbox.ownerDocument.createElement("div");
	errorPopupFooter.className = "hashcheck-popup-footer";
	var span = textbox.ownerDocument.createElement("span");
	span.innerHTML = '<a href="https://hacheck.tel.fer.hr/">Ispravljeno hašekom</a>';
	errorPopupFooter.appendChild(span);
	span = textbox.ownerDocument.createElement("span");
	span.id = "hashcheck-add";
	span.innerHTML = '<a>Dodaj u rječnik</a>'
	errorPopupFooter.appendChild(span);
	span = textbox.ownerDocument.createElement("span");
	span.id = "hashcheck-ignore";
	span.innerHTML = '<a>Ignoriraj</a>'
	errorPopupFooter.appendChild(span);
	errorPopup.appendChild(errorPopupFooter);
	textbox.ownerDocument.body.parentNode.insertBefore(errorPopup, textbox.ownerDocument.body.nextSibling);
}

/**
*** Checks hover events using mouse position and element position.
 */
var hovered;
function checkHoverEvent(e) {
	refreshEditorDivSize();
	refreshEditorDivPosition();

	// TODO: hover nakon 200ms?
	for (var i = 0; i < elements.length; i++) {
		if(elements[i].getAttribute('data-error-number') < errors.length) {
			if((e.pageX - editorDiv.positionX + editorDiv.scrollLeft - textbox.ownerDocument.defaultView.pageXOffset) >= elements[i].offsetLeft
				&& (e.pageX - editorDiv.positionX + editorDiv.scrollLeft - textbox.ownerDocument.defaultView.pageXOffset) <= (elements[i].offsetLeft + elements[i].offsetWidth)
				&& (e.pageY - editorDiv.positionY + editorDiv.scrollTop - textbox.ownerDocument.defaultView.pageYOffset) >= elements[i].offsetTop
				&& (e.pageY - editorDiv.positionY + editorDiv.scrollTop - textbox.ownerDocument.defaultView.pageYOffset) <= (elements[i].offsetTop + elements[i].offsetHeight)) {
				clearTimeout(mouseOutTimer);
				if(elements[i].getAttribute('data-hovered') == 'false') {
					if(hovered) {
						hovered.setAttribute('data-hovered', 'false');
						hovered.className = hovered.className.replace(/(?:^|\s)hashcheck-error-hovered-line hashcheck-error-hovered-background(?!\S)/g , '');
					}
					
					elements[i].setAttribute('data-hovered', 'true');

					hovered = elements[i];
					hovered.className += " hashcheck-error-hovered-line hashcheck-error-hovered-background";

					refreshPopup(elements[i]);
				}
			}

			if(elements[i].getAttribute('data-hovered') == 'true') {
				if(!((e.pageX - editorDiv.positionX + editorDiv.scrollLeft - textbox.ownerDocument.defaultView.pageXOffset) >= elements[i].offsetLeft
					&& (e.pageX - editorDiv.positionX + editorDiv.scrollLeft - textbox.ownerDocument.defaultView.pageXOffset) <= (elements[i].offsetLeft + elements[i].offsetWidth)
					&& (e.pageY - editorDiv.positionY + editorDiv.scrollTop - textbox.ownerDocument.defaultView.pageYOffset) >= elements[i].offsetTop
					&& (e.pageY - editorDiv.positionY + editorDiv.scrollTop - textbox.ownerDocument.defaultView.pageYOffset) <= (elements[i].offsetTop + elements[i].offsetHeight))) {
					clearTimeout(mouseOutTimer);
					mouseOutTimer = setTimeout(function() {
						errorPopup.style.display = "none";
						if(hovered) {
							hovered.className = hovered.className.replace(/(?:^|\s)hashcheck-error-hovered-line hashcheck-error-hovered-background(?!\S)/g , '');
							hovered.setAttribute('data-hovered', 'false');
						}
					}, 800);
				}
			}
		}
	}
}

function refreshPopup(element) {
	var error = errors[element.getAttribute('data-error-number')]
	var list = textbox.ownerDocument.createElement('ul');
	var listItem;

	errorPopup.style.left = (element.offsetLeft + editorDiv.positionX - editorDiv.scrollLeft + textbox.ownerDocument.defaultView.pageXOffset) + "px";
	errorPopup.style.top = (element.offsetTop + editorDiv.positionY - editorDiv.scrollTop + textbox.ownerDocument.defaultView.pageYOffset + 13) + "px";
	if(errorPopup.children[0].tagName == "UL") {
		errorPopup.removeChild(errorPopup.children[0]);
	}
	if(error.suggestions) {
		for (var i = 0; i < error.suggestions.length; i++) {
			listItem = textbox.ownerDocument.createElement('li');
			listItem.innerHTML = '<span class="error">' + error.suspicious + '</span><span class="arrow"> → </span><span class="correction">' + error.suggestions[i] + '</span>';
			
			listItem.addEventListener('click', function (e) {
				if(e.target.tagName == "SPAN") {
					if(e.target.className == "correction") {
						hovered.outerHTML = e.target.textContent;
					} else {
						hovered.outerHTML = e.target.parentElement.children[2].textContent;
					}

					if(textbox.tagName != "DIV" && textbox.tagName != "BODY") {
						textbox.value = editorDiv.textContent;
						inputValue = textbox.value;
					} else {
						inputValue = textbox.textContent;
					}
					errorPopup.style.display = "none";
					setTimeout(function() {
						clearTimeout(mouseOutTimer);
					}, 500);
				}
			});
			list.appendChild(listItem);
		};
	} else {
		list.innerHTML = 'Nema prijedloga';
	}

	errorPopup.insertBefore(list, errorPopup.firstChild);
	textbox.ownerDocument.getElementById("hashcheck-ignore").addEventListener("click", function() {
		errors[element.getAttribute('data-error-number')].ignored = true;
		errorPopup.style.display = "none";
		getInputValue(null);
	}, true);
	errorPopup.style.display = "block";
	if(((errorPopup.clientHeight + errorPopup.offsetTop - textbox.ownerDocument.defaultView.pageYOffset - textbox.ownerDocument.defaultView.innerHeight - 50) > 0) && ((errorPopup.clientHeight + errorPopup.offsetTop - textbox.ownerDocument.defaultView.pageYOffset - textbox.ownerDocument.defaultView.innerHeight - 50) > (errorPopup.clientHeight - errorPopup.offsetTop + 16 + textbox.ownerDocument.defaultView.pageYOffset))) {
		errorPopup.style.top = (element.offsetTop + editorDiv.positionY - editorDiv.scrollTop + textbox.ownerDocument.defaultView.pageYOffset - errorPopup.clientHeight - 3) + "px";
	}
	if(textbox.ownerDocument.defaultView.innerWidth - errorPopup.offsetLeft - errorPopup.clientWidth < 0) {
		errorPopup.style.left = (errorPopup.offsetLeft + (textbox.ownerDocument.defaultView.innerWidth - errorPopup.offsetLeft - errorPopup.clientWidth)) + "px";
	}
}

var errors = new Errors();
var errorCount = 0;
function checkErrors(response) {
	console.log((new Date).getTime() - requestTime);
	var newErrors = response.responseXML.getElementsByTagName("results")[0].children;
	var errorExists = false;
	var tmpErrorCount;
	var textNodes = getTextNodes(editorDiv);
	var newTextNodes;
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
			if(textbox.tagName == "DIV" || textbox.tagName == "BODY") {
				for (var m = 0; m < textNodes.length; m++) {
					if(textNodes[m].parentNode.className.indexOf("hashcheck-error") == -1) {
						if(textNodes[m].textContent.indexOf(errors[errorCount].suspicious) > -1) {
							newTextNodes = markError(textNodes[m], errorCount);
							textNodes[m] = newTextNodes[1];
							textNodes.splice(m, 0, newTextNodes[0]);
						}
					}
				};
			} else {
				editorDiv.innerHTML = editorDiv.innerHTML.replace(new RegExp('(^|[^a-zčćžšđA-ZČĆŽŠĐ])('+errors[errorCount].suspicious+')(?=^|[^a-zčćžšđA-ZČĆŽŠĐ])', 'g'), 
														'$1<span data-error-number="' + errorCount + '" data-hovered="false" class="hashcheck-error">$2</span>');
			}
		}
		if(errorExists) {
			errorCount = tmpErrorCount;
			errorExists = false;
		} else {
			errorCount++;
		}
	}
	//setElementPosition();
	getElements();
}

/**
 * Marks the error and correctly positions the caret
 * @param  {Node} textNode   the text node containing the error
 * @param  {Integer}   errorCount index of error in errors array
 * @return {Array}   array containing two new text nodes surrounding the error
 */
function markError(textNode, errorCount) {
	var indexOfError;
	var span;
	var newTextNodes = new Array();
	var position = textbox.ownerDocument.getSelection().anchorOffset;
	var node = textbox.ownerDocument.getSelection().anchorNode;

	indexOfError = textNode.textContent.indexOf(errors[errorCount].suspicious);


	span = textbox.ownerDocument.createElement("span");
	span.setAttribute('data-error-number', errorCount);
	span.setAttribute('data-hovered', false);
	span.className = "hashcheck-error";
	span.innerText = errors[errorCount].suspicious;

	newTextNodes.push(textbox.ownerDocument.createTextNode(textNode.textContent.slice(0, indexOfError)));
	textNode.parentNode.insertBefore(newTextNodes[0], textNode);
	textNode.parentNode.insertBefore(span, textNode);
	newTextNodes.push(textbox.ownerDocument.createTextNode(textNode.textContent.slice(indexOfError + errors[errorCount].suspicious.length)));
	textNode.parentNode.insertBefore(newTextNodes[1], textNode.nextSibling);
	textNode.parentNode.removeChild(textNode);


	if(node == textNode) {
		var sel = textbox.ownerDocument.getSelection();
		var range = sel.getRangeAt(0);
	    range.deleteContents();
		if(position < indexOfError) {
		    range.setStart(newTextNodes[0], position);
		    range.setEnd(newTextNodes[0], position);
		    textbox.ownerDocument.getSelection().anchorNode = newTextNodes[0];
		} else if(position > indexOfError + errors[errorCount].suspicious.length) {
			range.setStart(newTextNodes[1], position-(indexOfError + errors[errorCount].suspicious.length));
		    range.setEnd(newTextNodes[1], position-(indexOfError + errors[errorCount].suspicious.length));
		    textbox.ownerDocument.getSelection().anchorNode = newTextNodes[1];
		} else {
		    range.setStart(span.firstChild, position-indexOfError);
		    range.setEnd(span.firstChild, position-indexOfError);
		    textbox.ownerDocument.getSelection().anchorNode = span.firstChild;
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
function getTextNodes(el) {
	var n, a=[], walk=textbox.ownerDocument.createTreeWalker(el,NodeFilter.SHOW_TEXT,null,false);
	while(n=walk.nextNode()) a.push(n);
	return a;
}

/**
 * Gets all marked errors and if needed gives a new reference for the hovered error 
 */
function getElements() {
	elements = editorDiv.getElementsByClassName("hashcheck-error");
	for (var i = 0; i < elements.length; i++) {
		if(hovered && elements[i].outerHTML == hovered.outerHTML) {
			hovered = elements[i];
		}
	};
}

/**
*** Sets the position of an element.
 
var elements = [];
function setElementPosition() {
	elements = editorDiv.getElementsByTagName("span");

	for (var k = 0; k < elements.length; k++) {
		//if(elements[k].getAttribute('data-hover-set') == 'false') {
			var position = getPosition(elements[k]);
			elements[k].positionX = position.x;
			elements[k].positionY = position.y;
			//console.log('--------------------------------');
			//console.log(position.x);
			//console.log(position.y);

			//elements[k].setAttribute('data-hover-set', 'true');
		//}
	};
}*/

/**
*** Gets the position of an element.
 
function getPosition(element) {
    var xPosition = 0;
    var yPosition = 0;
  
    while(element) {
    	//scrolltop i scrolleft?
        xPosition += (element.offsetLeft + element.clientLeft);
        yPosition += (element.offsetTop + element.clientTop);
        element = element.offsetParent;
    }

    return { x: xPosition, y: yPosition };
}*/
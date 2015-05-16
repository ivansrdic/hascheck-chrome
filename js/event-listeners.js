window.addEventListener("input", function(e) {
	if(e.target.getAttribute('type') != "password" && e.target.getAttribute('type') != "email"/* && (e.target.tagName == "TEXTAREA" || (e.target.offsetHeight > 20 && e.target.offsetWidth > 50))*/) {
		getInputValue(e.target);
	}
}, true);

//TODO: IMPROVE!!!
window.addEventListener("resize", function() {
	for(var i = 0; i < editors.length; i++)	refreshEditorDivPosition(i);
}, true);

window.addEventListener("DOMNodeInserted", function(e) {
	if(e.target.tagName == "IFRAME"){
		var IFrame = e.target;
		IFrame.addEventListener("load", function(e) {
			var loadedIFrame = e.target;
			loadedIFrame.contentWindow.document.getElementsByTagName("head")[0].innerHTML += '<link rel="stylesheet" type="text/css" href="' + chrome.extension.getURL("css/main.css") + '" />';
			try {
				loadedIFrame.contentWindow.addEventListener("input", function(e) {
					getInputValue(e.target);
				}, true);
			} catch(exception) {
				if(exception.name != "SecurityError") {
					console.log(exception);
				}
			}
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

/*
window.addEventListener("submit", function() {
	if (typeof textbox !== "undefined" && ((typeof textbox.value != "undefined" && textbox.value == "") || (typeof textbox.textContent != "undefined" && textbox.textContent == ""))) {
    	getInputValue(null);
    }
}, true);*/

window.addEventListener("mouseup", function() {
	for(var i = 0; i < editors.length; i++) {
		setTimeout(function(editorID) {
			if (typeof editors[editorID] !== "undefined" && typeof editors[editorID].textbox !== "undefined" && 
				((!editors[editorID].contentEditable && editors[editorID].textbox.value == "") || 
				 (editors[editorID].contentEditable && editors[editorID].textbox.textContent == ""))) {
		    	editors[editorID].editorDiv.innerHTML = "";
		    }
		}, 10, i);
	}
}, true);

window.addEventListener("keyup", function(e) {
	for(var i = 0; i < editors.length; i++) {
	    if (e.keyCode == 13 && typeof editors[i] !== "undefined" && typeof editors[i].textbox !== "undefined" && 
	    	((typeof editors[i].textbox.value != "undefined" && editors[i].textbox.value == "") || 
	    	 (typeof editors[i].textbox.textContent != "undefined" && editors[i].textbox.textContent == ""))) {
	    	getInputValue(e.target);
	    }
	}
}, true);
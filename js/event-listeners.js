//window.addEventListener("load", function() {
	window.addEventListener("input", function(e) {
		if(e.target.getAttribute('type') != "password" && e.target.getAttribute('type') != "email") {
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
				if(!document.contains(editors[editorID].textbox)) editors[editorID].editorDiv.style.display = "none";
				if (typeof editors[editorID] !== "undefined" && typeof editors[editorID].textbox !== "undefined" && 
					((!editors[editorID].contentEditable && (editors[editorID].textbox.value == "" || editors[editorID].textbox.value != editors[editorID].editorDiv.textContent)) || 
					 (editors[editorID].contentEditable && (editors[editorID].textbox.textContent == "")))) {
			    	editors[editorID].editorDiv.innerHTML = "";
			    }
			}, 50, i);
		}
	}, true);

	window.addEventListener("keyup", function(e) {
		for(var editorID = 0; editorID < editors.length; editorID++) {
		    if (e.keyCode == 13 && typeof editors[editorID] !== "undefined" && typeof editors[editorID].textbox !== "undefined" && 
		    	((!editors[editorID].contentEditable && (editors[editorID].textbox.value == "" || editors[editorID].textbox.value != editors[editorID].editorDiv.textContent)) || 
				 (editors[editorID].contentEditable && (editors[editorID].textbox.textContent == "")))) {
		    	getInputValue(e.target);
		    }
		}
	}, true);
//}, true);
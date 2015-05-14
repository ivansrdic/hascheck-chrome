window.addEventListener("input", function(e) {
	getInputValue(e.target);
}, true);

/*
// check if eventListener exists
var eventAdded = false;

// create an observer instance
var observer = new MutationObserver(function(mutations) {
	mutations.forEach(function(mutation) {
		if(mutation.target.childNodes) {
			var children = mutation.target.childNodes;
			for (var i = 0; i < children.length; i++) {
				if(children[i].tagName === "IFRAME") {
					if(!eventAdded) {
						children[i].contentWindow.window.addEventListener("input", function() {
							getWord("test");
						}, false);
						eventAdded = true;
					}
				}
			};
		}
	});    
});

// configuration of the observer:
var config = { childList: true, subtree: true };

// pass in the target node, as well as the observer options
observer.observe(document, config);*/
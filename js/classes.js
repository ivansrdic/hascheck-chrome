function Error(length, suspicious, suggestions) {
	this.ignored = false;
	this.length = length;
	this.suspicious = suspicious;
	this.suggestions = new Array();
}

function Errors() {
}
Errors.prototype = Array.prototype;

function Editor(textbox) {
	this.ID = null;
	this.textbox = textbox;
	this.editorDiv = null;
	this.elements = null;
	this.timeoutHandle = null;
	this.inputValue = "";
	this.newInputValue = "";
	this.contentEditable = false;
	this.currentDocument = null;
	this.mouseOutTimer = null;
	this.length = false;
	this.flag = false;
}

function Editors() {
}
Editors.prototype = Array.prototype;
var editors = new Editors();
function Error(length, suspicious, suggestions) {
	this.ignored = false;
	this.length = length;
	this.suspicious = suspicious;
	this.suggestions = suggestions;
}
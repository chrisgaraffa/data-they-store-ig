//#region Date Utilities
function igDateToJSDate(d) {
	d *= 1000; // IG just drops the milliseconds in the export file.
	return new Date(d);
}

function dateToReadableDate(d) {
	if (typeof d.getMonth !== 'function') {
		d = igDateToJSDate(d);
	}

	return Intl.DateTimeFormat(navigator.language, {
		year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric'
	}).format(d);
}
//#endregion

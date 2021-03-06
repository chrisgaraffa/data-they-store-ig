//#region File Utilities
function getFileIfExists(files, target_name) {
	const foundFiles = files.filter((file) => {
		return file.name == target_name;
	});
	if (foundFiles.length) {
		return foundFiles[0];
	} else {
		return false;
	}
}

function parseFileContentsAsJSON(file, callback) {
	const fr = new FileReader();
	fr.onload = (e) => {
		const fileContents= JSON.parse(e.target.result);
		callback(fileContents);
	};
	fr.readAsText(file);
}

async function getTypeOfFile(file) {
	//Some images downloaded as .jpg are actually .mp4 videos, for some reason.
	//Extension is .jpg but the file header starts with something like     ftypisom   isomiso2avc1mp41  .�moov
	
	const blobText = await (await fileToBlob(file)).slice(0, 100, 'text/plain').text();
	
	return (blobText.indexOf('mp4') !== -1) ? 'video' : 'photo';
}

let fileToBlob = async(file) => new Blob([new Uint8Array(await file.arrayBuffer())]);



function loadImageContentIntoElement(files, name, element) {
	const file = getFileIfExists(files, parsePathToName(name));
	if (file) {
		element.src = URL.createObjectURL(file); // Hey don't need FileReader here!
	} else { }
}

function getImageContent(name) {
	const file = getFileIfExists(files, parsePathToName(name));
	if (file) {
		return URL.createObjectURL(file);
	}
	
}

function loadVideoContentIntoElement(files, name, element) {
	const file = getFileIfExists(files, parsePathToName(name));
	if (file) {
		element.src = URL.createObjectURL(file);
	} else {
		console.log(`couldn't find ${name}`);
	}
}

function parsePathToName(file) {
	return file.split('/').pop();
}
//#endregion
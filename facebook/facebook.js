//#region Setup, etc.
const inputEl = document.getElementById('file-control');
let files;

function dev() {
	// Because I'm tired of having to click, select the directory and approve the directory access every time.
	// At least in Firefox, refreshing keeps the files selected in inputEl.
	// Run with a function from the Content Sections region: profileChanges(dev());
	// Or loadSections(dev) to load everything.
	files = Object.values(inputEl.files);
	return Object.values(files);
}

function loadSections(files) {
	// Call all the various sections.
	aboutYou(files);
	// profileChanges(files);
	// interests(files);
	// stories(files);
	// posts(files);
	// devices(files);
	// comments(files);
	// likes(files);
	// logins(files);
	// messages(files);
	// suggestions(files);
}

inputEl.addEventListener('change', function(event) {
	files = Object.values(event.target.files);
	loadSections(files);
});
//#endregion

//#region Content Sections
function aboutYou(files) {
	document.querySelector('#about-you-username span').textContent = '';
	document.querySelector('#about-you-bio span').textContent = '';

	const personal_info_file = getFileIfExists(files, 'profile_information.json');
	if (!personal_info_file) { return; }

	parseFileContentsAsJSON(personal_info_file, (contents) => {
		const profileData = contents.profile;

		//loadImageContentIntoElement(files, profileData.media_map_data['Profile Photo'].uri, document.getElementById('about-you-image'));
		//document.querySelector('#about-you-email span').textContent = profileData.Email.value;
		document.querySelector('#about-you-username span').textContent = profileData.username;
		document.querySelector('#about-you-bio span').textContent = profileData.about_me;

		const allEmails = [];
		Object.keys(profileData.emails).forEach( emailSection => {
			allEmails.push(...profileData.emails[emailSection]);
		});
		const emailsList = document.getElementById('emails-youve-used-list');
		allEmails.forEach( email => {
			const newLI = document.createElement('li');
			newLI.textContent = email;
			emailsList.appendChild(newLI);
		});

		//TODO: Need something with "previous names" and "other names" filled in


		const allRelationships = [];
		const relationshipsList = document.getElementById('relationships-list');
		allRelationships.push(profileData.relationship?.partner); //jshint ignore:line
		profileData.previous_relationships.forEach( rel => {
			allRelationships.push(rel.name);
		});
		allRelationships.forEach ( rel => {
			const newLI = document.createElement('li');
			newLI.textContent = rel;
			relationshipsList.appendChild(newLI);
		});
		
	});

	document.getElementById('about-you-section').classList.add('active');
}

//#endregion
//#region Setup, etc.
const inputEl = document.getElementById('file-control');
let files;
//TODO: See comments in file. Also, unicode parsing for text.
//TODO: Cool to have an analysis of who you mesage with the most often.

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
	profileChanges(files);
	interests(files);
	stories(files);
	posts(files);
	devices(files);
	comments(files);
	likes(files);
	logins(files);
	messages(files);
	suggestions(files);
}

inputEl.addEventListener('change', function(event) {
	files = Object.values(event.target.files);
	loadSections(files);
});
//#endregion

//#region Content Sections
function aboutYou(files) {
	document.querySelector('#about-you-email span').textContent = '';
	document.querySelector('#about-you-username span').textContent = '';
	document.querySelector('#about-you-bio span').textContent = '';
	document.querySelector('#about-you-location-location').textContent = '';


	const personal_info_file = getFileIfExists(files, 'personal_information.json');
	if (!personal_info_file) { return; }

	parseFileContentsAsJSON(personal_info_file, (contents) => {
		const profileData = contents.profile_user[0];

		loadImageContentIntoElement(files, profileData.media_map_data['Profile Photo'].uri, document.getElementById('about-you-image'));
		document.querySelector('#about-you-email span').textContent = profileData.string_map_data.Email.value;
		document.querySelector('#about-you-username span').textContent = profileData.string_map_data.Username.value;
		document.querySelector('#about-you-bio span').textContent = profileData.string_map_data.Bio.value;
	});

	const primary_location_file = getFileIfExists(files, 'account_based_in.json');
	if (!primary_location_file) { return; }

	parseFileContentsAsJSON(primary_location_file, contents => {
		const data = contents.inferred_data_primary_location[0].string_map_data['City Name'].value;
		document.getElementById('about-you-location-location').textContent = data;
	});

	document.getElementById('about-you-section').classList.add('active');
}

function profileChanges(files) {
	document.querySelectorAll('#profile-changes-list tbody tr').forEach( row => { row.remove(); });
	document.getElementById('password-change-count').textContent = '';
	document.getElementById('password-change-last-date').textContent = '';

	const profile_changes_file = getFileIfExists(files, 'profile_changes.json');
	if (!profile_changes_file) { return; }

	parseFileContentsAsJSON(profile_changes_file, (contents) => {
		const changes = contents.profile_profile_change.sort((a,b) =>{
			return a.string_map_data['Change Date'].timestamp < b.string_map_data['Change Date'].timestamp;
		});

		document.getElementById('profile-changes-count').textContent = changes.length;

		changes.forEach((_change, changeIdx) => {
			const changeType = getProfileChangeValue(changes, changeIdx);

			const newChange = document.createElement('tr');
			const newChangeType = document.createElement('td');
			newChangeType.textContent = changeType.change_name;
			newChange.appendChild(newChangeType);
			const newChangeFrom = document.createElement('td');
			if (changeType.change_name == 'Profile Photo') {
				const fromImage = document.createElement('img');
				loadImageContentIntoElement(files, changeType.change_from, fromImage);
				newChangeFrom.appendChild(fromImage);
			} else {
				newChangeFrom.textContent = changeType.change_from;
			}
			newChange.appendChild(newChangeFrom);
			const newChangeTo = document.createElement('td');
			if (changeType.change_name == 'Profile Photo') {
				const toImage = document.createElement('img');
				loadImageContentIntoElement(files, changeType.change_to, toImage);
				newChangeTo.appendChild(toImage);
			} else {
				newChangeTo.textContent = changeType.change_to;
			}
			newChange.appendChild(newChangeTo);
			const newChangeDate = document.createElement('td');
			newChangeDate.textContent = changeType.change_on;
			newChange.appendChild(newChangeDate);

			document.querySelector('#profile-changes-list tbody').appendChild(newChange);
		});
	});

	const password_changes_file = getFileIfExists(files, 'password_change_activity.json');
	if (!password_changes_file) { return; }

	parseFileContentsAsJSON(password_changes_file, contents => {
		const changes = contents.account_history_password_change_history.sort( (a,b) => {
			return a.string_map_data.Time.timestamp < b.string_map_data.Time.timestamp;
		});

		document.getElementById('password-change-count').textContent = changes.length;
		document.getElementById('password-change-last-date').textContent = dateToReadableDate(changes[0].string_map_data.Time.timestamp);
	});
	document.getElementById('profile-changes-section').classList.add('active');
}

function interests(files) {
	document.querySelectorAll('interests li').forEach( li => { li.remove(); });

	const interests_file = getFileIfExists(files, 'your_topics.json');
	if (!interests_file) { return; }

	const interestsList = document.getElementById('interests');

	parseFileContentsAsJSON(interests_file, (contents) => {
		const interests = contents.topics_your_topics.flatMap(function(interest) {
			return interest.string_map_data.Name.value;
		}).sort();

		interests.forEach(function(interest) {
			const interestLI = document.createElement('li');
			interestLI.textContent = interest;
			interestsList.appendChild(interestLI);
		});
	});

	document.getElementById('interests-section').classList.add('active');
}

function stories(files) {
	const stories_file = getFileIfExists(files, 'stories.json');
	if (!stories_file) { return; }

	document.getElementById('stories-count').textContent = '';
	document.getElementById('stories-first-date').textContent = '';
	document.querySelectorAll('#stories-content > *').forEach( el => { el.remove(); });

	parseFileContentsAsJSON(stories_file, (contents) => {
		const stories = contents.ig_stories.sort(function(a, b) {
			return a.creation_timestamp > b.creation_timestamp;
		});

		document.getElementById('stories-count').textContent = stories.length;
		document.getElementById('stories-first-date').textContent = dateToReadableDate(stories[stories.length -1].creation_timestamp);

		
		const storiesContainer = document.getElementById('stories-content');
		stories.slice(0, 20).forEach(async function(story) {
			const storyClone = getTemplate('story-content');
			storyClone.querySelector('.card-title').textContent = dateToReadableDate(story.creation_timestamp);
			storyClone.querySelector('.card-text').textContent = story.title; //TODO: unicode parsing. unescape trick didn't work.

			//TODO: For some reason this is not being loaded in order.
			const file = getFileIfExists(files, parsePathToName(story.uri));
			const typeOfFile = await getTypeOfFile(file);
			if (typeOfFile == 'video') {
				loadVideoContentIntoElement(files, story.uri, storyClone.querySelector('video'));
				storyClone.querySelector('video').setAttribute('data-filename', story.uri);
				storiesContainer.appendChild(storyClone);
			} else {
				loadImageContentIntoElement(files, story.uri, storyClone.querySelector('img'));
				storyClone.querySelector('img').setAttribute('data-filename', story.uri);
				storiesContainer.appendChild(storyClone);
			}
		});
	});

	document.getElementById('stories-section').classList.add('active');
}

function posts(files) {
	document.getElementById('posts-count').textContent = '';
	document.getElementById('posts-first-date').textContent = '';
	document.getElementById('posts-with-location-count').textContent = '';
	document.getElementById('posts-with-multiple-photos-count').textContent = '';
	document.getElementById('posts-are-photo-count').textContent = '';
	document.getElementById('posts-are-video-count').textContent = '';

	const posts_file = getFileIfExists(files, 'posts_1.json'); //TODO: does posts_1 signify there can be a posts_2, etc?
	if (!posts_file) { return; }

	parseFileContentsAsJSON(posts_file, (contents) => {
		const posts = contents.map( (post, idx) => {
			return new MediaPost(post);
		}).sort( (a, b) => {
			return a.sortableDate() < b.sortableDate();
		});

		document.getElementById('posts-count').textContent = posts.length;
		document.getElementById('posts-first-date').textContent = dateToReadableDate(posts[posts.length -1].sortableDate());

		const postsWithLocation = posts.filter(post => {
			return post.hasLocationData();
		});
		
		document.getElementById('posts-with-location-count').textContent = postsWithLocation.length;

		setUpMap(postsWithLocation);

		const postsWithMultiplePhotos = posts.filter(post => {
			return post.hasMultiplePhotos();
		});

		document.getElementById('posts-with-multiple-photos-count').textContent = postsWithMultiplePhotos.length;

		const postsWithPhotos = posts.filter(post => {
			return post.isPhoto();
		});

		document.getElementById('posts-are-photo-count').textContent = postsWithPhotos.length;

		const postsWithVideos = posts.filter(post => {
			return post.isVideo();
		});

		document.getElementById('posts-are-video-count').textContent = postsWithVideos.length;
	});

	document.getElementById('posts-section').classList.add('active');
}

function devices(files) {
	document.getElementById('devices-count').textContent = '';
	document.querySelectorAll('#devices-list li').forEach( li => li.remove() );

	const devices_file = getFileIfExists(files, 'devices.json');
	if (!devices_file) { return; }

	parseFileContentsAsJSON(devices_file, (contents) => {
		const devices = contents.devices_devices;

		document.getElementById('devices-count').textContent = devices.length;

		const deviceList = document.getElementById('devices-list');

		devices.forEach( device => {
			const deviceLI = document.createElement('li');
			const deviceDetails = parseDevice(device.string_map_data['User Agent'].value);
			const deviceLastSeen = dateToReadableDate(device.string_map_data['Last Login'].timestamp);
			deviceLI.textContent = `${deviceDetails.instagram_version} on ${deviceDetails.device} running ${deviceDetails.os_version} last seen on ${deviceLastSeen}`;
	
			deviceList.appendChild(deviceLI);
		});
	});

	document.getElementById('devices-section').classList.add('active');
}

function comments(files) {
	document.getElementById('comments-count').textContent = '';
	document.getElementById('comment-target-count').textContent = '';
	document.querySelectorAll('comment-targets li').forEach( li => li.remove() );

	const comments_file = getFileIfExists(files, 'post_comments.json');
	if (!comments_file) { return; }

	parseFileContentsAsJSON(comments_file, (contents) => {
		const comments = contents.comments_media_comments;

		document.getElementById('comments-count').textContent = comments.length;

		const uniqueTargets = [...new Set(comments.flatMap( el => {
			return el.title;
		}))].sort();

		document.getElementById('comment-target-count').textContent = uniqueTargets.length;

		const commentTargets = [];
		uniqueTargets.forEach( targetAccount => {
			commentTargets.push({
				account: targetAccount,
				count: comments.filter( comment => {
					return comment.title === targetAccount;
				}).length
			});
		});
		commentTargets.sort( (a, b) => {
			return a.count < b.count;
		});

		const commentTargetsList = document.getElementById('comment-targets');

		commentTargets.forEach( targetAccount => {
			const newLI = document.createElement('li');
			newLI.textContent = `${targetAccount.count} - ${targetAccount.account}`;
			commentTargetsList.appendChild(newLI);
		});
	});
	
	document.getElementById('comments-section').classList.add('active');
}

function likes(files) {
	document.getElementById('likes-posts-count').textContent = '';
	document.getElementById('likes-posts-target-count').textContent = '';
	document.querySelectorAll('#likes-posts-targets li').forEach( li => li.remove() );
	document.getElementById('likes-comments-count').textContent = '';
	document.getElementById('likes-comments-target-count').textContent = '';
	document.querySelectorAll('#likes-comments-targets li').forEach ( li => li.remove() );

	const liked_posts_file = getFileIfExists(files, 'liked_posts.json');
	if (!liked_posts_file) { return; }

	parseFileContentsAsJSON(liked_posts_file, (contents) => {
		const likes = contents.likes_media_likes;

		document.getElementById('likes-posts-count').textContent = likes.length;

		const uniqueTargets = [...new Set(likes.flatMap( el => {
			return el.title;
		}))].sort();

		document.getElementById('likes-posts-target-count').textContent = uniqueTargets.length;

		const likesTargets = [];
		uniqueTargets.forEach( targetAccount => {
			likesTargets.push({
				account: targetAccount,
				count: likes.filter( like => {
					return like.title === targetAccount;
				}).length
			});
		});
		likesTargets.sort( (a, b) => {
			return a.count < b.count;
		});

		const likesTargetsList = document.getElementById('likes-posts-targets');

		likesTargets.forEach( targetAccount => {
			const newLI = document.createElement('li');
			newLI.textContent = `${targetAccount.count} - ${targetAccount.account}`;
			likesTargetsList.appendChild(newLI);
		});
	});

	const liked_comments_file = getFileIfExists(files, 'liked_comments.json');
	if (!liked_comments_file) { return; }

	parseFileContentsAsJSON(liked_comments_file, (contents) => {
		const likes = contents.likes_comment_likes;

		document.getElementById('likes-comments-count').textContent = likes.length;

		const uniqueTargets = [...new Set(likes.flatMap( el => {
			return el.title;
		}))].sort();

		document.getElementById('likes-comments-target-count').textContent = uniqueTargets.length;

		const likesTargets = [];
		uniqueTargets.forEach( targetAccount => {
			likesTargets.push({
				account: targetAccount,
				count: likes.filter( like => {
					return like.title === targetAccount;
				}).length
			});
		});
		likesTargets.sort( (a, b) => {
			return a.count < b.count;
		});

		const likesTargetsList = document.getElementById('likes-comments-targets');

		likesTargets.forEach( targetAccount => {
			const newLI = document.createElement('li');
			newLI.textContent = `${targetAccount.count} - ${targetAccount.account}`;
			likesTargetsList.appendChild(newLI);
		});
	});

	document.getElementById('likes-section').classList.add('active');

}

function logins(files) {
	document.getElementById('logins-count').textContent = '';
	document.querySelectorAll('#logins-list tbody tr').forEach( tr => tr.remove() );

	const logins_file = getFileIfExists(files, 'login_activity.json');
	if (!logins_file) { return; }

	parseFileContentsAsJSON(logins_file, (contents) => {
		const logins = contents.account_history_login_history.sort( (a, b)  => {
			return a.string_map_data.Time.timestamp < b.string_map_data.Time.timestamp;
		});

		document.getElementById('logins-count').textContent = logins.length;

		const loginList = document.querySelector('#logins-list tbody');
		logins.forEach( login => {
			const loginClone = getTemplate('login-content');

			loginClone.querySelector("td:nth-child(1)").textContent = dateToReadableDate(login.string_map_data.Time.timestamp);
			loginClone.querySelector("td:nth-child(2)").textContent = login.string_map_data["IP Address"]?.value; //jshint ignore:line
			loginClone.querySelector("td:nth-child(3)").textContent = login.string_map_data["User Agent"]?.value; //jshint ignore:line

			loginList.append(loginClone);
		});
	});

	document.getElementById('logins-section').classList.add('active');

}

function suggestions(files) {
	document.getElementById('suggested-accounts-count').textContent = '';
	document.querySelectorAll('suggested-accounts-list li').forEach( li => li.remove() );

	const suggested_accounts_file = getFileIfExists(files, 'suggested_accounts_viewed.json');
	if (!suggested_accounts_file) { return; }

	parseFileContentsAsJSON(suggested_accounts_file, (contents) => {
		const accounts = contents.impressions_history_chaining_seen.sort( (a, b) => {
			return a.string_map_data.Time.timestamp < b.string_map_data.Time.timestamp;
		});

		document.getElementById('suggested-accounts-count').textContent = accounts.length;

		const accountsSuggestedList = document.getElementById('suggested-accounts-list');
		accounts.forEach( account => {
			const newLI = document.createElement('li');
			newLI.textContent = account.string_map_data.Username.value + ' on ' + dateToReadableDate(account.string_map_data.Time.timestamp);
			accountsSuggestedList.appendChild(newLI);
		});
	});

	document.getElementById('suggestions-section').classList.add('active');
}

function messages(files) {
	document.getElementById('messages-conversations-count').textContent = '';
	document.querySelectorAll('#messages-conversations-list li').forEach( li => li.remove() );

	const messageAccounts = files.filter( file => {
		return file.webkitRelativePath.indexOf("messages/inbox/") !== -1 && file.webkitRelativePath.indexOf('.json') !== -1;
	}).sort( (a, b) => {
		return a.name < b.name;
	});

	document.getElementById('messages-conversations-count').textContent = messageAccounts.length;

	const messagesConversationsList = document.getElementById('messages-conversations-list');

	messageAccounts.forEach( accountFile => {
		const pathElements = accountFile.webkitRelativePath.split('/');
		const fileName = pathElements[pathElements.length - 2];
		let accountName;
		const fileNameParts = fileName.split('_');
		if (fileName.indexOf('_') != fileName.lastIndexOf('_')) {
			fileNameParts.pop();
		}
		fileNameParts.pop();
		accountName = fileNameParts.pop();

		parseFileContentsAsJSON(accountFile, function(contents) {
			const participants = [];
			contents.participants.forEach( participant => {
				participants.push(participant.name);
			});
			accountName = participants.join(', ');
			const newLI = document.createElement('li');
			newLI.setAttribute('data-originalname', accountFile.webkitRelativePath);
			newLI.textContent = accountName;
			messagesConversationsList.append(newLI);
		});

		document.getElementById('messages-section').classList.add('active');
		
	});
}
//#endregion

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

//#region Device Utilities
function parseDevice(deviceDescription) {
	//TODO: iPads, Android, "Other"?
	const results = {};
	results.instagram_version = deviceDescription.match(/Instagram [0-9]+/);

	if (deviceDescription.lastIndexOf('iOS') !== -1) {
		if (deviceDescription.lastIndexOf('iPhone') !== -1) {
			results.device = parseIPhoneDeviceName(deviceDescription.match(/iPhone[0-9,]+/)[0]);
		}

		results.os_version = deviceDescription.match(/(iOS [^;]+)/)[1].replaceAll('_', '.');
	}
	return results;
}

function parseIPhoneDeviceName(name) {
	/* global iPhones */
	const phonePossibility = iPhones.filter( phone => {
		return phone.codes.includes(name);
	});

	if (phonePossibility.length) {
		return phonePossibility[0].name;
	} else {
		return "Unknown iPhone";
	}
}

function parseIpadDeviceName(name) {
	//TODO: Pull in from https://www.theiphonewiki.com/wiki/Models
}
//#endregion

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

//#region Profile Change Utilities
function getProfileChangeValue(changes, idx) {
	let changeDetails = {
		'change_name': undefined,
		'change_from': '',
		'change_to': undefined,
		'change_on': undefined
	};

	const change = changes[idx];

	switch (change.string_map_data.Changed.value) {
		case 'Profile Photo':
			changeDetails.change_name = 'Profile Photo';
			changeDetails.change_to = change.media_map_data?.['Profile Photo']?.uri ?? ''; //jshint ignore:line
			changeDetails.change_on = igDateToJSDate(change.string_map_data['Change Date'].timestamp);
			changeDetails.change_from = findChangeOfTypeBefore(changes, idx, change.string_map_data.Changed.value, changeDetails.change_on);
			break;
		case 'Profile Bio Link':
			changeDetails.change_name = 'Bio Link';
			changeDetails.change_to = change.string_map_data?.['Bio Link']?.value ?? ''; //jshint ignore:line
			changeDetails.change_on = igDateToJSDate(change.string_map_data['Change Date'].timestamp);
			changeDetails.change_from = findChangeOfTypeBefore(changes, idx, change.string_map_data.Changed.value, changeDetails.change_on);
			break;
		default:
			break;
	}

	return changeDetails;
}

function findChangeOfTypeBefore(changes, idx, name, before) {

	const validChanges = changes.filter((change) => {
		return change.string_map_data['Change Date'].value < before && change.string_map_data.Changed.value == name;
	});


	if (validChanges.length) {
		let returnVal;
		switch (validChanges[0].string_map_data.Changed.value) {
			case 'Profile Photo':
				returnVal = validChanges[0].media_map_data['Profile Photo'].uri;
				break;
			case 'Profile Bio Link':
				returnVal = validChanges[0].string_map_data['Bio Link'].value;
				break;
			default:
				returnVal = 'unknown';
				break;
		}
		return returnVal;
		
	} else { return 'unknown'; }
}
//#endregion

//#region Template Utilities
function getTemplate(id) {
	const template = document.getElementById(id);
	return template.content.cloneNode(true);
}
//#endregion

//#region Map Utilities
function setUpMap(posts) {
	if (typeof mapboxToken === 'undefined') {
		console.log('no token');
		document.getElementById('posts-map').classList.add('d-none');
		return;
	}

	const firstPostLocation = posts[0].getLocationData();
	const postsMap = L.map('posts-map').setView([firstPostLocation.latitude, firstPostLocation.longitude], 5);

	L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		maxZoom: 18,
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1,
		accessToken: 'pk.eyJ1IjoidGVjaGZvcnRoZXBwbCIsImEiOiJja20yNjJkeXAyaHA2Mm9uNm1seW8zMnNhIn0.k5V4zNqdgwuPe4PBujgCxw'
	}).addTo(postsMap);
	posts.forEach( post => {
		const iconURL = getImageContent(post.source.media[0].uri);
		const postLocation = post.getLocationData();

		var postIcon = L.icon({
			iconSize: [30, 30],
			iconAnchor: [20, 20],
			popupAnchor: [-3, -76],
			iconUrl: iconURL
		});
	
	
		const postMarker = L.marker([postLocation.latitude, postLocation.longitude], {icon: postIcon}).addTo(postsMap);
		const previewElement = document.createElement('div');
		const previewImg = document.createElement('img');
		previewImg.src = iconURL;
		previewImg.classList.add('post-preview-image-in-map');
		previewElement.appendChild(previewImg);
		previewElement.appendChild(document.createTextNode(post.source.media[0].title));
		previewElement.appendChild(document.createElement('br'));
		previewElement.appendChild(document.createTextNode(dateToReadableDate(post.sortableDate())));
		postMarker.bindPopup(previewElement);
	});
}
//#endregion

//#region Classes
// Some variations in the structure of the JSON make it difficult to parse cleanly.
// So classes help with that.
class MediaPost {
	constructor(postObj) {
		this.source = postObj;
	}

	sortableDate() {
		const returnValue = this.source.creation_timestamp ? this.source.creation_timestamp : this.source.media[0].creation_timestamp; // jshint ignore:line
		return returnValue;
	}

	hasLocationData() {
		const hasPhotoLocation = this.source.media[0].media_metadata?.photo_metadata?.latitude ?? false; // jshint ignore:line
		const hasVideoLocation = this.source.media[0].media_metadata?.video_metadata?.latitude ?? false; // jshint ignore:line

		return hasPhotoLocation || hasVideoLocation;
	}

	getLocationData() {
		if (this.isPhoto()) {
			return this.source.media[0].media_metadata.photo_metadata;
		} else if (this.isVideo()) {
			return this.source.media[0].media_metadata.video_metadata;
		}
	}

	hasMultiplePhotos() {
		return this.source.media.length > 1;
	}

	isVideo() {
		return this.source.media[0].uri.indexOf('.jpg') === -1;
	}

	isPhoto() {
		return this.source.media[0].uri.indexOf('.jpg') !== -1;
	}
}
//#endregion

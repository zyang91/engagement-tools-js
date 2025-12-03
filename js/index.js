import { initBoundaryMap } from './map.js';
import { setupIntroFlow } from './intro-page.js';

document.addEventListener('DOMContentLoaded', () => {
	let mapStarted = false;

	const launchMap = async () => {
		if (mapStarted) {
			return;
		}
		mapStarted = true;
		try {
			await initBoundaryMap();
		} catch (error) {
			console.error('Unable to render the engagement map.', error);
		}
	};

	setupIntroFlow({ onConsent: launchMap });
});

import { initBoundaryMap } from './map.js';
import { setupIntroFlow } from './intro-page.js';
import { setupFeedbackInteraction } from './interactive.js';

document.addEventListener('DOMContentLoaded', () => {
	let mapStarted = false;

	const launchMap = async () => {
		if (mapStarted) {
			return;
		}
		mapStarted = true;
                try {
                        const map = await initBoundaryMap();
                        setupFeedbackInteraction(map);
                } catch (error) {
                        console.error('Unable to render the engagement map.', error);
                }
        };

	setupIntroFlow({ onConsent: launchMap });
});

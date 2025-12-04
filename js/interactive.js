/* global mapboxgl */
/**
 * Wire up map clicks to reveal and populate the feedback form.
 * @param {mapboxgl.Map} map
 */
export function setupFeedbackInteraction(map) {
        if (!map) {
                console.warn('Feedback interaction requires a valid map instance.');
                return;
        }

        const formElements = queryFormElements();
        if (!formElements) {
                console.warn('Feedback form elements are missing from the page.');
                return;
        }

        const { feedbackPanel, locationLabel, locationInput, form, status, resetButton } = formElements;
        const defaultLocationLabel = locationLabel.textContent;
        let activeMarker = null;
        let lastLocation = null;

        map.getCanvas().style.cursor = 'crosshair';

        map.on('click', (event) => {
                lastLocation = event.lngLat;
                updateMarker(map, lastLocation, activeMarker, (marker) => {
                        activeMarker = marker;
                });
                revealForm(feedbackPanel);
                setLocationLabel(locationLabel, locationInput, lastLocation);
                status.textContent = '';
        });

        form.addEventListener('submit', (event) => {
                event.preventDefault();
                if (!lastLocation) {
                        status.textContent = 'Click the map to choose a location before submitting.';
                        return;
                }

                const formData = new FormData(form);
                const category = formData.get('feedbackType');
                form.reset();
                locationInput.value = `${lastLocation.lng.toFixed(5)}, ${lastLocation.lat.toFixed(5)}`;
                setLocationLabel(locationLabel, locationInput, lastLocation);
                status.textContent = `Thanks for sharing your ${category || 'feedback'}!`;
        });

        resetButton.addEventListener('click', () => {
                form.reset();
                locationInput.value = '';
                locationLabel.textContent = defaultLocationLabel;
                lastLocation = null;
                status.textContent = '';
                feedbackPanel.classList.add('is-hidden');
                if (activeMarker) {
                        activeMarker.remove();
                        activeMarker = null;
                }
        });
}

function queryFormElements() {
        const feedbackPanel = document.querySelector('#feedback-panel');
        const locationLabel = document.querySelector('#selected-location');
        const locationInput = document.querySelector('#location-coordinates');
        const form = document.querySelector('#feedback-form');
        const status = document.querySelector('#feedback-status');
        const resetButton = document.querySelector('#reset-feedback');

        if (!feedbackPanel || !locationLabel || !locationInput || !form || !status || !resetButton) {
                        return null;
        }

        return { feedbackPanel, locationLabel, locationInput, form, status, resetButton };
}

function updateMarker(mapInstance, position, existingMarker, onUpdate) {
        if (existingMarker) {
                existingMarker.remove();
        }
        const marker = new mapboxgl.Marker({ color: '#900' })
                .setLngLat(position)
                .addTo(mapInstance);
        onUpdate(marker);
}

function revealForm(panel) {
        if (panel.classList.contains('is-hidden')) {
                panel.classList.remove('is-hidden');
        }
}

function setLocationLabel(labelEl, hiddenInput, lngLat) {
        const lng = lngLat.lng.toFixed(5);
        const lat = lngLat.lat.toFixed(5);
        labelEl.textContent = `Selected location: ${lng}, ${lat}`;
        hiddenInput.value = `${lng}, ${lat}`;
}

const MAPBOX_PUBLIC_TOKEN = 'pk.eyJ1IjoiemhhbmNoYW8iLCJhIjoiY21nYm1mOGNpMTlycTJtb2xuczUwdjY1aCJ9.KRjlJ3Siuf2p0OKSsngcGw';

const DEFAULT_VIEW = {
	center: [-75.1932, 39.9523],
	zoom: 12.75,
	style: 'mapbox://styles/mapbox/light-v11'
};

const BOUNDARY_SOURCE_ID = 'university-city-boundary';
const BOUNDARY_FILL_ID = 'university-city-fill';
const BOUNDARY_LINE_ID = 'university-city-outline';

/**
 * Initialize the University City boundary map using Mapbox GL JS.
 * @param {Object} [options]
 * @param {string} [options.containerId='map'] DOM id for the map container
 * @param {string} [options.geojsonUrl='data/university_city.geojson'] Boundary GeoJSON path
 * @param {Object} [options.view] Optional map view overrides (center, zoom, style)
 * @returns {Promise<mapboxgl.Map>} resolves with the instantiated map
 */
export async function initBoundaryMap({
	containerId = 'map',
	geojsonUrl = 'data/university_city.geojson',
	view = {}
} = {}) {
	const mapbox = window.mapboxgl;
	if (!mapbox) {
		throw new Error('Mapbox GL JS is not available. Ensure the CDN script is loaded before index.js.');
	}

	mapbox.accessToken = MAPBOX_PUBLIC_TOKEN;

	const map = new mapbox.Map({
		container: containerId,
		style: view.style ?? DEFAULT_VIEW.style,
		center: view.center ?? DEFAULT_VIEW.center,
		zoom: view.zoom ?? DEFAULT_VIEW.zoom,
		attributionControl: true
	});

	try {
		const boundaryData = await fetchGeojson(geojsonUrl);
		await onceMapLoaded(map);
		addBoundaryLayer(map, boundaryData);
		await onceMapIdle(map);
		fitMapToBoundary(map, boundaryData, mapbox);
	} catch (error) {
		console.error('Failed to initialize the University City boundary map.', error);
		throw error;
	}

	return map;
}

async function fetchGeojson(url) {
	const response = await fetch(url, { cache: 'reload' });
	if (!response.ok) {
		throw new Error(`Unable to load boundary GeoJSON from ${url}`);
	}
	return response.json();
}

function onceMapLoaded(mapInstance) {
	return new Promise((resolve) => {
		if (mapInstance.loaded()) {
			resolve();
			return;
		}
		mapInstance.on('load', () => resolve());
	});
}

function onceMapIdle(mapInstance) {
	return new Promise((resolve) => {
		if (mapInstance.isStyleLoaded()) {
			resolve();
			return;
		}
		mapInstance.once('idle', () => resolve());
	});
}

function addBoundaryLayer(mapInstance, data) {
	const sourceExists = mapInstance.getSource(BOUNDARY_SOURCE_ID);
	if (!sourceExists) {
		mapInstance.addSource(BOUNDARY_SOURCE_ID, {
			type: 'geojson',
			data
		});
	} else {
		sourceExists.setData(data);
	}

	if (!mapInstance.getLayer(BOUNDARY_FILL_ID)) {
		mapInstance.addLayer({
			id: BOUNDARY_FILL_ID,
			type: 'fill',
			source: BOUNDARY_SOURCE_ID,
			paint: {
				'fill-color': '#900',
				'fill-opacity': 0.12
			}
		});
	}

	if (!mapInstance.getLayer(BOUNDARY_LINE_ID)) {
		mapInstance.addLayer({
			id: BOUNDARY_LINE_ID,
			type: 'line',
			source: BOUNDARY_SOURCE_ID,
			paint: {
				'line-color': '#011F5B',
				'line-width': 3
			}
		});
	}
}

function fitMapToBoundary(mapInstance, data, mapboxLib) {
	const bounds = data.features.reduce((acc, feature) => {
		const coordinates = feature.geometry.type === 'MultiPolygon'
			? feature.geometry.coordinates.flat(2)
			: feature.geometry.coordinates.flat();
		coordinates.forEach(([lng, lat]) => acc.extend([lng, lat]));
		return acc;
	}, new mapboxLib.LngLatBounds());

	if (!bounds.isEmpty()) {
		mapInstance.fitBounds(bounds, {
			padding: { top: 80, bottom: 60, left: 60, right: 60 },
			duration: 0,
			maxZoom: 15
		});
	}
}

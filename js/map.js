const MAPBOX_PUBLIC_TOKEN = 'pk.eyJ1IjoiemhhbmNoYW8iLCJhIjoiY21nYm1mOGNpMTlycTJtb2xuczUwdjY1aCJ9.KRjlJ3Siuf2p0OKSsngcGw';

const DEFAULT_VIEW = {
	center: [-75.1932, 39.9523],
	zoom: 12.75,
	style: 'mapbox://styles/mapbox/light-v11'
};

const BOUNDARY_SOURCE_ID = 'university-city-boundary';
const BOUNDARY_FILL_ID = 'university-city-fill';
const BOUNDARY_LINE_ID = 'university-city-outline';

const BUILDINGS_SOURCE_ID = 'penn-buildings';
const BUILDINGS_FILL_ID = 'penn-buildings-fill';
const BUILDINGS_LINE_ID = 'penn-buildings-outline';

/**
 * Initialize the University City boundary map using Mapbox GL JS.
 * @param {Object} [options]
 * @param {string} [options.containerId='map'] DOM id for the map container
 * @param {string} [options.geojsonUrl='data/university_city.geojson'] Boundary GeoJSON path
 * @param {string} [options.buildingsUrl='data/penn-building.geojson'] Buildings GeoJSON path
 * @param {Object} [options.view] Optional map view overrides (center, zoom, style)
 * @returns {Promise<mapboxgl.Map>} resolves with the instantiated map
 */
export async function initBoundaryMap({
	containerId = 'map',
	geojsonUrl = 'data/university_city.geojson',
	buildingsUrl = 'data/penn-building.geojson',
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
		const buildingsData = await fetchGeojson(buildingsUrl);
		await onceMapLoaded(map);
		addBoundaryLayer(map, boundaryData);
		addBuildingsLayer(map, buildingsData);
		setupBuildingTooltips(map);
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
				'fill-opacity': 0
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

function addBuildingsLayer(mapInstance, data) {
	const sourceExists = mapInstance.getSource(BUILDINGS_SOURCE_ID);
	if (!sourceExists) {
		mapInstance.addSource(BUILDINGS_SOURCE_ID, {
			type: 'geojson',
			data
		});
	} else {
		sourceExists.setData(data);
	}

	if (!mapInstance.getLayer(BUILDINGS_FILL_ID)) {
		mapInstance.addLayer({
			id: BUILDINGS_FILL_ID,
			type: 'fill',
			source: BUILDINGS_SOURCE_ID,
			paint: {
				'fill-color': '#990000',
				'fill-opacity': 0.6
			}
		});
	}

	if (!mapInstance.getLayer(BUILDINGS_LINE_ID)) {
		mapInstance.addLayer({
			id: BUILDINGS_LINE_ID,
			type: 'line',
			source: BUILDINGS_SOURCE_ID,
			paint: {
				'line-color': '#660000',
				'line-width': 1.5
			}
		});
	}
}

function setupBuildingTooltips(mapInstance) {
	const popup = new window.mapboxgl.Popup({
		closeButton: false,
		closeOnClick: false,
		offset: 15
	});

	mapInstance.on('mousemove', BUILDINGS_FILL_ID, (e) => {
		mapInstance.getCanvas().style.cursor = 'pointer';
		
		const coordinates = e.lngLat;
		const properties = e.features[0].properties;
		const buildingName = properties.building_name || 'Unknown Building';
		const address = properties.address || 'No address available';
		
		const html = `
			<div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.5;">
				<strong style="display: block; margin-bottom: 4px;">Building Name:</strong>
				<div style="margin-bottom: 8px;">${buildingName}</div>
				<strong style="display: block; margin-bottom: 4px;">Address:</strong>
				<div>${address}</div>
			</div>
		`;
		
		popup.setLngLat(coordinates).setHTML(html).addTo(mapInstance);
	});

	mapInstance.on('mouseleave', BUILDINGS_FILL_ID, () => {
		mapInstance.getCanvas().style.cursor = '';
		popup.remove();
	});
}

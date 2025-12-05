import { Backend } from './backend.js';

const MAPBOX_PUBLIC_TOKEN = 'pk.eyJ1IjoiemhhbmNoYW8iLCJhIjoiY21nYm1mOGNpMTlycTJtb2xuczUwdjY1aCJ9.KRjlJ3Siuf2p0OKSsngcGw';

const DEFAULT_VIEW = {
  center: [-75.1932, 39.9523],
  zoom: 12.75,
  style: 'mapbox://styles/mapbox/light-v11',
};

const BOUNDARY_SOURCE_ID = 'university-city-boundary';
const BOUNDARY_FILL_ID = 'university-city-fill';
const BOUNDARY_LINE_ID = 'university-city-outline';

const BUILDINGS_SOURCE_ID = 'penn-buildings';
const BUILDINGS_FILL_ID = 'penn-buildings-fill';
const BUILDINGS_LINE_ID = 'penn-buildings-outline';

const FEEDBACK_COLORS = {
  issue: '#e74c3c',
  safety: '#e67e22',
  accessibility: '#8e44ad',
  kudos: '#27ae60',
  idea: '#2980b9',
  default: '#34495e',
};

/**
 * Initialize the University City boundary map using Mapbox GL JS.
 * @param {Object} [options]
 * @param {string} [options.containerId='map'] DOM id for the map container
 * @param {string} [options.geojsonUrl='data/university_city.geojson'] Boundary GeoJSON path
 * @param {string} [options.buildingsUrl='data/penn-building.geojson'] Buildings GeoJSON path
 * @param {Object} [options.view] Optional map view overrides (center, zoom, style)
 * @return {Promise<mapboxgl.Map>} resolves with the instantiated map
 */
export async function initBoundaryMap({
  containerId = 'map',
  geojsonUrl = 'data/university_city.geojson',
  buildingsUrl = 'data/penn-building.geojson',
  view = {},
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
    attributionControl: true,
  });

  try {
    const boundaryData = await fetchGeojson(geojsonUrl);
    const buildingsData = await fetchGeojson(buildingsUrl);
    await onceMapLoaded(map);
    addBoundaryLayer(map, boundaryData);
    addBuildingsLayer(map, buildingsData);
    setupBuildingTooltips(map);
    addMapLegend(map);
    await onceMapIdle(map);
    fitMapToBoundary(map, boundaryData, mapbox);

    // Load existing feedback from Firestore and display as markers
    const feedbackList = await Backend.getFeedback();
    addFeedbackMarkers(map, feedbackList);
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
      data,
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
        'fill-opacity': 0,
      },
    });
  }

  if (!mapInstance.getLayer(BOUNDARY_LINE_ID)) {
    mapInstance.addLayer({
      id: BOUNDARY_LINE_ID,
      type: 'line',
      source: BOUNDARY_SOURCE_ID,
      paint: {
        'line-color': '#011F5B',
        'line-width': 3,
      },
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
      maxZoom: 15,
    });
  }
}

function addBuildingsLayer(mapInstance, data) {
  const sourceExists = mapInstance.getSource(BUILDINGS_SOURCE_ID);
  if (!sourceExists) {
    mapInstance.addSource(BUILDINGS_SOURCE_ID, {
      type: 'geojson',
      data,
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
        'fill-opacity': 0.6,
      },
    });
  }

  if (!mapInstance.getLayer(BUILDINGS_LINE_ID)) {
    mapInstance.addLayer({
      id: BUILDINGS_LINE_ID,
      type: 'line',
      source: BUILDINGS_SOURCE_ID,
      paint: {
        'line-color': '#660000',
        'line-width': 1.5,
      },
    });
  }
}

function setupBuildingTooltips(mapInstance) {
  const popup = new window.mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false,
    offset: 15,
  });

  mapInstance.on('mousemove', BUILDINGS_FILL_ID, (e) => {
    mapInstance.getCanvas().style.cursor = 'pointer';

    const coordinates = e.lngLat;
    const properties = e.features[0].properties;
    const buildingName = properties.building_name || 'Unknown Building';
    const address = properties.address || 'No address available';

    const html = `
      <div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.5; color: #000;">
        <strong style="display: block; margin-bottom: 4px; color: #000;">Building Name:</strong>
        <div style="margin-bottom: 8px; color: #000;">${buildingName}</div>
        <strong style="display: block; margin-bottom: 4px; color: #000;">Address:</strong>
        <div style="color: #000;">${address}</div>
      </div>
    `;

    popup.setLngLat(coordinates).setHTML(html).addTo(mapInstance);
  });

  mapInstance.on('mouseleave', BUILDINGS_FILL_ID, () => {
    mapInstance.getCanvas().style.cursor = '';
    popup.remove();
  });
}

function addMapLegend(mapInstance) {
  const legend = document.createElement('div');
  legend.className = 'map-legend';
  legend.style.cssText = `
    position: absolute;
    bottom: 30px;
    right: 10px;
    background: white;
    padding: 12px 16px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    line-height: 1.6;
    z-index: 1;
  `;

  legend.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px; color: #333;">Map Legend</div>
    <div style="display: flex; align-items: center; margin-bottom: 6px;">
      <div style="width: 20px; height: 14px; background: #990000; opacity: 0.6; margin-right: 8px; border: 1px solid #660000;"></div>
      <span style="color: #333;">UPenn Buildings</span>
    </div>
    <div style="display: flex; align-items: center; margin-bottom: 6px;">
      <div style="width: 20px; height: 14px; background: transparent; margin-right: 8px; border: 3px solid #011F5B;"></div>
      <span style="color: #333;">University City District</span>
    </div>
    <div style="margin-top: 6px; border-top: 1px solid #ddd; padding-top: 6px; font-size: 12px; color: #333;">
      <div style="margin-bottom: 4px; font-weight: 600;">Feedback points</div>
      <div style="display: flex; align-items: center; margin-bottom: 3px;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${FEEDBACK_COLORS.issue}; margin-right: 6px;"></div>
        <span>Issue</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 3px;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${FEEDBACK_COLORS.safety}; margin-right: 6px;"></div>
        <span>Safety</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 3px;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${FEEDBACK_COLORS.accessibility}; margin-right: 6px;"></div>
        <span>Accessibility</span>
      </div>
      <div style="display: flex; align-items: center; margin-bottom: 3px;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${FEEDBACK_COLORS.kudos}; margin-right: 6px;"></div>
        <span>Kudos</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${FEEDBACK_COLORS.idea}; margin-right: 6px;"></div>
        <span>Idea</span>
      </div>
    </div>
  `;

  mapInstance.getContainer().appendChild(legend);
}

function addFeedbackMarkers(mapInstance, feedbackList) {
  if (!Array.isArray(feedbackList)) return;

  feedbackList.forEach((fb) => {
    if (!fb.locationCoordinates) return;

    const parts = fb.locationCoordinates.split(',').map((s) => s.trim());
    if (parts.length !== 2) return;

    const lng = Number(parts[0]);
    const lat = Number(parts[1]);
    if (Number.isNaN(lng) || Number.isNaN(lat)) return;

    const color = FEEDBACK_COLORS[fb.feedbackType] || FEEDBACK_COLORS.default;

    const el = document.createElement('div');
    el.style.width = '14px';
    el.style.height = '14px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = color;
    el.style.border = '2px solid white';
    el.style.boxShadow = '0 0 4px rgba(0,0,0,0.4)';
    el.style.cursor = 'pointer';

    const marker = new window.mapboxgl.Marker(el).setLngLat([lng, lat]);

    const popupHtml = `
      <div style="font-family: 'Inter', sans-serif; font-size: 13px; line-height: 1.5; color: #000; max-width: 240px;">
        <div style="font-weight: 600; margin-bottom: 4px;">
          ${fb.feedbackType ? fb.feedbackType.charAt(0).toUpperCase() + fb.feedbackType.slice(1) : 'Feedback'}
        </div>
        <div style="margin-bottom: 6px;">${fb.feedbackText || 'No description provided.'}</div>
        ${fb.contactName ? `<div style="font-size: 12px; color: #555;">From: ${fb.contactName}</div>` : ''}
      </div>
    `;

    const popup = new window.mapboxgl.Popup({ offset: 16 }).setHTML(popupHtml);

    marker.setPopup(popup).addTo(mapInstance);
  });
}

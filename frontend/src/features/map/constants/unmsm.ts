export const UNMSM = {
  center: {
    latitude: -12.0565,
    longitude: -77.0827,
  },
  bounds: {
    ne: { latitude: -12.0490, longitude: -77.0750 },
    sw: { latitude: -12.0640, longitude: -77.0900 },
  },
  camera: {
    zoomLevel: 16,
    pitch: 60, // Aumentado a 60 para mejor efecto 3D
    heading: 0,
  },
} as const;

export const UNMSM_POIS = {
  type: 'FeatureCollection',
  features: [
    // Facultades
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.0825, -12.0555] }, properties: { id: '1', nombre: 'Facultad de Sistemas (FISI)', categoria: 'Facultades' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.0850, -12.0570] }, properties: { id: '2', nombre: 'Facultad de Letras', categoria: 'Facultades' } },
    // Cafeterías
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.0835, -12.0560] }, properties: { id: '3', nombre: 'Comedor Universitario', categoria: 'Cafeterías' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [-77.0810, -12.0545] }, properties: { id: '4', nombre: 'Cafetería Letras', categoria: 'Cafeterías' } },
  ]
};
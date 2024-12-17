const config = {
    routingApi: 'https://8d4f-222-252-22-160.ngrok-free.app/',
    geocodingApi: 'https://ebb9-222-252-22-160.ngrok-free.app/',
    defaultTiles: 'OpenStreetMap',
    keys: {
        graphhopper: 'bfb9d728-3732-4542-9e92-f638ac1c9f3a',
        maptiler: 'missing_api_key',
        omniscale: 'missing_api_key',
        thunderforest: 'missing_api_key',
        kurviger: 'missing_api_key',
    },
    routingGraphLayerAllowed: false,
    request: {
        details: ['road_class', 'road_environment', 'max_speed', 'average_speed'],
    },
    poiApi: 'https://tmdt.fimo.edu.vn/',
}
if (module) module.exports = config

const fs = require('fs')
const path = require('path')
const localConfig = `
const config = {
    routingApi: 'https://tmdt.fimo.edu.vn/',
    geocodingApi: 'https://tmdt.fimo.edu.vn/',
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
        details: [
            'road_class',
            'road_environment',
            'road_access',
            'surface',
            'max_speed',
            'average_speed',
            'toll',
            'track_type',
            'country',
        ],
    },
    poiApi: 'http://localhost:3002/',
}
if (module) module.exports = config
`
const filePath = path.resolve(__dirname, 'config-local.js')
if (!fs.existsSync(filePath)) {
    fs.writeFile(filePath, localConfig, err => {
        if (err) {
            console.error('Error writing default local config file:', err)
        } else {
            console.log('Default local config file written successfully')
        }
    })
} else {
    console.log('Local config file already exists:', filePath)
}

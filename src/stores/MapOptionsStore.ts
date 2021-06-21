import Store from '@/stores/Store'
import { Action } from '@/stores/Dispatcher'
import { MapIsLoaded, SelectMapStyle } from '@/actions/Actions'

const osApiKey = 'mapsgraph-bf48cc0b'
const mapTilerKey = '?key=wYonyRi2hNgJVH2qgs81'
const thunderforestApiKey = '?apikey=95b7c76e19c04e36ab9756f2cdf15b32'
const kurvigerApiKey = '?key=b582abd4-d55d-4cb1-8f34-f4254cd52aa7'
const osmAttribution =
    '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'

export interface MapOptionsStoreState {
    styleOptions: StyleOption[]
    selectedStyle: StyleOption
    isMapLoaded: boolean
}

export interface StyleOption {
    name: string
    type: 'raster' | 'vector'
    url: string[] | string
    attribution: string
    maxZoom?: number
}

export interface RasterStyle extends StyleOption {
    type: 'raster'
    url: string[]
}

export interface VectorStyle extends StyleOption {
    type: 'vector'
    url: string
}

export default class MapOptionsStore extends Store<MapOptionsStoreState> {
    protected getInitialState(): MapOptionsStoreState {
        const defaultStyle: VectorStyle = {
            name: 'MapTiler',
            type: 'vector',
            url: 'https://api.maptiler.com/maps/1f566542-c726-4cc5-8f2d-2309b90083db/style.json' + mapTilerKey,
            attribution:
                osmAttribution + ', &copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>',
        }
        return {
            selectedStyle: defaultStyle,
            styleOptions: [
                defaultStyle,
                {
                    name: 'MapTiler Satellite',
                    type: 'vector',
                    url: 'https://api.maptiler.com/maps/hybrid/style.json' + mapTilerKey,
                    attribution:
                        osmAttribution +
                        ', &copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>',
                },
                {
                    name: 'OpenStreetMap',
                    type: 'raster',
                    url: [
                        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
                    ],
                    attribution: osmAttribution,
                },
                {
                    name: 'Omniscale',
                    type: 'raster',
                    url: ['https://maps.omniscale.net/v2/' + osApiKey + '/style.default/{z}/{x}/{y}.png'],
                    attribution:
                        osmAttribution + ', &copy; <a href="https://maps.omniscale.com/" target="_blank">Omniscale</a>',
                },
                {
                    name: 'Esri Satellite',
                    type: 'raster',
                    url: [
                        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                    ],
                    attribution:
                        '&copy; <a href="http://www.esri.com/" target="_blank">Esri</a>' +
                        ' i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                    maxZoom: 18,
                },
                {
                    name: 'TF Transport',
                    type: 'raster',
                    url: [
                        'https://a.tile.thunderforest.com/transport/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                        'https://b.tile.thunderforest.com/transport/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                        'https://c.tile.thunderforest.com/transport/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                    ],
                    attribution:
                        osmAttribution +
                        ', <a href="https://www.thunderforest.com/maps/transport/" target="_blank">Thunderforest Transport</a>',
                },
                {
                    name: 'TF Cycle',
                    type: 'raster',
                    url: [
                        'https://a.tile.thunderforest.com/cycle/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                        'https://b.tile.thunderforest.com/cycle/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                        'https://c.tile.thunderforest.com/cycle/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                    ],
                    attribution:
                        osmAttribution +
                        ', <a href="https://www.thunderforest.com/maps/opencyclemap/" target="_blank">Thunderforest Cycle</a>',
                },
                {
                    name: 'TF Outdoors',
                    type: 'raster',
                    url: [
                        'https://a.tile.thunderforest.com/outdoors/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                        'https://b.tile.thunderforest.com/outdoors/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                        'https://c.tile.thunderforest.com/outdoors/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                    ],
                    attribution:
                        osmAttribution +
                        ', <a href="https://www.thunderforest.com/maps/outdoors/" target="_blank">Thunderforest Outdoors</a>',
                },
                {
                    name: 'TF Atlas',
                    type: 'raster',
                    url: [
                        'https://a.tile.thunderforest.com/atlas/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                        'https://b.tile.thunderforest.com/atlas/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                        'https://c.tile.thunderforest.com/atlas/{z}/{x}/{y}@2x.png' + thunderforestApiKey,
                    ],
                    attribution:
                        osmAttribution +
                        ', <a href="https://thunderforest.com/maps/atlas/" target="_blank">Thunderforest Atlas</a>',
                },
                {
                    name: 'Kurviger Liberty',
                    type: 'raster',
                    url: [
                        'https://a-tiles.mapilion.com/raster/styles/kurviger-liberty/{z}/{x}/{y}@2x.png' +
                            kurvigerApiKey,
                        'https://b-tiles.mapilion.com/raster/styles/kurviger-liberty/{z}/{x}/{y}@2x.png' +
                            kurvigerApiKey,
                        'https://c-tiles.mapilion.com/raster/styles/kurviger-liberty/{z}/{x}/{y}@2x.png' +
                            kurvigerApiKey,
                        'https://d-tiles.mapilion.com/raster/styles/kurviger-liberty/{z}/{x}/{y}@2x.png' +
                            kurvigerApiKey,
                        'https://e-tiles.mapilion.com/raster/styles/kurviger-liberty/{z}/{x}/{y}@2x.png' +
                            kurvigerApiKey,
                    ],
                    attribution:
                        osmAttribution +
                        ',&copy; <a href="https://kurviger.de/" target="_blank">Kurviger</a> &copy; <a href="https://mapilion.com/attribution" target="_blank">Mapilion</a> <a href="http://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a>',
                },
                {
                    name: 'Mapilion',
                    type: 'vector',
                    url: 'https://tiles.mapilion.com/assets/osm-bright/style.json' + kurvigerApiKey,
                    attribution:
                        osmAttribution +
                        ', &copy; <a href="https://mapilion.com/attribution" target="_blank">Mapilion</a> <a href="http://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a>',
                },
                {
                    name: 'OpenStreetmap.de',
                    type: 'raster',
                    url: [
                        'https://a.tile.openstreetmap.de/{z}/{x}/{y}.png',
                        'https://b.tile.openstreetmap.de/{z}/{x}/{y}.png',
                        'https://c.tile.openstreetmap.de/{z}/{x}/{y}.png',
                    ],
                    attribution: osmAttribution,
                },
                /* The original client has this but those options yield cors errors with mapbox yields a cors error
                {
                    name: 'Lyrk',
                    type: 'raster',
                    url: ['https://tiles.lyrk.org/lr/{z}/{x}/{y}?apikey=6e8cfef737a140e2a58c8122aaa26077'],
                    attribution: osmAttribution + ', <a href="https://geodienste.lyrk.de/">Lyrk</a>',
                },
                {
                    name: 'WanderReitKarte',
                    type: 'raster',
                    url: [
                        'https://topo.wanderreitkarte.de/topo/{z}/{x}/{y}.png',
                        'https://topo2.wanderreitkarte.de/topo/{z}/{x}/{y}.png',
                        'https://topo3.wanderreitkarte.de/topo/{z}/{x}/{y}.png',
                        'https://topo4.wanderreitkarte.de/topo/{z}/{x}/{y}.png',
                    ],
                    attribution:
                        osmAttribution + ', <a href="https://wanderreitkarte.de" target="_blank">WanderReitKarte</a>',
                },
                */
                /* this works but is extremely slow with mapbox
                {
                    name: 'Sorbian Language',
                    type: 'raster',
                    url: ['https://a.tile.openstreetmap.de/tilesbw/osmhrb/{z}/{x}/{y}.png'],
                    attribution:
                        osmAttribution + ', <a href="https://www.alberding.eu/">&copy; Alberding GmbH, CC-BY-SA</a>',
                },*/
            ],
            isMapLoaded: false,
        }
    }

    reduce(state: MapOptionsStoreState, action: Action): MapOptionsStoreState {
        if (action instanceof SelectMapStyle) {
            return {
                ...state,
                selectedStyle: action.styleOption,
            }
        } else if (action instanceof MapIsLoaded) {
            return {
                ...state,
                isMapLoaded: true,
            }
        }
        return state
    }
}

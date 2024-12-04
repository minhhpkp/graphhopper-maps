import { useEffect, useState } from 'react'
import PathDetails from '@/pathDetails/PathDetails'
import styles from './App.module.css'
import {
    getApiInfoStore,
    getErrorStore,
    getMapFeatureStore,
    getMapOptionsStore,
    getPathDetailsStore,
    getPOIsStore,
    getQueryStore,
    getRouteStore,
    getSettingsStore,
} from '@/stores/Stores'
import MapComponent from '@/map/MapComponent'
import MapOptions from '@/map/MapOptions'
import MobileSidebar from '@/sidebar/MobileSidebar'
import { useMediaQuery } from 'react-responsive'
import RoutingResults from '@/sidebar/RoutingResults'
import { QueryStoreState, RequestState } from '@/stores/QueryStore'
import { RouteStoreState } from '@/stores/RouteStore'
import { MapOptionsStoreState } from '@/stores/MapOptionsStore'
import { ErrorStoreState } from '@/stores/ErrorStore'
import Search from '@/sidebar/search/Search'
import ErrorMessage from '@/sidebar/ErrorMessage'
import useBackgroundLayer from '@/layers/UseBackgroundLayer'
import useQueryPointsLayer from '@/layers/UseQueryPointsLayer'
import usePathsLayer from '@/layers/UsePathsLayer'
import ContextMenu from '@/layers/ContextMenu'
import usePathDetailsLayer from '@/layers/UsePathDetailsLayer'
import { Map } from 'ol'
import { getMap } from '@/map/map'
import CustomModelBox from '@/sidebar/CustomModelBox'
import useRoutingGraphLayer from '@/layers/UseRoutingGraphLayer'
import useUrbanDensityLayer from '@/layers/UseUrbanDensityLayer'
import useMapBorderLayer from '@/layers/UseMapBorderLayer'
import RoutingProfiles from '@/sidebar/search/routingProfiles/RoutingProfiles'
import MapPopups from '@/map/MapPopups'
import Menu from '@/sidebar/menu.svg'
import PlainButton from '@/PlainButton'
import useAreasLayer from '@/layers/UseAreasLayer'
import useExternalMVTLayer from '@/layers/UseExternalMVTLayer'
import LocationButton from '@/map/LocationButton'
import { SettingsContext } from '@/contexts/SettingsContext'
import usePOIsLayer from '@/layers/UsePOIsLayer'
import { FaUtensils, FaHospital, FaSchool, FaGasPump, FaMoneyBill, FaBus, FaLandmark } from 'react-icons/fa'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faClose, faDiamondTurnRight } from '@fortawesome/free-solid-svg-icons'
import { handlePoiSearch, ReverseGeocoder } from './sidebar/search/AddressInput'
import { AddressParseResult, POIAndQuery, POIPhrase, POIQuery } from './pois/AddressParseResult'
import { getApi } from './api/Api'
export const POPUP_CONTAINER_ID = 'popup-container'
export const SIDEBAR_CONTENT_ID = 'sidebar-content'

const queryPoint = {
    isInitialized: false,
    queryText: '',
    coordinate: {
        lat: 0,
        lng: 0,
    },
    id: 0,
    color: '#7cb342',
    type: 0,
}
class PoiSearch {
    private readonly addressParseResult: AddressParseResult
    constructor(addressParseResult: AddressParseResult) {
        this.addressParseResult = addressParseResult
    }
    search() {
        const poiSearch = new ReverseGeocoder(getApi(), queryPoint, AddressParseResult.handleGeocodingResponse)
        handlePoiSearch(poiSearch, this.addressParseResult, getMap())
    }
}
const foodSearch = new PoiSearch(
    new AddressParseResult(
        '',
        new POIQuery([
            new POIAndQuery([
                new POIPhrase('amenity', '~', 'restaurant|food_court|cafe|fast_food|pub|bar|street_vendor', false),
            ]),
        ]),
        'restaurant',
        'restaurants'
    )
)
const hospitalSearch = new PoiSearch(
    new AddressParseResult(
        '',
        new POIQuery([
            new POIAndQuery([
                new POIPhrase(
                    'amenity',
                    '~',
                    'hospital|clinic|doctors|pharmacy|dentist|nursing_home|healthcare',
                    false
                ),
            ]),
            new POIAndQuery([
                new POIPhrase('amenity', '=', 'doctors', false),
                new POIPhrase('healthcare', '=', 'doctor', false),
            ]),
        ]),
        'local_hospital',
        'hospitals'
    )
)
const educationSearch = new PoiSearch(
    new AddressParseResult(
        '',
        new POIQuery([
            new POIAndQuery([new POIPhrase('amenity', '~', 'school|college|university|kindergarten|library', false)]),
        ]),
        'school',
        'education'
    )
)
const gasStationSearch = new PoiSearch(
    new AddressParseResult(
        '',
        new POIQuery([new POIAndQuery([new POIPhrase('amenity', '=', 'fuel', false)])]),
        'local_gas_station',
        'gas stations'
    )
)
const atmSearch = new PoiSearch(
    new AddressParseResult(
        '',
        new POIQuery([
            new POIAndQuery([new POIPhrase('amenity', '=', 'atm', false)]),
            new POIAndQuery([new POIPhrase('amenity', '=', 'bank', false)]),
        ]),
        'local_atm',
        'atm'
    )
)
const publicTransitSearch = new PoiSearch(
    new AddressParseResult(
        '',
        new POIQuery([
            new POIAndQuery([
                new POIPhrase('aeroway', '=', 'aerodrome', false),
                new POIPhrase('landuse', '!=', 'military', false),
                new POIPhrase('military', '!~', '.*', false),
            ]),
            new POIAndQuery([new POIPhrase('highway', '=', 'bus_stop', false)]),
            new POIAndQuery([new POIPhrase('railway', '~', 'halt|station|subway_station', false)]),
            new POIAndQuery([new POIPhrase('amenity', '~', 'bus_station|ferry_terminal|airport', false)]),
            new POIAndQuery([new POIPhrase('public_transport', '~', 'station|stop_position|platform', false)]),
        ]),
        'train',
        'public transit'
    )
)
const tourismSearch = new PoiSearch(
    new AddressParseResult(
        '',
        new POIQuery([new POIAndQuery([new POIPhrase('tourism', '=', '*', false)])]),
        'luggage',
        'tourism'
    )
)

export default function App() {
    const [settings, setSettings] = useState(getSettingsStore().state)
    const [query, setQuery] = useState(getQueryStore().state)
    const [info, setInfo] = useState(getApiInfoStore().state)
    const [route, setRoute] = useState(getRouteStore().state)
    const [error, setError] = useState(getErrorStore().state)
    const [mapOptions, setMapOptions] = useState(getMapOptionsStore().state)
    const [pathDetails, setPathDetails] = useState(getPathDetailsStore().state)
    const [mapFeatures, setMapFeatures] = useState(getMapFeatureStore().state)
    const [pois, setPOIs] = useState(getPOIsStore().state)

    const map = getMap()

    useEffect(() => {
        const onSettingsChanged = () => setSettings(getSettingsStore().state)
        const onQueryChanged = () => setQuery(getQueryStore().state)
        const onInfoChanged = () => setInfo(getApiInfoStore().state)
        const onRouteChanged = () => setRoute(getRouteStore().state)
        const onErrorChanged = () => setError(getErrorStore().state)
        const onMapOptionsChanged = () => setMapOptions(getMapOptionsStore().state)
        const onPathDetailsChanged = () => setPathDetails(getPathDetailsStore().state)
        const onMapFeaturesChanged = () => setMapFeatures(getMapFeatureStore().state)
        const onPOIsChanged = () => setPOIs(getPOIsStore().state)

        getSettingsStore().register(onSettingsChanged)
        getQueryStore().register(onQueryChanged)
        getApiInfoStore().register(onInfoChanged)
        getRouteStore().register(onRouteChanged)
        getErrorStore().register(onErrorChanged)
        getMapOptionsStore().register(onMapOptionsChanged)
        getPathDetailsStore().register(onPathDetailsChanged)
        getMapFeatureStore().register(onMapFeaturesChanged)
        getPOIsStore().register(onPOIsChanged)

        onQueryChanged()
        onInfoChanged()
        onRouteChanged()
        onErrorChanged()
        onMapOptionsChanged()
        onPathDetailsChanged()
        onMapFeaturesChanged()
        onPOIsChanged()

        return () => {
            getSettingsStore().register(onSettingsChanged)
            getQueryStore().deregister(onQueryChanged)
            getApiInfoStore().deregister(onInfoChanged)
            getRouteStore().deregister(onRouteChanged)
            getErrorStore().deregister(onErrorChanged)
            getMapOptionsStore().deregister(onMapOptionsChanged)
            getPathDetailsStore().deregister(onPathDetailsChanged)
            getMapFeatureStore().deregister(onMapFeaturesChanged)
            getPOIsStore().deregister(onPOIsChanged)
        }
    }, [])

    // our different map layers
    useBackgroundLayer(map, mapOptions.selectedStyle)
    useExternalMVTLayer(map, mapOptions.externalMVTEnabled)
    useMapBorderLayer(map, info.bbox)
    useAreasLayer(map, settings.drawAreasEnabled, query.customModelStr, query.customModelEnabled)
    useRoutingGraphLayer(map, mapOptions.routingGraphEnabled)
    useUrbanDensityLayer(map, mapOptions.urbanDensityEnabled)
    usePathsLayer(map, route.routingResult.paths, route.selectedPath, query.queryPoints)
    useQueryPointsLayer(map, query.queryPoints)
    usePathDetailsLayer(map, pathDetails)
    usePOIsLayer(map, pois)

    const isSmallScreen = useMediaQuery({ query: '(max-width: 44rem)' })
    return (
        <SettingsContext.Provider value={settings}>
            <div className={styles.appWrapper}>
                <div className={styles.iconRow}>
                    <button className={styles.iconButton} onClick={() => foodSearch.search()}>
                        <FaUtensils /> <span>Ăn uống</span>
                    </button>

                    <button className={styles.iconButton} onClick={() => hospitalSearch.search()}>
                        <FaHospital /> <span>Sức khỏe</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => educationSearch.search()}>
                        <FaSchool /> <span>Trường học</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => gasStationSearch.search()}>
                        <FaGasPump /> <span>Trạm xăng</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => atmSearch.search()}>
                        <FaMoneyBill /> <span>ATM</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => publicTransitSearch.search()}>
                        <FaBus /> <span>Phương tiện công cộng</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => tourismSearch.search()}>
                        <FaLandmark /> <span>Du lịch</span>
                    </button>
                </div>
                <MapPopups
                    map={map}
                    pathDetails={pathDetails}
                    mapFeatures={mapFeatures}
                    poiState={pois}
                    query={query}
                />
                <ContextMenu map={map} route={route} queryPoints={query.queryPoints} />
                {isSmallScreen ? (
                    <SmallScreenLayout
                        query={query}
                        route={route}
                        map={map}
                        mapOptions={mapOptions}
                        error={error}
                        encodedValues={info.encoded_values}
                        drawAreas={settings.drawAreasEnabled}
                    />
                ) : (
                    <LargeScreenLayout
                        query={query}
                        route={route}
                        map={map}
                        mapOptions={mapOptions}
                        error={error}
                        encodedValues={info.encoded_values}
                        drawAreas={settings.drawAreasEnabled}
                    />
                )}
            </div>
        </SettingsContext.Provider>
    )
}

interface LayoutProps {
    query: QueryStoreState
    route: RouteStoreState
    map: Map
    mapOptions: MapOptionsStoreState
    error: ErrorStoreState
    encodedValues: object[]
    drawAreas: boolean
}

function LargeScreenLayout({ query, route, map, error, mapOptions, encodedValues, drawAreas }: LayoutProps) {
    const [showSidebar, setShowSidebar] = useState(true)
    const [showCustomModelBox, setShowCustomModelBox] = useState(false)
    const [viewMode, setViewMode] = useState(0) // State for view mode

    return (
        <>
            {showSidebar ? (
                <div className={styles.sidebar}>
                    <div className={styles.sidebarContent} id={SIDEBAR_CONTENT_ID}>
                        {viewMode === 1 && (
                            <RoutingProfiles
                                routingProfiles={query.profiles}
                                selectedProfile={query.routingProfile}
                                showCustomModelBox={showCustomModelBox}
                                toggleCustomModelBox={() => setShowCustomModelBox(!showCustomModelBox)}
                                customModelBoxEnabled={query.customModelEnabled}
                            />
                        )}
                        <div className={styles.rowContainer}>
                            <PlainButton onClick={() => setShowSidebar(false)} className={styles.sidebarCloseButton}>
                                <FontAwesomeIcon icon={faBars} />
                            </PlainButton>
                            <Search points={query.queryPoints} map={map} viewMode={viewMode} />

                            <PlainButton
                                className={styles.toggleViewButton}
                                onClick={() => setViewMode(viewMode === 0 ? 1 : 0)}
                            >
                                <FontAwesomeIcon
                                    icon={viewMode === 0 ? faDiamondTurnRight : faClose}
                                    style={{ color: '#2c8ff4', fontSize: '24px', margin: '10px' }}
                                />
                            </PlainButton>
                        </div>

                        {showCustomModelBox && (
                            <CustomModelBox
                                customModelEnabled={query.customModelEnabled}
                                encodedValues={encodedValues}
                                customModelStr={query.customModelStr}
                                queryOngoing={query.currentRequest.subRequests[0]?.state === RequestState.SENT}
                                drawAreas={drawAreas}
                            />
                        )}

                        <div>{!error.isDismissed && <ErrorMessage error={error} />}</div>

                        <RoutingResults
                            info={route.routingResult.info}
                            paths={route.routingResult.paths}
                            selectedPath={route.selectedPath}
                            currentRequest={query.currentRequest}
                            profile={query.routingProfile.name}
                        />
                    </div>
                </div>
            ) : (
                <div className={styles.sidebarWhenClosed} onClick={() => setShowSidebar(true)}>
                    <PlainButton className={styles.sidebarOpenButton}>
                        <Menu />
                    </PlainButton>
                </div>
            )}
            <div className={styles.popupContainer} id={POPUP_CONTAINER_ID} />
            <div className={styles.onMapRightSide}>
                <MapOptions {...mapOptions} />
                <LocationButton queryPoints={query.queryPoints} />
            </div>
            <div className={styles.map}>
                <MapComponent map={map} />
            </div>
            <div className={styles.pathDetails}>
                <PathDetails selectedPath={route.selectedPath} />
            </div>
        </>
    )
}

function SmallScreenLayout({ query, route, map, error, mapOptions, encodedValues, drawAreas }: LayoutProps) {
    return (
        <>
            <div className={styles.smallScreenSidebar}>
                <MobileSidebar
                    query={query}
                    route={route}
                    error={error}
                    encodedValues={encodedValues}
                    drawAreas={drawAreas}
                    map={map}
                />
            </div>
            <div className={styles.smallScreenMap}>
                <MapComponent map={map} />
            </div>
            <div className={styles.smallScreenMapOptions}>
                <div className={styles.onMapRightSide}>
                    <MapOptions {...mapOptions} />
                    <LocationButton queryPoints={query.queryPoints} />
                </div>
            </div>

            <div className={styles.smallScreenRoutingResult}>
                <RoutingResults
                    info={route.routingResult.info}
                    paths={route.routingResult.paths}
                    selectedPath={route.selectedPath}
                    currentRequest={query.currentRequest}
                    profile={query.routingProfile.name}
                />
            </div>
        </>
    )
}

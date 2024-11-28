import { useEffect, useRef, useState } from 'react'
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
import PoweredBy from '@/sidebar/PoweredBy'
import { getBBoxFromCoord, QueryPoint, QueryStoreState, RequestState } from '@/stores/QueryStore'
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
import Cross from '@/sidebar/times-solid.svg'
import PlainButton from '@/PlainButton'
import useAreasLayer from '@/layers/UseAreasLayer'
import useExternalMVTLayer from '@/layers/UseExternalMVTLayer'
import LocationButton from '@/map/LocationButton'
import { SettingsContext } from '@/contexts/SettingsContext'
import usePOIsLayer from '@/layers/UsePOIsLayer'
import { FaUtensils, FaHospital, FaSchool, FaGasPump, FaMoneyBill, FaBus, FaLandmark, FaRoute } from 'react-icons/fa'
import { IoArrowRedoCircleSharp } from "react-icons/io5";
import { BACKEND_SERVER_URL } from './settings'
import Dispatcher from './stores/Dispatcher'
import { ClearRoute, InvalidatePoint, MovePoint, RemovePoint, SetBBox, SetPoint } from './actions/Actions'
import { tr } from './translation/Translation'
import { MarkerComponent } from './map/Marker'
import AddressInput from './sidebar/search/AddressInput'
import axios from 'axios';

export const POPUP_CONTAINER_ID = 'popup-container'
export const SIDEBAR_CONTENT_ID = 'sidebar-content'

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

    const fetchPoiData = async (poi_type: any) => {
        try {
            const response = await axios.get(`/api/poi`, {
                params: { poi_type: poi_type },
            });
            const data = response.data;
            console.log(data)
        } catch (error) {
            console.error("Error fetching POI data:", error);
        }
    };

    const isSmallScreen = useMediaQuery({ query: '(max-width: 44rem)' })
    return (
        <SettingsContext.Provider value={settings}>
            <div className={styles.appWrapper}>
                <div className={styles.iconRow}>
                    <button
                        className={styles.iconButton}
                        onClick={async () => {
                            await fetchPoiData("restaurant");
                        }}
                    >
                        <FaUtensils /> <span>Nhà hàng</span>
                    </button>

                    <button className={styles.iconButton} onClick={() => { fetchPoiData("hospital"); }}>
                        <FaHospital /> <span>Bệnh viện</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => { fetchPoiData("school"); }}>
                        <FaSchool /> <span>Trường học</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => { fetchPoiData("gas"); }}>
                        <FaGasPump /> <span>Trạm xăng</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => { fetchPoiData("atm"); }}>
                        <FaMoneyBill /> <span>ATM</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => { fetchPoiData("bus stop"); }}>
                        <FaBus /> <span>Phương tiện công cộng</span>
                    </button>
                    <button className={styles.iconButton} onClick={() => { fetchPoiData("tourist"); }}>
                        <FaLandmark /> <span>Điểm tham quan</span>
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
    const [showSidebar, setShowSidebar] = useState(false)
    const [showCustomModelBox, setShowCustomModelBox] = useState(false)

    const [showTargetIcons, setShowTargetIcons] = useState(true)
    const [moveStartIndex, onMoveStartSelect] = useState(-1)
    const [dropPreviewIndex, onDropPreviewSelect] = useState(-1)

    return (
        <>
            {showSidebar ? (
                <div className={styles.sidebar}>
                    <div className={styles.sidebarContent} id={SIDEBAR_CONTENT_ID}>
                        <PlainButton onClick={() => setShowSidebar(!showSidebar)} className={styles.sidebarCloseButton}>
                            <Cross />
                        </PlainButton>
                        <RoutingProfiles
                            routingProfiles={query.profiles}
                            selectedProfile={query.routingProfile}
                            showCustomModelBox={showCustomModelBox}
                            toggleCustomModelBox={() => setShowCustomModelBox(!showCustomModelBox)}
                            customModelBoxEnabled={query.customModelEnabled}
                        />
                        {showCustomModelBox && (
                            <CustomModelBox
                                customModelEnabled={query.customModelEnabled}
                                encodedValues={encodedValues}
                                customModelStr={query.customModelStr}
                                queryOngoing={query.currentRequest.subRequests[0]?.state === RequestState.SENT}
                                drawAreas={drawAreas}
                            />
                        )}
                        <Search points={query.queryPoints} map={map} />
                        <div>{!error.isDismissed && <ErrorMessage error={error} />}</div>
                        <RoutingResults
                            info={route.routingResult.info}
                            paths={route.routingResult.paths}
                            selectedPath={route.selectedPath}
                            currentRequest={query.currentRequest}
                            profile={query.routingProfile.name}
                        />
                        <div>
                            <PoweredBy />
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.sidebar}>
                    <div className={styles.sidebarContent} id={SIDEBAR_CONTENT_ID}>
                        <div className={styles.container}>
                            <PlainButton
                                onClick={() => setShowSidebar(!showSidebar)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#007bff',
                                    border: 'none',
                                    fontSize: '24px',
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    color: '#fff',
                                    cursor: 'pointer',
                                }}
                            >
                                <IoArrowRedoCircleSharp
                                    style={{
                                        fontSize: '32px', 
                                    }}
                                />
                            </PlainButton>
                        </div>
                        <div className={styles.searchBox}>
                            <SearchBox
                                key={query.queryPoints[0].id}
                                index={0}
                                points={query.queryPoints}
                                deletable={query.queryPoints.length > 2}
                                onChange={() => {
                                    Dispatcher.dispatch(new ClearRoute())
                                    Dispatcher.dispatch(new InvalidatePoint(query.queryPoints[0]))
                                }}
                                showTargetIcons={showTargetIcons}
                                moveStartIndex={moveStartIndex}
                                onMoveStartSelect={(index, showTarget) => {
                                    setShowTargetIcons(showTarget)
                                }}
                                dropPreviewIndex={dropPreviewIndex}
                                onDropPreviewSelect={onDropPreviewSelect}
                                map={map}
                            />
                        </div>
                    </div>
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

            <div className={styles.smallScreenPoweredBy}>
                <PoweredBy />
            </div>
        </>
    )
}

const SearchBox = ({
    index,
    points,
    onChange,
    deletable,
    moveStartIndex,
    showTargetIcons,
    onMoveStartSelect,
    dropPreviewIndex,
    onDropPreviewSelect,
    map,
}: {
    index: number
    points: QueryPoint[]
    deletable: boolean
    onChange: (value: string) => void
    moveStartIndex: number
    showTargetIcons: boolean
    onMoveStartSelect: (index: number, showTargetIcon: boolean) => void
    dropPreviewIndex: number
    onDropPreviewSelect: (index: number) => void
    map: Map
}) => {
    const point = points[index]

    // With this ref and tabIndex=-1 we ensure that the first 'TAB' gives the focus the first input but the marker won't be included in the TAB sequence, #194
    const myMarkerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (index == 0) myMarkerRef.current?.focus()
    }, [])

    function onClickOrDrop() {
        onDropPreviewSelect(-1)
        const newIndex = moveStartIndex < index ? index + 1 : index
        Dispatcher.dispatch(new MovePoint(points[moveStartIndex], newIndex))
        onMoveStartSelect(index, false) // temporarily hide target icons
        setTimeout(() => {
            onMoveStartSelect(-1, true)
        }, 1000)
    }

    return (
        <>
            {(moveStartIndex < 0 || moveStartIndex == index) && (
                <div
                    ref={myMarkerRef}
                    tabIndex={-1}
                    title={tr('drag_to_reorder')}
                    className={styles.markerContainer}
                    draggable
                    onDragStart={() => {
                        // do not set to dropPreview to -1 if we start dragging when already selected
                        if (moveStartIndex != index) {
                            onMoveStartSelect(index, true)
                            onDropPreviewSelect(-1)
                        }
                    }}
                    onDragEnd={() => {
                        onMoveStartSelect(-1, true)
                        onDropPreviewSelect(-1)
                    }}
                    onClick={() => {
                        if (moveStartIndex == index) {
                            onMoveStartSelect(-1, true)
                            onDropPreviewSelect(-1)
                        } else onMoveStartSelect(index, true)
                    }}
                >
                    <MarkerComponent
                        number={index > 0 && index + 1 < points.length ? '' + index : undefined}
                        cursor="ns-resize"
                        color={moveStartIndex >= 0 ? 'gray' : point.color}
                    />
                </div>
            )}
            {moveStartIndex >= 0 && moveStartIndex != index && (
                <PlainButton
                    title={tr('click to move selected input here')}
                    className={[
                        showTargetIcons ? '' : styles.hide,
                        styles.markerTarget,
                        dropPreviewIndex >= 0 && dropPreviewIndex == index ? styles.dropPreview : '',
                    ].join(' ')}
                    style={moveStartIndex > index ? { marginTop: '-2.4rem' } : { marginBottom: '-2.4rem' }}
                    onDragOver={e => {
                        e.preventDefault() // without this, the onDrop hook isn't called
                        onDropPreviewSelect(index)
                    }}
                    onDragLeave={() => onDropPreviewSelect(-1)}
                    onDrop={onClickOrDrop}
                    onClick={onClickOrDrop}
                >

                </PlainButton>
            )}

            <div className={styles.searchBoxInput}>
                <AddressInput
                    map={map}
                    moveStartIndex={moveStartIndex}
                    dropPreviewIndex={dropPreviewIndex}
                    index={index}
                    point={point}
                    points={points}
                    onCancel={() => console.log('cancel')}
                    onAddressSelected={(queryText, coordinate) => {
                        const initCount = points.filter(p => p.isInitialized).length
                        if (coordinate && initCount != points.length)
                            Dispatcher.dispatch(new SetBBox(getBBoxFromCoord(coordinate)))

                        Dispatcher.dispatch(
                            new SetPoint(
                                {
                                    ...point,
                                    isInitialized: !!coordinate,
                                    queryText: queryText,
                                    coordinate: coordinate ? coordinate : point.coordinate,
                                },
                                initCount > 0
                            )
                        )
                    }}
                    clearDragDrop={() => {
                        onMoveStartSelect(-1, true)
                        onDropPreviewSelect(-1)
                    }}
                    onChange={onChange}
                />
            </div>
            {deletable && (
                <PlainButton
                    title={tr('delete_from_route')}
                    onClick={() => {
                        Dispatcher.dispatch(new RemovePoint(point))
                        onMoveStartSelect(-1, true)
                    }}
                    className={styles.removeSearchBox}
                >

                </PlainButton>
            )}
        </>
    )
}
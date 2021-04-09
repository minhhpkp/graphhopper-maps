import React, { useEffect, useState } from 'react'
import Sidebar from '@/sidebar/Sidebar'
import styles from './App.module.css'
import { getApiInfoStore, getErrorStore, getMapOptionsStore, getQueryStore, getRouteStore } from '@/stores/Stores'
import MapComponent from '@/map/Map'
import { Bbox } from '@/api/graphhopper'
import MapOptions from '@/map/MapOptions'

export default function App() {
    const [query, setQuery] = useState(getQueryStore().state)
    const [info, setInfo] = useState(getApiInfoStore().state)
    const [route, setRoute] = useState(getRouteStore().state)
    const [error, setError] = useState(getErrorStore().state)
    const [mapOptions, setMapOptions] = useState(getMapOptionsStore().state)
    const [useInfoBbox, setUseInfoBbox] = useState(true)

    useEffect(() => {
        const onQueryChanged = () => setQuery(getQueryStore().state)
        const onInfoChanged = () => setInfo(getApiInfoStore().state)
        const onRouteChanged = () => setRoute(getRouteStore().state)
        const onErrorChanged = () => setError(getErrorStore().state)
        const onMapOptionsChanged = () => setMapOptions(getMapOptionsStore().state)

        getQueryStore().register(onQueryChanged)
        getApiInfoStore().register(onInfoChanged)
        getRouteStore().register(onRouteChanged)
        getErrorStore().register(onErrorChanged)
        getMapOptionsStore().register(onMapOptionsChanged)

        return () => {
            getQueryStore().deregister(onQueryChanged)
            getApiInfoStore().deregister(onInfoChanged)
            getRouteStore().deregister(onRouteChanged)
            getErrorStore().deregister(onErrorChanged)
            getMapOptionsStore().deregister(onMapOptionsChanged)
        }
    })

    // only use the api info's bbox until any other bounding box was chosen. Is this too messy?
    const chooseBoundingBox = function (infoBbox: Bbox, shouldUseInfoBbox: boolean, pathBbox?: Bbox) {
        if (shouldUseInfoBbox && pathBbox && pathBbox.every(num => num !== 0)) {
            setUseInfoBbox(false)
            return pathBbox
        } else if (shouldUseInfoBbox) return infoBbox
        return pathBbox || [0, 0, 0, 0]
    }

    const bbox = chooseBoundingBox(info.bbox, useInfoBbox, route.selectedPath.bbox)

    return (
        <div className={styles.appWrapper}>
            <div className={styles.map}>
                <MapComponent
                    queryPoints={query.queryPoints}
                    paths={route.routingResult.paths}
                    selectedPath={route.selectedPath}
                    bbox={bbox}
                    mapStyle={mapOptions.selectedStyle}
                />
            </div>
            <div className={styles.sidebar}>
                <div className={styles.sidebarContent}>
                    <Sidebar info={info} query={query} route={route} error={error} />
                </div>
            </div>
            <div className={styles.mapOptions}>
                <div className={styles.mapOptionsContent}>
                    <MapOptions {...mapOptions} />
                </div>
            </div>
        </div>
    )
}

import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Coordinate, getBBoxFromCoord, QueryPoint, QueryPointType } from '@/stores/QueryStore'
import { Bbox, GeocodingHit, ReverseGeocodingHit } from '@/api/graphhopper'
import Autocomplete, {
    AutocompleteItem,
    GeocodingItem,
    POIQueryItem,
    SelectCurrentLocationItem,
} from '@/sidebar/search/AddressInputAutocomplete'

import ArrowBack from './arrow_back.svg'
import Cross from '@/sidebar/times-solid-thin.svg'
import styles from './AddressInput.module.css'
import Api, { ApiImpl, getApi } from '@/api/Api'
import { tr } from '@/translation/Translation'
import { coordinateToText, hitToItem, nominatimHitToItem, textToCoordinate } from '@/Converters'
import { useMediaQuery } from 'react-responsive'
import PopUp from '@/sidebar/search/PopUp'
import PlainButton from '@/PlainButton'
import { onCurrentLocationSelected } from '@/map/MapComponent'
import { toLonLat, transformExtent } from 'ol/proj'
import { calcDist } from '@/distUtils'
import { Map } from 'ol'
import { AddressParseResult } from '@/pois/AddressParseResult'
import { getMap } from '@/map/map'

export interface AddressInputProps {
    point: QueryPoint
    points: QueryPoint[]
    onCancel: () => void
    onAddressSelected: (queryText: string, coord: Coordinate | undefined) => void
    onChange: (value: string) => void
    clearDragDrop: () => void
    moveStartIndex: number
    dropPreviewIndex: number
    index: number
    map: Map
    // Optional state prop for additional configuration
    state?: number
}

export default function AddressInput(props: AddressInputProps) {
    const [origText, setOrigText] = useState(props.point.queryText)
    const [text, setText] = useState(props.point.queryText)
    useEffect(() => setText(props.point.queryText), [props.point.queryText])

    const [hasFocus, setHasFocus] = useState(false)
    const isSmallScreen = useMediaQuery({ query: '(max-width: 44rem)' })

    const [origAutocompleteItems, setOrigAutocompleteItems] = useState<AutocompleteItem[]>([])
    const [autocompleteItems, setAutocompleteItems] = useState<AutocompleteItem[]>([])

    // get the bias point for the geocoder
    const lonlat = toLonLat(getMap().getView().getCenter()!)
    const biasCoord = { lng: lonlat[0], lat: lonlat[1] }

    // Placeholder text logic, incorporating both original implementations
    const placeholderText = props.state === 0
        ? 'Tìm kiếm vị trí trên bản đồ' // Vietnamese for "Search for a location on the map"
        : tr(
            props.point.type === QueryPointType.From
                ? 'from_hint'
                : props.point.type === QueryPointType.To
                ? 'to_hint'
                : 'via_hint'
          )

    const [geocoder] = useState(
        new Geocoder(getApi(), (query, provider, hits) => {
            const items: AutocompleteItem[] = []
            const parseResult = AddressParseResult.parse(query, true)
            if (parseResult.hasPOIs()) items.push(new POIQueryItem(parseResult))

            hits.forEach(hit => {
                const obj = hitToItem(hit)
                items.push(
                    new GeocodingItem(
                        obj.mainText,
                        obj.secondText,
                        hit.point,
                        hit.extent ? hit.extent : getBBoxFromCoord(hit.point)
                    )
                )
            })

            setOrigText(query)
            setAutocompleteItems(items)
        })
    )

    const [poiSearch] = useState(new ReverseGeocoder(getApi(), props.point, AddressParseResult.handleGeocodingResponse))

    // if item is selected we need to clear the autocompletion list
    useEffect(() => setAutocompleteItems([]), [props.point])
    
    // if no items but input is selected show current location item
    useEffect(() => {
        if (hasFocus && text.length === 0 && autocompleteItems.length === 0)
            setAutocompleteItems([new SelectCurrentLocationItem()])
    }, [autocompleteItems, hasFocus])

    function hideSuggestions() {
        geocoder.cancel()
        setOrigAutocompleteItems(autocompleteItems)
        setAutocompleteItems([])
    }

    // highlighted result of geocoding results
    const [highlightedResult, setHighlightedResult] = useState<number>(-1)
    useEffect(() => setHighlightedResult(-1), [autocompleteItems])

    // refs for input and container
    const searchInputContainer = useRef<HTMLDivElement>(null)
    const searchInput = useRef<HTMLInputElement>(null)

    const onKeypress = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Escape') {
                setHasFocus(false)
                setText(origText)
                hideSuggestions()
                return
            }

            switch (event.key) {
                case 'ArrowUp':
                case 'ArrowDown':
                    setHighlightedResult(i => {
                        if (i < 0) setText(origText)
                        const delta = event.key === 'ArrowUp' ? -1 : 1
                        const nextIndex = calculateHighlightedIndex(autocompleteItems.length, i, delta)
                        if (autocompleteItems.length > 0) {
                            if (nextIndex < 0) {
                                setText(origText)
                            } else if (nextIndex >= 0) {
                                const item = autocompleteItems[nextIndex]
                                if (item instanceof GeocodingItem) setText(item.mainText)
                                else setText(origText)
                            }
                        }
                        return nextIndex
                    })

                    event.preventDefault()
                    break
                case 'Enter':
                case 'Tab':
                    const coordinate = textToCoordinate(text)
                    if (coordinate) {
                        props.onAddressSelected(text, coordinate)
                    } else if (autocompleteItems.length > 0) {
                        const index = highlightedResult >= 0 ? highlightedResult : 0
                        const item = autocompleteItems[index]
                        if (item instanceof POIQueryItem) {
                            handlePoiSearch(poiSearch, item.result, props.map)
                            props.onAddressSelected(item.result.text(item.result.poi), undefined)
                        } else if (highlightedResult < 0) {
                            getApi()
                                .geocode(text, 'nominatim')
                                .then(result => {
                                    if (result && result.hits.length > 0) {
                                        const hit: GeocodingHit = result.hits[0]
                                        const res = nominatimHitToItem(hit)
                                        props.onAddressSelected(res.mainText + ', ' + res.secondText, hit.point)
                                    } else if (item instanceof GeocodingItem) {
                                        props.onAddressSelected(item.toText(), item.point)
                                    }
                                })
                        } else if (item instanceof GeocodingItem) {
                            props.onAddressSelected(item.toText(), item.point)
                        }
                    }
                    setHasFocus(false)
                    hideSuggestions()
                    break
            }
        },
        [autocompleteItems, highlightedResult]
    )

    return (
        <div className={hasFocus ? styles.fullscreen : ''}>
            <div
                ref={searchInputContainer}
                className={[
                    styles.inputContainer,
                    props.dropPreviewIndex === props.index
                        ? props.dropPreviewIndex < props.moveStartIndex
                            ? styles.topBorder
                            : styles.bottomBorder
                        : '',
                ].join(' ')}
            >
                {hasFocus && (
                    <PlainButton
                        className={styles.btnClose}
                        onClick={() => {
                            setHasFocus(false)
                            hideSuggestions()
                        }}
                    >
                        <ArrowBack />
                    </PlainButton>
                )}
                
                <input
                    style={props.moveStartIndex === props.index ? { borderWidth: '2px', margin: '-1px' } : {}}
                    className={styles.input}
                    type="text"
                    ref={searchInput}
                    autoComplete="off"
                    value={text}
                    placeholder={placeholderText}
                    onChange={(e) => {
                        const query = e.target.value
                        setText(query)
                        const coordinate = textToCoordinate(query)
                        if (!coordinate) geocoder.request(query, biasCoord, getMap().getView().getZoom())
                        props.onChange(query)
                    }}
                    onKeyDown={onKeypress}
                    onFocus={() => {
                        setHasFocus(true)
                        props.clearDragDrop()
                        if (origAutocompleteItems.length > 0) setAutocompleteItems(origAutocompleteItems)
                    }}
                    onBlur={() => {
                        if (!isSmallScreen) hideSuggestions()
                    }}
                />

                {text.length > 0 && (
                    <PlainButton
                        className={styles.btnInputClear}
                        onClick={() => {
                            setText('')
                            props.onChange('')
                            searchInput.current!.focus()
                        }}
                    >
                        <Cross />
                    </PlainButton>
                )}

                {autocompleteItems.length > 0 && (
                    <ResponsiveAutocomplete
                        inputRef={searchInputContainer.current!}
                        index={props.index}
                        isSmallScreen={isSmallScreen}
                    >
                        <Autocomplete
                            items={autocompleteItems}
                            highlightedItem={autocompleteItems[highlightedResult]}
                            onSelect={item => {
                                setHasFocus(false)
                                if (item instanceof GeocodingItem) {
                                    hideSuggestions()
                                    props.onAddressSelected(item.toText(), item.point)
                                } else if (item instanceof SelectCurrentLocationItem) {
                                    hideSuggestions()
                                    onCurrentLocationSelected(props.onAddressSelected)
                                } else if (item instanceof POIQueryItem) {
                                    hideSuggestions()
                                    handlePoiSearch(poiSearch, item.result, props.map)
                                    setText(item.result.text(item.result.poi))
                                }
                                searchInput.current!.blur()
                            }}
                        />
                    </ResponsiveAutocomplete>
                )}
            </div>
        </div>
    )
}

// Utility functions
function handlePoiSearch(poiSearch: ReverseGeocoder, result: AddressParseResult, map: Map) {
    if (!result.hasPOIs()) return

    const origExtent = map.getView().calculateExtent(map.getSize())
    const extent = transformExtent(origExtent, 'EPSG:3857', 'EPSG:4326')
    poiSearch.request(result, extent as Bbox)
}

function ResponsiveAutocomplete({
    inputRef,
    children,
    index,
    isSmallScreen,
}: {
    inputRef: HTMLElement
    children: ReactNode
    isSmallScreen: boolean
    index: number
}): JSX.Element {
    return (
        <>
            {isSmallScreen ? (
                <div className={styles.smallList}>{children}</div>
            ) : (
                <PopUp inputElement={inputRef} keepClearAtBottom={index > 5 ? 270 : 0}>
                    {children}
                </PopUp>
            )}
        </>
    )
}

function calculateHighlightedIndex(length: number, currentIndex: number, incrementBy: number) {
    const nextIndex = currentIndex + incrementBy
    if (nextIndex >= length) return -1
    if (nextIndex < -1) return length - 1
    return nextIndex
}

// Geocoder, ReverseGeocoder, and Timeout classes remain the same as in the original implementation
class Geocoder {
    private requestId = 0
    private readonly timeout = new Timout(200)
    private readonly api: Api
    private readonly onSuccess: (query: string, provider: string, hits: GeocodingHit[]) => void

    constructor(api: Api, onSuccess: (query: string, provider: string, hits: GeocodingHit[]) => void) {
        this.api = api
        this.onSuccess = onSuccess
    }

    request(query: string, bias: Coordinate | undefined, zoom = 11) {
        this.requestAsync(query, bias, zoom).then(() => {})
    }

    cancel() {
        this.getNextId()
    }

    async requestAsync(query: string, bias: Coordinate | undefined, zoom: number) {
        const provider = 'default'
        const currentId = this.getNextId()
        this.timeout.cancel()
        if (!query || query.length < 2) return

        await this.timeout.wait()
        try {
            const options: Record<string, string> = bias
                ? { point: coordinateToText(bias), location_bias_scale: '0.5', zoom: '' + (zoom + 1) }
                : {}
            const result = await this.api.geocode(query, provider, options)
            const hits = Geocoder.filterDuplicates(result.hits)
            if (currentId === this.requestId) this.onSuccess(query, provider, hits)
        } catch (reason) {
            throw Error('Could not get geocoding results because: ' + reason)
        }
    }

    private getNextId() {
        this.requestId++
        return this.requestId
    }

    static filterDuplicates(hits: GeocodingHit[]) {
        const set: Set<string> = new Set()
        return hits.filter(hit => {
            if (!set.has(hit.osm_id)) {
                set.add(hit.osm_id)
                return true
            }
            return false
        })
    }
}

export class ReverseGeocoder {
    private requestId = 0
    private readonly timeout = new Timout(200)
    private readonly api: Api
    private readonly onSuccess: (
        hits: ReverseGeocodingHit[],
        parseResult: AddressParseResult,
        queryPoint: QueryPoint
    ) => void
    private readonly queryPoint: QueryPoint

    constructor(
        api: Api,
        queryPoint: QueryPoint,
        onSuccess: (hits: ReverseGeocodingHit[], parseResult: AddressParseResult, queryPoint: QueryPoint) => void
    ) {
        this.api = api
        this.onSuccess = onSuccess
        this.queryPoint = queryPoint
    }

    cancel() {
        // invalidates last request if there is one
        this.getNextId()
    }

    request(query: AddressParseResult, bbox: Bbox) {
        this.requestAsync(query, bbox).then(() => {})
    }

    async requestAsync(parseResult: AddressParseResult, bbox: Bbox) {
        const currentId = this.getNextId()
        this.timeout.cancel()
        await this.timeout.wait()
        try {
            let hits: ReverseGeocodingHit[] = []
            if (parseResult.location) {
                let options: Record<string, string> = {
                    point: coordinateToText({ lat: (bbox[1] + bbox[3]) / 2, lng: (bbox[0] + bbox[2]) / 2 }),
                    location_bias_scale: '0.5',
                    zoom: '9',
                }
                const fwdSearch = await this.api.geocode(parseResult.location, 'default', options)
                if (fwdSearch.hits.length > 0) {
                    const bbox = fwdSearch.hits[0].extent
                        ? fwdSearch.hits[0].extent
                        : getBBoxFromCoord(fwdSearch.hits[0].point, 0.01)
                    if (bbox) hits = await this.api.reverseGeocode(parseResult.query, bbox)
                }
            } else {
                hits = await this.api.reverseGeocode(parseResult.query, bbox)
            }
            if (currentId === this.requestId) this.onSuccess(hits, parseResult, this.queryPoint)
        } catch (reason) {
            throw Error('Could not get geocoding results because: ' + reason)
        }
    }

    private getNextId() {
        this.requestId++
        return this.requestId
    }
}

class Timout {
    private readonly delay: number
    private handle: number = 0

    constructor(delay: number) {
        this.delay = delay
    }

    wait() {
        return new Promise(resolve => {
            this.handle = window.setTimeout(resolve, this.delay)
        })
    }

    cancel() {
        clearTimeout(this.handle)
    }
}

import Api from '@/api/Api'
import { ApiInfo, GeocodingResult, RoutingArgs, RoutingResult } from '../../src/api/graphhopper'
import QueryStore, {
    QueryPoint,
    QueryPointType,
    QueryStoreState,
    RequestState,
    SubRequest,
} from '../../src/stores/QueryStore'
import {
    AddPoint,
    ClearPoints,
    InfoReceived,
    InvalidatePoint,
    RemovePoint,
    RouteRequestFailed,
    RouteRequestSuccess,
    SetPoint,
    SetVehicle,
} from '../../src/actions/Actions'

class ApiMock implements Api {
    private readonly callback: { (args: RoutingArgs): void }
    constructor(callback: { (args: RoutingArgs): void }) {
        this.callback = callback
    }
    geocode(query: string): Promise<GeocodingResult> {
        throw Error('not implemented')
    }

    info(): Promise<ApiInfo> {
        throw Error('not implemented')
    }

    infoWithDispatch(): void {}

    route(args: RoutingArgs): Promise<RoutingResult> {
        throw Error('not implemented')
    }

    routeWithDispatch(args: RoutingArgs): void {
        this.callback(args)
    }
}

describe('QueryStore', () => {
    describe('SetPoint action', () => {
        it('should update a point on set point action', () => {
            const store = new QueryStore(
                new ApiMock(() => {
                    throw Error('not expected')
                })
            )
            const point: QueryPoint = {
                ...store.state.queryPoints[0],
                isInitialized: true,
            }

            const state = store.reduce(store.state, new SetPoint(point))

            expect(state.queryPoints[0]).toEqual(point)
        })
        it('should only send a route request if all points are initialized', () => {
            let counter = 0
            const store = new QueryStore(new ApiMock(() => counter++))
            let state = {
                ...store.state,
                maxAlternativeRoutes: 1,
            }

            for (const point of store.state.queryPoints) {
                state = store.reduce(state, new SetPoint({ ...point, isInitialized: true }))
            }

            expect(state.queryPoints.every(point => point.isInitialized)).toBeTruthy()
            expect(counter).toEqual(1)
        })
        it('should send two requests with different parameters when maxAlternativeRoutes is > 1', () => {
            const requestArgs: RoutingArgs[] = []
            const store = new QueryStore(new ApiMock(args => requestArgs.push(args)))

            let state = store.state
            for (const point of store.state.queryPoints) {
                state = store.reduce(state, new SetPoint({ ...point, isInitialized: true }))
            }

            expect(state.queryPoints.every(point => point.isInitialized)).toBeTruthy()
            expect(requestArgs.length).toEqual(2)
            expect(requestArgs[0].maxAlternativeRoutes).toEqual(1)
            expect(requestArgs[1].maxAlternativeRoutes).toEqual(state.maxAlternativeRoutes)
        })
        it('should send one request when querypoints.length > 2 even though maxAlternativeRoutes > 1', () => {
            const requestArgs: RoutingArgs[] = []
            const store = new QueryStore(new ApiMock(args => requestArgs.push(args)))

            let state = store.state
            state.queryPoints.push({ ...state.queryPoints[0], id: 2 })
            for (const point of store.state.queryPoints) {
                state = store.reduce(state, new SetPoint({ ...point, isInitialized: true }))
            }

            expect(state.queryPoints.every(point => point.isInitialized)).toBeTruthy()
            expect(requestArgs.length).toEqual(1)
            expect(requestArgs[0].maxAlternativeRoutes).toEqual(1)
        })
    })
    describe('Invalidate point action', () => {
        it('should set point with the same id to isInitialized: false', () => {
            const store = new QueryStore(new ApiMock(() => {}))

            const initializedPoints = store.state.queryPoints.map(p => ({
                ...p,
                isInitialized: true,
            }))
            const state = {
                ...store.state,
                queryPoints: initializedPoints,
            }
            const point = initializedPoints[0]

            const newState = store.reduce(state, new InvalidatePoint(point))

            expect(
                newState.queryPoints.filter(p => p.id === point.id).every(point => !point.isInitialized)
            ).toBeTruthy()
            expect(newState.queryPoints.filter(p => p.id !== point.id).every(point => point.isInitialized)).toBeTruthy()
        })
    })
    describe('Clear Points action', () => {
        it('should reset all points', () => {
            const store = new QueryStore(new ApiMock(() => {}))
            const initializedPoints = store.state.queryPoints.map((p, i) => ({
                ...p,
                isInitialized: true,
                queryText: `${i}`,
                point: { lng: i, lat: i },
            }))
            const state = {
                ...store.state,
                queryPoints: initializedPoints,
            }

            const newState = store.reduce(state, new ClearPoints())

            expect(newState.queryPoints.every(p => isCleared(p)))
        })
    })
    describe('AddPoint action', () => {
        it('should add point at the action`s index', () => {
            let counter = 0
            const store = new QueryStore(
                new ApiMock(() => {
                    counter++
                })
            )
            const newPointId = store.state.nextQueryPointId
            const atIndex = 1

            const newState = store.reduce(store.state, new AddPoint(atIndex, { lng: 1, lat: 1 }, false))

            expect(newState.queryPoints.findIndex(p => p.id === newPointId)).toEqual(atIndex)
            expect(newState.queryPoints.every((p, i) => isCorrectType(p, i, newState.queryPoints.length))).toBeTruthy()
            expect(counter).toEqual(0)
        })
        it('should add point at index and route if all points are initialized', () => {
            let counter = 0
            const store = new QueryStore(
                new ApiMock(() => {
                    counter++
                })
            )
            const newPointId = store.state.nextQueryPointId
            const atIndex = 1
            const initializedPoints = store.state.queryPoints.map(p => ({ ...p, isInitialized: true }))
            const state = {
                ...store.state,
                queryPoints: initializedPoints,
            }

            const newState = store.reduce(state, new AddPoint(atIndex, { lng: 1, lat: 1 }, true))
            expect(newState.queryPoints.findIndex(p => p.id === newPointId)).toEqual(atIndex)
            expect(newState.queryPoints[atIndex].queryText).toEqual('1, 1') // if initialized flag is set the coordinates are set as query text
            expect(counter).toEqual(1)
            expect(newState.queryPoints.every((p, i) => isCorrectType(p, i, newState.queryPoints.length))).toBeTruthy()
        })
    })
    describe('RemovePoint action', () => {
        it('should remove the corresponding ponit', () => {
            let counter = 0
            const store = new QueryStore(
                new ApiMock(() => {
                    counter++
                })
            )

            const initializedPoints = store.state.queryPoints.map(p => ({ ...p, isInitialized: true }))
            const thirdPoint = {
                ...getQueryPoint(3),
                isInitialized: true,
            }
            initializedPoints.push(thirdPoint)
            const state = {
                ...store.state,
                queryPoints: initializedPoints,
                maxAlternativeRoutes: 1,
            }

            const lastState = store.reduce(state, new RemovePoint(thirdPoint))

            expect(lastState.queryPoints.length).toEqual(2)
            expect(
                lastState.queryPoints.every((p, i) => isCorrectType(p, i, lastState.queryPoints.length))
            ).toBeTruthy()
            expect(counter).toEqual(1)
        })
    })
    describe('InfoReceived action', () => {
        it('return unchanged state if routing vehicle was already set', () => {
            const store = new QueryStore(new ApiMock(() => {}))

            const state: QueryStoreState = {
                ...store.state,
                routingVehicle: {
                    version: 'some-value',
                    features: { elevation: true },
                    import_date: 'some-value',
                    key: 'some-value',
                },
            }
            const newState = store.reduce(
                state,
                new InfoReceived({
                    vehicles: [],
                    version: '',
                    import_date: '',
                    bbox: [0, 0, 0, 0],
                })
            )

            expect(newState).toEqual(state)
        })
        it('should set car as default routing mode', () => {
            const store = new QueryStore(new ApiMock(() => {}))
            const state: QueryStoreState = store.state
            const expectedVehicle = {
                key: 'car',
                import_date: 'some_date',
                features: { elevation: false },
                version: 'some-version',
            }

            const newState = store.reduce(
                state,
                new InfoReceived({
                    vehicles: [
                        expectedVehicle,
                        {
                            key: 'other',
                            import_date: 'other-date',
                            features: { elevation: false },
                            version: 'other-version',
                        },
                    ],
                    version: '',
                    import_date: '',
                    bbox: [0, 0, 0, 0],
                })
            )

            expect(newState.routingVehicle).toEqual(expectedVehicle)
        })
    })
    describe('SetVehicle action', () => {
        it('should set the routing vehicle (surprise!)', () => {
            const store = new QueryStore(new ApiMock(() => {}))
            const state: QueryStoreState = store.state
            const vehicle = {
                key: 'car',
                import_date: 'some_date',
                features: { elevation: false },
                version: 'some-version',
            }

            const newState = store.reduce(state, new SetVehicle(vehicle))

            expect(newState.routingVehicle).toEqual(vehicle)
        })
    })
    describe('RouteRequestSuccess action', () => {
        it('should mark the correct subrequest as done', () => {
            const store = new QueryStore(new ApiMock(() => {}))
            const routingArgs: RoutingArgs = {
                maxAlternativeRoutes: 1,
                points: [],
                vehicle: 'some-vehicle',
            }
            const subRequest: SubRequest = {
                state: RequestState.SENT,
                args: routingArgs,
            }
            const state: QueryStoreState = {
                ...store.state,
                currentRequest: {
                    subRequests: [subRequest],
                },
            }

            const newState = store.reduce(
                state,
                new RouteRequestSuccess(routingArgs, { paths: [], info: { took: 1, copyright: [] } })
            )

            expect(newState.currentRequest.subRequests[0].state).toEqual(RequestState.SUCCESS)
        })
    })
    describe('RouteRequestFailed action', () => {
        it('should mark the correct subrequest as done', () => {
            const store = new QueryStore(new ApiMock(() => {}))
            const routingArgs: RoutingArgs = {
                maxAlternativeRoutes: 1,
                points: [],
                vehicle: 'some-vehicle',
            }
            const subRequest: SubRequest = {
                state: RequestState.SENT,
                args: routingArgs,
            }
            const state: QueryStoreState = {
                ...store.state,
                currentRequest: {
                    subRequests: [subRequest],
                },
            }

            const newState = store.reduce(state, new RouteRequestFailed(routingArgs, 'message'))

            expect(newState.currentRequest.subRequests[0].state).toEqual(RequestState.FAILED)
        })
    })
})

function getQueryPoint(id: number): QueryPoint {
    return {
        type: QueryPointType.From,
        isInitialized: true,
        queryText: '',
        color: '',
        coordinate: { lng: 0, lat: 0 },
        id: id,
    }
}

function isCleared(point: QueryPoint) {
    return !point.isInitialized && point.queryText === '' && point.coordinate.lat === 0 && point.coordinate.lng === 0
}

function isCorrectType(point: QueryPoint, index: number, length: number) {
    if (index === 0 && point.type === QueryPointType.From) return true
    if (index === length - 1 && point.type === QueryPointType.To) return true
    return point.type === QueryPointType.Via
}

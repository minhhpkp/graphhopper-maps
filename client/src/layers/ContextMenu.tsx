import { Map, Overlay } from 'ol'
import { ContextMenuContent } from '@/map/ContextMenuContent'
import { useEffect, useRef, useState } from 'react'
import { Coordinate, QueryPoint } from '@/stores/QueryStore'
import { fromLonLat, toLonLat } from 'ol/proj'
import styles from '@/layers/ContextMenu.module.css'
import { RouteStoreState } from '@/stores/RouteStore'
import {BACKEND_SERVER_URL} from "@/settings";
import { createSvg } from './createMarkerSVG';

interface ContextMenuProps {
    map: Map
    route: RouteStoreState
    queryPoints: QueryPoint[]
}

const overlay = new Overlay({
    autoPan: true,
})

export default function ContextMenu({ map, route, queryPoints }: ContextMenuProps) {
    const [rightClick, setRightClick] = useState<true | false>(false);
    const [mCoordinate, setMCoordinate] = useState<null | { lng: number, lat: number }>(null);
    const [poiData, setPoiData] = useState<any>(null); // State để lưu trữ dữ liệu trả về từ API
    const [loading, setLoading] = useState<boolean>(false); // State để theo dõi trạng thái tải dữ liệu
    const container = useRef<HTMLDivElement | null>(null);
    const popupRef = useRef<HTMLDivElement | null>(null);
    const currentMarkerRef = useRef<Overlay | null>(null); // Tham chiếu đến marker hiện tại
    const currentPopupRef = useRef<Overlay | null>(null); // Tham chiếu đến popup hiện tại
    const abortControllerRef = useRef<AbortController | null>(null); // Tham chiếu đến AbortController

    useEffect(() => {
        // Tạo popup rỗng
        if (!popupRef.current) {
            popupRef.current = document.createElement('div');
            popupRef.current.style.padding = '20px';
            popupRef.current.style.backgroundColor = 'white';
            popupRef.current.style.border = '1px solid black';
            popupRef.current.style.borderRadius = '5px';
            popupRef.current.style.minWidth = '300px';
            popupRef.current.style.textAlign = 'left';
        }
    }, []);

    const fetchPoiData = async (lng: number, lat: number) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    
        const controller = new AbortController();
        abortControllerRef.current = controller;
    
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3002/poi/xxx?poi_x=${lat}&poi_y=${lng}`, {
                signal: controller.signal,
            });
            const data = await response.json();
            setPoiData(data);
            setLoading(false);
            console.log('Fetched POI data:', data);
    
            // Cập nhật nội dung popup nhỏ với thông tin gọn gàng
            if (popupRef.current) {
                popupRef.current.innerHTML = `
                    <style>
                        .popup-small {
                            display: flex;
                            flex-direction: column;
                            padding: 10px;
                            border-radius: 10px;
                            background-color: #ffffff;
                            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            font-family: 'Arial, sans-serif';
                            max-width: 250px;
                            border: 1px solid #ddd;
                            transition: all 0.3s ease-in-out;
                        }
                        .popup-title {
                            font-size: 16px;
                            color: #333;
                            font-weight: bold;
                            margin-bottom: 5px;
                        }
                        .popup-address {
                            font-size: 14px;
                            color: #666;
                            margin-bottom: 10px;
                        }
                        .details-button {
                            display: inline-block;
                            background-color: #444;
                            color: #fff;
                            border: none;
                            padding: 5px 10px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 14px;
                            text-align: center;
                            transition: background-color 0.2s ease-in-out;
                        }
                        .details-button:hover {
                            background-color: #555; /* Màu nền sáng hơn khi hover */
                            transform: scale(1.05); /* Hiệu ứng phóng nhẹ */
                        }
                        .details-button:active {
                            background-color: #666; /* Màu tối hơn khi nhấn */
                            transform: scale(0.98); /* Hiệu ứng thu nhỏ nhẹ khi nhấn */
                        }
                    </style>
                    <div class="popup-small">
                        <span class="popup-title">${data.en_title || 'N/A'}</span>
                        <span class="popup-address">${data.address?.join(', ') || 'N/A'}</span>
                        <button id="details-button" class="details-button">Chi tiết</button>
                    </div>
                `;
    
                // Thêm sự kiện click cho nút "Chi tiết"
                setTimeout(() => {
                    const detailsButton = document.getElementById('details-button');
                    if (detailsButton) {
                        detailsButton.onclick = event => {
                            event.stopPropagation(); // Ngăn click lan đến map
                            showDetailsPopup(data);
                        };
                    }
                }, 0);
            }
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') {
                console.log('Fetch request was cancelled');
            } else {
                console.error('Error fetching POI data:', error);
                setLoading(false);
            }
        }
    };
    

    let activeDetailsPopup: HTMLDivElement | null = null;
    
    function showDetailsPopup(data: any) {
        // Kiểm tra và xóa popup lớn hiện tại nếu có
        if (activeDetailsPopup) {
            document.body.removeChild(activeDetailsPopup);
            activeDetailsPopup = null;
        }
    
        // Xử lý giờ mở cửa để hiển thị dưới dạng chuỗi tổng quát
        const openTime = data.openTime
            ? typeof data.openTime === 'string'
                ? data.openTime
                : 'Thông tin giờ mở cửa không khả dụng'
            : 'N/A';
    
        // Tạo popup chi tiết mới
        const detailsPopup = document.createElement('div');
        detailsPopup.style.position = 'fixed';
        detailsPopup.style.bottom = '0';
        detailsPopup.style.left = '0';
        detailsPopup.style.width = '25%';
        detailsPopup.style.maxHeight = '70%'; // Chiều cao tối đa 70% màn hình
        detailsPopup.style.backgroundColor = '#ffffff';
        detailsPopup.style.zIndex = '1000';
        detailsPopup.style.overflowY = 'auto'; // Cho phép cuộn nội dung
        detailsPopup.style.padding = '20px';
        detailsPopup.style.boxShadow = '0 -4px 20px rgba(0, 0, 0, 0.2)';
        detailsPopup.style.borderTopLeftRadius = '15px';
        detailsPopup.style.borderTopRightRadius = '15px';
        detailsPopup.style.fontFamily = 'Arial, sans-serif';
    
        // HTML của popup chi tiết
        detailsPopup.innerHTML = `
            <style>
                .details-popup-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #ddd;
                }
                .details-popup-header h2 {
                    font-size: 18px;
                    color: #333;
                    margin: 0;
                }
                .details-close-btn {
                    background: none;
                    border: none;
                    font-size: 18px;
                    color: #666;
                    cursor: pointer;
                    transition: color 0.3s;
                }
                .details-close-btn:hover {
                    color: #ff4d4d;
                }
                .details-popup-content {
                    margin-top: 15px;
                }
                .details-row {
                    margin-bottom: 10px;
                }
                .details-label {
                    font-weight: bold;
                    color: #555;
                }
                .details-value {
                    color: #333;
                }
                .details-icon {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 10px 0;
                }
                .details-icon img {
                    width: 70px;
                    height: 70px;
                    border-radius: 10px;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                }
                .details-footer {
                    display: flex;
                    justify-content: center;
                    margin-top: 20px;
                }
                .action-button {
                    padding: 10px 20px;
                    font-size: 14px;
                    color: #fff;
                    background-color: #007bff;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s ease-in-out;
                }
                .action-button:hover {
                    background-color: #0056b3;
                }
            </style>
            <div>
                <div class="details-popup-header">
                    <h2>${data.en_title || 'N/A'}</h2>
                    <button id="close-details" class="details-close-btn">&times;</button>
                </div>
                <div class="details-popup-content">
                    <div class="details-row">
                        <span class="details-label">Business Type:</span>
                        <span class="details-value">${data.en_business?.join(', ') || 'N/A'}</span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Address:</span>
                        <span class="details-value">${data.address?.join(', ') || 'N/A'}</span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Telephone:</span>
                        <span class="details-value">${data.tele || 'N/A'}</span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Open Time:</span>
                        <span class="details-value">${openTime}</span>
                    </div>
                    <div class="details-row">
                        <span class="details-label">Website:</span>
                        <a href="${data.webSite || '#'}" class="details-value" target="_blank" style="color: #007bff;">${data.webSite || 'N/A'}</a>
                    </div>
                    <div class="details-row">
                        <span class="details-label">About:</span>
                        <span class="details-value">${data.about ? formatAboutSection(data.about) : 'N/A'}</span>
                    </div>
                    <div class="details-icon">
                        <img src="${data.icon}" alt="Icon" />
                    </div>
                </div>
                
            </div>
        `;
    
        document.body.appendChild(detailsPopup);
        activeDetailsPopup = detailsPopup;
    
        // Thêm sự kiện đóng popup
        document.getElementById('close-details')!.onclick = () => {
            if (activeDetailsPopup) {
                document.body.removeChild(activeDetailsPopup);
                activeDetailsPopup = null;
            }
        };
    }
    

    // Hàm phụ trợ để định dạng phần "about"
    function formatAboutSection(aboutData: any): string {
        return aboutData
            .map((section: any) => {
                const sectionName = section[1];
                const details = section[2]
                    .map((detail: any) => detail[1])
                    .join(', ');

                return `<p><strong>${sectionName}:</strong> ${details || 'N/A'}</p>`;
            })
            .join('');
    }

    

    const setCoordinate = (e: any) => {
        e.preventDefault();
        const coordinate = map.getEventCoordinate(e);
        const lonLat = toLonLat(coordinate);
        setMCoordinate({ lng: lonLat[0], lat: lonLat[1] });

        // Gọi API với tọa độ mới
        fetchPoiData(lonLat[0], lonLat[1]);
    };

    const openContextMenu = (e: any) => {
        setRightClick(true);
        setCoordinate(e);
    };

    const closeContextMenu = () => {
        setRightClick(false);
    };

    const handleLeftClick = (e: any) => {
        // Nếu click vào nút "Chi tiết", không thực hiện hành động thay đổi marker
        if (e.target?.id === 'details-button') {
            return;
        }
    
        setRightClick(false);
        setCoordinate(e);
    
        // Xóa marker và popup hiện tại nếu có
        if (currentMarkerRef.current) {
            map.removeOverlay(currentMarkerRef.current);
            currentMarkerRef.current = null;
        }
        if (currentPopupRef.current) {
            map.removeOverlay(currentPopupRef.current);
            currentPopupRef.current = null;
        }
    
        // Đặt marker mới tại tọa độ click chuột trái
        const coordinate = map.getEventCoordinate(e);
        const lonLat = toLonLat(coordinate);
    
        // Tạo và thêm marker vào bản đồ
        const markerSvg = createSvg({ color: '#808080', size: 30 }); // Màu xám và kích thước tùy chỉnh
        const markerElement = document.createElement('div');
        markerElement.innerHTML = markerSvg;
        markerElement.style.cursor = 'pointer';
    
        const markerOverlay = new Overlay({
            element: markerElement,
            position: coordinate,
            positioning: 'bottom-center',
            stopEvent: false,
        });
        map.addOverlay(markerOverlay);
        currentMarkerRef.current = markerOverlay;
    
        // Tạo popup tạm thời "Đang tải dữ liệu"
        if (popupRef.current) {
            popupRef.current.innerHTML = '<p>Đang tải dữ liệu...</p>';
        }
    
        // Tạo hoặc cập nhật popup hiện tại
        if (currentPopupRef.current) {
            map.removeOverlay(currentPopupRef.current);
        }
    
        const popupOverlay = new Overlay({
            element: popupRef.current!,
            position: coordinate,
            positioning: 'bottom-center',
            offset: [0, -35], // Điều chỉnh vị trí popup để không che marker
        });
        map.addOverlay(popupOverlay);
        currentPopupRef.current = popupOverlay;
    };
    

    useEffect(() => {
        overlay.setElement(container.current!);
        map.addOverlay(overlay);

        const longTouchHandler = new LongTouchHandler(e => openContextMenu(e));

        function onMapTargetChange() {
            const targetElement = map.getTargetElement();
            targetElement.addEventListener('contextmenu', openContextMenu);
            targetElement.addEventListener('touchstart', e => longTouchHandler.onTouchStart(e));
            targetElement.addEventListener('touchmove', () => longTouchHandler.onTouchEnd());
            targetElement.addEventListener('touchend', () => longTouchHandler.onTouchEnd());
            targetElement.addEventListener('click', handleLeftClick);
        }
        map.on('change:target', onMapTargetChange);

        return () => {
            map.getTargetElement().removeEventListener('contextmenu', openContextMenu);
            map.getTargetElement().removeEventListener('click', handleLeftClick);
            map.removeOverlay(overlay);
            map.un('change:target', onMapTargetChange);
        };
    }, [map]);

    useEffect(() => {
        overlay.setPosition(rightClick ? fromLonLat([mCoordinate?.lng ?? 0, mCoordinate?.lat ?? 0]) : undefined);
    }, [mCoordinate, rightClick]);

    console.log('Current coordinate:', mCoordinate);

    return (
        <div className={styles.contextMenu} ref={container}>
            {rightClick && (
                <ContextMenuContent
                    coordinate={mCoordinate!}
                    queryPoints={queryPoints}
                    route={route}
                    onSelect={closeContextMenu}
                />
            )}
        </div>
    );
}
// See #229
class LongTouchHandler {
    private readonly callback: (e: any) => void
    private currentTimeout: number = 0
    private currentEvent?: any

    constructor(onLongTouch: (e: any) => void) {
        this.callback = onLongTouch
    }

    onTouchStart(e: any) {
        this.currentEvent = e
        this.currentTimeout = window.setTimeout(() => {
            console.log('long touch')
            if (this.currentEvent) this.callback(this.currentEvent)
        }, 500)
    }

    onTouchEnd() {
        console.log('touch end')
        window.clearTimeout(this.currentTimeout)
        this.currentEvent = undefined
    }
}
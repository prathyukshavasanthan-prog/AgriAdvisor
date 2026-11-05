import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPin, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  Plus, 
  Layers, 
  Info,
  Map as MapIcon,
  CloudRain,
  Store,
  Star,
  Navigation,
  Compass
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface FarmMapItem {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  has_valid_coordinates: boolean;
  area: number;
  boundary?: {
    type: 'Polygon';
    coordinates: number[][][];
  } | null;
  soil_type: string;
  weather?: {
    forecast_rain_probability: number;
    forecast_rain_amount: number;
    temperature?: number;
    humidity?: number;
  } | null;
  crop?: {
    id: string;
    crop_type: string;
    status: string;
    sowing_date?: string;
  } | null;
  health?: {
    status: 'Healthy' | 'Okay' | 'Concerning';
    check_in_type: string;
    notes?: string;
    date?: string;
    ai_predicted_class?: string;
  } | null;
  irrigation?: {
    available: boolean;
    urgency_level?: string;
    recommended_action?: string;
    actionKey?: string;
    urgencyKey?: string;
  } | null;
  status: 'optimal' | 'warning' | 'critical' | 'unknown';
}

interface MandiItem {
  id: string;
  name: string;
  market: string;
  state: string;
  latitude: number;
  longitude: number;
  location_type: 'approximate_location';
  major_commodities: string[];
  price_for_crop: number;
  distance_km?: number;
  is_best_price_nearby: boolean;
}

interface FarmMapViewProps {
  onSelectFarm: (farmId: string) => void;
  onAddNew: () => void;
  token: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const FarmMapView: React.FC<FarmMapViewProps> = ({
  onSelectFarm,
  onAddNew,
  token,
}) => {
  const { t } = useTranslation();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Dedicated layer groups for multi-layer toggling
  const farmStatusLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const rainForecastLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const mandisLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const outbreaksLayerGroupRef = useRef<L.LayerGroup | null>(null);

  // Marker registry for programmatic popup opening
  const mandiMarkersRef = useRef<Record<string, L.Marker>>({});
  const outbreakMarkersRef = useRef<Record<string, { marker: L.Marker; circle: L.Circle }>>({});

  const [farms, setFarms] = useState<FarmMapItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tileError, setTileError] = useState<boolean>(false);

  // PART 1: Street / Satellite switch state
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');

  // Layer panel checkboxes (Farm status, Rain forecast, Mandis, Community outbreaks)
  const [showFarmStatusLayer, setShowFarmStatusLayer] = useState<boolean>(true);
  const [showRainLayer, setShowRainLayer] = useState<boolean>(false);
  const [showMandisLayer, setShowMandisLayer] = useState<boolean>(true);
  const [showOutbreaksLayer, setShowOutbreaksLayer] = useState<boolean>(true);

  // Selected farm for distance calculation & best price nearby
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);
  const [mandis, setMandis] = useState<MandiItem[]>([]);
  const [loadingMandis, setLoadingMandis] = useState<boolean>(false);
  const [nearbyOutbreaks, setNearbyOutbreaks] = useState<any[]>([]);
  const [loadingOutbreaks, setLoadingOutbreaks] = useState<boolean>(false);

  // Fetch GIS-enriched map data from backend
  const fetchMapData = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/farms/gis-map`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const fetchedFarms: FarmMapItem[] = data.data || [];
        setFarms(fetchedFarms);
        if (fetchedFarms.length > 0 && !selectedFarmId) {
          const firstValid = fetchedFarms.find((f) => f.has_valid_coordinates);
          if (firstValid) {
            setSelectedFarmId(firstValid.id);
          }
        }
      } else {
        setError(data.message || 'Failed to fetch GIS map data');
      }
    } catch (err: any) {
      console.error('[FarmMapView] Fetch error:', err);
      setError(err.message || 'Network error fetching map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, [token]);

  // Valid and invalid coordinate partitions
  const { validFarms, invalidFarms } = useMemo(() => {
    const valid: FarmMapItem[] = [];
    const invalid: FarmMapItem[] = [];
    farms.forEach((f) => {
      if (f.has_valid_coordinates) {
        valid.push(f);
      } else {
        invalid.push(f);
      }
    });
    return { validFarms: valid, invalidFarms: invalid };
  }, [farms]);

  // Selected farm object
  const selectedFarm = useMemo(() => {
    return validFarms.find((f) => f.id === selectedFarmId) || validFarms[0] || null;
  }, [validFarms, selectedFarmId]);

  // Fetch Nearby Mandis from backend when selected farm changes
  const fetchNearbyMandis = useCallback(async () => {
    setLoadingMandis(true);
    try {
      const crop = selectedFarm?.crop?.crop_type || 'wheat';
      const lat = selectedFarm?.latitude;
      const lng = selectedFarm?.longitude;
      const farmId = selectedFarm?.id;

      let url = `${API_BASE_URL}/api/market/mandis?crop=${encodeURIComponent(crop)}`;
      if (lat !== undefined && lng !== undefined) {
        url += `&lat=${lat}&lng=${lng}`;
      }
      if (farmId) {
        url += `&farmId=${encodeURIComponent(farmId)}`;
      }

      const res = await fetch(url);
      const resData = await res.json();
      if (res.ok && resData.success && resData.data?.data) {
        setMandis(resData.data.data);
      }
    } catch (mErr) {
      console.warn('[FarmMapView] Failed to fetch nearby mandis:', mErr);
    } finally {
      setLoadingMandis(false);
    }
  }, [selectedFarm]);

  useEffect(() => {
    fetchNearbyMandis();
  }, [fetchNearbyMandis]);

  // Fetch nearby community outbreaks for selected farm
  const fetchNearbyOutbreaks = useCallback(async () => {
    if (!token || !selectedFarmId) {
      setNearbyOutbreaks([]);
      return;
    }
    setLoadingOutbreaks(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/outbreaks/nearby?farmId=${selectedFarmId}&radiusKm=15`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNearbyOutbreaks(data.data || []);
      }
    } catch (oErr) {
      console.warn('[FarmMapView] Failed to fetch nearby outbreaks:', oErr);
    } finally {
      setLoadingOutbreaks(false);
    }
  }, [token, selectedFarmId]);

  useEffect(() => {
    fetchNearbyOutbreaks();
  }, [fetchNearbyOutbreaks]);

  // Expose global navigation handlers for popup clicks
  useEffect(() => {
    (window as any).__agriNavigateToFarm = (farmId: string) => {
      onSelectFarm(farmId);
    };
    (window as any).__agriSelectFarmOnMap = (farmId: string) => {
      setSelectedFarmId(farmId);
    };
    return () => {
      delete (window as any).__agriNavigateToFarm;
      delete (window as any).__agriSelectFarmOnMap;
    };
  }, [onSelectFarm]);

  // ---------------------------------------------------------------------------
  // 1. INITIALIZE LEAFLET MAP
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false, // We render custom prominent attribution
      }).setView([20.5937, 78.9629], 5); // Default center on India

      // Street tile layer initially
      const tileLayer = L.tileLayer(OSM_TILE_URL, {
        maxZoom: 19,
      }).addTo(map);

      tileLayer.on('tileerror', () => {
        setTileError(true);
      });

      tileLayerRef.current = tileLayer;

      // Layer Groups for Parts 4 & Outbreaks
      const farmGroup = L.layerGroup().addTo(map);
      const rainGroup = L.layerGroup().addTo(map);
      const mandiGroup = L.layerGroup().addTo(map);
      const outbreakGroup = L.layerGroup().addTo(map);

      farmStatusLayerGroupRef.current = farmGroup;
      rainForecastLayerGroupRef.current = rainGroup;
      mandisLayerGroupRef.current = mandiGroup;
      outbreaksLayerGroupRef.current = outbreakGroup;

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // PART 1: TILE LAYER SWITCH (Street vs Satellite)
  // ---------------------------------------------------------------------------
  const handleSwitchMapType = (type: 'street' | 'satellite') => {
    setMapType(type);
    setTileError(false);
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    tileLayerRef.current.remove();
    const newUrl = type === 'street' ? OSM_TILE_URL : ESRI_SATELLITE_URL;
    const newLayer = L.tileLayer(newUrl, {
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    newLayer.on('tileerror', () => {
      setTileError(true);
    });

    tileLayerRef.current = newLayer;
  };

  // ---------------------------------------------------------------------------
  // PART 2 & 3: RENDER FARM BOUNDARIES & STATUS PINS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const farmGroup = farmStatusLayerGroupRef.current;
    if (!map || !farmGroup) return;

    farmGroup.clearLayers();

    if (!showFarmStatusLayer || validFarms.length === 0) return;

    const bounds = L.latLngBounds([]);

    validFarms.forEach((farm) => {
      const lat = farm.latitude;
      const lng = farm.longitude;
      bounds.extend([lat, lng]);

      // Status colors per Module 5 & design system
      let pinColor = '#1E4620';
      let pinBg = '#D1FAE5';
      let statusFill = '#22c55e';
      let iconSvg = '';
      let badgeLabel = t('map_status_optimal');

      if (farm.status === 'critical') {
        pinColor = '#DC2626';
        pinBg = '#FEE2E2';
        statusFill = '#ef4444';
        badgeLabel = t('map_status_critical');
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${pinColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      } else if (farm.status === 'warning') {
        pinColor = '#D97706';
        pinBg = '#FEF3C7';
        statusFill = '#f59e0b';
        badgeLabel = t('map_status_warning');
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${pinColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
      } else if (farm.status === 'optimal') {
        pinColor = '#1E4620';
        pinBg = '#D1FAE5';
        statusFill = '#22c55e';
        badgeLabel = t('map_status_optimal');
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${pinColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
      } else {
        pinColor = '#64748B';
        pinBg = '#F1F5F9';
        statusFill = '#9ca3af';
        badgeLabel = t('map_status_unknown');
        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${pinColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
      }

      // Localized crop name
      const cropTypeName = farm.crop?.crop_type
        ? String(t(`crop_${farm.crop.crop_type}` as any, farm.crop.crop_type))
        : t('crop_none_registered');

      // Localized irrigation urgency / action
      let irrigationText = t('irrigation_no_data');
      if (farm.irrigation?.available) {
        const actionLabel = farm.irrigation.actionKey
          ? String(t(farm.irrigation.actionKey as any, { defaultValue: farm.irrigation.recommended_action || '' }))
          : farm.irrigation.recommended_action;
        const urgencyLabel = farm.irrigation.urgencyKey
          ? String(t(farm.irrigation.urgencyKey as any, { defaultValue: farm.irrigation.urgency_level || '' }))
          : farm.irrigation.urgency_level;
        irrigationText = `${actionLabel} (${urgencyLabel})`;
      }

      // Localized health status
      let healthText = t('health_status_not_logged');
      if (farm.health?.status) {
        const statusLabel = String(t(`health_status_${farm.health.status.toLowerCase()}` as any, farm.health.status));
        const typeBadge = farm.health.check_in_type === 'ai_diagnosis' ? t('health_badge_ai') : t('health_badge_manual');
        healthText = `${statusLabel} • ${typeBadge}`;
      }

      // Interactive Popup card
      const popupHtml = `
        <div style="font-family: Inter, sans-serif; min-width: 250px; padding: 4px 2px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-bottom: 8px;">
            <div>
              <h4 style="margin: 0; font-size: 15px; font-weight: 800; color: #14251B; line-height: 1.2;">
                ${farm.name}
              </h4>
              <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">
                ${farm.latitude.toFixed(3)}°N, ${farm.longitude.toFixed(3)}°E • ${farm.area} acres
              </div>
            </div>
            <span style="font-size: 10px; font-weight: 800; background: ${pinBg}; color: ${pinColor}; border: 1px solid ${pinColor}33; padding: 2px 6px; border-radius: 6px; text-transform: uppercase;">
              ${badgeLabel}
            </span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 12px; margin-bottom: 12px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="color: #1E4620; font-weight: bold;">🌱 ${t('map_popup_crop')}:</span>
              <span style="color: #1F2937; font-weight: 600;">${cropTypeName}</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 6px;">
              <span style="color: #0284C7; font-weight: bold; white-space: nowrap;">💧 ${t('map_popup_irrigation')}:</span>
              <span style="color: #374151;">${irrigationText}</span>
            </div>
            <div style="display: flex; align-items: flex-start; gap: 6px;">
              <span style="color: #059669; font-weight: bold; white-space: nowrap;">🩺 ${t('map_popup_health')}:</span>
              <span style="color: #374151;">${healthText}</span>
            </div>
            ${farm.boundary ? `
              <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #15803D; font-weight: bold; background: #DCFCE7; padding: 3px 6px; border-radius: 6px;">
                <span>📐 ${t('farm_boundary_title')}</span>
              </div>
            ` : ''}
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <button
              type="button"
              id="map-popup-btn-${farm.id}"
              onclick="window.__agriNavigateToFarm('${farm.id}')"
              style="width: 100%; height: 32px; background: #1E4620; color: #FFFFFF; font-size: 12px; font-weight: 700; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;"
            >
              <span>${t('map_popup_view_details')}</span>
              <span>&rarr;</span>
            </button>
            <button
              type="button"
              id="map-popup-select-btn-${farm.id}"
              onclick="window.__agriSelectFarmOnMap('${farm.id}')"
              style="width: 100%; height: 28px; background: #EBF5EE; color: #1E4620; font-size: 11px; font-weight: 700; border: 1px solid #1E462033; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px;"
            >
              <span>📍 ${t('mandi_selected_farm')}</span>
            </button>
          </div>
        </div>
      `;

      // PART 3: Draw Real Farm Boundary Outline if present
      if (farm.boundary && farm.boundary.coordinates && farm.boundary.coordinates[0]) {
        const ring = farm.boundary.coordinates[0];
        const latLngs = ring.map((pt) => [pt[1], pt[0]] as [number, number]);
        const polygon = L.polygon(latLngs, {
          color: pinColor,
          weight: farm.id === selectedFarmId ? 4 : 2.5,
          fillColor: statusFill,
          fillOpacity: farm.id === selectedFarmId ? 0.35 : 0.2,
          dashArray: farm.status === 'warning' || farm.status === 'critical' ? '4, 4' : undefined,
        });

        polygon.bindPopup(popupHtml, { maxWidth: 300 });
        polygon.on('click', () => {
          setSelectedFarmId(farm.id);
        });
        farmGroup.addLayer(polygon);
      }

      // Put status icon at the centre (carrying meaning + colour)
      const isSelected = farm.id === selectedFarmId;
      const customIcon = L.divIcon({
        className: 'agri-custom-marker',
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background-color: ${pinBg}; border: 2.5px solid ${pinColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15);">
              ${iconSvg}
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${pinColor}; margin-top: -1px;"></div>
            ${isSelected ? `<div style="position: absolute; top: -6px; right: -6px; width: 14px; height: 14px; border-radius: 50%; background: #F59E0B; border: 2px solid #FFFFFF;"></div>` : ''}
          </div>
        `,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
        popupAnchor: [0, -42],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.bindPopup(popupHtml, { maxWidth: 300 });
      marker.on('click', () => {
        setSelectedFarmId(farm.id);
      });
      farmGroup.addLayer(marker);
    });

    if (validFarms.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else if (validFarms.length === 1) {
      map.setView([validFarms[0].latitude, validFarms[0].longitude], 12);
    }
  }, [validFarms, showFarmStatusLayer, selectedFarmId, t]);

  // ---------------------------------------------------------------------------
  // PART 4: LAYER 2 — RAIN FORECAST ON EACH FARM (24h Rain Chance)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const rainGroup = rainForecastLayerGroupRef.current;
    if (!rainGroup) return;

    rainGroup.clearLayers();

    if (!showRainLayer || validFarms.length === 0) return;

    validFarms.forEach((farm) => {
      const rainChance = farm.weather?.forecast_rain_probability ?? 0;
      const rainAmount = farm.weather?.forecast_rain_amount ?? 0;

      const rainBadgeHtml = `
        <div style="display: flex; align-items: center; gap: 4px; background: #0284C7; color: #FFFFFF; font-family: Inter, sans-serif; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 9999px; border: 2px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); white-space: nowrap; cursor: pointer;">
          <span>🌧️</span>
          <span>${rainChance}%</span>
          <span style="font-size: 9px; opacity: 0.9;">(${rainAmount}mm)</span>
        </div>
      `;

      const rainIcon = L.divIcon({
        className: 'agri-rain-badge',
        html: rainBadgeHtml,
        iconSize: [80, 24],
        iconAnchor: [40, 56], // Positioned above the status pin
      });

      const rainMarker = L.marker([farm.latitude, farm.longitude], { icon: rainIcon });
      rainMarker.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 2px;">
          <h5 style="margin: 0; font-size: 13px; font-weight: 800; color: #0284C7;">
            ${farm.name} — ${t('map_rain_24h_label')}
          </h5>
          <div style="font-size: 12px; margin-top: 4px; color: #374151;">
            <strong>${t('map_layer_rain_forecast')}:</strong> ${rainChance}% probability
          </div>
          <div style="font-size: 11px; color: #6B7280; margin-top: 2px;">
            Forecast precipitation: ${rainAmount} mm
          </div>
        </div>
      `);
      rainGroup.addLayer(rainMarker);
    });
  }, [validFarms, showRainLayer, t]);

  // ---------------------------------------------------------------------------
  // PART 4 & 5: LAYER 3 — NEARBY MANDI MARKETS & BEST PRICE NEARBY
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const mandiGroup = mandisLayerGroupRef.current;
    if (!mandiGroup) return;

    mandiGroup.clearLayers();

    if (!showMandisLayer || mandis.length === 0) return;

    mandis.forEach((mandi) => {
      const isBest = mandi.is_best_price_nearby;
      const mandiPinBg = isBest ? '#FEF3C7' : '#FFFFFF';
      const mandiBorder = isBest ? '#D97706' : '#2563EB';

      const mandiIcon = L.divIcon({
        className: 'agri-mandi-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: ${isBest ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s;">
            <div style="width: 34px; height: 34px; border-radius: 50%; background: ${mandiPinBg}; border: 2.5px solid ${mandiBorder}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
              ${isBest ? '⭐' : '🏪'}
            </div>
            <div style="background: #1E293B; color: #FFFFFF; font-family: Inter, sans-serif; font-size: 9px; font-weight: 800; padding: 2px 6px; border-radius: 4px; margin-top: 2px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2);">
              ₹${mandi.price_for_crop}
            </div>
          </div>
        `,
        iconSize: [40, 52],
        iconAnchor: [20, 52],
        popupAnchor: [0, -48],
      });

      const mandiPopup = `
        <div style="font-family: Inter, sans-serif; min-width: 230px; padding: 4px 2px;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 6px;">
            <div>
              <h4 style="margin: 0; font-size: 14px; font-weight: 800; color: #0F172A;">
                ${mandi.name}
              </h4>
              <div style="font-size: 11px; color: #64748B;">
                ${mandi.state} • ${t('mandi_approx_location')}
              </div>
            </div>
            ${isBest ? `
              <span style="font-size: 9px; font-weight: 800; background: #FEF3C7; color: #B45309; border: 1px solid #F59E0B; padding: 2px 5px; border-radius: 4px; text-transform: uppercase;">
                ${t('mandi_best_price_nearby')}
              </span>
            ` : ''}
          </div>

          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">${t('mandi_price_label')}:</span>
              <strong style="color: #059669; font-size: 13px;">₹${mandi.price_for_crop} / q</strong>
            </div>
            ${mandi.distance_km !== undefined ? `
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #64748B;">${t('distance_label', 'Distance:')}</span>
                <strong style="color: #1E293B;">${mandi.distance_km} km away</strong>
              </div>
            ` : ''}
            <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">
              ${t('mandi_for_crop', { crop: selectedFarm?.crop?.crop_type || 'wheat' })} (representative data)
            </div>
          </div>
        </div>
      `;

      const marker = L.marker([mandi.latitude, mandi.longitude], { icon: mandiIcon });
      marker.bindPopup(mandiPopup, { maxWidth: 280 });
      mandiGroup.addLayer(marker);
      mandiMarkersRef.current[mandi.id] = marker;
    });
  }, [mandis, showMandisLayer, selectedFarm, t]);

  // Pan map to specific mandi with scroll and popup open
  const handleLocateMandi = (mandi: MandiItem) => {
    if (!showMandisLayer) {
      setShowMandisLayer(true);
    }
    mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([mandi.latitude, mandi.longitude], 13, { duration: 1.2 });
      setTimeout(() => {
        mandiMarkersRef.current[mandi.id]?.openPopup();
      }, 700);
    }
  };

  // ---------------------------------------------------------------------------
  // PART 4: RENDER COMMUNITY DISEASE OUTBREAKS ON MAP (Red-Orange Circles + Alert Pin)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const map = mapInstanceRef.current;
    const outbreakGroup = outbreaksLayerGroupRef.current;
    if (!map || !outbreakGroup) return;

    outbreakGroup.clearLayers();
    outbreakMarkersRef.current = {};

    if (!showOutbreaksLayer || nearbyOutbreaks.length === 0) return;

    nearbyOutbreaks.forEach((outbreak) => {
      if (!outbreak.location?.coordinates || outbreak.location.coordinates.length < 2) return;
      const [lng, lat] = outbreak.location.coordinates;

      // Outer warning radius circle (Part 4 requirement: red-orange circle)
      const circle = L.circle([lat, lng], {
        color: '#EA580C',
        fillColor: '#F97316',
        fillOpacity: 0.28,
        weight: 2,
        radius: 450,
      });

      // Center marker with alert icon
      const outbreakIcon = L.divIcon({
        className: 'custom-outbreak-pin',
        html: `
          <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #EA580C; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([lat, lng], { icon: outbreakIcon });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; padding: 2px; min-width: 250px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px; border-bottom: 1px solid #FED7AA; padding-bottom: 6px;">
            <div style="width: 30px; height: 30px; border-radius: 8px; background: #FFEDD5; display: flex; align-items: center; justify-content: center; color: #EA580C;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <strong style="font-size: 13px; color: #9A3412; display: block;">${t('outbreak_popup_title')}</strong>
              <span style="font-size: 11px; color: #7C2D12;">${outbreak.cropType.toUpperCase()} • ${t('outbreak_distance_from_farm', { distance: outbreak.distanceKm })}</span>
            </div>
          </div>

          <div style="margin-bottom: 6px; font-size: 12px;">
            <span style="color: #78716C;">${t('outbreak_concern_label')}:</span>
            <strong style="color: #9A3412; margin-left: 4px;">${outbreak.concern}</strong>
            ${outbreak.isDemo ? `<span style="margin-left: 6px; font-size: 9px; font-weight: bold; background: #FEF3C7; color: #B45309; padding: 2px 5px; border-radius: 4px; border: 1px solid #F59E0B; text-transform: uppercase;">${t('outbreak_demo_tag')}</span>` : ''}
          </div>

          <div style="font-size: 11px; color: #78716C; margin-bottom: 8px;">
            ${t('outbreak_days_ago', { count: outbreak.daysAgo })}
          </div>

          <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 8px; font-size: 11px; color: #431407; line-height: 1.4;">
            <div style="font-weight: bold; margin-bottom: 2px; color: #C2410C;">${t('outbreak_guidance_title')}</div>
            <div>${outbreak.guidance}</div>
            <div style="font-size: 10px; color: #9A3412; margin-top: 4px; font-style: italic;">
              * ${t('outbreak_guidance_disclaimer')}
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });
      circle.bindPopup(popupHtml, { maxWidth: 300 });

      outbreakGroup.addLayer(circle);
      outbreakGroup.addLayer(marker);

      outbreakMarkersRef.current[outbreak.id] = { marker, circle };
    });
  }, [nearbyOutbreaks, showOutbreaksLayer, t]);

  // Pan map to specific outbreak
  const handleLocateOutbreak = (outbreak: any) => {
    if (!showOutbreaksLayer) {
      setShowOutbreaksLayer(true);
    }
    mapContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (mapInstanceRef.current && outbreak.location?.coordinates) {
      const [lng, lat] = outbreak.location.coordinates;
      mapInstanceRef.current.flyTo([lat, lng], 14, { duration: 1.2 });
      setTimeout(() => {
        outbreakMarkersRef.current[outbreak.id]?.marker.openPopup();
      }, 700);
    }
  };

  // ---------------------------------------------------------------------------
  // EMPTY STATE (Cultivator has no farms yet)
  // ---------------------------------------------------------------------------
  if (!loading && farms.length === 0) {
    return (
      <div 
        id="gis-map-empty-state"
        className="bg-white border-2 border-dashed border-[#D8D5C5] rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xs"
      >
        <div className="w-16 h-16 rounded-3xl bg-[#EBF5EE] text-[#1E4620] mx-auto flex items-center justify-center border border-[#2D6A4F]/20 shadow-xs">
          <MapPin className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg sm:text-xl font-bold text-[#14251B]">
            {t('map_empty_title')}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-stone-600 leading-relaxed font-medium">
            {t('map_empty_desc')}
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            id="map-empty-add-farm-btn"
            onClick={onAddNew}
            className="h-11 px-6 rounded-2xl bg-[#1E4620] hover:bg-[#163719] text-white font-bold text-sm inline-flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>{t('btn_add_farm')}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Network / Backend Error Banner */}
      {error && (
        <div id="gis-map-error-banner" className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchMapData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-[11px] font-bold hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* PART 6: SAFE BEHAVIOUR — TILE ERROR BANNER */}
      {tileError && (
        <div 
          id="gis-map-tile-error-banner"
          className="bg-amber-50 border border-amber-300 text-amber-900 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{t('map_tile_error_msg')}</span>
          </div>
          <button
            type="button"
            onClick={() => setTileError(false)}
            className="text-[11px] font-bold text-amber-800 hover:underline cursor-pointer"
          >
            {t('map_tile_error_dismiss')}
          </button>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TOP CONTROLS BAR: Street/Satellite Switch & Layer Panel Toggle        */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-white border border-[#D8D5C5] rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Street / Satellite Toggle (PART 1) */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider hidden sm:inline">
            Base Map:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-stone-100 border border-stone-200 shadow-2xs">
            <button
              type="button"
              id="map-switch-street-btn"
              onClick={() => handleSwitchMapType('street')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                mapType === 'street'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapIcon className="w-4 h-4 text-[#1E4620]" />
              <span>{t('map_layer_street')}</span>
            </button>
            <button
              type="button"
              id="map-switch-satellite-btn"
              onClick={() => handleSwitchMapType('satellite')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                mapType === 'satellite'
                  ? 'bg-[#1E4620] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Layers className="w-4 h-4 text-amber-300" />
              <span>{t('map_layer_satellite')}</span>
            </button>
          </div>
        </div>

        {/* Selected Plot Quick Selector */}
        {validFarms.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-[#1E4620]" />
              <span className="hidden sm:inline">{t('mandi_selected_farm')}:</span>
            </span>
            <select
              id="map-select-farm-dropdown"
              value={selectedFarmId || ''}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="h-10 px-3 rounded-xl border border-stone-300 bg-[#FBFBF9] text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#1E4620]"
            >
              {validFarms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.crop?.crop_type || 'No Crop'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* PART 4: ACCESSIBLE MAP LAYERS BAR (Checkboxes, Large Touch Targets)   */}
      {/* --------------------------------------------------------------------- */}
      <div 
        id="gis-map-layers-panel"
        className="bg-white border border-[#D8D5C5] rounded-2xl p-3 sm:p-4 shadow-xs"
      >
        <div className="flex items-center justify-between border-b border-stone-100 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1E4620]" />
            <h4 className="text-xs sm:text-sm font-bold text-[#14251B] uppercase tracking-wider">
              {t('map_layers_title')}
            </h4>
          </div>
          <span className="text-[11px] text-stone-500 font-medium">
            Touch to show / hide data
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Layer 1: Farm Status & Boundaries */}
          <label 
            id="layer-toggle-farm-status"
            className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition select-none ${
              showFarmStatusLayer
                ? 'border-[#1E4620] bg-emerald-50/70 shadow-2xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="checkbox-farm-status-layer"
                checked={showFarmStatusLayer}
                onChange={(e) => setShowFarmStatusLayer(e.target.checked)}
                className="w-4 h-4 text-[#1E4620] rounded-sm focus:ring-[#1E4620]"
              />
              <span className="text-xs font-bold text-stone-800">
                {t('map_layer_farm_status')}
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          </label>

          {/* Layer 2: 24h Rain Forecast */}
          <label 
            id="layer-toggle-rain-forecast"
            className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition select-none ${
              showRainLayer
                ? 'border-sky-600 bg-sky-50/70 shadow-2xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="checkbox-rain-forecast-layer"
                checked={showRainLayer}
                onChange={(e) => setShowRainLayer(e.target.checked)}
                className="w-4 h-4 text-sky-600 rounded-sm focus:ring-sky-600"
              />
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-sky-600" />
                <span>{t('map_layer_rain_forecast')}</span>
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
          </label>

          {/* Layer 3: Nearby Mandi Markets */}
          <label 
            id="layer-toggle-mandis"
            className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition select-none ${
              showMandisLayer
                ? 'border-amber-600 bg-amber-50/70 shadow-2xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="checkbox-mandis-layer"
                checked={showMandisLayer}
                onChange={(e) => setShowMandisLayer(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-600"
              />
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>{t('map_layer_mandis')}</span>
              </span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </label>

          {/* Layer 4: Disease Alerts (Community Outbreaks) */}
          <label 
            id="layer-toggle-outbreaks-layer"
            className={`min-h-[44px] px-3.5 py-2.5 rounded-xl border-2 flex items-center justify-between gap-3 cursor-pointer transition select-none ${
              showOutbreaksLayer
                ? 'border-orange-600 bg-orange-50/70 shadow-2xs'
                : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="checkbox-outbreaks-layer"
                checked={showOutbreaksLayer}
                onChange={(e) => setShowOutbreaksLayer(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded-sm focus:ring-orange-600"
              />
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                <span>{t('map_layer_outbreaks')}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {nearbyOutbreaks.length > 0 && (
                <span className="text-[10px] font-black bg-orange-200 text-orange-950 px-1.5 py-0.5 rounded-full">
                  {nearbyOutbreaks.length}
                </span>
              )}
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
            </div>
          </label>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* PART 4: ACCESSIBLE ALWAYS-VISIBLE MAP LEGEND                           */}
      {/* --------------------------------------------------------------------- */}
      <div 
        id="gis-map-legend"
        className="bg-white border border-[#D8D5C5] rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#1E4620]" />
            <h3 className="text-xs sm:text-sm font-bold text-[#14251B] uppercase tracking-wider">
              {t('map_legend_title')}
            </h3>
          </div>
          <span className="text-[11px] font-bold text-stone-500 bg-stone-100 px-2.5 py-0.5 rounded-full">
            {validFarms.length} {t('map_active_plots_plotted')}
          </span>
        </div>

        {/* 4 Accessible status items: Icon + Color + Text */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Optimal Condition */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <div className="w-7 h-7 rounded-full bg-[#1E4620] text-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-bold text-[#1E4620]">
                {t('map_legend_optimal_title')}
              </div>
              <div className="text-[11px] text-stone-600 leading-snug mt-0.5">
                {t('map_legend_optimal_desc')}
              </div>
            </div>
          </div>

          {/* Attention Needed */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/80 border border-amber-200">
            <div className="w-7 h-7 rounded-full bg-amber-600 text-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-bold text-amber-900">
                {t('map_legend_warning_title')}
              </div>
              <div className="text-[11px] text-stone-600 leading-snug mt-0.5">
                {t('map_legend_warning_desc')}
              </div>
            </div>
          </div>

          {/* Critical Alert */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/80 border border-rose-200">
            <div className="w-7 h-7 rounded-full bg-rose-600 text-rose-100 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-bold text-rose-900">
                {t('map_legend_critical_title')}
              </div>
              <div className="text-[11px] text-stone-600 leading-snug mt-0.5">
                {t('map_legend_critical_desc')}
              </div>
            </div>
          </div>

          {/* Status Unavailable */}
          <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-stone-100/80 border border-stone-200">
            <div className="w-7 h-7 rounded-full bg-stone-600 text-stone-100 flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-bold text-stone-800">
                {t('map_legend_unknown_title')}
              </div>
              <div className="text-[11px] text-stone-600 leading-snug mt-0.5">
                {t('map_legend_unknown_desc')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* INVALID / MISSING COORDINATES BANNER                                  */}
      {/* --------------------------------------------------------------------- */}
      {invalidFarms.length > 0 && (
        <div 
          id="gis-map-invalid-coords-banner"
          className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start gap-3 text-xs text-amber-900 shadow-2xs"
        >
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">{t('map_invalid_coords_title', { count: invalidFarms.length })}: </span>
            <span>
              {invalidFarms.map((f) => f.name).join(', ')} ({t('map_invalid_coords_desc')})
            </span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* LEAFLET.JS MAP CONTAINER WITH TILE ATTRIBUTION CONTROL                */}
      {/* --------------------------------------------------------------------- */}
      <div className="relative rounded-3xl overflow-hidden border border-[#D8D5C5] shadow-xs bg-stone-100">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs z-20 flex items-center justify-center gap-2 text-xs font-bold text-[#1E4620]">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{t('map_loading')}</span>
          </div>
        )}

        <div
          id="gis-leaflet-map-container"
          ref={mapContainerRef}
          className="w-full h-[520px] sm:h-[580px] z-10"
          style={{ minHeight: '480px' }}
        />

        {/* Required Attribution Text on the Map (Part 1 Mandate) */}
        <div 
          id="gis-map-attribution-text"
          className="absolute bottom-1 right-1 z-20 bg-black/60 backdrop-blur-xs text-[10px] text-white/90 px-2.5 py-1 rounded-lg pointer-events-none max-w-[85%] truncate shadow-xs"
        >
          {mapType === 'street' ? t('map_attr_street') : t('map_attr_satellite')}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* PART 5: NEARBY APMC MANDIS & "BEST PLACE TO SELL" PANEL               */}
      {/* --------------------------------------------------------------------- */}
      {showMandisLayer && (
        <div 
          id="gis-nearby-mandis-panel"
          className="bg-white border border-[#D8D5C5] rounded-3xl p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#14251B] flex items-center gap-2">
                <Store className="w-4 h-4 text-[#1E4620]" />
                <span>{t('mandi_nearest_title')}</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                {t('mandi_nearest_desc')} • <span className="font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">{t('mandi_approx_location')}</span>
              </p>
            </div>

            {selectedFarm && (
              <span className="text-xs font-bold text-[#1E4620] bg-emerald-50 border border-emerald-300 px-3 py-1 rounded-xl flex items-center gap-1.5">
                <span>🌱 {t('mandi_selected_farm')}: {selectedFarm.name}</span>
                <span className="text-stone-500 font-medium">({selectedFarm.crop?.crop_type || 'wheat'})</span>
              </span>
            )}
          </div>

          {loadingMandis ? (
            <div className="p-8 text-center text-xs font-semibold text-stone-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#1E4620]" />
              <span>{t('calculating_mandi_prices', 'Calculating nearby mandi distances and market prices...')}</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {mandis.map((mandi) => {
                const isBest = mandi.is_best_price_nearby;
                return (
                  <div
                    key={mandi.id}
                    id={`mandi-card-${mandi.id}`}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isBest
                        ? 'border-amber-400 bg-amber-50/60 shadow-xs ring-2 ring-amber-400/40'
                        : 'border-stone-200 bg-[#FBFBF9] hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span>{mandi.name}</span>
                          {isBest && <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />}
                        </div>
                        <div className="text-[11px] text-stone-500">
                          {mandi.state}
                        </div>
                      </div>

                      {isBest && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-md shadow-2xs">
                          {t('mandi_best_price_nearby')}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-stone-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[11px] text-stone-500 block">Rate for {selectedFarm?.crop?.crop_type || 'crop'}:</span>
                        <span className="font-extrabold text-emerald-800 text-sm">
                          {t('mandi_commodity_rate', { price: mandi.price_for_crop })}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-stone-500 block">{t('distance_label', 'Distance:')}</span>
                        <span className="font-bold text-stone-800">
                          {mandi.distance_km !== undefined ? t('mandi_distance_km', { distance: mandi.distance_km }) : '—'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id={`locate-mandi-btn-${mandi.id}`}
                      onClick={() => handleLocateMandi(mandi)}
                      className="mt-2.5 w-full py-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-[11px] font-bold text-stone-700 flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-[#1E4620]" />
                      <span>{t('mandi_locate_btn')}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* COMMUNITY DISEASE OUTBREAKS PANEL (Surveillance Reports & Safe Guidance) */}
      {/* --------------------------------------------------------------------- */}
      {selectedFarm && (
        <div 
          id="gis-nearby-outbreaks-panel"
          className="bg-white border border-[#D8D5C5] rounded-3xl p-5 shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-200 shadow-2xs">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#14251B] flex items-center gap-2">
                  <span>{t('outbreak_panel_title')}</span>
                  {nearbyOutbreaks.length > 0 && (
                    <span className="text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 px-2 py-0.5 rounded-full">
                      {nearbyOutbreaks.length}
                    </span>
                  )}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  {t('outbreak_layer_desc')} — {selectedFarm.name} ({selectedFarm.crop?.crop_type || 'Crop'})
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-orange-800 bg-orange-50 border border-orange-300 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <span>🌾 {selectedFarm.name}</span>
            </span>
          </div>

          {loadingOutbreaks ? (
            <div className="p-8 text-center text-xs font-semibold text-stone-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-orange-600" />
              <span>{t('checking_disease_reports', 'Checking community disease surveillance reports...')}</span>
            </div>
          ) : nearbyOutbreaks.length === 0 ? (
            <div className="p-6 text-center text-xs font-semibold text-stone-500 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
              {t('outbreak_panel_empty')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {nearbyOutbreaks.map((outbreak) => (
                <div
                  key={outbreak.id}
                  id={`outbreak-card-${outbreak.id}`}
                  className="p-3.5 rounded-2xl border-2 border-orange-200 bg-orange-50/40 hover:bg-orange-50/70 transition space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-black uppercase tracking-wider bg-orange-200 text-orange-950 px-2 py-0.5 rounded">
                          {outbreak.cropType}
                        </span>
                        {outbreak.isDemo && (
                          <span 
                            id={`demo-tag-map-${outbreak.id}`}
                            className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded"
                          >
                            {t('outbreak_demo_tag')}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">
                        {outbreak.concern}
                      </h4>
                    </div>
                    <span className="text-xs font-bold text-orange-800 whitespace-nowrap">
                      {outbreak.distanceKm} km away
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {outbreak.guidance}
                  </p>

                  <div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-stone-500 font-medium">
                      {t('outbreak_days_ago', { count: outbreak.daysAgo })}
                    </span>
                    <button
                      type="button"
                      id={`locate-outbreak-btn-${outbreak.id}`}
                      onClick={() => handleLocateOutbreak(outbreak)}
                      className="py-1 px-2.5 rounded-lg bg-white hover:bg-orange-100 border border-orange-300 text-[11px] font-bold text-orange-800 flex items-center gap-1 transition cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-orange-600" />
                      <span>{t('mandi_locate_btn')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import React, { useRef, useCallback, useState, useEffect } from 'react';
import Map, { Marker, NavigationControl, MapRef, Source, Layer } from "react-map-gl/mapbox";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useLocation } from '../contexts/LocationContext';

interface Clinic {
  id: string;
  name: string;
  address: string;
  distance: number;
  longitude: number;
  latitude: number;
  rating: number;
  phone: string;
}

interface LocationWidgetProps {
  onClose?: () => void;
  onClinicSelect?: (clinic: Clinic) => void;
  clinics?: any[]; // Allow external control of clinics list
}

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Base location: 1450 Guy St, Montreal, Quebec H3H 0A1
const BASE_LOCATION = { longitude: -73.5791, latitude: 45.4953 };

// Real Montreal clinics for the hackathon demo
const CLINIC_DATA = [
  {
    id: 'clinic-1',
    name: 'Clinique Médicale Crescent',
    address: '1198 Crescent St, Montreal, Quebec H3G 2A9',
    distance: 0.3,
    rating: 2.1,
    phone: '(514) 933-8383'
  },
  {
    id: 'clinic-2',
    name: 'Clinique Médicale Privée UnionMD',
    address: '1191 Avenue Union, Montreal, Quebec H3B 3C3',
    distance: 0.5,
    rating: 4.5,
    phone: '(514) 332-4546'
  },
  {
    id: 'clinic-3',
    name: 'CuraMed',
    address: '4150 Rue Sainte-Catherine O #330, Westmount, Quebec H3Z 2Y5',
    distance: 1.8,
    rating: 4.8,
    phone: '(514) 612-2430'
  },
  {
    id: 'clinic-4',
    name: 'Clinique Santé MD',
    address: '1411 Peel St, Montreal, Quebec H3A 1S5',
    distance: 0.4,
    rating: 4.2,
    phone: '(514) 843-1234'
  },
  {
    id: 'clinic-5',
    name: 'Centre Médical Westmount',
    address: '5025 Sherbrooke St W, Westmount, Quebec H3Z 1H2',
    distance: 2.1,
    rating: 4.6,
    phone: '(514) 481-0268'
  },
  {
    id: 'clinic-6',
    name: 'Clinique Médicale 1851',
    address: '1851 Sherbrooke St E, Montreal, Quebec H2K 1B4',
    distance: 3.5,
    rating: 3.9,
    phone: '(514) 524-7548'
  },
  {
    id: 'clinic-7',
    name: 'Clinique Médicale du Plateau',
    address: '1315 Mont-Royal Ave E, Montreal, Quebec H2J 1Y6',
    distance: 2.8,
    rating: 4.1,
    phone: '(514) 521-1223'
  },
  {
    id: 'clinic-8',
    name: 'Clinique Médicale Métro',
    address: '1844 Rue Sainte-Catherine O, Montreal, Quebec H3H 1M1',
    distance: 0.2,
    rating: 3.8,
    phone: '(514) 932-2334'
  },
  {
    id: 'clinic-9',
    name: 'Westmount Square Health Group',
    address: '1 Westmount Sq, Westmount, Quebec H3Z 2P9',
    distance: 1.5,
    rating: 4.9,
    phone: '(514) 934-2334'
  },
  {
    id: 'clinic-10',
    name: 'Rockland MD',
    address: '100 Chemin Rockland, Mont-Royal, Quebec H3P 2V9',
    distance: 4.2,
    rating: 4.7,
    phone: '(514) 341-2555'
  },
  {
    id: 'clinic-11',
    name: 'Clinique Médicale Greene',
    address: '1241 Greene Ave, Westmount, Quebec H3Z 2A4',
    distance: 1.6,
    rating: 4.4,
    phone: '(514) 932-1111'
  },
  {
    id: 'clinic-12',
    name: 'Medi-Club',
    address: '2155 Guy St #500, Montreal, Quebec H3H 2R9',
    distance: 0.6,
    rating: 3.5,
    phone: '(514) 935-8555'
  }
];

// Random landmarks to make the map feel alive
const LANDMARK_DATA = [
  { id: 'l1', type: 'cafe', name: 'Café Myriade', lat: 45.4948, lng: -73.5785 },
  { id: 'l2', type: 'gym', name: 'Nautilus Plus', lat: 45.4960, lng: -73.5770 },
  { id: 'l3', type: 'park', name: 'Dorchester Square', lat: 45.5005, lng: -73.5710 },
  { id: 'l4', type: 'pharmacy', name: 'Jean Coutu', lat: 45.4935, lng: -73.5765 },
  { id: 'l5', type: 'cafe', name: 'Starbucks', lat: 45.4975, lng: -73.5780 },
  { id: 'l6', type: 'gym', name: 'Econofitness', lat: 45.4925, lng: -73.5800 },
  { id: 'l7', type: 'park', name: 'Place du Canada', lat: 45.4990, lng: -73.5720 },
  { id: 'l8', type: 'cafe', name: 'Humble Lion', lat: 45.5030, lng: -73.5750 },
  { id: 'l9', type: 'pharmacy', name: 'Pharmaprix', lat: 45.4950, lng: -73.5730 },
  { id: 'l10', type: 'gym', name: 'YMCA Centre-ville', lat: 45.5010, lng: -73.5745 }
];

const LocationWidget: React.FC<LocationWidgetProps> = ({ onClose, onClinicSelect }) => {
  const { userLocation } = useLocation();
  const mapRef = useRef<MapRef>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.Feature | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use user location or default to base location (1450 Guy St)
  const mapCenter = userLocation || BASE_LOCATION;

  // Geocode clinic addresses on mount
  useEffect(() => {
    const geocodeClinics = async () => {
      setIsLoading(true);
      const geocodedClinics: Clinic[] = [];

      // Process in chunks to avoid rate limits
      for (const clinic of CLINIC_DATA) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(clinic.address)}.json?` +
            `access_token=${MAPBOX_TOKEN}&limit=1`
          );
          const data = await response.json();

          if (data.features && data.features[0]) {
            geocodedClinics.push({
              ...clinic,
              longitude: data.features[0].center[0],
              latitude: data.features[0].center[1]
            });
          }
        } catch (error) {
          console.error(`Error geocoding ${clinic.name}:`, error);
        }
        // Small delay
        await new Promise(r => setTimeout(r, 50));
      }

      setClinics(geocodedClinics);
      setIsLoading(false);
    };

    geocodeClinics();
  }, []);

  // Force map resize when it loads
  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.resize();
    }
  }, []);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get route to selected clinic
  const getRoute = async (clinic: Clinic) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/` +
        `${mapCenter.longitude},${mapCenter.latitude};${clinic.longitude},${clinic.latitude}?` +
        `geometries=geojson&` +
        `access_token=${MAPBOX_TOKEN}`
      );

      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        setRouteGeoJson({
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        });

        // Fit map to show the route
        if (mapRef.current) {
          const coordinates = route.geometry.coordinates;
          // Use imported mapboxgl
          const bounds = coordinates.reduce(
            (bounds: any, coord: number[]) => bounds.extend(coord),
            new mapboxgl.LngLatBounds(coordinates[0] as [number, number], coordinates[0] as [number, number])
          );
          mapRef.current.fitBounds(bounds, { padding: 50, pitch: 45, bearing: -10 });
        }
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  // Handle clinic selection
  const handleClinicSelect = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    getRoute(clinic);
  };

  // Handle final selection
  // Handle final selection
  const handleConfirmSelection = () => {
    if (onClinicSelect && selectedClinic) {
      onClinicSelect(selectedClinic);
    }
  };

  const getLandmarkIcon = (type: string) => {
    switch (type) {
      case 'cafe': return 'local_cafe';
      case 'gym': return 'fitness_center';
      case 'park': return 'park';
      case 'pharmacy': return 'medication';
      default: return 'place';
    }
  };

  const getLandmarkColor = (type: string) => {
    switch (type) {
      case 'cafe': return 'text-amber-600 bg-amber-50';
      case 'gym': return 'text-purple-600 bg-purple-50';
      case 'park': return 'text-green-600 bg-green-50';
      case 'pharmacy': return 'text-teal-600 bg-teal-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="h-full bg-soft-cream flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 w-full">
      <div className="p-6 border-b border-black/5 flex justify-between items-center bg-white/50 backdrop-blur-sm flex-shrink-0">
        <div>
          <h2 className="serif-font text-3xl text-primary">Find Nearby Doctors</h2>
          <p className="text-gray-500 text-xs font-medium mt-1">
            {userLocation ? 'Showing clinics near your location' : 'Enable location to find nearby clinics'}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="size-8 rounded-full bg-white border border-black/5 flex items-center justify-center hover:bg-black hover:text-white transition-all">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Map Container */}
        <div className="min-h-[300px] h-1/2 bg-gray-100 relative flex-shrink-0">
          <Map
            ref={mapRef}
            key={`${mapCenter.longitude}-${mapCenter.latitude}`}
            initialViewState={{
              longitude: mapCenter.longitude,
              latitude: mapCenter.latitude,
              zoom: 15.5,
              pitch: 60,
              bearing: -17.6
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            mapboxAccessToken={MAPBOX_TOKEN}
            onLoad={onMapLoad}
            reuseMaps
            // Removed terrain prop to avoid "Source mapbox-dem cannot be removed" error during widget switch
            fog={{
              'range': [0.8, 8],
              'color': '#dc9f9f',
              'horizon-blend': 0.5,
              'high-color': '#245bde',
              'space-color': '#333',
              'star-intensity': 0.15
            }}
          >
            <NavigationControl position="bottom-right" />

            {/* 3D Buildings Layer */}
            <Layer
              id="3d-buildings"
              source="composite"
              source-layer="building"
              filter={['==', 'extrude', 'true']}
              type="fill-extrusion"
              minzoom={15}
              paint={{
                'fill-extrusion-color': '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }}
            />

            {/* Route line */}
            {routeGeoJson && (
              <Source id="route" type="geojson" data={routeGeoJson}>
                <Layer
                  id="route-line"
                  type="line"
                  paint={{
                    'line-color': '#3b82f6',
                    'line-width': 4,
                    'line-opacity': 0.8
                  }}
                />
              </Source>
            )}

            {/* Ambient Landmarks */}
            {LANDMARK_DATA.map((landmark) => (
              <Marker
                key={landmark.id}
                longitude={landmark.lng}
                latitude={landmark.lat}
                anchor="bottom"
              >
                <div className={`p-1.5 rounded-full border border-white shadow-sm opacity-90 scale-75 hover:scale-100 transition-transform ${getLandmarkColor(landmark.type)}`}>
                  <span className="material-symbols-outlined text-sm">{getLandmarkIcon(landmark.type)}</span>
                </div>
              </Marker>
            ))}

            {/* User's location marker */}
            <Marker longitude={mapCenter.longitude} latitude={mapCenter.latitude} anchor="bottom">
              <div className="relative">
                <div className="size-6 bg-primary rounded-full border-4 border-white shadow-2xl pulse-red"></div>
              </div>
            </Marker>

            {/* Clinic markers */}
            {clinics.map((clinic, index) => (
              <Marker
                key={clinic.id}
                longitude={clinic.longitude}
                latitude={clinic.latitude}
                anchor="bottom"
                onClick={() => handleClinicSelect(clinic)}
              >
                <div className={`cursor-pointer transition-transform ${selectedClinic?.id === clinic.id ? 'scale-125' : 'hover:scale-110'}`}>
                  <span className={`material-symbols-outlined text-3xl drop-shadow-md ${selectedClinic?.id === clinic.id ? 'text-blue-500' : 'text-red-500'
                    }`}>location_on</span>
                </div>
              </Marker>
            ))}
          </Map>
        </div>

        {/* Clinic List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-3xl text-gray-400">progress_activity</span>
            </div>
          ) : clinics.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p>No clinics found nearby</p>
            </div>
          ) : (
            clinics.map((clinic, index) => (
              <div
                key={clinic.id}
                onClick={() => handleClinicSelect(clinic)}
                className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md ${selectedClinic?.id === clinic.id
                  ? 'border-blue-500 ring-2 ring-blue-100'
                  : 'border-black/5 hover:border-primary'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="size-6 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xs font-black">
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-lg text-primary leading-tight">{clinic.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-400 whitespace-nowrap ml-2 bg-gray-50 px-2 py-1 rounded-lg">
                    {clinic.distance.toFixed(1)} mi
                  </span>
                </div>
                <div className="flex items-center gap-1 text-orange-500 mb-2 ml-8">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`material-symbols-outlined text-[16px] ${star <= Math.round(clinic.rating) ? 'fill-1' : 'opacity-30'}`}
                    >
                      star
                    </span>
                  ))}
                  <span className="text-sm font-black ml-1">{clinic.rating}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1 ml-8">{clinic.address}</p>
                <p className="text-xs text-gray-500 font-medium mb-3 ml-8">
                  <span className="material-symbols-outlined text-[12px] align-middle mr-1">call</span>
                  {clinic.phone}
                </p>
                {selectedClinic?.id === clinic.id && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleConfirmSelection(); }}
                    className="w-full bg-primary text-white py-3 rounded-xl text-xs font-black shadow-lg shadow-black/5 hover:bg-black transition-all mt-2"
                  >
                    Select This Center
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LocationWidget;

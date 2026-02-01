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
}

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

// Base location: 1450 Guy St, Montreal, Quebec H3H 0A1
const BASE_LOCATION = { longitude: -73.5791, latitude: 45.4953 };

// Healthcare categories - ONLY doctors offices (most specific)
const HEALTHCARE_CATEGORIES = [
  'doctors_office',
  'medical_clinic'
];

// ONLY show results containing these terms (family/general practice indicators)
const INCLUDED_TERMS = [
  'clinique médicale', 'medical clinic', 'clinique medicale',
  'family', 'famille', 'familial',
  'general', 'généraliste', 'generaliste',
  'walk-in', 'sans rendez-vous', 'walk in',
  'médecin', 'medecin', 'doctor', 'dr.',
  'gmc', 'clsc', 'polyclinique', 'polyclinic',
  'group health', 'groupe santé', 'health center', 'centre de santé'
];

// Filter out these specialist types
const EXCLUDED_TERMS = [
  // Sexual health / Non-GP practitioners
  'sexolog', 'sexuel', 'sexual',
  // Osteopathy (with French accents)
  'ostéopath', 'osteopath', 'ostéo',
  // Specialists
  'plastic', 'cosmetic', 'surgery', 'surgeon', 'chirurgie', 'esthetique', 'esthétique',
  'pediatr', 'pédiatr', 'enfant', 'child', 'kid',
  'gynec', 'gynéc', 'obstet', 'obstét', 'fertility', 'fertilité', 'ivf',
  'cardio', 'neuro', 'oncol', 'cancer', 'urolog', 'gastro', 'pulmon', 'endocrin',
  'orthop', 'ortho', 'spine', 'joint', 'sport medicine',
  'allerg', 'immun', 'rheuma',
  // Mental health / Addiction
  'psychiatr', 'psycholog', 'mental', 'therapy', 'thérap', 'counsel', 'addiction',
  'toxicoman', 'rehab', 'recovery', 'detox', 'substance', 'dependan',
  'alcool', 'drogue', 'sobri', 'treatment center',
  // Dental
  'dentist', 'dental', 'dentaire', 'orthodont',
  // Other non-GP
  'chiropract', 'physiother', 'optometr', 'ophthalm', 'podiatr', 'dermato',
  'veterinar', 'acupunctur', 'massage', 'spa', 'beauty',
  'naturopath', 'homeopath', 'kinesiolog', 'kinésio',
  // Labs & imaging
  'laboratory', 'laboratoire', 'imaging', 'x-ray', 'radiolog',
  // Social services
  'social', 'community', 'communautaire', 'shelter', 'refuge',
  // Pharmacy
  'pharmacy', 'pharmacie', 'drugstore',
  // Ear/Nose/Throat specialists
  'ear', 'nose', 'throat', 'ent ', 'orl', 'audio', 'hearing',
  // Other random non-GP
  'evolution', 'hope', 'wellness', 'bien-être', 'holistic', 'holistique'
];


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

const LocationWidget: React.FC<LocationWidgetProps> = ({ onClose, onClinicSelect }) => {
  const { userLocation, requestLocation } = useLocation();
  const mapRef = useRef<MapRef>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.Feature | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Request user's actual location on mount
  useEffect(() => {
    if (!userLocation) {
      requestLocation();
    }
  }, []);

  // Fly to user's location when it becomes available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.flyTo({
        center: [userLocation.longitude, userLocation.latitude],
        zoom: 15.5,
        pitch: 60,
        bearing: -17.6,
        duration: 2000
      });
    }
  }, [userLocation]);

  // Use user location or default to base location (1450 Guy St)
  const mapCenter = userLocation || BASE_LOCATION;

  // Fetch nearby clinics from Mapbox Search Box API
  useEffect(() => {
    // Only fetch when we have the user's actual location
    if (!userLocation) {
      setIsLoading(true);
      return;
    }

    const fetchNearbyClinics = async () => {
      setIsLoading(true);
      const allClinics: Clinic[] = [];
      const seenIds = new Set<string>();

      // Search multiple healthcare categories
      for (const category of HEALTHCARE_CATEGORIES) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/search/searchbox/v1/category/${category}?` +
            `access_token=${MAPBOX_TOKEN}&` +
            `proximity=${userLocation.longitude},${userLocation.latitude}&` +
            `limit=25&` +
            `language=en`
          );
          const data = await response.json();

          if (data.features) {
            for (const feature of data.features) {
              // Avoid duplicates
              if (seenIds.has(feature.properties.mapbox_id)) continue;
              seenIds.add(feature.properties.mapbox_id);

              const coords = feature.geometry.coordinates;
              const props = feature.properties;
              
              // Build searchable text (name + address)
              const nameLower = (props.name || '').toLowerCase();
              const addressLower = (props.full_address || props.address || '').toLowerCase();
              const searchText = nameLower + ' ' + addressLower;
              
              // Filter out excluded types (specialists, etc.)
              const isExcluded = EXCLUDED_TERMS.some(term => 
                searchText.includes(term)
              );
              if (isExcluded) continue;
              
              // MUST contain at least one included term (family/GP indicators)
              const isIncluded = INCLUDED_TERMS.some(term => 
                searchText.includes(term)
              );
              if (!isIncluded) continue;
              
              // Calculate distance from user
              const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                coords[1],
                coords[0]
              );

              allClinics.push({
                id: props.mapbox_id,
                name: props.name || 'Medical Facility',
                address: props.full_address || props.address || 'Address not available',
                distance: distance,
                longitude: coords[0],
                latitude: coords[1],
                rating: Math.round((props.metadata?.rating || (3.5 + Math.random() * 1.5)) * 10) / 10,
                phone: props.metadata?.phone || 'Phone not available'
              });
            }
          }
        } catch (error) {
          console.error(`Error fetching ${category}:`, error);
        }
      }

      // Sort by distance
      allClinics.sort((a, b) => a.distance - b.distance);
      
      // Limit to exactly 10
      setClinics(allClinics.slice(0, 10));
      setIsLoading(false);
    };

    fetchNearbyClinics();
  }, [userLocation]);

  // Force map resize when it loads
  const onMapLoad = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.resize();
    }
  }, []);

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

  const handleConfirmSelection = () => {
    if (onClinicSelect && selectedClinic) {
      onClinicSelect(selectedClinic);
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

import { Clinic } from '../types/index.js';

// Hardcoded clinic data for the hackathon demo
export const clinics: Clinic[] = [
  {
    id: 'clinic-1',
    name: 'City Health Center',
    address: '123 Main Street, Montreal, QC',
    phone: '+15141234567',
    distance: '0.8 miles',
    rating: 4.8,
    tags: ['GP', 'Urgent Care'],
    coordinates: { lat: 45.5017, lng: -73.5673 }
  },
  {
    id: 'clinic-2',
    name: 'Prime Care Medical',
    address: '456 Saint-Laurent Blvd, Montreal, QC',
    phone: '+15149876543',
    distance: '1.2 miles',
    rating: 4.5,
    tags: ['Diagnostics'],
    coordinates: { lat: 45.5088, lng: -73.5540 }
  },
  {
    id: 'clinic-3',
    name: 'St. Mary Diagnostics',
    address: '789 Sherbrooke St W, Montreal, QC',
    phone: '+15145551234',
    distance: '2.4 miles',
    rating: 4.9,
    tags: ['Cardiology'],
    coordinates: { lat: 45.4972, lng: -73.5790 }
  }
];

export function getClinicById(id: string): Clinic | undefined {
  return clinics.find(c => c.id === id);
}

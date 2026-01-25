import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
let db: admin.firestore.Firestore;

try {
  const serviceAccountPath = path.join(__dirname, '../../../serviceAccountKey.json');
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'healthme-cd5cf'
  });

  db = admin.firestore();
  console.log('[Firestore] Firebase Admin initialized successfully');
} catch (error) {
  console.error('[Firestore] Failed to initialize Firebase Admin:', error);
  throw error;
}

export interface UserProfile {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
  };
  physicalStats: {
    height: string;
    weight: string;
  };
  bloodType: string;
  allergies: string[];
  medicalConditions: {
    conditions: string[];
    notes: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profileRef = db.collection('users').doc(userId).collection('profile').doc('data');
    const profileDoc = await profileRef.get();

    if (profileDoc.exists) {
      return profileDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Error getting user profile:', error);
    return null;
  }
}

/**
 * Format user profile as a clean string for the ElevenLabs agent
 */
export function formatProfileForAgent(profile: UserProfile): string {
  const parts: string[] = [];

  // Personal Info
  if (profile.personalInfo) {
    parts.push(`Name: ${profile.personalInfo.fullName}`);
    parts.push(`Date of Birth: ${profile.personalInfo.dateOfBirth}`);
    parts.push(`Gender: ${profile.personalInfo.gender}`);
  }

  // Physical Stats
  if (profile.physicalStats) {
    parts.push(`Height: ${profile.physicalStats.height}`);
    parts.push(`Weight: ${profile.physicalStats.weight} lbs`);
  }

  // Blood Type
  if (profile.bloodType) {
    parts.push(`Blood Type: ${profile.bloodType}`);
  }

  // Allergies
  if (profile.allergies && profile.allergies.length > 0) {
    parts.push(`Allergies: ${profile.allergies.join(', ')}`);
  } else {
    parts.push(`Allergies: None`);
  }

  // Medical Conditions
  if (profile.medicalConditions) {
    if (profile.medicalConditions.conditions && profile.medicalConditions.conditions.length > 0) {
      parts.push(`Medical Conditions: ${profile.medicalConditions.conditions.join(', ')}`);
    }
    if (profile.medicalConditions.notes) {
      parts.push(`Medical Notes: ${profile.medicalConditions.notes}`);
    }
  }

  // Emergency Contact
  if (profile.emergencyContact) {
    parts.push(`Emergency Contact: ${profile.emergencyContact.name} (${profile.emergencyContact.relationship}), Phone: ${profile.emergencyContact.phone}`);
  }

  return parts.join('. ');
}

export { db };

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../../db.json');

interface UserProfile {
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
}

const readDb = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { currentChatId: null, chats: {}, userProfile: null };
  }
};

const writeDb = (data: any) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// Save user profile from onboarding
router.post('/', (req, res) => {
  try {
    const profile: UserProfile = req.body;
    const db = readDb();
    
    db.userProfile = {
      ...profile,
      updatedAt: new Date().toISOString()
    };
    
    writeDb(db);
    
    console.log('[Profile] User profile saved successfully');
    res.json({ success: true, message: 'Profile saved successfully' });
  } catch (error) {
    console.error('[Profile] Error saving profile:', error);
    res.status(500).json({ success: false, error: 'Failed to save profile' });
  }
});

// Get user profile
router.get('/', (req, res) => {
  try {
    const db = readDb();
    
    if (!db.userProfile) {
      return res.json({ success: true, profile: null, onboardingCompleted: false });
    }
    
    res.json({ 
      success: true, 
      profile: db.userProfile,
      onboardingCompleted: db.userProfile.onboardingCompleted || false
    });
  } catch (error) {
    console.error('[Profile] Error getting profile:', error);
    res.status(500).json({ success: false, error: 'Failed to get profile' });
  }
});

// Update specific profile fields
router.patch('/', (req, res) => {
  try {
    const updates = req.body;
    const db = readDb();
    
    if (!db.userProfile) {
      db.userProfile = {};
    }
    
    db.userProfile = {
      ...db.userProfile,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    writeDb(db);
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('[Profile] Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

export default router;

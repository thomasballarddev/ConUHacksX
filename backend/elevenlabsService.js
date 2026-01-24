const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
const dotenv = require('dotenv');

dotenv.config();

const client = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

// Function to initiate a call to the clinic (Test number)
async function callClinic(patientSummary) {
    try {
        console.log("Initiating call to clinic...");
        
        // This assumes you have configured an Agent in ElevenLabs dashboard
        // and have Twilio connected in ElevenLabs OR we use the SDK to trigger it.
        // If using the SDK to trigger a call to a phone number:
        
        /* 
           NOTE: As of early 2025, ElevenLabs JS SDK might have specific methods for this.
           If not, we might need to use Twilio directly to Dial, and then Connect to ElevenLabs Stream.
           
           However, the easiest way for "Agent to call out" is often using the ElevenLabs API 
           trigger if supported, or Twilio <Connect> to the ElevenLabs WebSocket.
           
           For this prototype, we'll assume we use Twilio to dial OUT, 
           and when they answer, we connect them to the ElevenLabs Agent via WebSocket.
        */
        
        // Return true to signal we should start the Twilio flow
        return true; 
    } catch (error) {
        console.error("Error initiating call:", error);
        throw error;
    }
}

module.exports = { callClinic };

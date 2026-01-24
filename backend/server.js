const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const dotenv = require('dotenv');
const cors = require('cors');
const { callClinic } = require('./elevenlabsService');
const { handleTwilioStream } = require('./twilioStream');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Global reference for the User UI socket
global.userSocket = null;
global.broadcastToUser = (type, data) => {
    if (global.userSocket && global.userSocket.readyState === WebSocket.OPEN) {
        global.userSocket.send(JSON.stringify({ type, ...data }));
        console.log(`Broadcasted ${type} to User UI`);
    } else {
        console.log("User UI not connected, cannot broadcast");
    }
};

global.activeTwilioStream = null;

wss.on('connection', (ws, req) => {
    // Check if it's the User UI or Twilio
    // Simple distinction: User UI connects to /, Twilio writes to /twilio/stream but that's a route.
    // Actually, Twilio connection comes via <Connect><Stream url="..."/></Connect>. 
    // The url will be ws://domain/streams/twilio
    
    const url = req.url;
    
    if (url.includes('/streams/twilio')) {
        console.log("Twilio Stream Connection Attempt");
        handleTwilioStream(ws, req, process.env.ELEVENLABS_AGENT_ID);
    } else {
        console.log('User UI Connected');
        global.userSocket = ws;

        ws.on('message', async (message) => {
            console.log('Received from User UI:', message);
            try {
                const data = JSON.parse(message);
                
                if (data.type === 'start_clinic_call') {
                    // Trigger the phone call
                    // Determine which number to call based on severity
                    const severity = data.severity || 'normal';
                    let targetNumber = process.env.CLINIC_PHONE_NUMBER;
                    
                    if (severity === 'critical') {
                        console.log("CRITICAL SEVERITY DETECTED. DIALING EMERGENCY NUMBER.");
                        targetNumber = process.env.EMERGENCY_PHONE_NUMBER;
                    }

                    console.log(`Initiating call to: ${targetNumber} (Severity: ${severity})`);

                    // callClinic handles the Twilio API call to Dial logic
                    // We need to implement callClinic to output TwiML that points to THIS stream
                    try {
                        const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                        
                        // Using ngrok or public URL. Since we are local, we need ngrok.
                        // I will ask user for public URL or assume hardcoded for now.
                        // For now we just log it.
                        console.log(`Mocking Twilio Call to ${targetNumber}...`);
                        
                        // REAL CALL LOGIC (Commented out until config set):
                        /*
                        await twilio.calls.create({
                             url: `https://${process.env.PUBLIC_URL}/twilio/twiml`,
                             to: targetNumber,
                             from: process.env.TWILIO_PHONE_NUMBER
                        });
                        */
                       
                       // For testing without real phone, we can simulate the connection if we had a simulated stream.
                       // But checking flow: UI -> Backend -> Log "Calling".
                       
                    } catch (e) { console.error(e); }
                }

                if (data.type === 'slot_selected') {
                    console.log(`User selected: ${data.slot}`);
                    // Sending to Phone Agent
                    if (global.activeTwilioStream && global.activeTwilioStream.injectText) {
                        // "The user picked..."
                        global.activeTwilioStream.injectText(`The user has selected the appointment for ${data.slot}.`);
                    }
                }

            } catch (e) { console.error(e); }
        });

        ws.on('close', () => {
            console.log('User UI disconnected');
            global.userSocket = null;
        });
    }
});

// Endpoint for Twilio to fetch TwiML
app.post('/twilio/twiml', (req, res) => {
    // Return TwiML to connect to the Stream
    // Replace with your ngrok/public domain
    const host = req.get('host'); // e.g. qwerty.ngrok.io
    const xml = `
    <Response>
        <Connect>
            <Stream url="wss://${host}/streams/twilio" />
        </Connect>
    </Response>
    `;
    res.type('text/xml');
    res.send(xml);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

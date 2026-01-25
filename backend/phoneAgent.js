/**
 * Phone Agent Service - Handles outbound calls to clinic via ElevenLabs + Twilio
 */

const { agentBridge, AgentBridge } = require('./agentBridge');

class PhoneAgentService {
  constructor() {
    this.activeConversationId = null;
    this.isCallActive = false;
    this.setupBridgeListeners();
  }

  /**
   * Setup listeners for events from Chat Agent
   */
  setupBridgeListeners() {
    agentBridge.on('toPhoneAgent', async (message) => {
      console.log('[PhoneAgent] Received:', message.type);
      
      switch (message.type) {
        case AgentBridge.EVENTS.TRIGGER_CALL:
          await this.initiateCall(message.data);
          break;
        case AgentBridge.EVENTS.USER_RESPONSE:
          await this.handleUserResponse(message.data);
          break;
        default:
          console.log('[PhoneAgent] Unknown event:', message.type);
      }
    });
  }

  /**
   * Initiate outbound call to clinic using ElevenLabs API
   */
  async initiateCall(data) {
    const { reason, userContext } = data;
    
    console.log('[PhoneAgent] Initiating clinic call...', { reason });
    
    // Notify Chat Agent that call is starting
    agentBridge.sendToChatAgent(AgentBridge.EVENTS.CALL_STARTED, {
      message: 'Calling the clinic now...'
    });

    try {
      // Call ElevenLabs API to initiate outbound call
      const response = await fetch(
        `https://api.elevenlabs.io/v1/convai/conversation/initiate-outbound-call`,
        {
          method: 'POST',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agent_id: process.env.PHONE_AGENT_ID,
            agent_overrides: {
              prompt: {
                prompt: this.buildPhoneAgentPrompt(reason, userContext)
              }
            }
          })
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to initiate call: ${error}`);
      }

      const result = await response.json();
      this.activeConversationId = result.conversation_id;
      this.isCallActive = true;

      console.log('[PhoneAgent] Call initiated:', this.activeConversationId);
      
      agentBridge.updateCallStatus('connected', 'Connected to clinic');

    } catch (error) {
      console.error('[PhoneAgent] Call initiation failed:', error);
      agentBridge.sendToChatAgent(AgentBridge.EVENTS.CALL_ENDED, {
        status: 'error',
        error: error.message
      });
    }
  }

  /**
   * Build dynamic prompt for Phone Agent based on user context
   */
  buildPhoneAgentPrompt(reason, userContext) {
    return `You are a medical assistant AI calling a clinic on behalf of a patient.

CALL REASON: ${reason}

PATIENT CONTEXT:
${JSON.stringify(userContext, null, 2)}

INSTRUCTIONS:
1. Introduce yourself professionally
2. Explain you're calling to schedule an appointment for a patient
3. When the receptionist provides available time slots, you MUST call the 'relay_appointment_slots' tool to inform the patient
4. Wait for the patient to select their preferred slot
5. Confirm the selected slot with the receptionist
6. Thank them and end the call

IMPORTANT: Always use the tools to communicate with the patient. Never assume their preferences.`;
  }

  /**
   * Handle response from user (via Chat Agent)
   */
  async handleUserResponse(data) {
    if (!this.isCallActive) {
      console.log('[PhoneAgent] No active call to send response to');
      return;
    }

    console.log('[PhoneAgent] User response received:', data);
    
    // In a real implementation, this would signal the Phone Agent's conversation
    // to continue with the user's selection. Since ElevenLabs handles the actual
    // conversation, this would be done through their webhook/tool system.
    
    if (data.type === 'appointment_selection') {
      // The Phone Agent will receive this through its server tool
      console.log('[PhoneAgent] User selected slot:', data.selectedSlot);
    }
  }

  /**
   * Called when Phone Agent needs info from user
   * This is triggered by the Phone Agent's server tool
   */
  requestAppointmentSlots(slots) {
    console.log('[PhoneAgent] Requesting user to select from slots:', slots);
    agentBridge.sendAppointmentSlots(slots);
  }

  /**
   * End the current call
   */
  endCall(status = 'completed', appointmentDetails = null) {
    this.isCallActive = false;
    this.activeConversationId = null;
    
    agentBridge.sendToChatAgent(AgentBridge.EVENTS.CALL_ENDED, {
      status,
      appointment: appointmentDetails
    });
  }
}

// Singleton instance
const phoneAgentService = new PhoneAgentService();

module.exports = { PhoneAgentService, phoneAgentService };

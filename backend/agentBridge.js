/**
 * Agent Bridge - Manages communication between Chat Agent and Phone Agent
 * Uses EventEmitter pattern for loosely coupled inter-agent messaging
 */

const EventEmitter = require('events');

class AgentBridge extends EventEmitter {
  constructor() {
    super();
    this.phoneAgentReady = false;
    this.chatAgentReady = false;
    this.messageQueue = [];
  }

  // Event Types
  static EVENTS = {
    // Chat Agent → Phone Agent
    TRIGGER_CALL: 'trigger_call',
    PROVIDE_INFO: 'provide_info',
    USER_RESPONSE: 'user_response',
    
    // Phone Agent → Chat Agent
    CALL_STARTED: 'call_started',
    CALL_ENDED: 'call_ended',
    REQUEST_INFO: 'request_info',
    APPOINTMENT_SLOTS: 'appointment_slots',
    CALL_STATUS: 'call_status'
  };

  /**
   * Register Chat Agent as ready to receive events
   */
  setChatAgentReady(ready = true) {
    this.chatAgentReady = ready;
    if (ready) {
      this.flushQueuedMessages('chat');
    }
    console.log(`[AgentBridge] Chat Agent ready: ${ready}`);
  }

  /**
   * Register Phone Agent as ready to receive events
   */
  setPhoneAgentReady(ready = true) {
    this.phoneAgentReady = ready;
    if (ready) {
      this.flushQueuedMessages('phone');
    }
    console.log(`[AgentBridge] Phone Agent ready: ${ready}`);
  }

  /**
   * Send message from Chat Agent to Phone Agent
   */
  sendToPhoneAgent(eventType, data) {
    const message = { type: eventType, data, timestamp: Date.now() };
    
    if (this.phoneAgentReady) {
      console.log(`[AgentBridge] → Phone Agent:`, eventType, data);
      this.emit('toPhoneAgent', message);
    } else {
      console.log(`[AgentBridge] Queuing for Phone Agent:`, eventType);
      this.messageQueue.push({ target: 'phone', message });
    }
  }

  /**
   * Send message from Phone Agent to Chat Agent
   */
  sendToChatAgent(eventType, data) {
    const message = { type: eventType, data, timestamp: Date.now() };
    
    if (this.chatAgentReady) {
      console.log(`[AgentBridge] → Chat Agent:`, eventType, data);
      this.emit('toChatAgent', message);
    } else {
      console.log(`[AgentBridge] Queuing for Chat Agent:`, eventType);
      this.messageQueue.push({ target: 'chat', message });
    }
  }

  /**
   * Flush queued messages when agent becomes ready
   */
  flushQueuedMessages(target) {
    const toFlush = this.messageQueue.filter(m => m.target === target);
    this.messageQueue = this.messageQueue.filter(m => m.target !== target);
    
    toFlush.forEach(({ message }) => {
      const event = target === 'phone' ? 'toPhoneAgent' : 'toChatAgent';
      console.log(`[AgentBridge] Flushing queued message:`, message.type);
      this.emit(event, message);
    });
  }

  /**
   * Trigger an outbound clinic call
   */
  triggerClinicCall(reason, userContext = {}) {
    this.sendToPhoneAgent(AgentBridge.EVENTS.TRIGGER_CALL, {
      reason,
      userContext,
      initiatedAt: new Date().toISOString()
    });
  }

  /**
   * Send appointment slots to Chat Agent for user selection
   */
  sendAppointmentSlots(slots) {
    this.sendToChatAgent(AgentBridge.EVENTS.APPOINTMENT_SLOTS, { slots });
  }

  /**
   * Send user's selected appointment slot to Phone Agent
   */
  sendSelectedSlot(slot) {
    this.sendToPhoneAgent(AgentBridge.EVENTS.USER_RESPONSE, {
      type: 'appointment_selection',
      selectedSlot: slot
    });
  }

  /**
   * Update call status to Chat Agent
   */
  updateCallStatus(status, message) {
    this.sendToChatAgent(AgentBridge.EVENTS.CALL_STATUS, { status, message });
  }
}

// Singleton instance
const agentBridge = new AgentBridge();

module.exports = { AgentBridge, agentBridge };

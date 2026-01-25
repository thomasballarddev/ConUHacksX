/**
 * Health Assistant - Frontend Application
 * Handles ElevenLabs Chat Agent communication, voice input, and UI interactions
 */

// ============================================
// Configuration
// ============================================
const CONFIG = {
  BACKEND_URL: 'http://localhost:3001',
  WS_URL: 'ws://localhost:3001/ws'
};

// ============================================
// State Management
// ============================================
const state = {
  conversation: null,
  isConnected: false,
  isRecording: false,
  selectedSlot: null,
  agentId: null,
  pendingCallReason: null,
  // Map state
  map: null,
  placesService: null,
  clinics: [],
  selectedClinic: null,
  markers: [],
  googleMapsApiKey: null
};

// ============================================
// DOM Elements
// ============================================
const elements = {
  messages: document.getElementById('messages'),
  messageInput: document.getElementById('messageInput'),
  sendBtn: document.getElementById('sendBtn'),
  voiceBtn: document.getElementById('voiceBtn'),
  voiceIndicator: document.getElementById('voiceIndicator'),
  stopVoice: document.getElementById('stopVoice'),
  connectionStatus: document.getElementById('connectionStatus'),
  callBanner: document.getElementById('callBanner'),
  callText: document.getElementById('callText'),
  calendarModal: document.getElementById('calendarModal'),
  slotsContainer: document.getElementById('slotsContainer'),
  confirmSlot: document.getElementById('confirmSlot'),
  cancelSlot: document.getElementById('cancelSlot'),
  // Question modal elements
  questionModal: document.getElementById('questionModal'),
  questionText: document.getElementById('questionText'),
  questionAnswer: document.getElementById('questionAnswer'),
  submitAnswer: document.getElementById('submitAnswer'),
  // Call confirmation modal elements
  confirmCallModal: document.getElementById('confirmCallModal'),
  confirmCallReason: document.getElementById('confirmCallReason'),
  confirmCall: document.getElementById('confirmCall'),
  declineCall: document.getElementById('declineCall'),
  // Map modal elements
  mapModal: document.getElementById('mapModal'),
  clinicMap: document.getElementById('clinicMap'),
  clinicList: document.getElementById('clinicList'),
  closeMap: document.getElementById('closeMap'),
  selectedClinicInfo: document.getElementById('selectedClinicInfo'),
  selectedClinicName: document.getElementById('selectedClinicName'),
  selectedClinicAddress: document.getElementById('selectedClinicAddress'),
  selectedClinicRating: document.getElementById('selectedClinicRating'),
  callSelectedClinic: document.getElementById('callSelectedClinic')
};

// ============================================
// WebSocket Connection to Backend
// ============================================
let ws = null;

function connectWebSocket() {
  ws = new WebSocket(CONFIG.WS_URL);
  
  ws.onopen = () => {
    console.log('[WS] Connected to backend');
    updateConnectionStatus('connected');
    initializeElevenLabsAgent();
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleBackendMessage(message);
  };
  
  ws.onclose = () => {
    console.log('[WS] Disconnected');
    updateConnectionStatus('disconnected');
    // Attempt reconnect after 3 seconds
    setTimeout(connectWebSocket, 3000);
  };
  
  ws.onerror = (error) => {
    console.error('[WS] Error:', error);
    updateConnectionStatus('error');
  };
}

function updateConnectionStatus(status) {
  const statusElement = elements.connectionStatus;
  const statusText = statusElement.querySelector('.status-text');
  
  statusElement.className = 'connection-status ' + status;
  
  switch (status) {
    case 'connected':
      statusText.textContent = 'Connected';
      state.isConnected = true;
      break;
    case 'disconnected':
      statusText.textContent = 'Reconnecting...';
      state.isConnected = false;
      break;
    case 'error':
      statusText.textContent = 'Connection Error';
      state.isConnected = false;
      break;
    default:
      statusText.textContent = 'Connecting...';
  }
}

// ============================================
// Backend Message Handler
// ============================================
function handleBackendMessage(message) {
  console.log('[Backend Message]', message.type, message.data);
  
  switch (message.type) {
    case 'call_status':
      if (message.data.status === 'connecting') {
        showCallBanner('Connecting to clinic...');
      } else if (message.data.status === 'connected') {
        showCallBanner('Connected - speaking with clinic');
      } else if (message.data.status === 'error') {
        hideCallBanner();
        addMessage('assistant', 'Failed to connect to the clinic. Would you like me to try again?');
      }
      break;
      
    case 'appointment_slots':
      showCalendarModal(message.data.slots, message.data.showAskNextWeek !== false);
      break;
      
    case 'user_question':
      showQuestionModal(message.data.question);
      break;
      
    case 'call_ended':
      hideCallBanner();
      if (message.data.status === 'success' && message.data.appointment) {
        addMessage('assistant', `Great news! Your appointment has been confirmed for ${message.data.appointment.date} at ${message.data.appointment.time}.`);
      }
      break;
      
    default:
      console.log('[Backend] Unknown message type:', message.type);
  }
}

// ============================================
// ElevenLabs Agent Integration
// ============================================
async function initializeElevenLabsAgent() {
  try {
    // Fetch agent config from backend
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/config`);
    const config = await response.json();
    state.agentId = config.agentId;
    state.googleMapsApiKey = config.googleMapsApiKey;
    
    if (!state.agentId) {
      console.warn('[ElevenLabs] No Agent ID configured');
      addMessage('assistant', '⚠️ Agent not configured. Please set ELEVENLABS_AGENT_ID in the backend .env file.');
      return;
    }
    
    console.log('[ElevenLabs] Agent ID:', state.agentId);
    
    // Load Google Maps API if key is available
    if (state.googleMapsApiKey) {
      loadGoogleMapsApi(state.googleMapsApiKey);
    }
    
  } catch (error) {
    console.error('[ElevenLabs] Failed to initialize:', error);
  }
}

// Load Google Maps API dynamically
function loadGoogleMapsApi(apiKey) {
  if (window.google && window.google.maps) return;
  
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  console.log('[Maps] Google Maps API loading...');
}

async function startConversation() {
  if (!state.agentId || !window.ElevenLabs) {
    console.error('[ElevenLabs] SDK not loaded or agent not configured');
    return null;
  }
  
  try {
    const conversation = await window.ElevenLabs.Conversation.startSession({
      agentId: state.agentId,
      
      // Client tools - run in browser
      clientTools: {
        trigger_clinic_call: async ({ reason }) => {
          console.log('[Client Tool] trigger_clinic_call:', reason);
          
          // Store reason and show confirmation modal
          state.pendingCallReason = reason;
          showCallConfirmModal(reason);
          
          return 'I\'ve asked the patient if they would like me to call the clinic. Waiting for their response.';
        }
      },
      
      // Callbacks
      onMessage: (message) => {
        console.log('[ElevenLabs] Message:', message);
        if (message.message) {
          addMessage('assistant', message.message);
        }
      },
      
      onError: (error) => {
        console.error('[ElevenLabs] Error:', error);
        addMessage('assistant', 'I encountered an error. Please try again.');
      },
      
      onStatusChange: (status) => {
        console.log('[ElevenLabs] Status:', status);
      }
    });
    
    state.conversation = conversation;
    return conversation;
    
  } catch (error) {
    console.error('[ElevenLabs] Failed to start conversation:', error);
    return null;
  }
}

// ============================================
// Message Handling
// ============================================
function addMessage(role, content) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerHTML = `<p>${content}</p>`;
  
  messageDiv.appendChild(contentDiv);
  elements.messages.appendChild(messageDiv);
  
  // Scroll to bottom
  elements.messages.scrollTop = elements.messages.scrollHeight;
}

async function sendMessage() {
  const text = elements.messageInput.value.trim();
  if (!text) return;
  
  // Add user message to UI
  addMessage('user', text);
  elements.messageInput.value = '';
  
  // Start conversation if not already started
  if (!state.conversation) {
    await startConversation();
  }
  
  // Send to ElevenLabs agent
  if (state.conversation) {
    try {
      await state.conversation.sendUserInput(text);
    } catch (error) {
      console.error('[ElevenLabs] Failed to send message:', error);
      
      // Fallback: simulate a response for demo purposes
      setTimeout(() => {
        addMessage('assistant', 'I understand you\'re experiencing ' + text + '. Could you tell me more about when these symptoms started and how severe they are?');
      }, 1000);
    }
  } else {
    // Fallback response when agent not configured
    setTimeout(() => {
      addMessage('assistant', 'I understand you\'re experiencing ' + text + '. Could you tell me more about when these symptoms started and how severe they are?');
    }, 1000);
  }
}

// ============================================
// Voice Input
// ============================================
async function startVoiceInput() {
  if (!state.conversation) {
    await startConversation();
  }
  
  if (state.conversation && state.conversation.startRecording) {
    try {
      await state.conversation.startRecording();
      state.isRecording = true;
      elements.voiceBtn.classList.add('recording');
      elements.voiceIndicator.classList.remove('hidden');
    } catch (error) {
      console.error('[Voice] Failed to start recording:', error);
      
      // Fallback: use browser's SpeechRecognition
      startBrowserSpeechRecognition();
    }
  } else {
    // Fallback: use browser's SpeechRecognition
    startBrowserSpeechRecognition();
  }
}

function stopVoiceInput() {
  if (state.conversation && state.conversation.stopRecording) {
    state.conversation.stopRecording();
  }
  
  state.isRecording = false;
  elements.voiceBtn.classList.remove('recording');
  elements.voiceIndicator.classList.add('hidden');
}

// Browser Speech Recognition Fallback
let recognition = null;

function startBrowserSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    addMessage('assistant', 'Sorry, voice input is not supported in your browser. Please use text input.');
    return;
  }
  
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';
  
  recognition.onstart = () => {
    state.isRecording = true;
    elements.voiceBtn.classList.add('recording');
    elements.voiceIndicator.classList.remove('hidden');
  };
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    elements.messageInput.value = transcript;
    sendMessage();
  };
  
  recognition.onerror = (event) => {
    console.error('[Voice] Recognition error:', event.error);
    stopVoiceInput();
  };
  
  recognition.onend = () => {
    stopVoiceInput();
  };
  
  recognition.start();
}

// ============================================
// Call Banner
// ============================================
function showCallBanner(text) {
  elements.callText.textContent = text;
  elements.callBanner.classList.remove('hidden');
}

function hideCallBanner() {
  elements.callBanner.classList.add('hidden');
}

// ============================================
// Calendar Modal
// ============================================
function showCalendarModal(slots, showAskNextWeek = true) {
  // Clear existing slots
  elements.slotsContainer.innerHTML = '';
  state.selectedSlot = null;
  elements.confirmSlot.disabled = true;
  
  // Create slot options for available appointments
  slots.forEach((slot, index) => {
    const slotDiv = document.createElement('label');
    slotDiv.className = 'slot-option';
    slotDiv.innerHTML = `
      <input type="radio" name="slot" value="${index}">
      <span class="slot-radio"></span>
      <div class="slot-info">
        <span class="slot-date">${slot.date || slot}</span>
        ${slot.time ? `<span class="slot-time">${slot.time}</span>` : ''}
      </div>
    `;
    
    slotDiv.addEventListener('click', () => {
      document.querySelectorAll('.slot-option').forEach(el => el.classList.remove('selected'));
      slotDiv.classList.add('selected');
      state.selectedSlot = slot;
      elements.confirmSlot.disabled = false;
    });
    
    elements.slotsContainer.appendChild(slotDiv);
  });
  
  // Add "Ask for next week" option
  if (showAskNextWeek) {
    const nextWeekDiv = document.createElement('label');
    nextWeekDiv.className = 'slot-option slot-next-week';
    nextWeekDiv.innerHTML = `
      <input type="radio" name="slot" value="ask_next_week">
      <span class="slot-radio"></span>
      <div class="slot-info">
        <span class="slot-date">📅 Ask for next week's availability</span>
        <span class="slot-time">These times don't work for me</span>
      </div>
    `;
    
    nextWeekDiv.addEventListener('click', () => {
      document.querySelectorAll('.slot-option').forEach(el => el.classList.remove('selected'));
      nextWeekDiv.classList.add('selected');
      state.selectedSlot = 'ask_next_week';
      elements.confirmSlot.disabled = false;
    });
    
    elements.slotsContainer.appendChild(nextWeekDiv);
  }
  
  elements.calendarModal.classList.remove('hidden');
}

function hideCalendarModal() {
  elements.calendarModal.classList.add('hidden');
  state.selectedSlot = null;
}

function confirmSlotSelection() {
  if (!state.selectedSlot) return;
  
  const isAskNextWeek = state.selectedSlot === 'ask_next_week';
  
  // Send selection to backend
  ws.send(JSON.stringify({
    type: 'appointment_selected',
    slot: state.selectedSlot
  }));
  
  hideCalendarModal();
  
  if (isAskNextWeek) {
    addMessage('user', "These times don't work for me. Can you ask about next week's availability?");
  } else {
    addMessage('user', `I'd like the ${state.selectedSlot.date || state.selectedSlot} appointment${state.selectedSlot.time ? ' at ' + state.selectedSlot.time : ''}.`);
  }
}

// ============================================
// Question Modal
// ============================================
function showQuestionModal(question) {
  elements.questionText.textContent = question;
  elements.questionAnswer.value = '';
  elements.questionModal.classList.remove('hidden');
  elements.questionAnswer.focus();
}

function hideQuestionModal() {
  elements.questionModal.classList.add('hidden');
}

function submitQuestionAnswer() {
  const answer = elements.questionAnswer.value.trim();
  if (!answer) return;
  
  // Send answer to backend
  ws.send(JSON.stringify({
    type: 'user_answer',
    answer: answer
  }));
  
  hideQuestionModal();
  addMessage('user', answer);
}

// ============================================
// Event Listeners
// ============================================
function setupEventListeners() {
  // Send message
  elements.sendBtn.addEventListener('click', sendMessage);
  
  elements.messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Auto-resize textarea
  elements.messageInput.addEventListener('input', () => {
    elements.messageInput.style.height = 'auto';
    elements.messageInput.style.height = elements.messageInput.scrollHeight + 'px';
  });
  
  // Voice input
  elements.voiceBtn.addEventListener('click', () => {
    if (state.isRecording) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  });
  
  elements.stopVoice.addEventListener('click', stopVoiceInput);
  
  // Calendar modal
  elements.confirmSlot.addEventListener('click', confirmSlotSelection);
  elements.cancelSlot.addEventListener('click', hideCalendarModal);
  
  // Question modal
  elements.submitAnswer.addEventListener('click', submitQuestionAnswer);
  elements.questionAnswer.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitQuestionAnswer();
    }
  });
  
  // Call confirmation modal
  elements.confirmCall.addEventListener('click', confirmClinicCall);
  elements.declineCall.addEventListener('click', declineClinicCall);
  
  // Map modal
  elements.closeMap.addEventListener('click', hideMapModal);
  elements.callSelectedClinic.addEventListener('click', callSelectedClinic);
}

// ============================================
// Call Confirmation Modal
// ============================================
function showCallConfirmModal(reason) {
  elements.confirmCallReason.textContent = `Based on your symptoms (${reason}), would you like me to find nearby clinics?`;
  elements.confirmCallModal.classList.remove('hidden');
}

function hideCallConfirmModal() {
  elements.confirmCallModal.classList.add('hidden');
}

function confirmClinicCall() {
  hideCallConfirmModal();
  addMessage('user', 'Yes, show me nearby clinics.');
  showMapModal();
}

function declineClinicCall() {
  hideCallConfirmModal();
  state.pendingCallReason = null;
  addMessage('user', 'No, not right now.');
  addMessage('assistant', 'No problem! Let me know if you change your mind or if there\'s anything else I can help with.');
}

// ============================================
// Clinic Map Modal
// ============================================
function showMapModal() {
  elements.mapModal.classList.remove('hidden');
  elements.clinicList.innerHTML = '<p class="loading-text">Getting your location...</p>';
  elements.selectedClinicInfo.classList.add('hidden');
  state.selectedClinic = null;
  
  // Get user's location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        initializeMap(userLocation);
      },
      (error) => {
        console.error('[Maps] Geolocation error:', error);
        // Default to Montreal if location fails
        const defaultLocation = { lat: 45.5017, lng: -73.5673 };
        initializeMap(defaultLocation);
      }
    );
  } else {
    const defaultLocation = { lat: 45.5017, lng: -73.5673 };
    initializeMap(defaultLocation);
  }
}

function hideMapModal() {
  elements.mapModal.classList.add('hidden');
  state.markers.forEach(marker => marker.setMap(null));
  state.markers = [];
  state.clinics = [];
  state.selectedClinic = null;
}

function initializeMap(location) {
  if (!window.google || !window.google.maps) {
    elements.clinicList.innerHTML = '<p class="loading-text">Google Maps not loaded. Please add your API key to .env</p>';
    return;
  }
  
  // Create map
  state.map = new google.maps.Map(elements.clinicMap, {
    center: location,
    zoom: 14,
    styles: [
      { elementType: 'geometry', stylers: [{ color: '#1a1a25' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a25' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d3d' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0a0f' }] },
      { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#12121a' }] }
    ]
  });
  
  // Add user location marker
  new google.maps.Marker({
    position: location,
    map: state.map,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#6366f1',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2
    },
    title: 'Your Location'
  });
  
  // Search for clinics
  state.placesService = new google.maps.places.PlacesService(state.map);
  searchNearbyClinics(location);
}

function searchNearbyClinics(location) {
  elements.clinicList.innerHTML = '<p class="loading-text">Searching for nearby clinics...</p>';
  
  const request = {
    location: location,
    radius: 5000, // 5km
    type: 'doctor',
    keyword: 'clinic medical doctor'
  };
  
  state.placesService.nearbySearch(request, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
      state.clinics = results.slice(0, 10); // Limit to 10 clinics
      displayClinics();
    } else {
      elements.clinicList.innerHTML = '<p class="loading-text">No clinics found nearby. Try a different location.</p>';
    }
  });
}

function displayClinics() {
  elements.clinicList.innerHTML = '';
  
  state.clinics.forEach((clinic, index) => {
    // Add marker
    const marker = new google.maps.Marker({
      position: clinic.geometry.location,
      map: state.map,
      title: clinic.name,
      label: {
        text: String(index + 1),
        color: '#ffffff',
        fontSize: '12px'
      }
    });
    
    marker.addListener('click', () => selectClinic(index));
    state.markers.push(marker);
    
    // Add list item
    const item = document.createElement('div');
    item.className = 'clinic-item';
    item.dataset.index = index;
    
    const rating = clinic.rating ? `⭐ ${clinic.rating}` : '';
    const address = clinic.vicinity || 'Address not available';
    
    item.innerHTML = `
      <h4>${index + 1}. ${clinic.name}</h4>
      <p>${address}</p>
      ${rating ? `<p class="rating">${rating}</p>` : ''}
    `;
    
    item.addEventListener('click', () => selectClinic(index));
    elements.clinicList.appendChild(item);
  });
}

function selectClinic(index) {
  // Deselect previous
  document.querySelectorAll('.clinic-item').forEach(el => el.classList.remove('selected'));
  
  // Select new
  const item = document.querySelector(`.clinic-item[data-index="${index}"]`);
  if (item) item.classList.add('selected');
  
  state.selectedClinic = state.clinics[index];
  
  // Show selected clinic info
  elements.selectedClinicName.textContent = state.selectedClinic.name;
  elements.selectedClinicAddress.textContent = state.selectedClinic.vicinity || 'Address not available';
  elements.selectedClinicRating.textContent = state.selectedClinic.rating ? `⭐ ${state.selectedClinic.rating} rating` : '';
  elements.selectedClinicInfo.classList.remove('hidden');
  
  // Center map on clinic
  state.map.panTo(state.selectedClinic.geometry.location);
  state.map.setZoom(16);
}

async function callSelectedClinic() {
  if (!state.selectedClinic) return;
  
  const clinicName = state.selectedClinic.name;
  const reason = state.pendingCallReason;
  
  hideMapModal();
  addMessage('user', `Call ${clinicName}`);
  
  try {
    const response = await fetch(`${CONFIG.BACKEND_URL}/api/trigger-call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason,
        clinic: {
          name: clinicName,
          address: state.selectedClinic.vicinity,
          // Note: actual phone number would require Places Details API
          // For testing, backend uses TEST_PHONE_NUMBER
        }
      })
    });
    
    if (!response.ok) {
      addMessage('assistant', 'Failed to connect to the clinic. Please try again.');
    }
  } catch (error) {
    console.error('[Call] Failed to trigger call:', error);
    addMessage('assistant', 'Error connecting to the clinic.');
  }
  
  state.pendingCallReason = null;
}

// ============================================
// Initialize App
// ============================================
function init() {
  console.log('[App] Initializing Health Assistant...');
  setupEventListeners();
  connectWebSocket();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);


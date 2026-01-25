import React, { useEffect, useRef, useState } from 'react';

/**
 * BACKEND IMPLEMENTATION FOR AGENT INPUT REQUESTS:
 *
 * 1. ElevenLabs Webhook/Event Handler:
 *    - When the AI agent detects it needs user info (e.g., receptionist asks "date of birth?"),
 *    - The agent should say: "One moment, let me verify that with the patient"
 *    - ElevenLabs can trigger a webhook or the agent can use a tool/function call
 *
 * 2. Backend Socket Event (emit to frontend):
 *    socket.emit('agent_needs_input', {
 *      callId: string,
 *      question: string,        // e.g., "What is your date of birth?"
 *      context: string,         // e.g., "The receptionist is asking for verification"
 *      inputType: 'text' | 'date' | 'phone' | 'select',
 *      options?: string[]       // For select type
 *    });
 *
 * 3. Backend Endpoint to Receive User Response:
 *    POST /call/user-response
 *    Body: { callId: string, response: string }
 *    - This endpoint should inject the response into the ongoing ElevenLabs call
 *    - Use ElevenLabs conversation API to send a message/context update
 *
 * 4. After Response Injection:
 *    socket.emit('agent_input_received', { callId: string });
 *    - Frontend clears the input prompt
 *    - Agent continues: "The patient's date of birth is [response]"
 *
 * 5. ElevenLabs Agent Prompt Should Include:
 *    - "If you don't know personal information about the patient (DOB, insurance, address, etc.),
 *       say 'One moment, let me verify that with the patient' and use the request_user_input tool"
 */

interface TranscriptMessage {
  message: string;
  sender: 'bot' | 'receptionist' | 'unknown';
}

interface LiveCallPanelProps {
  onClose?: () => void;
  minimized?: boolean;
  transcript?: TranscriptMessage[];
  // Agent input request props
  agentNeedsInput?: boolean;
  agentQuestion?: string;
  agentContext?: string;
  onUserResponse?: (response: string) => void;
}

const LiveCallPanel: React.FC<LiveCallPanelProps> = ({
  onClose,
  minimized = false,
  transcript = [],
  agentNeedsInput = false,
  agentQuestion = '',
  agentContext = '',
  onUserResponse
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-scroll to bottom when transcript updates or agent needs input
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, agentNeedsInput]);

  // Handle user response submission
  const handleSubmitResponse = () => {
    if (!userInput.trim() || !onUserResponse) return;
    setIsSubmitting(true);
    onUserResponse(userInput.trim());
    setUserInput('');
    // isSubmitting will be reset when agentNeedsInput becomes false
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const getMessageRole = (sender: string): 'ai' | 'other' => {
    return sender === 'bot' ? 'ai' : 'other';
  };

  return (
    <div className={`w-full shadow-xl z-20 flex flex-col ${minimized ? 'bg-green-600' : 'h-full bg-soft-cream'
      }`}>
      {/* Full Call Preview - Only when not minimized, shown at top */}
      {!minimized && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Scrollable Transcript Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <span className="material-symbols-outlined text-4xl mb-2">graphic_eq</span>
                <p className="text-sm font-medium">Waiting for conversation...</p>
              </div>
            ) : (
              transcript.map((msg, index) => {
                const role = getMessageRole(msg.sender);

                if (role === 'ai') {
                  return (
                    <div key={index} className="flex flex-row-reverse gap-3">
                      <div className="size-8 bg-green-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="material-symbols-outlined text-white text-sm fill-1">smart_toy</span>
                      </div>
                      <div className="bg-green-600 p-4 rounded-2xl rounded-tr-none shadow-xl text-white max-w-[85%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">AI Assistant</span>
                        </div>
                        <p className="text-xs md:text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div key={index} className="flex gap-3">
                      <div className="size-8 rounded-full overflow-hidden border border-black/5 flex-shrink-0 bg-white flex items-center justify-center">
                         <span className="material-symbols-outlined text-gray-500 text-sm">support_agent</span>
                      </div>
                      <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-black/5 max-w-[85%]">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500">Receptionist</span>
                        </div>
                        <p className="text-xs md:text-sm text-primary leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  );
                }
              })
            )}

            {/* Agent Needs User Input - Prompt Card */}
            {agentNeedsInput && (
              <div>
                <div className="bg-card-beige border-2 border-primary/20 rounded-[32px] p-6 shadow-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="size-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="material-symbols-outlined text-white">help</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Input Needed</span>
                        <span className="size-2 bg-primary rounded-full"></span>
                      </div>
                      <p className="text-primary font-bold text-lg">{agentQuestion || "The agent needs information from you"}</p>
                      {agentContext && (
                        <p className="text-sm text-gray-500 mt-1">{agentContext}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitResponse()}
                      placeholder="Type your response..."
                      className="flex-1 bg-white border border-black/5 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all shadow-sm"
                      autoFocus
                      disabled={isSubmitting}
                    />
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!userInput.trim() || isSubmitting}
                      className={`px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2 ${
                        !userInput.trim() || isSubmitting
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-black active:scale-95 shadow-lg shadow-black/10'
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                          Sending
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-lg">send</span>
                          Send
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[10px] text-gray-400 font-medium mt-3 text-center">
                    The receptionist is waiting. Your response will be relayed by the AI agent.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Voice Waveform Animation */}
          <div className="flex justify-center items-center gap-1 py-6 bg-soft-cream/95 backdrop-blur-sm border-t border-black/5 shrink-0 z-10">
            {/* Removed text as requested */}
            {/* <span className="text-[9px] font-bold uppercase tracking-widest text-green-600 mr-3">Voice ActivityLink</span> */}
            {[0.1, 0.4, 0.2, 0.6, 0.3, 0.5, 0.2].map((d, i) => (
              <div key={i} className="waveform-bar w-1 bg-green-500 rounded-full h-6" style={{ height: `${12 + (i % 3) * 8}px` }}></div>
            ))}
          </div>
        </div>
      )}

      {/* Green Header Bar - At the bottom */}
      <div className="bg-green-600 p-4 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="size-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <span className="material-symbols-outlined text-white text-xl">phone_in_talk</span>
          </div>
          <div>
            <p className="text-sm font-black text-white">Relay Call Active</p>
            <p className="text-[11px] text-white/80 font-mono mt-0.5">Recording • Live</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="bg-white text-green-600 rounded-2xl font-black text-xs px-5 py-3 flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-lg rotate-[135deg]">call</span>
          End
        </button>
      </div>
    </div>
  );
};

export default LiveCallPanel;

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import WebSocket, { RawData } from 'ws';

// Types and state - will be set via setupMcpRoutes
let initiateCall: any;
let activeCalls: any;
let twilioClient: any;
let getSignedUrl: any;
let sendChatMessage: any;

// Initialize MCP Server
export const mcpServer = new McpServer({
  name: "Health.me Backend",
  version: "1.0.0"
});

// Tool: Make Call (ElevenLabs native)
mcpServer.tool(
  "make_call",
  "Initiate an outbound phone call with a message",
  {
    phone_number: z.string().describe("The phone number to call (with country code, e.g., +1 555 123 4567)"),
    message: z.string().describe("The message to convey during the call"),
    recipient_name: z.string().optional().describe("Name of the person being called")
  },
  async (params) => {
    console.log("[MCP] Tool called: make_call", params);
    try {
      // Use ElevenLabs to initiate the call
      // The agent will conduct the conversation naturally
      const callMessage = `Please call ${params.recipient_name || 'the recipient'} at ${params.phone_number} and say: "${params.message}"`;

      const response = await sendChatMessage(callMessage);

      return {
        content: [
          {
            type: "text",
            text: `Call initiated. ${response.message || 'Call is being processed.'}`
          }
        ]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[MCP] Tool error: make_call", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to initiate call: ${errorMsg}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Initiate Call (Legacy - Twilio based)
mcpServer.tool(
  "initiate_call",
  "Initiate an outbound phone call with a message",
  {
    phoneNumber: z.string().describe("The phone number to call (with country code)"),
    message: z.string().describe("The message or purpose of the call"),
    recipientName: z.string().optional().describe("Name of the person being called")
  },
  async (params) => {
    console.log("[MCP] Tool called: initiate_call", params);
    try {
      // Get ngrok host from environment or use fallback
      const ngrokHost = process.env.NGROK_HOST || "localhost:3001";

      const callSid = await initiateCall(
        params.phoneNumber,
        `You are calling ${params.recipientName || 'the recipient'} on behalf of the user. Your message: ${params.message}`,
        `Hello! This is Health.me calling. ${params.message}`,
        ngrokHost
      );

      return {
        content: [
          {
            type: "text",
            text: `Call initiated successfully. Call SID: ${callSid}`
          }
        ]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[MCP] Tool error: initiate_call", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to initiate call: ${errorMsg}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: End Call
mcpServer.tool(
  "end_call",
  "End an active phone call",
  {
    callSid: z.string().describe("The call SID to end")
  },
  async (params) => {
    console.log("[MCP] Tool called: end_call", params);
    try {
      if (!activeCalls.has(params.callSid)) {
        return {
          content: [
            {
              type: "text",
              text: `Call not found: ${params.callSid}`
            }
          ],
          isError: true
        };
      }

      // End the Twilio call
      await twilioClient.calls(params.callSid).update({ status: 'completed' });

      // Clean up
      const callData = activeCalls.get(params.callSid);
      if (callData) {
        if (callData.elevenLabsWs?.readyState === WebSocket.OPEN) {
          callData.elevenLabsWs.close();
        }
        activeCalls.delete(params.callSid);
      }

      return {
        content: [
          {
            type: "text",
            text: `Call ${params.callSid} ended successfully`
          }
        ]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[MCP] Tool error: end_call", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to end call: ${errorMsg}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Get Call Status
mcpServer.tool(
  "get_call_status",
  "Get the status and transcript of an active call",
  {
    callSid: z.string().describe("The call SID to get status for")
  },
  async (params) => {
    console.log("[MCP] Tool called: get_call_status", params);
    try {
      const callData = activeCalls.get(params.callSid);

      if (!callData) {
        return {
          content: [
            {
              type: "text",
              text: `Call not found: ${params.callSid}`
            }
          ],
          isError: true
        };
      }

      const status = {
        callSid: callData.callSid,
        streamSid: callData.streamSid,
        connected: callData.elevenLabsWs?.readyState === WebSocket.OPEN,
        transcriptLines: callData.transcript.length,
        transcript: callData.transcript
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(status, null, 2)
          }
        ]
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[MCP] Tool error: get_call_status", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to get call status: ${errorMsg}`
          }
        ],
        isError: true
      };
    }
  }
);

// Tool: Send Chat Message
mcpServer.tool(
  "send_chat_message",
  "Send a text message to the ElevenLabs health assistant and get a response",
  {
    message: z.string().describe("The message to send to the health assistant")
  },
  async (params) => {
    console.log("[MCP] Tool called: send_chat_message", params);
    try {
      const signedUrl = await getSignedUrl();

      // Connect to ElevenLabs in text-only mode
      const ws = new WebSocket(signedUrl);
      let responseText = '';
      let hasResponded = false;

      return new Promise((resolve) => {
        ws.on('open', () => {
          console.log('[MCP Chat] Connected to ElevenLabs');

          // Send initial config for text-only mode
          ws.send(JSON.stringify({
            type: 'conversation_initiation_client_data',
            text_only: true,
            conversation_config_override: {
              agent: {
                prompt: {
                  prompt: `You are Health.me, a friendly AI health assistant. You can help users with health questions and medical information.

Always be helpful, empathetic, and provide accurate health information.`
                }
              }
            }
          }));

          // Send the user's message
          setTimeout(() => {
            ws.send(JSON.stringify({
              type: 'user_message',
              text: params.message
            }));
          }, 500);
        });

        ws.on('message', (data: RawData) => {
          try {
            const msg = JSON.parse(data.toString());

            // Handle different message types
            if (msg.type === 'agent_response' || msg.type === 'text') {
              const text = msg.agent_response_event?.agent_response || msg.text || '';
              if (text) {
                responseText += text;
              }
            }

            // Handle conversation end
            if (msg.type === 'agent_response_end' || msg.type === 'conversation_end') {
              if (!hasResponded) {
                hasResponded = true;
                ws.close();
                resolve({
                  content: [
                    {
                      type: "text",
                      text: responseText || "No response received from assistant"
                    }
                  ]
                });
              }
            }

            // Handle ping
            if (msg.type === 'ping' && msg.ping_event?.event_id) {
              ws.send(JSON.stringify({
                type: 'pong',
                event_id: msg.ping_event.event_id
              }));
            }

          } catch (parseError) {
            console.error('[MCP Chat] Parse error:', parseError);
          }
        });

        ws.on('error', (error) => {
          console.error('[MCP Chat] WebSocket error:', error);
          if (!hasResponded) {
            hasResponded = true;
            resolve({
              content: [
                {
                  type: "text",
                  text: `Connection error: ${error.message}`
                }
              ],
              isError: true
            });
          }
        });

        ws.on('close', () => {
          console.log('[MCP Chat] WebSocket closed');
          if (!hasResponded) {
            hasResponded = true;
            if (responseText) {
              resolve({
                content: [
                  {
                    type: "text",
                    text: responseText
                  }
                ]
              });
            } else {
              resolve({
                content: [
                  {
                    type: "text",
                    text: "No response received from assistant"
                  }
                ],
                isError: true
              });
            }
          }
        });

        // Timeout after 30 seconds
        setTimeout(() => {
          if (!hasResponded) {
            hasResponded = true;
            ws.close();
            if (responseText) {
              resolve({
                content: [
                  {
                    type: "text",
                    text: responseText
                  }
                ]
              });
            } else {
              resolve({
                content: [
                  {
                    type: "text",
                    text: "Request timeout - no response received"
                  }
                ],
                isError: true
              });
            }
          }
        }, 30000);
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("[MCP] Tool error: send_chat_message", error);
      return {
        content: [
          {
            type: "text",
            text: `Failed to send message: ${errorMsg}`
          }
        ],
        isError: true
      };
    }
  }
);

// Express Middleware for SSE
export function setupMcpRoutes(
  app: express.Express,
  deps?: {
    initiateCall?: typeof initiateCall;
    activeCalls?: typeof activeCalls;
    twilioClient?: typeof twilioClient;
    getSignedUrl?: typeof getSignedUrl;
    sendChatMessage?: typeof sendChatMessage;
  }
) {
  // Set the dependencies
  if (deps) {
    initiateCall = deps.initiateCall || initiateCall;
    activeCalls = deps.activeCalls || activeCalls;
    twilioClient = deps.twilioClient || twilioClient;
    getSignedUrl = deps.getSignedUrl || getSignedUrl;
    sendChatMessage = deps.sendChatMessage || sendChatMessage;
  }

  const transports = new Map<string, SSEServerTransport>();

  app.get("/sse", async (req, res) => {
    console.log("[MCP] New SSE connection established");
    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);
    console.log(`[MCP] Session created: ${sessionId}`);

    res.on("close", () => {
      console.log(`[MCP] Session closed: ${sessionId}`);
      transports.delete(sessionId);
    });

    try {
      await mcpServer.connect(transport);
    } catch (error) {
      console.error(`[MCP] Connection error for session ${sessionId}:`, error);
    }
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    console.log(`[MCP] Message received for session: ${sessionId}`);
    const transport = transports.get(sessionId);

    if (transport) {
      try {
        await transport.handlePostMessage(req, res, req.body);
      } catch (error) {
        console.error(`[MCP] Error handling message for session ${sessionId}:`, error);
        res.status(500).send("Error processing message");
      }
    } else {
      console.log(`[MCP] No transport found for session: ${sessionId}`);
      res.status(400).send("Invalid or missing sessionId");
    }
  });
}


import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express from "express";
import { clinics } from "./data/clinics.js";
import {
  emitShowClinics,
  emitShowCalendar,
  emitCallOnHold,
  emitCallResumed,
  emitEmergencyTrigger
} from "./services/websocket.js";
import { TimeSlot } from "./types/index.js";

export const mcpServer = new McpServer({
  name: "Health.me Backend",
  version: "1.0.0"
});

// Tool: Show Clinics
mcpServer.tool(
  "show_clinics",
  "Display a list of nearby clinics to the user UI.",
  {},
  async () => {
    console.log("[MCP] Tool called: show_clinics");
    emitShowClinics(clinics);
    return {
      content: [{ type: "text", text: "Displayed list of 3 nearby clinics to the user." }]
    };
  }
);

// Tool: Show Calendar
mcpServer.tool(
  "show_calendar",
  "Display available appointment slots to the user UI.",
  {
    slots: z.array(z.object({
      day: z.string(),
      date: z.string(),
      time: z.string()
    })).describe("List of available time slots offered by the receptionist")
  },
  async ({ slots }) => {
    console.log("[MCP] Tool called: show_calendar", slots);
    // Fallback if empty
    const displaySlots: TimeSlot[] = slots.length > 0 ? slots as TimeSlot[] : [
      { day: 'TUE', date: '13', time: '02:00 PM' },
      { day: 'WED', date: '14', time: '03:00 PM' }
    ];
    emitShowCalendar(displaySlots);
    return {
      content: [{ type: "text", text: "Displayed calendar widget with available slots to user." }]
    };
  }
);

// Tool: Hold Call
mcpServer.tool(
  "hold_call",
  "Put the call on hold to ask the user for input/selection.",
  {},
  async () => {
    console.log("[MCP] Tool called: hold_call");
    emitCallOnHold("current-call-id");
    return {
      content: [{ type: "text", text: "Call put on hold. User prompt displayed." }]
    };
  }
);

// Tool: Resume Call
mcpServer.tool(
  "resume_call",
  "Resume the call after the user has made a selection.",
  {},
  async () => {
    console.log("[MCP] Tool called: resume_call");
    emitCallResumed("current-call-id");
    return {
      content: [{ type: "text", text: "Call resumed." }]
    };
  }
);

// Tool: Emergency
mcpServer.tool(
  "emergency",
  "Trigger the 438 520 2457 emergency sequence for critical life-threatening situations.",
  {},
  async () => {
    console.log("[MCP] Tool called: emergency");
    emitEmergencyTrigger();
    return {
      content: [{ type: "text", text: "Emergency countdown triggered on user UI." }]
    };
  }
);

// Express Middleware for SSE
export async function setupMcpRoutes(app: express.Express) {
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

    await mcpServer.connect(transport);
  });

  app.post("/messages", async (req, res) => {
    const sessionId = req.query.sessionId as string;
    console.log(`[MCP] Message received for session: ${sessionId}`);

    const transport = transports.get(sessionId);
    if (transport) {
      // Pass req.body as parsedBody since express.json() already consumed the stream
      await transport.handlePostMessage(req, res, req.body);
    } else {
      console.log(`[MCP] No transport found for session: ${sessionId}`);
      res.status(400).send("Invalid or missing sessionId");
    }
  });
}

#!/bin/bash

# Script to configure ElevenLabs agent webhook for real-time transcripts

AGENT_ID="agent_2601kfscag1vef3bkfk9phq16xsg"
API_KEY="sk_2fad8e76ef81ae90f80d8c4e7bb975eebb69445281b6c65f"

# Your ngrok URL (update this to match your actual ngrok URL from the logs)
WEBHOOK_URL="https://obliterative-loura-congruously.ngrok-free.dev/call/transcript-webhook"

echo "Configuring ElevenLabs Agent Webhook..."
echo "Agent ID: $AGENT_ID"
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Get current agent configuration
echo "Fetching current agent configuration..."
curl -X GET \
  "https://api.elevenlabs.io/v1/convai/agents/$AGENT_ID" \
  -H "xi-api-key: $API_KEY" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "================================"
echo "IMPORTANT: You need to configure the webhook in the ElevenLabs Dashboard"
echo "================================"
echo ""
echo "1. Go to: https://elevenlabs.io/app/conversational-ai"
echo "2. Click on your agent: $AGENT_ID"
echo "3. Go to 'Settings' or 'Configuration' tab"
echo "4. Find 'Webhooks' or 'Events' section"
echo "5. Add webhook URL: $WEBHOOK_URL"
echo "6. Enable these events:"
echo "   - conversation.initiated"
echo "   - agent.response"
echo "   - user.transcription"
echo "   - conversation.ended"
echo ""

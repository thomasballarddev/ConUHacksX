/**
 * Script to check ElevenLabs agent configuration and test webhook setup
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const AGENT_ID = process.env.ELEVENLABS_AGENT_ID!;
const API_KEY = process.env.ELEVENLABS_API_KEY!;

async function checkAgentConfig() {
  console.log('Fetching agent configuration...');
  console.log('Agent ID:', AGENT_ID);

  const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, {
    headers: {
      'xi-api-key': API_KEY,
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch agent:', await response.text());
    return;
  }

  const agent = await response.json();
  console.log('\n===== AGENT CONFIGURATION =====');
  console.log(JSON.stringify(agent, null, 2));
  console.log('\n===== WEBHOOK CONFIG =====');
  console.log('Webhook URL:', agent.webhook?.url || 'NOT SET');
  console.log('Webhook events:', agent.webhook?.events || 'NOT SET');

  console.log('\n===== CLIENT TOOLS =====');
  agent.client_tools?.forEach((tool: any, index: number) => {
    console.log(`Tool ${index + 1}: ${tool.name}`);
    console.log(`  URL: ${tool.url || 'N/A'}`);
  });
}

checkAgentConfig().catch(console.error);

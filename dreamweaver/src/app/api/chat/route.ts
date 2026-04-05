import { openai } from '@ai-sdk/openai';
import { streamText, type CoreMessage } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, model = 'gpt-4o-mini', temperature = 0.7, maxTokens = 2000 } = await req.json();

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages are required and must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate each message has required fields
    const validMessages = messages.every(
      (msg: CoreMessage) => 
        msg && 
        typeof msg === 'object' && 
        'role' in msg && 
        'content' in msg &&
        ['system', 'user', 'assistant'].includes(msg.role)
    );

    if (!validMessages) {
      return new Response(
        JSON.stringify({ error: 'Invalid message format. Each message must have role and content' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create stream
    const result = await streamText({
      model: openai(model),
      messages,
      temperature,
      maxTokens,
    });

    // Return streaming response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Health check endpoint
export async function GET() {
  return new Response(
    JSON.stringify({ 
      status: 'ok',
      message: 'AI Chat API is running',
      endpoints: {
        POST: '/api/chat - Stream chat completions',
      }
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

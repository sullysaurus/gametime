import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { streamText } from 'ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, provider = 'claude', model } = await req.json()

    // Select the appropriate provider and model
    let selectedModel

    if (provider === 'claude') {
      // Claude models: claude-3-5-sonnet-20241022, claude-3-opus-20240229, etc.
      selectedModel = anthropic(model || 'claude-3-5-sonnet-20241022')
    } else if (provider === 'gemini') {
      // Gemini models: gemini-2.0-flash-exp, gemini-1.5-pro, etc.
      selectedModel = google(model || 'gemini-2.0-flash-exp')
    } else {
      return Response.json(
        { error: 'Invalid provider. Use "claude" or "gemini".' },
        { status: 400 }
      )
    }

    // Stream the response using Vercel AI SDK
    const result = await streamText({
      model: selectedModel,
      messages,
      temperature: 0.7,
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to generate response',
        details: error
      },
      { status: 500 }
    )
  }
}

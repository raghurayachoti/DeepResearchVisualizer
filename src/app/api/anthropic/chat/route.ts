import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

// Set the API key in the environment
process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = await streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    messages: convertToCoreMessages(messages),
    system: "You are a helpful AI assistant",
  });

  return result.toDataStreamResponse();
}

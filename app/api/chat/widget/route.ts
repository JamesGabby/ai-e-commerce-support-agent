import {
  convertToModelMessages,
  createUIMessageStream,
  JsonToSseTransformStream,
  smoothStream,
  stepCountIs,
  streamText,
} from "ai";
import { getLanguageModel } from "@/lib/ai/providers";
import { systemPrompt } from "@/lib/ai/prompts";
import { generateUUID } from "@/lib/utils";

export const maxDuration = 60;

// Simplified widget endpoint - no auth required, no persistence
export async function POST(request: Request) {
  try {
    const { messages, id } = await request.json();

    const requestHints = {
      latitude: undefined,
      longitude: undefined,
      city: "Unknown",
      country: "Unknown",
    };

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model: getLanguageModel("google/gemini-2.5-flash-lite"),
          system: systemPrompt({
            selectedChatModel: "google/gemini-2.5-flash-lite",
            requestHints,
          }),
          messages: await convertToModelMessages(messages),
          stopWhen: stepCountIs(5),
          experimental_transform: smoothStream({ chunking: "word" }),
        });

        result.consumeStream();

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );
      },
      generateId: generateUUID,
      onError: () => "Oops, an error occurred!",
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()));
  } catch (error) {
    console.error("Widget chat error:", error);
    return new Response("Error", { status: 500 });
  }
}
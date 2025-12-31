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

// Import Shopify tools
import { lookupOrder } from "@/lib/ai/tools/lookup-order";
import { lookupCustomer } from "@/lib/ai/tools/lookup-customer";
import { getOrderHistory } from "@/lib/ai/tools/order-history";
import { searchProductCatalog } from "@/lib/ai/tools/search-products";
import { getTrackingInfo } from "@/lib/ai/tools/get-tracking";
import { cancelOrderTool } from "@/lib/ai/tools/cancel-order";
import { verifyCustomer } from "@/lib/ai/tools/verify-customer";
import { requestReturn } from "@/lib/ai/tools/request-return";
import { createSupportTicket } from "@/lib/ai/tools/create-support-ticket";
import { updateShippingAddress } from "@/lib/ai/tools/update-shipping-address";

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
          experimental_activeTools: [
            "lookupOrder",
            "lookupCustomer",
            "getOrderHistory",
            "searchProductCatalog",
            "getTrackingInfo",
            "cancelOrderTool",
            "verifyCustomer",
            "requestReturn",
            "createSupportTicket",
            "updateShippingAddress",
          ],
          tools: {
            lookupOrder,
            lookupCustomer,
            getOrderHistory,
            searchProductCatalog,
            getTrackingInfo,
            cancelOrderTool,
            verifyCustomer,
            requestReturn,
            createSupportTicket,
            updateShippingAddress
          },
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
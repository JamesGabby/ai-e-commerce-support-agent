// lib/ai/tools/capture-lead.ts
import { tool } from "ai";
import { z } from "zod";
import { captureLeadInShopify } from "@/lib/shopify";

export const captureLead = tool({
  description: `Capture customer contact information for follow-up.
    
    Use this when:
    - Customer asks to be notified about restocks
    - Customer wants to receive more info or a quote
    - Customer wants to sign up for newsletter/updates
    - Customer is interested but not ready to buy
    
    BEFORE calling this tool:
    1. Ask for permission to collect their info
    2. Get their email (required)
    3. Optionally get name/phone if offered
    4. Ask about marketing consent if signing up for newsletter
    
    YOU determine the source based on context - don't ask customer.`,
  inputSchema: z.object({
    email: z
      .string()
      .email()
      .describe("Customer's email address"),
    firstName: z
      .string()
      .optional()
      .describe("Customer's first name if provided"),
    lastName: z
      .string()
      .optional()
      .describe("Customer's last name if provided"),
    phone: z
      .string()
      .optional()
      .describe("Customer's phone number if provided"),
    interest: z
      .string()
      .describe("What the customer is interested in (product name, restock item, etc.)"),
    marketingConsent: z
      .boolean()
      .describe("Whether customer agreed to receive marketing emails"),
    source: z
      .enum([
        "restock_notification",
        "product_inquiry",
        "newsletter",
        "quote_request",
        "general"
      ])
      .describe("YOU determine this based on why they're giving their email - don't ask customer"),
  }),
  execute: async (input) => {
    console.log("📧 captureLead called:", JSON.stringify(input, null, 2));

    try {
      const tags = [
        "chatbot-lead",
        `source:${input.source}`,
        `interest:${input.interest.toLowerCase().replace(/\s+/g, '-').substring(0, 50)}`,
        `captured:${new Date().toISOString().split('T')[0]}`,
      ];

      if (input.marketingConsent) {
        tags.push("marketing-consent");
      }

      const note = `
        Lead captured via chatbot
        Source: ${input.source}
        Interest: ${input.interest}
        Marketing consent: ${input.marketingConsent ? 'Yes' : 'No'}
        Captured at: ${new Date().toISOString()}
      `.trim();

      const result = await captureLeadInShopify({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        tags,
        note,
        marketingConsent: input.marketingConsent,
      });

      // Handle failure case
      if (!result.success) {
        console.log("❌ Lead capture failed:", result.error);
        return {
          success: false,
          message: "Sorry, I couldn't save your information. Please try again.",
          error: result.error,
        };
      }

      // Success case - now TypeScript knows result.success is true
      const responses: Record<string, string> = {
        restock_notification: `I've added you to our restock notification list for ${input.interest}. We'll email you at ${input.email} as soon as it's back in stock!`,
        product_inquiry: `I've saved your information. Our team will follow up with you at ${input.email} regarding ${input.interest}.`,
        newsletter: `You're all set! You'll receive our updates at ${input.email}.`,
        quote_request: `Our team will prepare a quote for ${input.interest} and send it to ${input.email} shortly.`,
        general: `I've saved your contact information. We'll be in touch at ${input.email}.`,
      };

      console.log("✅ Lead captured successfully:", {
        email: input.email,
        isNew: result.isNew,
        source: input.source,
      });

      return {
        success: true,
        isNewLead: result.isNew,
        message: responses[input.source] || responses.general,
        details: {
          email: input.email,
          name: input.firstName || "Not provided",
          interest: input.interest,
          source: input.source,
          marketingConsent: input.marketingConsent,
        },
      };
    } catch (error) {
      console.error("❌ Lead capture error:", error);
      return {
        success: false,
        message: "Sorry, something went wrong. Please try again later.",
      };
    }
  },
});
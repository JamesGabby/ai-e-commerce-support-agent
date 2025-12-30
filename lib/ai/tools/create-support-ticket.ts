// lib/ai/tools/create-support-ticket.ts
import { tool } from "ai";
import { z } from "zod";

export const createSupportTicket = tool({
  description: `Create a support ticket for issues needing human follow-up.
    
    BEFORE calling this tool, gather from customer:
    1. Email (required)
    2. What their issue is (required)
    3. Order number (if order-related)
    
    YOU (the AI) determine the category and priority - don't ask customer for these.
    
    Priority guide:
    - urgent: Customer very angry, safety issue, expensive item damaged
    - high: Order not received, time-sensitive, major issue
    - medium: General complaints, return problems
    - low: Questions, feedback, minor issues`,
  inputSchema: z.object({
    customerEmail: z
      .string()
      .email()
      .describe("Customer's email address"),
    customerName: z
      .string()
      .optional()
      .describe("Customer's name if provided"),
    orderNumber: z
      .string()
      .optional()
      .describe("Order number if order-related"),
    category: z
      .enum([
        "order_issue",
        "shipping", 
        "return_problem",
        "product_defect",
        "warranty",
        "refund_request",
        "complaint",
        "general_inquiry"
      ])
      .describe("YOU determine this based on the issue - don't ask customer"),
    priority: z
      .enum(["low", "medium", "high", "urgent"])
      .describe("YOU determine this based on urgency and customer emotion - don't ask customer"),
    subject: z
      .string()
      .describe("Brief subject line summarizing the issue"),
    description: z
      .string()
      .describe("Detailed description including what the issue is and any context"),
  }),
  execute: async (input) => {
    console.log("🎫 createSupportTicket called:", JSON.stringify(input, null, 2));

    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;

    const responseTimes: Record<string, string> = {
      urgent: "within 2 hours",
      high: "within 4 hours", 
      medium: "within 24 hours",
      low: "within 48 hours",
    };

    const categoryLabels: Record<string, string> = {
      order_issue: "Order Issue",
      shipping: "Shipping & Delivery",
      return_problem: "Return Problem",
      product_defect: "Product Defect",
      warranty: "Warranty Claim",
      refund_request: "Refund Request",
      complaint: "Complaint",
      general_inquiry: "General Inquiry",
    };

    console.log("📧 Ticket created:", {
      id: ticketId,
      ...input,
    });

    return {
      success: true,
      ticketId,
      message: `Support ticket created!`,
      details: {
        email: input.customerEmail,
        category: categoryLabels[input.category],
        orderNumber: input.orderNumber || "N/A",
      },
      responseTime: responseTimes[input.priority],
      whatToExpect: [
        `📧 Confirmation email sent to ${input.customerEmail}`,
        `⏰ A team member will respond ${responseTimes[input.priority]}`,
        `🎫 Your ticket ID: ${ticketId}`,
      ],
      contactInfo: {
        email: "support@techgearsnowboards.com",
        phone: "1-800-SHRED-IT",
      },
    };
  },
});
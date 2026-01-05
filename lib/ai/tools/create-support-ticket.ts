// lib/ai/tools/create-support-ticket.ts
import { tool } from "ai";
import { z } from "zod";

// Simple in-memory cache for idempotency (use Redis in production)
const recentTickets = new Map<string, { ticketId: string; timestamp: number }>();

// Clean old entries every 5 minutes
setInterval(() => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, value] of recentTickets.entries()) {
    if (value.timestamp < fiveMinutesAgo) {
      recentTickets.delete(key);
    }
  }
}, 5 * 60 * 1000);

export const createSupportTicket = tool({
  description: `Create a support ticket for issues needing human follow-up.
    
    BEFORE calling this tool, gather from customer:
    1. Email (required)
    2. What their issue is (required)
    3. Order number (if order-related)
    
    IMPORTANT: Only call this tool ONCE per issue. If you've already created a ticket, do NOT call again.
    
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
        "general_inquiry",
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
    const startTime = Date.now();
    console.log(`🎫 [${startTime}] createSupportTicket called:`, JSON.stringify(input, null, 2));

    // Create idempotency key from email + order + subject
    const idempotencyKey = `${input.customerEmail}:${input.orderNumber || "no-order"}:${input.subject.slice(0, 30)}`;

    // Check for duplicate within last 2 minutes
    const existing = recentTickets.get(idempotencyKey);
    if (existing && Date.now() - existing.timestamp < 2 * 60 * 1000) {
      console.log(`🎫 [${startTime}] Duplicate detected! Returning existing ticket: ${existing.ticketId}`);

      return {
        success: true,
        ticketId: existing.ticketId,
        duplicate: true,
        priority: input.priority,
        responseTime: getResponseTime(input.priority),
        customerEmail: input.customerEmail,
        supportEmail: "support@techgearsnowboards.com",
        supportPhone: "1-800-SHRED-IT",
        businessHours: "Monday-Friday 9AM-6PM EST, Saturday 10AM-4PM EST",
        message: "Ticket was already created for this issue.",
      };
    }

    // Generate consistent ticket ID format
    const ticketId = generateTicketId();

    // Store for idempotency check
    recentTickets.set(idempotencyKey, { ticketId, timestamp: Date.now() });

    console.log(`🎫 [${startTime}] Created new ticket: ${ticketId}`);

    // TODO: Actually save to database
    // await db.insert(supportTickets).values({
    //   id: ticketId,
    //   tenantId: getCurrentTenantId(),
    //   ...input,
    //   createdAt: new Date(),
    // });

    // TODO: Send notification email to business owner

    return {
      success: true,
      ticketId,
      duplicate: false,
      priority: input.priority,
      responseTime: getResponseTime(input.priority),
      customerEmail: input.customerEmail,
      supportEmail: "support@techgearsnowboards.com",
      supportPhone: "1-800-SHRED-IT",
      businessHours: "Monday-Friday 9AM-6PM EST, Saturday 10AM-4PM EST",
    };
  },
});

function generateTicketId(): string {
  // Consistent format: TKT-XXXXXXXX (8 alphanumeric chars)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (0,O,1,I,L)
  let id = "TKT-";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function getResponseTime(priority: string): string {
  const times: Record<string, string> = {
    urgent: "within 2 hours",
    high: "within 4 hours",
    medium: "within 24 hours",
    low: "within 48 hours",
  };
  return times[priority] || "within 48 hours";
}
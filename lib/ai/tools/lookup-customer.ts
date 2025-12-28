// lib/ai/tools/lookup-customer.ts
import { tool } from "ai";
import { z } from "zod";
import { getCustomerByEmail } from "@/lib/shopify";

export const lookupCustomer = tool({
  description:
    "Look up a customer by their email address. Use this to find customer details, order count, and total spent.",
  inputSchema: z.object({
    email: z
      .string()
      .email()
      .describe("The customer's email address"),
  }),
  execute: async (input) => {
    try {
      const customer = await getCustomerByEmail(input.email);

      if (!customer) {
        return {
          found: false,
          message: `No customer found with email ${input.email}`,
        };
      }

      return {
        found: true,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'N/A',
        email: customer.email,
        phone: customer.phone || 'Not provided',
        totalOrders: customer.numberOfOrders,
        totalSpent: customer.amountSpent,
        location: customer.defaultAddress 
          ? `${customer.defaultAddress.city}, ${customer.defaultAddress.province}, ${customer.defaultAddress.country}`
          : 'Not provided',
        customerSince: customer.createdAt,
      };
    } catch (error) {
      return {
        found: false,
        message: "Error looking up customer. Please try again.",
      };
    }
  },
});
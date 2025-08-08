import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreatePaymentRequest {
  invoiceId: string;
  returnUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ 
          error: "Payment service not configured. Please add STRIPE_SECRET_KEY in admin settings." 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get the request data
    const { invoiceId, returnUrl }: CreatePaymentRequest = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: "Invoice ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client to fetch invoice data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select(`
        *,
        customer:customers(*),
        company:companies(*),
        invoice_items(*)
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return new Response(
        JSON.stringify({ error: "Invoice not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === 'paid') {
      return new Response(
        JSON.stringify({ error: "This invoice has already been paid" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create line items for Stripe
    const lineItems = invoice.invoice_items?.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.description,
        },
        unit_amount: Math.round(item.unit_price * 100), // Convert to cents
      },
      quantity: item.quantity,
    })) || [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Invoice ${invoice.invoice_number}`,
        },
        unit_amount: Math.round(invoice.total_amount * 100), // Convert to cents
      },
      quantity: 1,
    }];

    // Add tax as a separate line item if there's tax
    if (invoice.tax_amount > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: {
            name: "Tax",
          },
          unit_amount: Math.round(invoice.tax_amount * 100), // Convert to cents
        },
        quantity: 1,
      });
    }

    // Check if customer exists in Stripe
    let customerId;
    if (invoice.customer?.email) {
      const customers = await stripe.customers.list({ 
        email: invoice.customer.email, 
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        // Create customer if doesn't exist
        const customer = await stripe.customers.create({
          email: invoice.customer.email,
          name: `${invoice.customer.first_name} ${invoice.customer.last_name}`,
        });
        customerId = customer.id;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : invoice.customer?.email,
      line_items: lineItems,
      mode: "payment",
      success_url: returnUrl ? `${returnUrl}?session_id={CHECKOUT_SESSION_ID}` : `${req.headers.get("origin")}/dashboard/invoices/${invoiceId}?payment=success`,
      cancel_url: returnUrl ? `${returnUrl}?canceled=true` : `${req.headers.get("origin")}/dashboard/invoices/${invoiceId}?payment=canceled`,
      metadata: {
        invoice_id: invoiceId,
        invoice_number: invoice.invoice_number,
      },
      payment_intent_data: {
        metadata: {
          invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
        },
      },
    });

    // Log the payment attempt
    await supabaseClient.from("customer_interactions").insert({
      customer_id: invoice.customer_id,
      interaction_type: "note",
      subject: `Payment initiated for Invoice ${invoice.invoice_number}`,
      description: `Payment session created. Amount: $${invoice.total_amount}`,
      created_by: invoice.created_by,
    });

    console.log("Payment session created successfully:", session.id);

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url,
      message: "Payment session created successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in create-payment function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to create payment session" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
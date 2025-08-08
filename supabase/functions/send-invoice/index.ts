import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendInvoiceRequest {
  invoiceId: string;
  recipientEmail: string;
  recipientName: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ 
          error: "Email service not configured. Please add RESEND_API_KEY in admin settings." 
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const resend = new Resend(resendApiKey);

    // Get the request data
    const { invoiceId, recipientEmail, recipientName, message }: SendInvoiceRequest = await req.json();

    if (!invoiceId || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: "Invoice ID and recipient email are required" }),
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

    // Format currency
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    // Format date
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    // Create email content
    const customMessage = message ? `
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #1e293b;">Personal Message:</h3>
        <p style="margin: 0; color: #475569; font-style: italic;">"${message}"</p>
      </div>
    ` : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice ${invoice.invoice_number}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; color: #6b7280; font-size: 14px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #1f2937; margin: 0;">Invoice from TimeTracker Pro</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Professional Workforce Management</p>
          </div>

          <p>Dear ${recipientName},</p>
          
          <p>Please find attached your invoice <strong>#${invoice.invoice_number}</strong> for the amount of <strong>${formatCurrency(invoice.total_amount)}</strong>.</p>

          ${customMessage}

          <div class="invoice-details">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">Invoice Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Invoice Number:</td>
                <td style="padding: 8px 0; font-weight: 600;">${invoice.invoice_number}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Issue Date:</td>
                <td style="padding: 8px 0; font-weight: 600;">${formatDate(invoice.issue_date)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Due Date:</td>
                <td style="padding: 8px 0; font-weight: 600;">${formatDate(invoice.due_date)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Amount Due:</td>
                <td style="padding: 8px 0; font-weight: 600; font-size: 18px; color: #059669;">${formatCurrency(invoice.total_amount)}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")}/invoices/${invoice.id}/pay" class="button">
              Pay Invoice Online
            </a>
          </div>

          <p>If you have any questions about this invoice, please don't hesitate to contact us.</p>

          <p>Thank you for your business!</p>

          <p>Best regards,<br>
          <strong>TimeTracker Pro Team</strong></p>

          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>© ${new Date().getFullYear()} TimeTracker Pro. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the email
    const emailResponse = await resend.emails.send({
      from: "TimeTracker Pro <invoices@yourdomain.com>",
      to: [recipientEmail],
      subject: `Invoice ${invoice.invoice_number} - ${formatCurrency(invoice.total_amount)}`,
      html: emailHtml,
      // Note: In a real implementation, you would also attach the PDF here
      // attachments: [{ filename: \`Invoice-\${invoice.invoice_number}.pdf\`, content: pdfBuffer }]
    });

    // Log the interaction
    await supabaseClient.from("customer_interactions").insert({
      customer_id: invoice.customer_id,
      interaction_type: "email",
      subject: `Invoice ${invoice.invoice_number} sent`,
      description: `Invoice sent to ${recipientEmail} via email`,
      created_by: invoice.created_by,
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id,
      message: "Invoice sent successfully" 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-invoice function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send invoice" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
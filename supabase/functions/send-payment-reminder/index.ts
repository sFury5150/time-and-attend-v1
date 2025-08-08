import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface PaymentReminderRequest {
  invoiceId: string;
  reminderType: 'first' | 'second' | 'final';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, reminderType }: PaymentReminderRequest = await req.json();

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        customer:customers(*),
        company:companies(*)
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    if (!invoice.customer?.email) {
      throw new Error('Customer email not found');
    }

    // Check if reminder already sent
    const { data: existingReminder } = await supabaseClient
      .from('payment_reminders')
      .select('id')
      .eq('invoice_id', invoiceId)
      .eq('reminder_type', reminderType)
      .single();

    if (existingReminder) {
      return new Response(JSON.stringify({ message: 'Reminder already sent' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const daysSinceIssue = Math.floor((new Date().getTime() - new Date(invoice.issue_date).getTime()) / (1000 * 3600 * 24));
    const daysPastDue = Math.floor((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 3600 * 24));

    const reminderMessages = {
      first: {
        subject: `Friendly Reminder: Payment Due for Invoice ${invoice.invoice_number}`,
        message: `We hope this message finds you well. This is a friendly reminder that payment for Invoice ${invoice.invoice_number} is due.`
      },
      second: {
        subject: `Second Notice: Payment Overdue for Invoice ${invoice.invoice_number}`,
        message: `This is a second reminder that payment for Invoice ${invoice.invoice_number} is now ${daysPastDue} days overdue. Please arrange payment at your earliest convenience.`
      },
      final: {
        subject: `Final Notice: Immediate Payment Required for Invoice ${invoice.invoice_number}`,
        message: `This is a final notice that payment for Invoice ${invoice.invoice_number} is significantly overdue (${daysPastDue} days). Please contact us immediately to arrange payment.`
      }
    };

    const reminderContent = reminderMessages[reminderType];

    const emailResponse = await resend.emails.send({
      from: "Billing <onboarding@resend.dev>",
      to: [invoice.customer.email],
      subject: reminderContent.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${reminderContent.subject}</h2>
          
          <p>Dear ${invoice.customer.first_name} ${invoice.customer.last_name},</p>
          
          <p>${reminderContent.message}</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Invoice Details:</h3>
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Issue Date:</strong> ${new Date(invoice.issue_date).toLocaleDateString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
            <p><strong>Amount Due:</strong> $${invoice.total_amount}</p>
          </div>
          
          <p>If you have already made this payment, please disregard this notice. If you have any questions or need to discuss payment arrangements, please don't hesitate to contact us.</p>
          
          <p>Thank you for your prompt attention to this matter.</p>
          
          <p>Best regards,<br>
          ${invoice.company?.name || 'Your Company'} Billing Department</p>
        </div>
      `,
    });

    // Record the reminder
    await supabaseClient
      .from('payment_reminders')
      .insert({
        invoice_id: invoiceId,
        reminder_type: reminderType,
        email_sent_to: invoice.customer.email
      });

    console.log("Payment reminder sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `${reminderType} reminder sent successfully`,
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error sending payment reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
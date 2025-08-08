import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecurringInvoiceRequest {
  templateInvoiceId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { templateInvoiceId }: RecurringInvoiceRequest = await req.json();

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get template invoice details
    const { data: templateInvoice, error: templateError } = await supabaseClient
      .from('invoices')
      .select(`
        *,
        invoice_items(*)
      `)
      .eq('id', templateInvoiceId)
      .single();

    if (templateError || !templateInvoice) {
      throw new Error('Template invoice not found');
    }

    if (!templateInvoice.is_recurring) {
      throw new Error('Invoice is not set up for recurring billing');
    }

    // Calculate next invoice date
    const currentDate = new Date();
    let nextInvoiceDate = new Date(templateInvoice.next_invoice_date);

    // Check if it's time to create the next invoice
    if (nextInvoiceDate > currentDate) {
      return new Response(JSON.stringify({ 
        message: 'Next invoice not due yet',
        nextInvoiceDate: nextInvoiceDate.toISOString()
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate new invoice number
    const { data: invoiceCount } = await supabaseClient
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (invoiceCount && invoiceCount.length > 0) {
      const lastNumber = invoiceCount[0].invoice_number;
      const match = lastNumber.match(/INV-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const newInvoiceNumber = `INV-${nextNumber.toString().padStart(6, '0')}`;

    // Calculate new dates
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from issue

    // Calculate next invoice date based on frequency
    const nextDate = new Date(nextInvoiceDate);
    switch (templateInvoice.recurring_frequency) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }

    // Create new invoice
    const newInvoiceData = {
      invoice_number: newInvoiceNumber,
      customer_id: templateInvoice.customer_id,
      company_id: templateInvoice.company_id,
      created_by: templateInvoice.created_by,
      issue_date: issueDate.toISOString().split('T')[0],
      due_date: dueDate.toISOString().split('T')[0],
      subtotal: templateInvoice.subtotal,
      tax_amount: templateInvoice.tax_amount,
      total_amount: templateInvoice.total_amount,
      status: 'draft',
      notes: templateInvoice.notes,
      is_recurring: false,
      parent_invoice_id: templateInvoiceId
    };

    const { data: newInvoice, error: invoiceError } = await supabaseClient
      .from('invoices')
      .insert(newInvoiceData)
      .select()
      .single();

    if (invoiceError) {
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Copy invoice items
    if (templateInvoice.invoice_items && templateInvoice.invoice_items.length > 0) {
      const newItems = templateInvoice.invoice_items.map((item: any) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabaseClient
        .from('invoice_items')
        .insert(newItems);

      if (itemsError) {
        throw new Error(`Failed to create invoice items: ${itemsError.message}`);
      }
    }

    // Update template invoice's next_invoice_date
    await supabaseClient
      .from('invoices')
      .update({ next_invoice_date: nextDate.toISOString() })
      .eq('id', templateInvoiceId);

    console.log(`Created recurring invoice ${newInvoiceNumber} from template ${templateInvoice.invoice_number}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Recurring invoice created successfully',
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoiceNumber,
      nextInvoiceDate: nextDate.toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error creating recurring invoice:", error);
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
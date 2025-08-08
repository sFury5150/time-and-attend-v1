import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateInvoicePDF = async (invoice: any) => {
  // Create a temporary div with the invoice content
  const invoiceContent = document.createElement('div');
  invoiceContent.style.width = '800px';
  invoiceContent.style.padding = '40px';
  invoiceContent.style.fontFamily = 'Arial, sans-serif';
  invoiceContent.style.backgroundColor = 'white';
  invoiceContent.style.position = 'absolute';
  invoiceContent.style.left = '-9999px';
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  invoiceContent.innerHTML = `
    <div style="max-width: 800px; margin: 0 auto; background: white;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px;">
        <div>
          <h1 style="font-size: 28px; font-weight: bold; color: #1f2937; margin: 0 0 8px 0;">INVOICE</h1>
          <p style="color: #6b7280; margin: 0; font-size: 14px;">Invoice #${invoice.invoice_number}</p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0;">TimeTracker Pro</h2>
          <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Workforce Management Solutions</p>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
        <div>
          <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Bill To:</h3>
          <div style="color: #374151;">
            <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 16px;">
              ${invoice.customer?.first_name} ${invoice.customer?.last_name}
            </p>
            ${invoice.customer?.email ? `<p style="margin: 0 0 4px 0; color: #6b7280;">${invoice.customer.email}</p>` : ''}
            ${invoice.company?.name ? `<p style="margin: 0 0 4px 0; font-weight: 500;">${invoice.company.name}</p>` : ''}
            ${invoice.company?.address ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">${invoice.company.address}</p>` : ''}
          </div>
        </div>
        <div>
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-weight: 500;">Issue Date:</span>
              <span style="color: #1f2937; font-weight: 600;">${formatDate(invoice.issue_date)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #6b7280; font-weight: 500;">Due Date:</span>
              <span style="color: #1f2937; font-weight: 600;">${formatDate(invoice.due_date)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280; font-weight: 500;">Status:</span>
              <span style="color: #1f2937; font-weight: 600; text-transform: capitalize;">${invoice.status}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Line Items -->
      <div style="margin-bottom: 40px;">
        <table style="width: 100%; border-collapse: collapse; background: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f9fafb;">
              <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Description</th>
              <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Qty</th>
              <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Unit Price</th>
              <th style="padding: 16px; text-align: right; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.invoice_items?.map((item: any, index: number) => `
              <tr style="${index % 2 === 0 ? 'background: #fafafa;' : 'background: white;'}">
                <td style="padding: 16px; color: #374151; border-bottom: 1px solid #f3f4f6;">${item.description}</td>
                <td style="padding: 16px; text-align: right; color: #374151; border-bottom: 1px solid #f3f4f6;">${item.quantity}</td>
                <td style="padding: 16px; text-align: right; color: #374151; border-bottom: 1px solid #f3f4f6;">${formatCurrency(item.unit_price)}</td>
                <td style="padding: 16px; text-align: right; color: #374151; border-bottom: 1px solid #f3f4f6; font-weight: 600;">${formatCurrency(item.total_price)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="padding: 32px; text-align: center; color: #6b7280;">No items added to this invoice</td></tr>'}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end;">
        <div style="min-width: 300px;">
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; background: white; overflow: hidden;">
            <div style="padding: 16px; display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6;">
              <span style="color: #6b7280; font-weight: 500;">Subtotal:</span>
              <span style="color: #374151; font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div style="padding: 16px; display: flex; justify-content: space-between; border-bottom: 1px solid #f3f4f6;">
              <span style="color: #6b7280; font-weight: 500;">Tax:</span>
              <span style="color: #374151; font-weight: 600;">${formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div style="padding: 20px; display: flex; justify-content: space-between; background: #f9fafb; font-size: 18px;">
              <span style="color: #1f2937; font-weight: 700;">Total:</span>
              <span style="color: #1f2937; font-weight: 700;">${formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      ${invoice.notes ? `
        <!-- Notes -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0;">Notes:</h3>
          <p style="color: #6b7280; margin: 0; line-height: 1.6;">${invoice.notes}</p>
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-center;">
        <p style="color: #6b7280; margin: 0; font-size: 14px;">Thank you for your business!</p>
        <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 12px;">Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
  `;

  // Add to document temporarily
  document.body.appendChild(invoiceContent);

  try {
    // Convert to canvas
    const canvas = await html2canvas(invoiceContent, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Download the PDF
    pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  } finally {
    // Remove temporary element
    document.body.removeChild(invoiceContent);
  }
};

export const previewInvoice = (invoice: any) => {
  const previewWindow = window.open('', '_blank', 'width=800,height=1000');
  if (!previewWindow) {
    throw new Error('Unable to open preview window. Please check your popup blocker.');
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  previewWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice ${invoice.invoice_number} - Preview</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
          border-radius: 8px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 40px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        .invoice-title {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 8px 0;
        }
        .company-title {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 40px;
        }
        .details-box {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          margin-bottom: 40px;
        }
        .table th {
          padding: 16px;
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e5e7eb;
        }
        .table td {
          padding: 16px;
          color: #374151;
          border-bottom: 1px solid #f3f4f6;
        }
        .table tr:nth-child(even) {
          background: #fafafa;
        }
        .totals-container {
          display: flex;
          justify-content: flex-end;
        }
        .totals-box {
          min-width: 300px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }
        .total-row {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #f3f4f6;
        }
        .total-row.final {
          padding: 20px;
          background: #f9fafb;
          font-size: 18px;
          font-weight: 700;
        }
        .notes {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
        }
        @media print {
          body { background: white; }
          .invoice-container { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-container">
        <!-- Header -->
        <div class="header">
          <div>
            <h1 class="invoice-title">INVOICE</h1>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Invoice #${invoice.invoice_number}</p>
          </div>
          <div style="text-align: right;">
            <h2 class="company-title">TimeTracker Pro</h2>
            <p style="color: #6b7280; margin: 4px 0 0 0; font-size: 14px;">Workforce Management Solutions</p>
          </div>
        </div>

        <!-- Invoice Details -->
        <div class="details-grid">
          <div>
            <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0;">Bill To:</h3>
            <div style="color: #374151;">
              <p style="margin: 0 0 4px 0; font-weight: 600; font-size: 16px;">
                ${invoice.customer?.first_name} ${invoice.customer?.last_name}
              </p>
              ${invoice.customer?.email ? `<p style="margin: 0 0 4px 0; color: #6b7280;">${invoice.customer.email}</p>` : ''}
              ${invoice.company?.name ? `<p style="margin: 0 0 4px 0; font-weight: 500;">${invoice.company.name}</p>` : ''}
              ${invoice.company?.address ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">${invoice.company.address}</p>` : ''}
            </div>
          </div>
          <div>
            <div class="details-box">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-weight: 500;">Issue Date:</span>
                <span style="color: #1f2937; font-weight: 600;">${formatDate(invoice.issue_date)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #6b7280; font-weight: 500;">Due Date:</span>
                <span style="color: #1f2937; font-weight: 600;">${formatDate(invoice.due_date)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #6b7280; font-weight: 500;">Status:</span>
                <span style="color: #1f2937; font-weight: 600; text-transform: capitalize;">${invoice.status}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <table class="table">
          <thead>
            <tr>
              <th style="text-align: left;">Description</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.invoice_items?.map((item: any) => `
              <tr>
                <td>${item.description}</td>
                <td style="text-align: right;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(item.unit_price)}</td>
                <td style="text-align: right; font-weight: 600;">${formatCurrency(item.total_price)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4" style="padding: 32px; text-align: center; color: #6b7280;">No items added to this invoice</td></tr>'}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-container">
          <div class="totals-box">
            <div class="total-row">
              <span style="color: #6b7280; font-weight: 500;">Subtotal:</span>
              <span style="color: #374151; font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
            </div>
            <div class="total-row">
              <span style="color: #6b7280; font-weight: 500;">Tax:</span>
              <span style="color: #374151; font-weight: 600;">${formatCurrency(invoice.tax_amount)}</span>
            </div>
            <div class="total-row final">
              <span style="color: #1f2937;">Total:</span>
              <span style="color: #1f2937;">${formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        ${invoice.notes ? `
          <!-- Notes -->
          <div class="notes">
            <h3 style="font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 12px 0;">Notes:</h3>
            <p style="color: #6b7280; margin: 0; line-height: 1.6;">${invoice.notes}</p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p style="margin: 0; font-size: 14px;">Thank you for your business!</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">Generated on ${new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </body>
    </html>
  `);

  previewWindow.document.close();
};
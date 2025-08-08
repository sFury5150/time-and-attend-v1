import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { useInvoices } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Edit, Trash2, FileText, Download, Eye, Send, Printer, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { generateInvoicePDF, previewInvoice } from '@/utils/invoicePDF';
import { supabase } from '@/integrations/supabase/client';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, loading, updateInvoice, addInvoiceItem, updateInvoiceItem, deleteInvoiceItem } = useInvoices();
  const { customers } = useCustomers();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [sendFormData, setSendFormData] = useState({
    recipientEmail: '',
    recipientName: '',
    message: ''
  });
  const [itemFormData, setItemFormData] = useState({
    description: '',
    quantity: 1,
    unit_price: 0
  });

  useEffect(() => {
    if (invoices.length > 0 && id) {
      const foundInvoice = invoices.find(inv => inv.id === id);
      setInvoice(foundInvoice);
      
      // Pre-fill send form with customer data
      if (foundInvoice?.customer) {
        setSendFormData(prev => ({
          ...prev,
          recipientEmail: foundInvoice.customer.email || '',
          recipientName: `${foundInvoice.customer.first_name} ${foundInvoice.customer.last_name}`
        }));
      }
    }
  }, [invoices, id]);

  const resetItemForm = () => {
    setItemFormData({
      description: '',
      quantity: 1,
      unit_price: 0
    });
    setEditingItem(null);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await addInvoiceItem(invoice.id, itemFormData);
      toast({
        title: 'Item added',
        description: 'Invoice item has been added successfully.',
      });
      resetItemForm();
      setIsItemDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditItem = (item: any) => {
    setEditingItem(item);
    setItemFormData({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price
    });
    setIsItemDialogOpen(true);
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateInvoiceItem(editingItem.id, itemFormData);
      toast({
        title: 'Item updated',
        description: 'Invoice item has been updated successfully.',
      });
      resetItemForm();
      setIsItemDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update item. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteInvoiceItem(itemId);
        toast({
          title: 'Item deleted',
          description: 'Invoice item has been deleted successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete item. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'sent':
        return 'secondary';
      case 'overdue':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const generatePDF = async () => {
    try {
      await generateInvoicePDF(invoice);
      toast({
        title: 'PDF Generated',
        description: 'Invoice PDF has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = () => {
    try {
      previewInvoice(invoice);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open preview. Please check your popup blocker.',
        variant: 'destructive',
      });
    }
  };

  const sendInvoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: {
          invoiceId: invoice.id,
          recipientEmail: sendFormData.recipientEmail,
          recipientName: sendFormData.recipientName,
          message: sendFormData.message
        }
      });

      if (error) throw error;

      toast({
        title: 'Invoice sent',
        description: `Invoice has been sent to ${sendFormData.recipientEmail}`,
      });
      
      setIsSendDialogOpen(false);
      setSendFormData(prev => ({ ...prev, message: '' }));
    } catch (error: any) {
      toast({
        title: 'Error sending invoice',
        description: error.message || 'Failed to send invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePayInvoice = async () => {
    setIsProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          invoiceId: invoice.id,
          returnUrl: window.location.href
        }
      });

      if (error) throw error;

      if (data.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Error processing payment',
        description: error.message || 'Failed to process payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">Loading invoice...</div>
      </DashboardLayout>
    );
  }

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold">Invoice not found</h2>
          <p className="text-muted-foreground mt-2">The invoice you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/dashboard/invoices')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/invoices')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Invoices
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoice_number}</h1>
              <p className="text-muted-foreground">
                Created {format(new Date(invoice.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="outline" onClick={generatePDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            {invoice.status !== 'paid' && (
              <Button 
                variant="outline" 
                onClick={handlePayInvoice}
                disabled={isProcessingPayment}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {isProcessingPayment ? 'Processing...' : 'Pay Online'}
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const subject = `Invoice ${invoice.invoice_number} - ${formatCurrency(invoice.total_amount)}`;
                  const body = `Dear ${invoice.customer?.first_name} ${invoice.customer?.last_name},

Please find attached your invoice details:

Invoice Number: ${invoice.invoice_number}
Issue Date: ${format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
Due Date: ${format(new Date(invoice.due_date), 'MMM dd, yyyy')}
Total Amount: ${formatCurrency(invoice.total_amount)}

Thank you for your business!

Best regards`;
                  const mailto = `mailto:${invoice.customer?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  window.open(mailto, '_self');
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Email Client
              </Button>
              <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Send className="mr-2 h-4 w-4" />
                    Send Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Invoice via Email</DialogTitle>
                  <DialogDescription>
                    Send this invoice to your customer via email with PDF attachment.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={sendInvoice}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recipientEmail" className="text-right">
                        Email *
                      </Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        value={sendFormData.recipientEmail}
                        onChange={(e) => setSendFormData(prev => ({...prev, recipientEmail: e.target.value}))}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="recipientName" className="text-right">
                        Name *
                      </Label>
                      <Input
                        id="recipientName"
                        value={sendFormData.recipientName}
                        onChange={(e) => setSendFormData(prev => ({...prev, recipientName: e.target.value}))}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="message" className="text-right">
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        value={sendFormData.message}
                        onChange={(e) => setSendFormData(prev => ({...prev, message: e.target.value}))}
                        className="col-span-3"
                        rows={3}
                        placeholder="Optional personal message to include with the invoice..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSending}>
                      {isSending ? 'Sending...' : 'Send Invoice'}
                    </Button>
                  </DialogFooter>
                </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Invoice Information
                <Badge variant={getStatusVariant(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Issue Date</Label>
                  <p className="font-medium">{format(new Date(invoice.issue_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Customer</Label>
                  <p className="font-medium">
                    {invoice.customer?.first_name} {invoice.customer?.last_name}
                  </p>
                  {invoice.customer?.email && (
                    <p className="text-muted-foreground">{invoice.customer.email}</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Company</Label>
                  <p className="font-medium">{invoice.company?.name || 'N/A'}</p>
                </div>
              </div>
              {invoice.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="mt-1">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(invoice.total_amount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Line Items
              <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetItemForm()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingItem ? 'Edit Item' : 'Add New Item'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingItem 
                        ? 'Update the item details below.'
                        : 'Enter the item details below to add to the invoice.'
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">
                          Description *
                        </Label>
                        <Input
                          id="description"
                          value={itemFormData.description}
                          onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                          Quantity *
                        </Label>
                        <Input
                          id="quantity"
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={itemFormData.quantity}
                          onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseFloat(e.target.value) || 1 })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="unit_price" className="text-right">
                          Unit Price *
                        </Label>
                        <Input
                          id="unit_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={itemFormData.unit_price}
                          onChange={(e) => setItemFormData({ ...itemFormData, unit_price: parseFloat(e.target.value) || 0 })}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Total</Label>
                        <div className="col-span-3 font-medium">
                          {formatCurrency((itemFormData.quantity || 0) * (itemFormData.unit_price || 0))}
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">
                        {editingItem ? 'Update Item' : 'Add Item'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!invoice.invoice_items || invoice.invoice_items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items added to this invoice yet. Add your first item to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.invoice_items.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total_price)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default InvoiceDetail;
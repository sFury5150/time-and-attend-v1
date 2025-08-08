import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, 
  Plus, 
  Calendar, 
  Repeat,
  StopCircle,
  Play,
  Clock
} from 'lucide-react';
import { useRecurringInvoices } from '@/hooks/useRecurringInvoices';
import { useInvoices } from '@/hooks/useInvoices';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const RecurringInvoicesManager = () => {
  const { recurringInvoices, loading, createRecurringInvoice, generateNextRecurringInvoice, stopRecurringInvoice, getRecurringInvoicesData } = useRecurringInvoices();
  const { invoices } = useInvoices();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const data = getRecurringInvoicesData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleCreateRecurring = async () => {
    if (!selectedInvoiceId) {
      toast({
        title: 'Error',
        description: 'Please select an invoice to set up recurring billing.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createRecurringInvoice(selectedInvoiceId, frequency, startDate, endDate || undefined);
      toast({
        title: 'Recurring Invoice Created',
        description: 'The invoice has been set up for recurring billing.',
      });
      setIsCreateDialogOpen(false);
      setSelectedInvoiceId('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create recurring invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateNext = async (invoiceId: string) => {
    setIsGenerating(true);
    try {
      const result = await generateNextRecurringInvoice(invoiceId);
      toast({
        title: 'Invoice Generated',
        description: `New invoice ${result.invoiceNumber} has been created.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate next invoice. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopRecurring = async (invoiceId: string) => {
    try {
      await stopRecurringInvoice(invoiceId);
      toast({
        title: 'Recurring Stopped',
        description: 'The recurring invoice has been stopped.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop recurring invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const availableInvoices = invoices.filter(invoice => 
    !invoice.is_recurring && invoice.status === 'paid'
  );

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      monthly: 'default',
      quarterly: 'secondary',
      yearly: 'outline'
    } as const;
    
    return (
      <Badge variant={colors[frequency as keyof typeof colors] || 'default'}>
        {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (invoice: any) => {
    const nextDate = new Date(invoice.next_invoice_date);
    const now = new Date();
    const isOverdue = nextDate <= now;
    const isActive = !invoice.recurring_end_date || new Date(invoice.recurring_end_date) > now;

    if (!isActive) {
      return <Badge variant="outline">Stopped</Badge>;
    }

    if (isOverdue) {
      return <Badge variant="destructive">Due</Badge>;
    }

    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recurring Invoices</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recurring Invoices</h2>
          <p className="text-muted-foreground">Manage automated invoice generation</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Setup Recurring
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Setup Recurring Invoice</DialogTitle>
              <DialogDescription>
                Configure an existing invoice for automatic recurring generation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="invoice" className="text-right">
                  Invoice *
                </Label>
                <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an invoice" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableInvoices.map((invoice) => (
                      <SelectItem key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} - {formatCurrency(invoice.total_amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="frequency" className="text-right">
                  Frequency *
                </Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Start Date *
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="col-span-3"
                  placeholder="Optional"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRecurring}>
                Setup Recurring
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Recurring</CardTitle>
            <Repeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active.length}</div>
            <p className="text-xs text-muted-foreground">
              Currently active setups
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due for Generation</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overdue.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to generate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Setup</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total}</div>
            <p className="text-xs text-muted-foreground">
              All time recurring invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recurring Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recurring Invoice Templates</CardTitle>
          <CardDescription>
            Manage your recurring invoice setups and generate new invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recurringInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recurring invoices set up yet. Create your first recurring invoice to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>
                      {invoice.customer?.first_name} {invoice.customer?.last_name}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(invoice.total_amount)}
                    </TableCell>
                    <TableCell>
                      {getFrequencyBadge(invoice.recurring_frequency)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(invoice.next_invoice_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {new Date(invoice.next_invoice_date) <= new Date() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateNext(invoice.id)}
                            disabled={isGenerating}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStopRecurring(invoice.id)}
                        >
                          <StopCircle className="h-3 w-3" />
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
  );
};

export default RecurringInvoicesManager;
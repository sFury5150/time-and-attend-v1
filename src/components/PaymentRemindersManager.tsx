import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Clock
} from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import { useInvoiceAnalytics } from '@/hooks/useInvoiceAnalytics';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';

const PaymentRemindersManager = () => {
  const { invoices } = useInvoices();
  const { sendPaymentReminder } = useInvoiceAnalytics();
  const { toast } = useToast();
  
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [reminderType, setReminderType] = useState<'first' | 'second' | 'final'>('first');
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Filter overdue invoices
  const overdueInvoices = invoices.filter(invoice => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    return dueDate < today;
  });

  // Filter invoices due soon (within 7 days)
  const dueSoonInvoices = invoices.filter(invoice => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    const dueDate = new Date(invoice.due_date);
    const today = new Date();
    const daysUntilDue = differenceInDays(dueDate, today);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  });

  const getDaysSinceOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    return differenceInDays(today, due);
  };

  const getUrgencyBadge = (daysOverdue: number) => {
    if (daysOverdue <= 7) {
      return <Badge variant="secondary">Recently Due</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else {
      return <Badge variant="destructive">Critical</Badge>;
    }
  };

  const getSuggestedReminderType = (daysOverdue: number): 'first' | 'second' | 'final' => {
    if (daysOverdue <= 7) return 'first';
    if (daysOverdue <= 30) return 'second';
    return 'final';
  };

  const handleSendReminder = async () => {
    if (!selectedInvoice) return;

    setIsSending(true);
    try {
      await sendPaymentReminder(selectedInvoice.id, reminderType);
      toast({
        title: 'Reminder Sent',
        description: `${reminderType} reminder sent to ${selectedInvoice.customer?.email}`,
      });
      setIsReminderDialogOpen(false);
      setSelectedInvoice(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send payment reminder. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const openReminderDialog = (invoice: any) => {
    const daysOverdue = getDaysSinceOverdue(invoice.due_date);
    setSelectedInvoice(invoice);
    setReminderType(getSuggestedReminderType(daysOverdue));
    setIsReminderDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Payment Reminders</h2>
        <p className="text-muted-foreground">Manage overdue invoices and payment reminders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(overdueInvoices.reduce((sum, inv) => sum + inv.total_amount, 0))} total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dueSoonInvoices.length}</div>
            <p className="text-xs text-muted-foreground">
              Due within 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {invoices.length > 0 ? Math.round((invoices.filter(inv => inv.status === 'paid').length / invoices.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Paid invoices ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Invoices</CardTitle>
          <CardDescription>
            Invoices that are past their due date and require attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overdueInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="mx-auto h-12 w-12 mb-4 text-green-500" />
              <p>Great! No overdue invoices at the moment.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueInvoices.map((invoice) => {
                  const daysOverdue = getDaysSinceOverdue(invoice.due_date);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {invoice.customer?.first_name} {invoice.customer?.last_name}
                        <br />
                        <span className="text-sm text-muted-foreground">
                          {invoice.customer?.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(invoice.total_amount)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-destructive">
                          {daysOverdue} days
                        </span>
                      </TableCell>
                      <TableCell>
                        {getUrgencyBadge(daysOverdue)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReminderDialog(invoice)}
                        >
                          <Send className="mr-2 h-3 w-3" />
                          Send Reminder
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Due Soon Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Due Soon</CardTitle>
          <CardDescription>
            Invoices due within the next 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dueSoonInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="mx-auto h-12 w-12 mb-4" />
              <p>No invoices due in the next 7 days.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Days Until Due</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dueSoonInvoices.map((invoice) => {
                  const daysUntilDue = differenceInDays(new Date(invoice.due_date), new Date());
                  return (
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
                        {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={daysUntilDue <= 2 ? "destructive" : "secondary"}>
                          {daysUntilDue === 0 ? 'Due Today' : `${daysUntilDue} days`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openReminderDialog(invoice)}
                        >
                          <Send className="mr-2 h-3 w-3" />
                          Send Notice
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send a payment reminder email for invoice {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right font-medium">Customer:</span>
              <span className="col-span-3">
                {selectedInvoice?.customer?.first_name} {selectedInvoice?.customer?.last_name}
                <br />
                <span className="text-sm text-muted-foreground">
                  {selectedInvoice?.customer?.email}
                </span>
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right font-medium">Amount:</span>
              <span className="col-span-3 font-medium">
                {selectedInvoice && formatCurrency(selectedInvoice.total_amount)}
              </span>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="text-right font-medium">Reminder Type:</span>
              <Select value={reminderType} onValueChange={(value: 'first' | 'second' | 'final') => setReminderType(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First Reminder (Friendly)</SelectItem>
                  <SelectItem value="second">Second Notice (Urgent)</SelectItem>
                  <SelectItem value="final">Final Notice (Critical)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSendReminder} disabled={isSending}>
              {isSending ? 'Sending...' : 'Send Reminder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentRemindersManager;
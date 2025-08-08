import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useCustomerInteractions } from '@/hooks/useCustomerInteractions';
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
import { Plus, MessageSquare, Phone, Mail, FileText, Edit, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const CustomerInteractions = () => {
  const { interactions, loading, createInteraction, updateInteraction, deleteInteraction } = useCustomerInteractions();
  const { customers } = useCustomers();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<any>(null);
  const [formData, setFormData] = useState({
    customer_id: '',
    interaction_type: 'note' as const,
    subject: '',
    description: '',
    interaction_date: new Date().toISOString().slice(0, 16)
  });

  const resetForm = () => {
    setFormData({
      customer_id: '',
      interaction_type: 'note',
      subject: '',
      description: '',
      interaction_date: new Date().toISOString().slice(0, 16)
    });
    setEditingInteraction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        interaction_date: new Date(formData.interaction_date).toISOString()
      };

      if (editingInteraction) {
        await updateInteraction(editingInteraction.id, submitData);
        toast({
          title: 'Interaction updated',
          description: 'Customer interaction has been updated successfully.',
        });
      } else {
        await createInteraction(submitData);
        toast({
          title: 'Interaction created',
          description: 'New customer interaction has been logged successfully.',
        });
      }
      
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save interaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (interaction: any) => {
    setEditingInteraction(interaction);
    setFormData({
      customer_id: interaction.customer_id,
      interaction_type: interaction.interaction_type,
      subject: interaction.subject,
      description: interaction.description || '',
      interaction_date: new Date(interaction.interaction_date).toISOString().slice(0, 16)
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (interaction: any) => {
    if (confirm('Are you sure you want to delete this interaction?')) {
      try {
        await deleteInteraction(interaction.id);
        toast({
          title: 'Interaction deleted',
          description: 'Customer interaction has been deleted successfully.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete interaction. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getInteractionVariant = (type: string) => {
    switch (type) {
      case 'call':
        return 'default';
      case 'email':
        return 'secondary';
      case 'meeting':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customer Interactions</h1>
            <p className="text-muted-foreground">
              Track all customer communications and activities
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Log Interaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>
                  {editingInteraction ? 'Edit Interaction' : 'Log New Interaction'}
                </DialogTitle>
                <DialogDescription>
                  {editingInteraction 
                    ? 'Update the interaction details below.'
                    : 'Record a new customer interaction or communication.'
                  }
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="customer" className="text-right">
                      Customer *
                    </Label>
                    <Select 
                      value={formData.customer_id} 
                      onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                      required
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select a customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.first_name} {customer.last_name}
                            {customer.company && ` - ${customer.company.name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Type *
                    </Label>
                    <Select 
                      value={formData.interaction_type} 
                      onValueChange={(value: any) => setFormData({ ...formData, interaction_type: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="subject" className="text-right">
                      Subject *
                    </Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="col-span-3"
                      placeholder="Brief description of the interaction"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="date" className="text-right">
                      Date & Time *
                    </Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={formData.interaction_date}
                      onChange={(e) => setFormData({ ...formData, interaction_date: e.target.value })}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Details
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="col-span-3"
                      rows={3}
                      placeholder="Additional details about the interaction..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingInteraction ? 'Update Interaction' : 'Log Interaction'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Interaction History
            </CardTitle>
            <CardDescription>
              {interactions.length} interactions logged in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4">Loading interactions...</div>
            ) : interactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No interactions logged yet. Start tracking customer communications to build a history.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interactions.map((interaction) => (
                    <TableRow key={interaction.id}>
                      <TableCell>
                        <Badge variant={getInteractionVariant(interaction.interaction_type)} className="flex items-center gap-1 w-fit">
                          {getInteractionIcon(interaction.interaction_type)}
                          {interaction.interaction_type.charAt(0).toUpperCase() + interaction.interaction_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {getCustomerName(interaction.customer_id)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{interaction.subject}</div>
                        {interaction.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {interaction.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(interaction.interaction_date), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(interaction.interaction_date), 'h:mm a')}
                        </div>
                      </TableCell>
                      <TableCell>
                        {interaction.description ? (
                          <div className="text-sm text-muted-foreground max-w-[300px] truncate">
                            {interaction.description}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No details</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(interaction)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(interaction)}
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

export default CustomerInteractions;
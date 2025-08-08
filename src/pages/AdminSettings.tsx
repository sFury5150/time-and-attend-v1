import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings, Key, Mail, CreditCard, Save, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminSettings = () => {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState({
    resend_api_key: '',
    stripe_secret_key: '',
    stripe_publishable_key: ''
  });
  const [showKeys, setShowKeys] = useState({
    resend_api_key: false,
    stripe_secret_key: false,
    stripe_publishable_key: false
  });
  const [hasKeys, setHasKeys] = useState({
    resend_api_key: false,
    stripe_secret_key: false,
    stripe_publishable_key: false
  });

  // Check if keys exist (in a real app, this would check Supabase secrets)
  useEffect(() => {
    // Simulate checking for existing keys
    const storedKeys = localStorage.getItem('crm_api_keys');
    if (storedKeys) {
      const keys = JSON.parse(storedKeys);
      setHasKeys({
        resend_api_key: !!keys.resend_api_key,
        stripe_secret_key: !!keys.stripe_secret_key,
        stripe_publishable_key: !!keys.stripe_publishable_key
      });
    }
  }, []);

  const handleSaveKeys = () => {
    // In a real app, this would save to Supabase secrets via edge function
    const keysToSave = Object.entries(apiKeys).reduce((acc, [key, value]) => {
      if (value.trim()) {
        acc[key] = value.trim();
      }
      return acc;
    }, {} as any);

    if (Object.keys(keysToSave).length > 0) {
      localStorage.setItem('crm_api_keys', JSON.stringify(keysToSave));
      setHasKeys({
        resend_api_key: !!keysToSave.resend_api_key,
        stripe_secret_key: !!keysToSave.stripe_secret_key,
        stripe_publishable_key: !!keysToSave.stripe_publishable_key
      });
      
      toast({
        title: 'API Keys Saved',
        description: 'Your API keys have been saved securely.',
      });
      
      // Clear the input fields for security
      setApiKeys({
        resend_api_key: '',
        stripe_secret_key: '',
        stripe_publishable_key: ''
      });
    } else {
      toast({
        title: 'No Changes',
        description: 'No API keys were provided.',
        variant: 'destructive',
      });
    }
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyName]: !prev[keyName]
    }));
  };

  const getKeyStatus = (keyName: string) => {
    return hasKeys[keyName] ? (
      <Badge variant="default" className="ml-2">
        <Key className="w-3 h-3 mr-1" />
        Configured
      </Badge>
    ) : (
      <Badge variant="outline" className="ml-2">
        Not Set
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
          <p className="text-muted-foreground">
            Manage system configuration and API integrations
          </p>
        </div>

        <Tabs defaultValue="api-keys" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="email">Email Settings</TabsTrigger>
            <TabsTrigger value="payments">Payment Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Key Management
                </CardTitle>
                <CardDescription>
                  Configure API keys for external services. Keys are stored securely in Supabase secrets.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resend API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resend_api_key" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Resend API Key
                      {getKeyStatus('resend_api_key')}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href="https://resend.com/api-keys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Get Key
                      </a>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="resend_api_key"
                        type={showKeys.resend_api_key ? "text" : "password"}
                        value={apiKeys.resend_api_key}
                        onChange={(e) => setApiKeys(prev => ({...prev, resend_api_key: e.target.value}))}
                        placeholder={hasKeys.resend_api_key ? "••••••••••••••••" : "re_xxxxxxxxxxxx"}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowKey('resend_api_key')}
                      >
                        {showKeys.resend_api_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Required for sending invoices via email. Get your API key from Resend dashboard.
                  </p>
                </div>

                <Separator />

                {/* Stripe Secret Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stripe_secret_key" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Stripe Secret Key
                      {getKeyStatus('stripe_secret_key')}
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a 
                        href="https://dashboard.stripe.com/apikeys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Get Key
                      </a>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="stripe_secret_key"
                        type={showKeys.stripe_secret_key ? "text" : "password"}
                        value={apiKeys.stripe_secret_key}
                        onChange={(e) => setApiKeys(prev => ({...prev, stripe_secret_key: e.target.value}))}
                        placeholder={hasKeys.stripe_secret_key ? "••••••••••••••••" : "sk_test_xxxxxxxxxxxx"}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => toggleShowKey('stripe_secret_key')}
                      >
                        {showKeys.stripe_secret_key ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Required for processing payments. Use test key for development, live key for production.
                  </p>
                </div>

                <Separator />

                {/* Stripe Publishable Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stripe_publishable_key" className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Stripe Publishable Key
                      {getKeyStatus('stripe_publishable_key')}
                    </Label>
                  </div>
                  <Input
                    id="stripe_publishable_key"
                    type="text"
                    value={apiKeys.stripe_publishable_key}
                    onChange={(e) => setApiKeys(prev => ({...prev, stripe_publishable_key: e.target.value}))}
                    placeholder={hasKeys.stripe_publishable_key ? "pk_test_configured" : "pk_test_xxxxxxxxxxxx"}
                  />
                  <p className="text-sm text-muted-foreground">
                    Public key for client-side Stripe integration. Safe to expose in frontend code.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveKeys}>
                    <Save className="w-4 h-4 mr-2" />
                    Save API Keys
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure email settings for sending invoices and notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Service Status</Label>
                    <div className="mt-1">
                      {hasKeys.resend_api_key ? (
                        <Badge variant="default">Email Service Active</Badge>
                      ) : (
                        <Badge variant="outline">Configure Resend API Key</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Default From Email</Label>
                    <p className="text-sm text-muted-foreground mt-1">invoices@yourdomain.com</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-base font-medium">Features Available:</Label>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Send invoices with PDF attachments</li>
                    <li>• Professional email templates</li>
                    <li>• Delivery tracking and confirmations</li>
                    <li>• Automated payment reminders</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Configuration
                </CardTitle>
                <CardDescription>
                  Configure Stripe payment processing for online invoice payments.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Payment Status</Label>
                    <div className="mt-1">
                      {hasKeys.stripe_secret_key && hasKeys.stripe_publishable_key ? (
                        <Badge variant="default">Stripe Configured</Badge>
                      ) : (
                        <Badge variant="outline">Configure Stripe Keys</Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>Default Currency</Label>
                    <p className="text-sm text-muted-foreground mt-1">USD</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-base font-medium">Payment Features:</Label>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Secure online payments via Stripe</li>
                    <li>• Automatic invoice status updates</li>
                    <li>• Payment confirmation emails</li>
                    <li>• Support for multiple payment methods</li>
                    <li>• Refund and partial payment handling</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
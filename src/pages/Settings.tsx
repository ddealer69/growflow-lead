import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Server, Plus, Edit, Trash2, Mail, Shield, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { API_CONFIG } from "@/config/api";

interface SMTPCredentials {
  id: string;
  account_id: string;
  created_by: string;
  display_name: string;
  smtp_host: string;
  smtp_port: number;
  username: string;
  auth_type: string;
  verified: boolean;
  last_verified_at: string;
  rate_limit_per_hour: number;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface SMTPFormData {
  display_name: string;
  smtp_host: string;
  smtp_port: number;
  username: string;
  password: string;
  auth_type: string;
  rate_limit_per_hour: number;
  metadata: {
    provider: string;
    department: string;
    tls: boolean;
    ssl?: boolean;
  };
}

const defaultFormData: SMTPFormData = {
  display_name: '',
  smtp_host: '',
  smtp_port: 587,
  username: '',
  password: '',
  auth_type: 'plain',
  rate_limit_per_hour: 100,
  metadata: {
    provider: '',
    department: '',
    tls: true
  }
};

export default function Settings() {
  const { user, accountId } = useAuth();
  const [smtpCredentials, setSMTPCredentials] = useState<SMTPCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSMTP, setSelectedSMTP] = useState<SMTPCredentials | null>(null);
  const [formData, setFormData] = useState<SMTPFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (accountId) {
      fetchSMTPCredentials();
    }
  }, [accountId]);

  const fetchSMTPCredentials = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/accounts/${accountId}/smtp-credentials`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSMTPCredentials(data.smtp_credentials || []);
      } else {
        console.error('Failed to fetch SMTP credentials');
        setSMTPCredentials([]);
      }
    } catch (error) {
      console.error('Error fetching SMTP credentials:', error);
      setSMTPCredentials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSMTP = async () => {
    if (!accountId || !user?.id) return;

    setSubmitting(true);
    try {
      const payload = {
        account_id: accountId,
        display_name: formData.display_name,
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        username: formData.username,
        password: formData.password,
        auth_type: formData.auth_type,
        rate_limit_per_hour: formData.rate_limit_per_hour,
        metadata: formData.metadata,
        created_by: user.id
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/smtp-credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('SMTP credentials created successfully');
        setShowCreateDialog(false);
        setFormData(defaultFormData);
        fetchSMTPCredentials();
      } else {
        toast.error(data.message || 'Failed to create SMTP credentials');
      }
    } catch (error) {
      console.error('Error creating SMTP credentials:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSMTP = async () => {
    if (!selectedSMTP) return;

    setSubmitting(true);
    try {
      const payload = {
        display_name: formData.display_name,
        smtp_host: formData.smtp_host,
        smtp_port: formData.smtp_port,
        username: formData.username,
        ...(formData.password && { password: formData.password }),
        auth_type: formData.auth_type,
        rate_limit_per_hour: formData.rate_limit_per_hour,
        metadata: formData.metadata
      };

      const response = await fetch(`${API_CONFIG.BASE_URL}/smtp-credentials/${selectedSMTP.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('SMTP credentials updated successfully');
        setShowEditDialog(false);
        setSelectedSMTP(null);
        setFormData(defaultFormData);
        fetchSMTPCredentials();
      } else {
        toast.error(data.message || 'Failed to update SMTP credentials');
      }
    } catch (error) {
      console.error('Error updating SMTP credentials:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSMTP = async () => {
    if (!selectedSMTP) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/smtp-credentials/${selectedSMTP.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('SMTP credentials deleted successfully');
        setShowDeleteDialog(false);
        setSelectedSMTP(null);
        fetchSMTPCredentials();
      } else {
        toast.error(data.message || 'Failed to delete SMTP credentials');
      }
    } catch (error) {
      console.error('Error deleting SMTP credentials:', error);
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (smtp: SMTPCredentials) => {
    setSelectedSMTP(smtp);
    setFormData({
      display_name: smtp.display_name,
      smtp_host: smtp.smtp_host,
      smtp_port: smtp.smtp_port,
      username: smtp.username,
      password: '', // Don't populate password for security
      auth_type: smtp.auth_type,
      rate_limit_per_hour: smtp.rate_limit_per_hour,
      metadata: {
        provider: smtp.metadata?.provider || '',
        department: smtp.metadata?.department || '',
        tls: smtp.metadata?.tls || true,
        ssl: smtp.metadata?.ssl || false
      }
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (smtp: SMTPCredentials) => {
    setSelectedSMTP(smtp);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setSelectedSMTP(null);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account settings and configurations</p>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your account and user details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">User ID:</span>
                <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">{user?.id}</code>
              </div>
              <div className="text-sm">
                <span className="font-medium">Account ID:</span>
                <code className="ml-2 text-xs bg-muted px-2 py-1 rounded">{accountId}</code>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm">
                <span className="font-medium">Name:</span> {user?.full_name}
              </div>
              <div className="text-sm">
                <span className="font-medium">Email:</span> {user?.email}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Credentials Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                SMTP Credentials
              </CardTitle>
              <CardDescription>Manage your email server configurations</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add SMTP Server
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add SMTP Server</DialogTitle>
                  <DialogDescription>
                    Configure a new SMTP server for sending emails
                  </DialogDescription>
                </DialogHeader>
                <SMTPForm 
                  formData={formData} 
                  setFormData={setFormData} 
                  onSubmit={handleCreateSMTP}
                  submitting={submitting}
                  isEdit={false}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {smtpCredentials.length === 0 ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No SMTP servers configured</h3>
              <p className="text-muted-foreground mb-4">Add your first SMTP server to start sending emails</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {smtpCredentials.map((smtp) => (
                <Card key={smtp.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{smtp.display_name}</h3>
                          <Badge variant={smtp.verified ? "default" : "secondary"}>
                            {smtp.verified ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Unverified
                              </>
                            )}
                          </Badge>
                          <Badge variant="outline">{smtp.auth_type}</Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Host:</span> {smtp.smtp_host}:{smtp.smtp_port}
                          </div>
                          <div>
                            <span className="font-medium">Username:</span> {smtp.username}
                          </div>
                          <div>
                            <span className="font-medium">Rate Limit:</span> {smtp.rate_limit_per_hour}/hour
                          </div>
                          <div>
                            <span className="font-medium">Provider:</span> {smtp.metadata?.provider || 'Custom'}
                          </div>
                        </div>

                        {smtp.last_verified_at && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Last verified: {new Date(smtp.last_verified_at).toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(smtp)}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(smtp)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SMTP Server</DialogTitle>
            <DialogDescription>
              Update SMTP server configuration
            </DialogDescription>
          </DialogHeader>
          <SMTPForm 
            formData={formData} 
            setFormData={setFormData} 
            onSubmit={handleUpdateSMTP}
            submitting={submitting}
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete SMTP Credentials</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSMTP?.display_name}"? This action cannot be undone and will permanently remove the SMTP configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSMTP}
              disabled={submitting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// SMTP Form Component
function SMTPForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  submitting, 
  isEdit 
}: {
  formData: SMTPFormData;
  setFormData: (data: SMTPFormData) => void;
  onSubmit: () => void;
  submitting: boolean;
  isEdit: boolean;
}) {
  const updateFormData = (field: string, value: any) => {
    if (field.startsWith('metadata.')) {
      const metadataField = field.split('.')[1];
      setFormData({
        ...formData,
        metadata: {
          ...formData.metadata,
          [metadataField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">Display Name *</Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => updateFormData('display_name', e.target.value)}
            placeholder="Gmail - Sales Team"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Input
            id="provider"
            value={formData.metadata.provider}
            onChange={(e) => updateFormData('metadata.provider', e.target.value)}
            placeholder="gmail, outlook, custom"
          />
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="smtp_host">SMTP Host *</Label>
          <Input
            id="smtp_host"
            value={formData.smtp_host}
            onChange={(e) => updateFormData('smtp_host', e.target.value)}
            placeholder="smtp.gmail.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smtp_port">SMTP Port *</Label>
          <Input
            id="smtp_port"
            type="number"
            min="1"
            max="65535"
            value={formData.smtp_port}
            onChange={(e) => updateFormData('smtp_port', parseInt(e.target.value))}
            placeholder="587"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Username/Email *</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => updateFormData('username', e.target.value)}
          placeholder="sales@company.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
        />
        {isEdit && (
          <p className="text-xs text-muted-foreground">
            Leave blank to keep the current password
          </p>
        )}
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="auth_type">Authentication Type</Label>
          <Select value={formData.auth_type} onValueChange={(value) => updateFormData('auth_type', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="plain">Plain</SelectItem>
              <SelectItem value="oauth2">OAuth2</SelectItem>
              <SelectItem value="app_password">App Password</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate_limit">Rate Limit (per hour)</Label>
          <Input
            id="rate_limit"
            type="number"
            min="1"
            value={formData.rate_limit_per_hour}
            onChange={(e) => updateFormData('rate_limit_per_hour', parseInt(e.target.value))}
            placeholder="100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.metadata.department}
            onChange={(e) => updateFormData('metadata.department', e.target.value)}
            placeholder="sales, support, marketing"
          />
        </div>
        <div className="space-y-2">
          <Label>Security</Label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.metadata.tls}
                onChange={(e) => updateFormData('metadata.tls', e.target.checked)}
              />
              <span className="text-sm">TLS</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.metadata.ssl || false}
                onChange={(e) => updateFormData('metadata.ssl', e.target.checked)}
              />
              <span className="text-sm">SSL</span>
            </label>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => window.location.reload()} disabled={submitting}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update' : 'Create')}
        </Button>
      </div>
    </div>
  );
}
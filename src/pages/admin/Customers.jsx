import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  ArrowLeft,
  Plus,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Image
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44 } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

export default function Customers() {
  const { isSuperAdmin } = useCustomer();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Form state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerSlug, setNewCustomerSlug] = useState('');
  const [newCustomerPlan, setNewCustomerPlan] = useState('free');

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Super admin can see all customers - bypass customer filtering
      const allCustomers = await base44.entities.Customer.list();
      setCustomers(allCustomers.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ));
    } catch (err) {
      console.error('Failed to load customers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !newCustomerSlug) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const limits = { free: 100, starter: 500, pro: 2000, enterprise: -1 };

      await base44.entities.Customer.create({
        name: newCustomerName,
        slug: newCustomerSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        plan: newCustomerPlan,
        plan_started_at: new Date().toISOString(),
        images_limit_monthly: limits[newCustomerPlan] || 100,
        storage_limit_gb: 10,
        images_generated_this_month: 0,
        usage_reset_date: new Date().toISOString(),
        status: 'active',
      });

      setShowCreateDialog(false);
      setNewCustomerName('');
      setNewCustomerSlug('');
      setNewCustomerPlan('free');
      await loadCustomers();
    } catch (err) {
      console.error('Failed to create customer:', err);
      alert('Failed to create customer: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const getPlanBadge = (plan) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      starter: 'bg-blue-100 text-blue-800',
      pro: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-amber-100 text-amber-800',
    };
    return <Badge className={colors[plan] || colors.free}>{plan || 'free'}</Badge>;
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    }
    if (status === 'suspended') {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  if (!isSuperAdmin()) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super admins can manage customers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('admin')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Customers
            </h1>
            <p className="text-muted-foreground">
              Manage all customers in the system
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCustomers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Customer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Customer</DialogTitle>
                <DialogDescription>
                  Create a new customer account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    placeholder="Acme Fashion"
                    value={newCustomerName}
                    onChange={(e) => {
                      setNewCustomerName(e.target.value);
                      if (!newCustomerSlug) {
                        setNewCustomerSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-'));
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug *</Label>
                  <Input
                    placeholder="acme-fashion"
                    value={newCustomerSlug}
                    onChange={(e) => setNewCustomerSlug(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL-safe identifier (lowercase, no spaces)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={newCustomerPlan} onValueChange={setNewCustomerPlan}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free (100 images/month)</SelectItem>
                      <SelectItem value="starter">Starter (500 images/month)</SelectItem>
                      <SelectItem value="pro">Pro (2000 images/month)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (Unlimited)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomer} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Customer'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No customers found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((cust) => (
                  <TableRow key={cust.id}>
                    <TableCell>
                      <div className="font-medium">{cust.name}</div>
                      {cust.domain && (
                        <div className="text-sm text-muted-foreground">{cust.domain}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {cust.slug}
                      </code>
                    </TableCell>
                    <TableCell>{getPlanBadge(cust.plan)}</TableCell>
                    <TableCell>{getStatusBadge(cust.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Image className="h-3 w-3" />
                        {cust.images_generated_this_month || 0}
                        {cust.images_limit_monthly !== -1 && (
                          <span className="text-muted-foreground">
                            / {cust.images_limit_monthly}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cust.createdAt
                        ? new Date(cust.createdAt).toLocaleDateString()
                        : '-'}
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
}

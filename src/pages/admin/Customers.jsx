import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  ArrowLeft,
  Plus,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Image,
  ChevronDown,
  ChevronRight,
  Users,
  Trash2,
  ArrowRightLeft,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  Eye,
  Star,
  Receipt,
  HardDrive,
  Database
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44 } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

export default function Customers() {
  const navigate = useNavigate();
  const { isSuperAdmin, userProfile } = useCustomer();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Expanded customer for showing users
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [customerUsers, setCustomerUsers] = useState({});
  const [loadingUsers, setLoadingUsers] = useState({});

  // Form state
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerSlug, setNewCustomerSlug] = useState('');

  // Move user dialog state
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [userToMove, setUserToMove] = useState(null);
  const [sourceCustomerId, setSourceCustomerId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [moving, setMoving] = useState(false);

  // Usage costs state
  const [customerCosts, setCustomerCosts] = useState({});
  const [userCosts, setUserCosts] = useState({});

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const loadUsageCosts = async () => {
    try {
      // Load all usage costs (skip customer filter for super admin)
      const allCosts = await base44.entities.UsageCost.list({ skipCustomerFilter: true });

      // Calculate start of current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Aggregate by customer
      const costsByCustomer = {};
      const costsByUser = {};

      for (const cost of allCosts) {
        const customerId = cost.customer_id;
        const userId = cost.user_profile_id;
        const costValue = cost.cost_sek || 0;
        const costDate = new Date(cost.createdAt);
        const isThisMonth = costDate >= startOfMonth;
        const isStorage = cost.action === 'storage_upload';
        const isDynamoDB = cost.action === 'dynamodb_write';

        // Customer totals
        if (!costsByCustomer[customerId]) {
          costsByCustomer[customerId] = {
            total: 0, thisMonth: 0,
            storageTotal: 0, storageThisMonth: 0,
            dynamodbTotal: 0, dynamodbThisMonth: 0
          };
        }
        costsByCustomer[customerId].total += costValue;
        if (isThisMonth) {
          costsByCustomer[customerId].thisMonth += costValue;
        }
        if (isStorage) {
          costsByCustomer[customerId].storageTotal += costValue;
          if (isThisMonth) {
            costsByCustomer[customerId].storageThisMonth += costValue;
          }
        }
        if (isDynamoDB) {
          costsByCustomer[customerId].dynamodbTotal += costValue;
          if (isThisMonth) {
            costsByCustomer[customerId].dynamodbThisMonth += costValue;
          }
        }

        // User totals
        if (!costsByUser[userId]) {
          costsByUser[userId] = {
            total: 0, thisMonth: 0,
            storageTotal: 0, storageThisMonth: 0,
            dynamodbTotal: 0, dynamodbThisMonth: 0
          };
        }
        costsByUser[userId].total += costValue;
        if (isThisMonth) {
          costsByUser[userId].thisMonth += costValue;
        }
        if (isStorage) {
          costsByUser[userId].storageTotal += costValue;
          if (isThisMonth) {
            costsByUser[userId].storageThisMonth += costValue;
          }
        }
        if (isDynamoDB) {
          costsByUser[userId].dynamodbTotal += costValue;
          if (isThisMonth) {
            costsByUser[userId].dynamodbThisMonth += costValue;
          }
        }
      }

      setCustomerCosts(costsByCustomer);
      setUserCosts(costsByUser);
    } catch (err) {
      console.error('Failed to load usage costs:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
    loadUsageCosts();
  }, []);

  const toggleCustomerExpand = async (customerId) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
      return;
    }

    setExpandedCustomerId(customerId);

    // Load users for this customer if not already loaded
    if (!customerUsers[customerId]) {
      setLoadingUsers(prev => ({ ...prev, [customerId]: true }));
      try {
        const users = await base44.entities.UserProfile.filter({
          customer_id: customerId,
        });
        setCustomerUsers(prev => ({ ...prev, [customerId]: users }));
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoadingUsers(prev => ({ ...prev, [customerId]: false }));
      }
    }
  };

  const handleDeleteUser = async (userId, customerId) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    try {
      await base44.entities.UserProfile.delete(userId);
      // Refresh users for this customer
      const users = await base44.entities.UserProfile.filter({
        customer_id: customerId,
      });
      setCustomerUsers(prev => ({ ...prev, [customerId]: users }));
    } catch (err) {
      console.error('Failed to delete user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  const handleUpdateSurcharge = async (customerId, surchargePercent) => {
    try {
      await base44.entities.Customer.update(customerId, {
        surcharge_percent: surchargePercent,
      });
      // Update local state
      setCustomers(prev => prev.map(c =>
        c.id === customerId ? { ...c, surcharge_percent: surchargePercent } : c
      ));
    } catch (err) {
      console.error('Failed to update surcharge:', err);
    }
  };

  const openMoveDialog = (user, customerId) => {
    setUserToMove(user);
    setSourceCustomerId(customerId);
    setSelectedCustomerId('');
    setShowMoveDialog(true);
  };

  const handleMoveUser = async () => {
    if (!userToMove || !selectedCustomerId) return;

    setMoving(true);
    try {
      // Update user profile
      await base44.entities.UserProfile.update(userToMove.id, {
        customer_id: selectedCustomerId,
        role: 'member', // Reset to member when moving
      });

      // Also move all UsageCost records for this user to the new customer
      const userCostRecords = await base44.entities.UsageCost.list({ skipCustomerFilter: true });
      const costsToMove = userCostRecords.filter(c => c.user_profile_id === userToMove.id);

      console.log(`Moving ${costsToMove.length} cost records to new customer...`);
      for (const cost of costsToMove) {
        await base44.entities.UsageCost.update(cost.id, {
          customer_id: selectedCustomerId,
        });
      }

      setShowMoveDialog(false);

      // Refresh users for source customer
      const sourceUsers = await base44.entities.UserProfile.filter({
        customer_id: sourceCustomerId,
      });
      setCustomerUsers(prev => ({ ...prev, [sourceCustomerId]: sourceUsers }));

      // Clear cached users for target customer so they reload on expand
      setCustomerUsers(prev => {
        const updated = { ...prev };
        delete updated[selectedCustomerId];
        return updated;
      });

      // Reload usage costs to reflect the move
      await loadUsageCosts();

      setUserToMove(null);
      setSourceCustomerId(null);
    } catch (err) {
      console.error('Failed to move user:', err);
      alert('Failed to move user: ' + err.message);
    } finally {
      setMoving(false);
    }
  };

  const handleChangeRole = async (userId, customerId, newRole) => {
    try {
      await base44.entities.UserProfile.update(userId, { role: newRole });
      // Refresh users for this customer
      const users = await base44.entities.UserProfile.filter({
        customer_id: customerId,
      });
      setCustomerUsers(prev => ({ ...prev, [customerId]: users }));
    } catch (err) {
      console.error('Failed to change role:', err);
      alert('Failed to change role: ' + err.message);
    }
  };

  const handleToggleSuperAdmin = async (userId, customerId, currentValue) => {
    try {
      await base44.entities.UserProfile.update(userId, { is_super_admin: !currentValue });
      // Refresh users for this customer
      const users = await base44.entities.UserProfile.filter({
        customer_id: customerId,
      });
      setCustomerUsers(prev => ({ ...prev, [customerId]: users }));
    } catch (err) {
      console.error('Failed to toggle super admin:', err);
      alert('Failed to toggle super admin: ' + err.message);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !newCustomerSlug) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      await base44.entities.Customer.create({
        name: newCustomerName,
        slug: newCustomerSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        images_limit_monthly: 100,
        storage_limit_gb: 10,
        images_generated_this_month: 0,
        usage_reset_date: new Date().toISOString(),
        status: 'active',
      });

      setShowCreateDialog(false);
      setNewCustomerName('');
      setNewCustomerSlug('');
      await loadCustomers();
    } catch (err) {
      console.error('Failed to create customer:', err);
      alert('Failed to create customer: ' + err.message);
    } finally {
      setCreating(false);
    }
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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Påslag %</TableHead>
                  <TableHead className="text-right">Kostnad (totalt)</TableHead>
                  <TableHead className="text-right">Kostnad (månad)</TableHead>
                  <TableHead className="text-right">Med påslag (totalt)</TableHead>
                  <TableHead className="text-right">Med påslag (månad)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((cust) => (
                  <React.Fragment key={cust.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleCustomerExpand(cust.id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {expandedCustomerId === cust.id ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium">{cust.name}</div>
                            {cust.domain && (
                              <div className="text-sm text-muted-foreground">{cust.domain}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {cust.slug}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(cust.status)}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          className="w-20 h-8 text-right text-sm"
                          value={cust.surcharge_percent || 0}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleUpdateSurcharge(cust.id, parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="1"
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {(customerCosts[cust.id]?.total || 0).toFixed(2)} kr
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {(customerCosts[cust.id]?.thisMonth || 0).toFixed(2)} kr
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {((customerCosts[cust.id]?.total || 0) * (1 + (cust.surcharge_percent || 0) / 100)).toFixed(2)} kr
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {((customerCosts[cust.id]?.thisMonth || 0) * (1 + (cust.surcharge_percent || 0) / 100)).toFixed(2)} kr
                      </TableCell>
                    </TableRow>

                    {/* Expanded customer details section */}
                    {expandedCustomerId === cust.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-muted/30 p-4">
                          <div className="space-y-4">
                            {/* Cost breakdown sections */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Storage costs (S3) */}
                              <div className="bg-background rounded-lg p-4 border">
                                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                                  <HardDrive className="h-4 w-4" />
                                  Lagringskostnad (S3)
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-muted-foreground">Totalt</div>
                                    <div className="font-medium">{(customerCosts[cust.id]?.storageTotal || 0).toFixed(4)} kr</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">Denna månad</div>
                                    <div className="font-medium">{(customerCosts[cust.id]?.storageThisMonth || 0).toFixed(4)} kr</div>
                                  </div>
                                </div>
                              </div>

                              {/* Database costs (DynamoDB) */}
                              <div className="bg-background rounded-lg p-4 border">
                                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                                  <Database className="h-4 w-4" />
                                  Databaskostnad (DynamoDB)
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-muted-foreground">Totalt</div>
                                    <div className="font-medium">{(customerCosts[cust.id]?.dynamodbTotal || 0).toFixed(4)} kr</div>
                                  </div>
                                  <div>
                                    <div className="text-muted-foreground">Denna månad</div>
                                    <div className="font-medium">{(customerCosts[cust.id]?.dynamodbThisMonth || 0).toFixed(4)} kr</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Users section */}
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Users className="h-4 w-4" />
                              Users
                            </div>

                            {loadingUsers[cust.id] ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading users...
                              </div>
                            ) : customerUsers[cust.id]?.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                No users in this customer
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {customerUsers[cust.id]?.map((usr) => {
                                  const isCurrentUser = usr.id === userProfile?.id;
                                  const getRoleBadge = (role) => {
                                    const styles = {
                                      owner: 'bg-purple-100 text-purple-800',
                                      admin: 'bg-blue-100 text-blue-800',
                                      member: 'bg-gray-100 text-gray-800',
                                      viewer: 'bg-green-100 text-green-800',
                                    };
                                    return styles[role] || styles.member;
                                  };
                                  return (
                                    <div
                                      key={usr.id}
                                      className="flex items-center justify-between bg-background rounded-lg p-3 border"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div>
                                          <div className="font-medium flex items-center gap-2">
                                            {usr.display_name || usr.email}
                                            {isCurrentUser && (
                                              <Badge variant="outline" className="text-xs">You</Badge>
                                            )}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {usr.email}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        {/* Cost columns - clickable to view history */}
                                        <div
                                          className="text-right text-xs min-w-[160px] cursor-pointer hover:bg-muted/50 rounded p-1 -m-1"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`${createPageUrl('admin/usage-history')}?user=${usr.id}&customer=${cust.id}`);
                                          }}
                                          title="Visa användningshistorik"
                                        >
                                          <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Total:</span>
                                            <span>{(userCosts[usr.id]?.total || 0).toFixed(2)} kr</span>
                                            <span className="font-medium">{((userCosts[usr.id]?.total || 0) * (1 + (cust.surcharge_percent || 0) / 100)).toFixed(2)} kr</span>
                                          </div>
                                          <div className="flex justify-between gap-4">
                                            <span className="text-muted-foreground">Månad:</span>
                                            <span>{(userCosts[usr.id]?.thisMonth || 0).toFixed(2)} kr</span>
                                            <span className="font-medium">{((userCosts[usr.id]?.thisMonth || 0) * (1 + (cust.surcharge_percent || 0) / 100)).toFixed(2)} kr</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {usr.is_super_admin && (
                                            <Badge className="text-xs bg-yellow-100 text-yellow-800">
                                              <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                                              Super Admin
                                            </Badge>
                                          )}
                                          <Badge className={`text-xs ${getRoleBadge(usr.role)}`}>
                                            {usr.role || 'member'}
                                          </Badge>
                                        </div>
                                        {!isCurrentUser && (
                                          <DropdownMenu>
                                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            {/* Role options */}
                                            <DropdownMenuItem
                                              onClick={() => handleChangeRole(usr.id, cust.id, 'owner')}
                                              disabled={usr.role === 'owner'}
                                            >
                                              <ShieldCheck className="h-4 w-4 mr-2" />
                                              Make Owner
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleChangeRole(usr.id, cust.id, 'admin')}
                                              disabled={usr.role === 'admin'}
                                            >
                                              <Shield className="h-4 w-4 mr-2" />
                                              Make Admin
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleChangeRole(usr.id, cust.id, 'member')}
                                              disabled={usr.role === 'member'}
                                            >
                                              <User className="h-4 w-4 mr-2" />
                                              Make Member
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              onClick={() => handleChangeRole(usr.id, cust.id, 'viewer')}
                                              disabled={usr.role === 'viewer'}
                                            >
                                              <Eye className="h-4 w-4 mr-2" />
                                              Make Viewer
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            {/* Super Admin toggle */}
                                            <DropdownMenuItem
                                              onClick={() => handleToggleSuperAdmin(usr.id, cust.id, usr.is_super_admin)}
                                            >
                                              <Star className={`h-4 w-4 mr-2 ${usr.is_super_admin ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                                              {usr.is_super_admin ? 'Remove Super Admin' : 'Make Super Admin'}
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            {/* Usage History */}
                                            <DropdownMenuItem
                                              onClick={() => navigate(`${createPageUrl('admin/usage-history')}?user=${usr.id}&customer=${cust.id}`)}
                                            >
                                              <Receipt className="h-4 w-4 mr-2" />
                                              Användningshistorik
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            {/* Move */}
                                            <DropdownMenuItem onClick={() => openMoveDialog(usr, cust.id)}>
                                              <ArrowRightLeft className="h-4 w-4 mr-2" />
                                              Move to Customer
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            {/* Delete */}
                                            <DropdownMenuItem
                                              onClick={() => handleDeleteUser(usr.id, cust.id)}
                                              className="text-red-600"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete User
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Move User Dialog */}
      <Dialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move User to Another Customer</DialogTitle>
            <DialogDescription>
              Move {userToMove?.display_name || userToMove?.email} to a different customer.
              They will become a member of the new organization.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium">Select Customer</Label>
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers
                  .filter(c => c.id !== sourceCustomerId)
                  .map(cust => (
                    <SelectItem key={cust.id} value={cust.id}>
                      {cust.name} ({cust.slug})
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMoveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMoveUser} disabled={!selectedCustomerId || moving}>
              {moving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Moving...
                </>
              ) : (
                'Move User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

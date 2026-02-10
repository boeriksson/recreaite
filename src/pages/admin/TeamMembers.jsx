import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Users,
  ArrowLeft,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  User,
  Eye,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ArrowRightLeft
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44 } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

const ROLE_LABELS = {
  owner: { label: 'Owner', icon: ShieldCheck, color: 'bg-purple-100 text-purple-800' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-blue-100 text-blue-800' },
  member: { label: 'Member', icon: User, color: 'bg-gray-100 text-gray-800' },
  viewer: { label: 'Viewer', icon: Eye, color: 'bg-green-100 text-green-800' },
};

export default function TeamMembers() {
  const { userProfile, customer, canManageUsers, isSuperAdmin } = useCustomer();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Move user dialog state
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [memberToMove, setMemberToMove] = useState(null);
  const [allCustomers, setAllCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [moving, setMoving] = useState(false);

  // Load all customers for super admin
  const loadCustomers = async () => {
    if (!isSuperAdmin()) return;
    try {
      const customers = await base44.entities.Customer.list();
      setAllCustomers(customers);
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadMembers = async () => {
    if (!customer?.id) return;

    setLoading(true);
    setError(null);

    try {
      const profiles = await base44.entities.UserProfile.filter({
        customer_id: customer.id,
      });
      setMembers(profiles.sort((a, b) => {
        // Sort by role: owner > admin > member > viewer
        const roleOrder = { owner: 0, admin: 1, member: 2, viewer: 3 };
        return (roleOrder[a.role] || 4) - (roleOrder[b.role] || 4);
      }));
    } catch (err) {
      console.error('Failed to load members:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [customer?.id]);

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await base44.entities.UserProfile.update(memberId, { role: newRole });
      await loadMembers();
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleSuspend = async (memberId) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      await base44.entities.UserProfile.update(memberId, { status: 'suspended' });
      await loadMembers();
    } catch (err) {
      console.error('Failed to suspend user:', err);
      alert('Failed to suspend user: ' + err.message);
    }
  };

  const handleReactivate = async (memberId) => {
    try {
      await base44.entities.UserProfile.update(memberId, { status: 'active' });
      await loadMembers();
    } catch (err) {
      console.error('Failed to reactivate user:', err);
      alert('Failed to reactivate user: ' + err.message);
    }
  };

  const openMoveDialog = (member) => {
    setMemberToMove(member);
    setSelectedCustomerId('');
    setShowMoveDialog(true);
  };

  const handleMoveUser = async () => {
    if (!memberToMove || !selectedCustomerId) return;

    setMoving(true);
    try {
      await base44.entities.UserProfile.update(memberToMove.id, {
        customer_id: selectedCustomerId,
        role: 'member', // Reset to member when moving
      });
      setShowMoveDialog(false);
      setMemberToMove(null);
      await loadMembers();
    } catch (err) {
      console.error('Failed to move user:', err);
      alert('Failed to move user: ' + err.message);
    } finally {
      setMoving(false);
    }
  };

  if (!canManageUsers()) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You need admin privileges to manage team members.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
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
              <Users className="h-6 w-6" />
              Team Members
            </h1>
            <p className="text-muted-foreground">
              {customer?.name || 'Default'} · {members.length} members
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMembers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link to={createPageUrl('admin/invite-links')}>
            <Button>Invite Users</Button>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Members Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No team members found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const roleInfo = ROLE_LABELS[member.role] || ROLE_LABELS.member;
                  const RoleIcon = roleInfo.icon;
                  const isCurrentUser = member.id === userProfile?.id;
                  const canModify = canManageUsers() && !isCurrentUser && member.role !== 'owner';

                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {member.display_name || member.email}
                            {isCurrentUser && (
                              <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                            )}
                            {member.is_super_admin && (
                              <Badge className="ml-2 text-xs bg-purple-600">Super Admin</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={roleInfo.color}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {roleInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                          {member.status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.joined_at
                          ? new Date(member.joined_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.last_active_at
                          ? new Date(member.last_active_at).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {canModify && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'admin')}>
                                Make Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'member')}>
                                Make Member
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'viewer')}>
                                Make Viewer
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {isSuperAdmin() && (
                                <DropdownMenuItem onClick={() => openMoveDialog(member)}>
                                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                                  Move to Customer
                                </DropdownMenuItem>
                              )}
                              {isSuperAdmin() && <DropdownMenuSeparator />}
                              {member.status === 'suspended' ? (
                                <DropdownMenuItem onClick={() => handleReactivate(member.id)}>
                                  Reactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleSuspend(member.id)}
                                  className="text-red-600"
                                >
                                  Suspend
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
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
              Move {memberToMove?.display_name || memberToMove?.email} to a different customer.
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
                {allCustomers
                  .filter(c => c.id !== customer?.id)
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

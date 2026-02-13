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
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44 } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

const ROLE_LABELS = {
  owner: { label: 'Ägare', icon: ShieldCheck, color: 'bg-purple-100 text-purple-800' },
  admin: { label: 'Admin', icon: Shield, color: 'bg-blue-100 text-blue-800' },
  member: { label: 'Medlem', icon: User, color: 'bg-gray-100 text-gray-800' },
  viewer: { label: 'Visare', icon: Eye, color: 'bg-green-100 text-green-800' },
};

export default function TeamMembers() {
  const { userProfile, customer, canManageUsers, isSuperAdmin } = useCustomer();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      alert('Kunde inte uppdatera roll: ' + err.message);
    }
  };

  const handleSuspend = async (memberId) => {
    if (!confirm('Är du säker på att du vill stänga av denna användare?')) return;

    try {
      await base44.entities.UserProfile.update(memberId, { status: 'suspended' });
      await loadMembers();
    } catch (err) {
      console.error('Failed to suspend user:', err);
      alert('Kunde inte stänga av användare: ' + err.message);
    }
  };

  const handleReactivate = async (memberId) => {
    try {
      await base44.entities.UserProfile.update(memberId, { status: 'active' });
      await loadMembers();
    } catch (err) {
      console.error('Failed to reactivate user:', err);
      alert('Kunde inte återaktivera användare: ' + err.message);
    }
  };

  const handleToggleSuperAdmin = async (memberId, currentIsSuperAdmin) => {
    const action = currentIsSuperAdmin ? 'ta bort superadmin-rättigheter från' : 'göra till superadmin';
    if (!confirm(`Är du säker på att du vill ${action} denna användare?`)) return;

    try {
      await base44.entities.UserProfile.update(memberId, { is_super_admin: !currentIsSuperAdmin });
      await loadMembers();
    } catch (err) {
      console.error('Failed to update super admin status:', err);
      alert('Kunde inte uppdatera superadmin-status: ' + err.message);
    }
  };

  if (!canManageUsers()) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Åtkomst nekad. Du behöver administratörsbehörighet för att hantera teammedlemmar.
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
              Teammedlemmar
            </h1>
            <p className="text-muted-foreground">
              {customer?.name || 'Default'} · {members.length} medlemmar
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadMembers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Uppdatera
          </Button>
          <Link to={createPageUrl('admin/invite-links')}>
            <Button>Bjud in användare</Button>
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
              Inga teammedlemmar hittades
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Användare</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gick med</TableHead>
                  <TableHead>Senast aktiv</TableHead>
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
                              <Badge variant="outline" className="ml-2 text-xs">Du</Badge>
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
                                Gör till admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'member')}>
                                Gör till medlem
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'viewer')}>
                                Gör till visare
                              </DropdownMenuItem>
                              {isSuperAdmin() && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleToggleSuperAdmin(member.id, member.is_super_admin)}
                                    className={member.is_super_admin ? "text-orange-600" : "text-purple-600"}
                                  >
                                    {member.is_super_admin ? 'Ta bort superadmin' : 'Gör till superadmin'}
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              {member.status === 'suspended' ? (
                                <DropdownMenuItem onClick={() => handleReactivate(member.id)}>
                                  Återaktivera
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => handleSuspend(member.id)}
                                  className="text-red-600"
                                >
                                  Stäng av
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
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  Link as LinkIcon,
  BarChart3,
  Database,
  Shield,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { createPageUrl } from '@/utils';

const AdminCard = ({ to, icon: Icon, title, description, badge, disabled }) => (
  <Link
    to={disabled ? '#' : to}
    className={disabled ? 'cursor-not-allowed' : ''}
  >
    <Card className={`transition-all ${disabled ? 'opacity-50' : 'hover:shadow-md hover:border-primary/50'}`}>
      <CardHeader className="flex flex-row items-center gap-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {badge && <Badge variant="secondary">{badge}</Badge>}
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
    </Card>
  </Link>
);

export default function Admin() {
  const { userProfile, customer, isOwner, isAdmin, isSuperAdmin } = useCustomer();

  // Check if user has any admin access
  const hasAdminAccess = isOwner() || isAdmin() || isSuperAdmin();

  if (!hasAdminAccess) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You need admin privileges to access this area.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin</h1>
          <p className="text-muted-foreground">
            {customer?.name || 'Default'} · {userProfile?.role}
            {userProfile?.is_super_admin && ' · Super Admin'}
          </p>
        </div>
      </div>

      {/* Brand Management - Owner/Admin */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Team Management
        </h2>
        <div className="grid gap-3">
          <AdminCard
            to={createPageUrl('admin/team-members')}
            icon={Users}
            title="Team Members"
            description="View and manage users in your brand"
          />
          <AdminCard
            to={createPageUrl('admin/invite-links')}
            icon={LinkIcon}
            title="Invite Links"
            description="Create signup links to invite new users"
          />
        </div>
      </div>

      {/* Owner Only */}
      {isOwner() && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Billing & Usage
          </h2>
          <div className="grid gap-3">
            <AdminCard
              to={createPageUrl('admin/cost-dashboard')}
              icon={BarChart3}
              title="Cost Dashboard"
              description="View usage statistics and costs"
            />
          </div>
        </div>
      )}

      {/* Super Admin Only */}
      {isSuperAdmin() && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Super Admin
          </h2>
          <div className="grid gap-3">
            <AdminCard
              to={createPageUrl('admin/brands')}
              icon={Building2}
              title="Brands"
              description="Create and manage all brands"
              badge="Super Admin"
            />
            <AdminCard
              to={createPageUrl('admin/data-migration')}
              icon={Database}
              title="Data Migration"
              description="Run multi-tenant data migration"
              badge="Super Admin"
            />
          </div>
        </div>
      )}
    </div>
  );
}

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
  Link as LinkIcon,
  ArrowLeft,
  Plus,
  Copy,
  Trash2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44 } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function InviteLinks() {
  const { userProfile, customer, canInviteUsers } = useCustomer();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form state
  const [newLinkRole, setNewLinkRole] = useState('member');
  const [newLinkMaxUses, setNewLinkMaxUses] = useState('');
  const [newLinkExpiresDays, setNewLinkExpiresDays] = useState('7');

  const loadLinks = async () => {
    if (!customer?.id) return;

    setLoading(true);
    setError(null);

    try {
      const inviteLinks = await base44.entities.InviteLink.filter({
        customer_id: customer.id,
      });
      setLinks(inviteLinks.sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      ));
    } catch (err) {
      console.error('Failed to load invite links:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLinks();
  }, [customer?.id]);

  const handleCreateLink = async () => {
    setCreating(true);
    try {
      const expiresAt = newLinkExpiresDays && newLinkExpiresDays !== 'never'
        ? new Date(Date.now() + parseInt(newLinkExpiresDays) * 24 * 60 * 60 * 1000).toISOString()
        : null;

      await base44.entities.InviteLink.create({
        customer_id: customer.id,
        code: generateInviteCode(),
        role: newLinkRole,
        created_by: userProfile.id,
        expires_at: expiresAt,
        max_uses: newLinkMaxUses ? parseInt(newLinkMaxUses) : null,
        use_count: 0,
        status: 'active',
      });

      setShowCreateDialog(false);
      setNewLinkRole('member');
      setNewLinkMaxUses('');
      setNewLinkExpiresDays('7');
      await loadLinks();
    } catch (err) {
      console.error('Failed to create invite link:', err);
      alert('Failed to create invite link: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRevokeLink = async (linkId) => {
    if (!confirm('Are you sure you want to revoke this invite link?')) return;

    try {
      await base44.entities.InviteLink.update(linkId, { status: 'revoked' });
      await loadLinks();
    } catch (err) {
      console.error('Failed to revoke link:', err);
      alert('Failed to revoke link: ' + err.message);
    }
  };

  const copyLink = async (code) => {
    const url = `${window.location.origin}/signup?invite=${code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(code);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (link) => {
    if (link.status === 'revoked') {
      return <Badge variant="destructive">Revoked</Badge>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    if (link.max_uses && link.use_count >= link.max_uses) {
      return <Badge variant="secondary">Limit Reached</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  if (!canInviteUsers()) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You need admin privileges to manage invite links.
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
              <LinkIcon className="h-6 w-6" />
              Invite Links
            </h1>
            <p className="text-muted-foreground">
              Create shareable links to invite users to {customer?.name || 'your organization'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLinks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Invite Link</DialogTitle>
                <DialogDescription>
                  Generate a link that new users can use to join your organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Role for new users</Label>
                  <Select value={newLinkRole} onValueChange={setNewLinkRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max uses (leave empty for unlimited)</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={newLinkMaxUses}
                    onChange={(e) => setNewLinkMaxUses(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires in (days)</Label>
                  <Select value={newLinkExpiresDays} onValueChange={setNewLinkExpiresDays}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 day</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateLink} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Link'
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

      {/* Links Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : links.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No invite links yet</p>
              <p className="text-sm">Create a link to invite users to your organization</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Link</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {link.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{link.role}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(link)}</TableCell>
                    <TableCell>
                      {link.use_count || 0}
                      {link.max_uses && ` / ${link.max_uses}`}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {link.expires_at
                        ? new Date(link.expires_at).toLocaleDateString()
                        : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyLink(link.code)}
                          disabled={link.status === 'revoked'}
                        >
                          {copiedId === link.code ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {link.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRevokeLink(link.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
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
}

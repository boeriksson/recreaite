import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Building2,
  Link as LinkIcon,
  BarChart3,
  Database,
  Shield,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Settings,
  Shirt,
  Plus,
  Trash2,
  Loader2,
  Save,
  FolderTree,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/amplifyClient';

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

// Tree node component for recursive rendering
const TreeNode = ({ node, level = 0, onUpdate, onDelete, onAddChild, editingId, setEditingId, expandedNodes, toggleExpanded, isLast = false, parentLines = [] }) => {
  const [editName, setEditName] = useState(node.name);
  const [editText, setEditText] = useState(node.text || '');
  const isEditing = editingId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  // Update edit values when node changes
  useEffect(() => {
    setEditName(node.name);
    setEditText(node.text || '');
  }, [node.name, node.text]);

  const handleSave = () => {
    onUpdate(node.id, { name: editName, text: editText });
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditName(node.name);
    setEditText(node.text || '');
    setEditingId(null);
  };

  return (
    <div>
      <div className="flex items-center group">
        {/* Tree lines */}
        <div className="flex items-center flex-shrink-0" style={{ width: `${level * 20}px` }}>
          {parentLines.map((showLine, idx) => (
            <div key={idx} className="w-5 h-9 flex justify-center">
              {showLine && <div className="w-px h-full bg-border" />}
            </div>
          ))}
        </div>

        {/* Branch connector for non-root nodes */}
        {level > 0 && (
          <div className="w-5 h-9 flex-shrink-0 relative">
            {/* Vertical line (full height if not last, half if last) */}
            <div className={`absolute left-1/2 -translate-x-1/2 w-px bg-border ${isLast ? 'h-1/2 top-0' : 'h-full'}`} />
            {/* Horizontal line */}
            <div className="absolute top-1/2 left-1/2 w-1/2 h-px bg-border" />
          </div>
        )}

        {/* Expand/collapse button */}
        <button
          onClick={() => hasChildren && toggleExpanded(node.id)}
          className={`flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-sm border transition-colors ${
            hasChildren
              ? 'border-border bg-background hover:bg-muted cursor-pointer'
              : 'border-transparent'
          }`}
        >
          {hasChildren ? (
            <span className="text-xs font-medium text-muted-foreground leading-none">
              {isExpanded ? '−' : '+'}
            </span>
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
          )}
        </button>

        {/* Content area */}
        <div className="flex items-center gap-2 flex-1 min-w-0 py-1.5 pl-2">
          {isEditing ? (
            <>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Kategorinamn"
                className="h-7 text-sm w-32 flex-shrink-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <Input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Prompt för att hjälpa AI att placera plaggen i den här kategorin.."
                className="h-7 text-sm flex-1 min-w-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleSave}>
                <Check className="h-3.5 w-3.5 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleCancel}>
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </>
          ) : (
            <>
              <span
                className={`text-sm w-32 flex-shrink-0 ${hasChildren ? 'font-medium cursor-pointer' : ''}`}
                onClick={() => hasChildren && toggleExpanded(node.id)}
              >
                {node.name || <span className="text-muted-foreground/60 italic">Namnlös</span>}
              </span>
              <span className="text-xs text-muted-foreground/60 flex-1 truncate min-w-0">
                {node.text || ''}
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center transition-opacity flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEditingId(node.id)}
                  title="Redigera"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onAddChild(node.id)}
                  title="Lägg till underkategori"
                >
                  <Plus className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onDelete(node.id)}
                  title="Ta bort"
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
              editingId={editingId}
              setEditingId={setEditingId}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
              isLast={idx === node.children.length - 1}
              parentLines={[...parentLines, !isLast]}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Tree editor component
const TreeEditor = ({ treeData = [], onChange }) => {
  const [editingId, setEditingId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  const toggleExpanded = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const addRootNode = () => {
    const newId = crypto.randomUUID();
    onChange([
      ...treeData,
      { id: newId, name: '', text: '', children: [] }
    ]);
    setEditingId(newId);
  };

  const updateNode = (nodeId, updates) => {
    const updateInTree = (nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, ...updates };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: updateInTree(node.children) };
        }
        return node;
      });
    onChange(updateInTree(treeData));
  };

  const deleteNode = (nodeId) => {
    const deleteFromTree = (nodes) =>
      nodes
        .filter((node) => node.id !== nodeId)
        .map((node) => ({
          ...node,
          children: node.children ? deleteFromTree(node.children) : []
        }));
    onChange(deleteFromTree(treeData));
    if (editingId === nodeId) {
      setEditingId(null);
    }
  };

  const addChildNode = (parentId) => {
    const newId = crypto.randomUUID();
    const addToTree = (nodes) =>
      nodes.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [
              ...(node.children || []),
              { id: newId, name: '', text: '', children: [] }
            ]
          };
        }
        if (node.children && node.children.length > 0) {
          return { ...node, children: addToTree(node.children) };
        }
        return node;
      });
    onChange(addToTree(treeData));
    // Auto-expand parent when adding child
    setExpandedNodes(prev => new Set(prev).add(parentId));
    setEditingId(newId);
  };

  return (
    <div className="border rounded-xl p-4 bg-muted/20">
      <div className="text-xs text-muted-foreground mb-3">
        Bygg upp din kategoristruktur. Klicka för att expandera/minimera. Hovra för att redigera.
      </div>
      {treeData.length > 0 ? (
        <div>
          {treeData.map((node, idx) => (
            <TreeNode
              key={node.id}
              node={node}
              onUpdate={updateNode}
              onDelete={deleteNode}
              onAddChild={addChildNode}
              editingId={editingId}
              setEditingId={setEditingId}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
              isLast={idx === treeData.length - 1}
              parentLines={[]}
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
          Inga kategorier ännu
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={addRootNode}
        className="w-full mt-4"
      >
        <Plus className="h-4 w-4 mr-2" />
        Lägg till rotkategori
      </Button>
    </div>
  );
};

const ExpandableCard = ({ icon: Icon, title, description, isOpen, onToggle, children }) => (
  <Card className="transition-all">
    <CardHeader
      className="flex flex-row items-center gap-4 cursor-pointer hover:bg-muted/50"
      onClick={onToggle}
    >
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="flex-1">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      {isOpen ? (
        <ChevronDown className="h-5 w-5 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      )}
    </CardHeader>
    {isOpen && (
      <CardContent className="pt-0">
        {children}
      </CardContent>
    )}
  </Card>
);

export default function Admin() {
  const { userProfile, customer, isOwner, isAdmin, isSuperAdmin, refreshCustomer } = useCustomer();
  const [expandedSections, setExpandedSections] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Load custom fields from customer
  useEffect(() => {
    if (customer?.custom_fields) {
      try {
        const fields = typeof customer.custom_fields === 'string'
          ? JSON.parse(customer.custom_fields)
          : customer.custom_fields;
        setCustomFields(Array.isArray(fields) ? fields : []);
      } catch {
        setCustomFields([]);
      }
    } else {
      setCustomFields([]);
    }
    setHasChanges(false);
  }, [customer?.id, customer?.custom_fields]);

  const addField = () => {
    setCustomFields([
      ...customFields,
      { id: crypto.randomUUID(), label: '', type: 'text' }
    ]);
    setHasChanges(true);
  };

  const updateField = (id, key, value) => {
    setCustomFields(customFields.map(f =>
      f.id === id ? { ...f, [key]: value } : f
    ));
    setHasChanges(true);
  };

  const removeField = (id) => {
    setCustomFields(customFields.filter(f => f.id !== id));
    setHasChanges(true);
  };

  const saveCustomFields = async () => {
    if (!customer?.id) return;
    setSaving(true);
    try {
      await base44.entities.Customer.update(customer.id, {
        custom_fields: JSON.stringify(customFields)
      });
      setHasChanges(false);
      if (refreshCustomer) refreshCustomer();
    } catch (err) {
      console.error('Failed to save custom fields:', err);
      alert('Kunde inte spara: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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

      {/* Team Management - Owner/Admin */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Team Management
        </h2>
        <div className="grid gap-3">
          <AdminCard
            to={createPageUrl('admin/team-members')}
            icon={Users}
            title="Team Members"
            description="View and manage users in your organization"
          />
          <AdminCard
            to={createPageUrl('admin/invite-links')}
            icon={LinkIcon}
            title="Invite Links"
            description="Create signup links to invite new users"
          />
        </div>
      </div>

      {/* Team Configuration - All Admins */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Team specifik konfiguration
        </h2>

        <div className="grid gap-3">
          {/* Specifik konfiguration */}
          <ExpandableCard
            icon={Shirt}
            title="Specifik konfiguration"
            description={`Konfigurera inställningar som är unika för ${customer?.name || 'ditt team'}`}
            isOpen={expandedSections.garmentInfo}
            onToggle={() => toggleSection('garmentInfo')}
          >
            <div className="space-y-6 pt-4 border-t">
              {/* Plagginformation */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Plagginformation</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lägg till fält med information som är unik för {customer?.name || 'ditt team'}.
                    Dessa fält kan användas vid bildgenerering och produktbeskrivningar.
                  </p>
                </div>

                {/* Existing fields */}
                {customFields.length > 0 && (
                  <div className="space-y-3">
                    {/* Column headers */}
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Etikett</Label>
                      </div>
                      <div className="w-40">
                        <Label className="text-xs text-muted-foreground">Typ</Label>
                      </div>
                      <div className="w-9" /> {/* Spacer for delete button */}
                    </div>
                    {customFields.map((field) => (
                      <div key={field.id} className="space-y-4">
                        <div className="flex gap-3 items-start">
                          <div className="flex-1">
                            <Input
                              placeholder="T.ex. Material, Tillverkningsland..."
                              value={field.label}
                              onChange={(e) => updateField(field.id, 'label', e.target.value)}
                            />
                          </div>
                          <div className="w-40">
                            <Select
                              value={field.type || 'text'}
                              onValueChange={(value) => updateField(field.id, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Textfält</SelectItem>
                                <SelectItem value="tree">Kategoriträd</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeField(field.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Tree editor for category tree fields */}
                        {field.type === 'tree' && (
                          <TreeEditor
                            treeData={field.treeData || []}
                            onChange={(newTreeData) => updateField(field.id, 'treeData', newTreeData)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add field button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addField}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till fält
                </Button>

                {/* Save button */}
                {hasChanges && (
                  <Button
                    onClick={saveCustomFields}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sparar...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Spara ändringar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </ExpandableCard>
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
              to={createPageUrl('admin/customers')}
              icon={Building2}
              title="Customers"
              description="Create and manage all customers"
            />
            <AdminCard
              to={createPageUrl('admin/data-migration')}
              icon={Database}
              title="Data Migration"
              description="Run multi-tenant data migration"
            />
            <AdminCard
              to={createPageUrl('admin/settings')}
              icon={Settings}
              title="System Settings"
              description="Configure exchange rates and system options"
            />
          </div>
        </div>
      )}
    </div>
  );
}

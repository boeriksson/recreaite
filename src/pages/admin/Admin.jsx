import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

const AdminCard = ({ to, icon: Icon, title, description, badge, disabled, onNavigate }) => {
  const handleClick = (e) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    if (onNavigate) {
      e.preventDefault();
      onNavigate(to);
    }
  };

  return (
    <Link
      to={disabled ? '#' : to}
      className={disabled ? 'cursor-not-allowed' : ''}
      onClick={handleClick}
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
};

// Tree node component for recursive rendering
const TreeNode = ({ node, level = 0, onUpdate, onDelete, onAddChild, editingId, setEditingId, expandedNodes, toggleExpanded, isLast = false, parentLines = [] }) => {
  const [editName, setEditName] = useState(node.name);
  const [editText, setEditText] = useState(node.text || '');
  const isEditing = editingId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);

  // Sync local state with node prop
  useEffect(() => {
    setEditName(node.name);
    setEditText(node.text || '');
  }, [node.name, node.text]);

  // Auto-save changes on every keystroke (only update the changed field to avoid stale closures)
  const handleNameChange = (e) => {
    const newValue = e.target.value;
    setEditName(newValue);
    onUpdate(node.id, { name: newValue });
  };

  const handleTextChange = (e) => {
    const newValue = e.target.value;
    setEditText(newValue);
    onUpdate(node.id, { text: newValue });
  };

  const handleFinishEditing = () => {
    setEditingId(null);
  };

  const handleCancel = () => {
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
                onChange={handleNameChange}
                placeholder="Kategorinamn"
                className="h-7 text-sm w-32 flex-shrink-0"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishEditing();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <Input
                value={editText}
                onChange={handleTextChange}
                placeholder="Prompt för att hjälpa AI att placera plaggen i den här kategorin.."
                className="h-7 text-sm flex-1 min-w-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleFinishEditing();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={handleFinishEditing}>
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
const TreeEditor = ({ treeData = [], onChange, onEditingChange }) => {
  const [editingId, setEditingId] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Notify parent when editing state changes
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(editingId !== null);
    }
  }, [editingId, onEditingChange]);

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

  // Remove nodes without a name (empty or only whitespace)
  const removeUnnamedNodes = (nodes) => {
    return nodes
      .filter((node) => node.name && node.name.trim() !== '')
      .map((node) => ({
        ...node,
        children: node.children ? removeUnnamedNodes(node.children) : []
      }));
  };

  const addRootNode = () => {
    const newId = crypto.randomUUID();
    const cleanedTree = removeUnnamedNodes(treeData);
    onChange([
      ...cleanedTree,
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
    // First clean up unnamed nodes
    const cleanedTree = removeUnnamedNodes(treeData);
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
    onChange(addToTree(cleanedTree));
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
  const { userProfile, customer, isOwner, isAdmin, isSuperAdmin, refreshCustomerData } = useCustomer();
  const [expandedSections, setExpandedSections] = useState({});
  const [customFields, setCustomFields] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditingTree, setIsEditingTree] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(true);

  // Ref to always have the latest customFields for saving (updated synchronously)
  const customFieldsRef = React.useRef(customFields);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Refresh customer data when Admin page loads
  useEffect(() => {
    const doRefresh = async () => {
      setIsRefreshing(true);
      if (refreshCustomerData) {
        await refreshCustomerData();
      }
      setIsRefreshing(false);
    };
    doRefresh();
  }, []);

  // Load custom fields from customer (only after refresh is done)
  useEffect(() => {
    if (isRefreshing) return;

    if (customer?.custom_fields) {
      try {
        const fields = typeof customer.custom_fields === 'string'
          ? JSON.parse(customer.custom_fields)
          : customer.custom_fields;
        setCustomFields(Array.isArray(fields) ? fields : []);
        customFieldsRef.current = Array.isArray(fields) ? fields : [];
      } catch {
        setCustomFields([]);
        customFieldsRef.current = [];
      }
    } else {
      setCustomFields([]);
      customFieldsRef.current = [];
    }
    setHasChanges(false);
  }, [customer?.id, customer?.custom_fields, isRefreshing]);

  const addField = () => {
    setCustomFields(prevFields => {
      const newFields = [
        ...prevFields,
        { id: crypto.randomUUID(), label: '', type: 'text' }
      ];
      customFieldsRef.current = newFields;
      return newFields;
    });
    setHasChanges(true);
  };

  const updateField = (id, key, value) => {
    setCustomFields(prevFields => {
      const newFields = prevFields.map(f =>
        f.id === id ? { ...f, [key]: value } : f
      );
      customFieldsRef.current = newFields;
      return newFields;
    });
    setHasChanges(true);
  };

  const removeField = (id) => {
    setCustomFields(prevFields => {
      const newFields = prevFields.filter(f => f.id !== id);
      customFieldsRef.current = newFields;
      return newFields;
    });
    setHasChanges(true);
  };

  const saveCustomFields = async () => {
    if (!customer?.id) return;
    setSaving(true);
    try {
      // Use ref to ensure we have the latest value
      await base44.entities.Customer.update(customer.id, {
        custom_fields: JSON.stringify(customFieldsRef.current)
      });
      setHasChanges(false);
      setIsEditingTree(false);
      if (refreshCustomerData) refreshCustomerData();
    } catch (err) {
      console.error('Failed to save custom fields:', err);
      alert('Kunde inte spara: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const navigate = useNavigate();
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Warn on browser close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasChanges || isEditingTree) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges, isEditingTree]);

  // Intercept all link clicks when there are unsaved changes
  useEffect(() => {
    const handleLinkClick = (e) => {
      // Only intercept if there are unsaved changes
      if (!hasChanges && !isEditingTree) return;

      // Find the closest anchor tag
      const link = e.target.closest('a');
      if (!link) return;

      // Ignore external links, hash links, and links that open in new tabs
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || link.target === '_blank') return;

      // Prevent navigation and show dialog
      e.preventDefault();
      e.stopPropagation();
      setPendingNavigation(href);
    };

    document.addEventListener('click', handleLinkClick, true);
    return () => document.removeEventListener('click', handleLinkClick, true);
  }, [hasChanges, isEditingTree]);

  // Handle navigation attempt - shows dialog if unsaved changes or editing tree
  const handleNavigate = (to) => {
    if (hasChanges || isEditingTree) {
      setPendingNavigation(to);
    } else {
      navigate(to);
    }
  };

  // Handle save and proceed
  const handleSaveAndProceed = async () => {
    await saveCustomFields();
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
    }
  };

  // Handle proceed without saving
  const handleProceedWithoutSaving = () => {
    setHasChanges(false); // Reset to prevent beforeunload
    setIsEditingTree(false);
    if (pendingNavigation) {
      navigate(pendingNavigation);
      setPendingNavigation(null);
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
            Åtkomst nekad. Du behöver administratörsbehörighet för att komma åt detta område.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Unsaved changes dialog */}
      <AlertDialog open={pendingNavigation !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Osparade ändringar</AlertDialogTitle>
            <AlertDialogDescription>
              Du har osparade ändringar i dina inställningar. Vill du spara innan du lämnar sidan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingNavigation(null)}>
              Avbryt
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleProceedWithoutSaving}
            >
              Lämna utan att spara
            </Button>
            <AlertDialogAction
              onClick={handleSaveAndProceed}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sparar...
                </>
              ) : (
                'Spara och lämna'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          Teamhantering
        </h2>
        <div className="grid gap-3">
          <AdminCard
            to={createPageUrl('admin/team-members')}
            icon={Users}
            title="Teammedlemmar"
            description="Visa och hantera användare i din organisation"
            onNavigate={handleNavigate}
          />
          <AdminCard
            to={createPageUrl('admin/invite-links')}
            icon={LinkIcon}
            title="Inbjudningslänkar"
            description="Skapa registreringslänkar för att bjuda in nya användare"
            onNavigate={handleNavigate}
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
                      <div key={field.id} className="space-y-3">
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
                        {/* Prompt field for text type */}
                        {field.type === 'text' && (
                          <div className="pl-0">
                            <Input
                              placeholder="Prompt för att hjälpa AI att använda detta fält..."
                              value={field.prompt || ''}
                              onChange={(e) => updateField(field.id, 'prompt', e.target.value)}
                              className="text-sm text-muted-foreground"
                            />
                          </div>
                        )}
                        {/* Tree editor for category tree fields */}
                        {field.type === 'tree' && (
                          <TreeEditor
                            treeData={field.treeData || []}
                            onChange={(newTreeData) => updateField(field.id, 'treeData', newTreeData)}
                            onEditingChange={setIsEditingTree}
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
            Fakturering & användning
          </h2>
          <div className="grid gap-3">
            <AdminCard
              to={createPageUrl('admin/cost-dashboard')}
              icon={BarChart3}
              title="Kostnadspanel"
              description="Visa användningsstatistik och kostnader"
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      )}

      {/* Super Admin Only */}
      {isSuperAdmin() && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Superadmin
          </h2>
          <div className="grid gap-3">
            <AdminCard
              to={createPageUrl('admin/customers')}
              icon={Building2}
              title="Kunder"
              description="Skapa och hantera alla kunder"
              onNavigate={handleNavigate}
            />
            <AdminCard
              to={createPageUrl('admin/data-migration')}
              icon={Database}
              title="Datamigrering"
              description="Kör datamigrering för multi-tenant"
              onNavigate={handleNavigate}
            />
            <AdminCard
              to={createPageUrl('admin/settings')}
              icon={Settings}
              title="Systeminställningar"
              description="Konfigurera växelkurser och systemalternativ"
              onNavigate={handleNavigate}
            />
          </div>
        </div>
      )}
    </div>
  );
}

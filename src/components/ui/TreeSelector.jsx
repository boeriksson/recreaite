import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * TreeSelectorNode - Recursive tree node for selection
 */
const TreeSelectorNode = ({
  node,
  level = 0,
  selectedId,
  onSelect,
  expandedNodes,
  toggleExpanded,
  isLast = false,
  parentLines = []
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;

  const handleRowClick = () => {
    // Always select when clicking the row
    onSelect(node.id);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors",
          isSelected && "bg-primary/10"
        )}
        onClick={handleRowClick}
      >
        {/* Tree lines for depth visualization */}
        <div className="flex items-center flex-shrink-0" style={{ width: `${level * 16}px` }}>
          {parentLines.map((showLine, idx) => (
            <div key={idx} className="w-4 h-8 flex justify-center">
              {showLine && <div className="w-px h-full bg-black/10 dark:bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Branch connector for non-root nodes */}
        {level > 0 && (
          <div className="w-4 h-8 flex-shrink-0 relative">
            <div className={`absolute left-1/2 -translate-x-1/2 w-px bg-black/10 dark:bg-white/10 ${isLast ? 'h-1/2 top-0' : 'h-full'}`} />
            <div className="absolute top-1/2 left-1/2 w-1/2 h-px bg-black/10 dark:bg-white/10" />
          </div>
        )}

        {/* Expand/collapse button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpanded(node.id);
          }}
          className={cn(
            "flex-shrink-0 h-5 w-5 flex items-center justify-center rounded-sm transition-colors",
            hasChildren ? "hover:bg-black/10 dark:hover:bg-white/10" : ""
          )}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-black/40 dark:text-white/40" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-black/40 dark:text-white/40" />
            )
          ) : (
            <div className="h-1.5 w-1.5 rounded-full bg-black/20 dark:bg-white/20" />
          )}
        </button>

        {/* Node content */}
        <div className="flex-1 flex items-center gap-2 py-1.5 pl-1 pr-2 min-w-0">
          <span className={cn(
            "text-sm truncate flex-1",
            isSelected ? "font-medium text-primary" : "text-black dark:text-white"
          )}>
            {node.name || <span className="text-black/40 dark:text-white/40 italic">Namnlös</span>}
          </span>
          {isSelected && (
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child, idx) => (
            <TreeSelectorNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
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

/**
 * Helper function to find a node by ID and get its full path
 */
const findNodePath = (nodes, targetId, currentPath = []) => {
  for (const node of nodes) {
    const newPath = [...currentPath, node.name];
    if (node.id === targetId) {
      return newPath;
    }
    if (node.children && node.children.length > 0) {
      const found = findNodePath(node.children, targetId, newPath);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Helper function to collect all ancestor IDs for a node
 */
const findAncestorIds = (nodes, targetId, ancestors = []) => {
  for (const node of nodes) {
    if (node.id === targetId) {
      return ancestors;
    }
    if (node.children && node.children.length > 0) {
      const found = findAncestorIds(node.children, targetId, [...ancestors, node.id]);
      if (found) return found;
    }
  }
  return null;
};

/**
 * TreeSelector - A dropdown-like component for selecting from a tree structure
 */
export const TreeSelector = ({
  treeData = [],
  value,
  onChange,
  placeholder = "Välj kategori...",
  className,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  // Auto-expand ancestors of selected node when opening
  useEffect(() => {
    if (isOpen && value && treeData.length > 0) {
      const ancestors = findAncestorIds(treeData, value);
      if (ancestors && ancestors.length > 0) {
        setExpandedNodes(prev => {
          const next = new Set(prev);
          ancestors.forEach(id => next.add(id));
          return next;
        });
      }
    }
  }, [isOpen, value, treeData]);

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

  const handleSelect = (nodeId) => {
    onChange(nodeId);
    setIsOpen(false);
  };

  // Get display value (full path)
  const selectedPath = value ? findNodePath(treeData, value) : null;
  const displayValue = selectedPath ? selectedPath.join(' > ') : null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ring-offset-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "bg-[#f5f5f7] border-black/10 text-black dark:bg-white/5 dark:border-white/10 dark:text-white",
            className
          )}
        >
          <span className={cn(
            "truncate",
            !displayValue && "text-black/50 dark:text-white/50"
          )}>
            {displayValue || placeholder}
          </span>
          <ChevronDown className={cn(
            "h-4 w-4 opacity-50 transition-transform flex-shrink-0 ml-2",
            isOpen && "rotate-180"
          )} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] max-h-[300px] overflow-auto p-2"
        align="start"
      >
        {treeData.length > 0 ? (
          treeData.map((node, idx) => (
            <TreeSelectorNode
              key={node.id}
              node={node}
              selectedId={value}
              onSelect={handleSelect}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
              isLast={idx === treeData.length - 1}
              parentLines={[]}
            />
          ))
        ) : (
          <div className="p-4 text-center text-sm text-black/50 dark:text-white/50">
            Inga kategorier tillgängliga
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default TreeSelector;

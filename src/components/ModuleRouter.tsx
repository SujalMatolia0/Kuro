import React from 'react';
import type { ModuleId } from '../store/windowStore';

// Import all active Kuro business modules
import InstanceDashboard from '../modules/instance-dashboard';
import Settings          from '../modules/settings';
import QuickNotes        from '../modules/notes';
import TaskTracker       from '../modules/task-tracker';
import CodeLibrary       from '../modules/snippets';
import CodeVault         from '../modules/vault';
import AuditModule       from '../modules/audit';
import KnowledgeHub      from '../modules/knowledge/KnowledgeHub';
import Checklists        from '../modules/knowledge/Checklists';
import ErrorDecoder      from '../modules/assist/ErrorDecoder';
import PermissionAdvisor from '../modules/assist/PermissionAdvisor';
import KnownIssues       from '../modules/assist/KnownIssues';
import RoleAdvisor       from '../modules/assist/RoleAdvisor';
import RoleCommandCenter from '../modules/role-command-center';

// ── KnowledgeHub defaultView variants ───────────────────────────────────────
// These moduleIds all render KnowledgeHub but start on different tabs.
type KHView = 'doc' | 'term' | 'api' | 'guide';
const KNOWLEDGE_VARIANTS: Partial<Record<ModuleId, KHView>> = {
  knowledge:     'doc',
  glossary:      'term',
  'api-reference': 'api',
  onboarding:    'guide',
};

// ── Flat module → component map (single-render modules) ─────────────────────
const MODULE_COMPONENTS: Partial<Record<ModuleId, React.ComponentType>> = {
  instances:           InstanceDashboard,
  tasks:               TaskTracker,
  notes:               QuickNotes,
  vault:               CodeVault,
  checklists:          Checklists,
  permissions:         PermissionAdvisor,
  errors:              ErrorDecoder,
  issues:              KnownIssues,
  settings:            Settings,
  audit:               AuditModule,
  'role-advisor':      RoleAdvisor,
  'role-command-center': RoleCommandCenter,
};

export function ModuleRouter({ moduleId }: { moduleId: ModuleId }) {
  // KnowledgeHub variants — start on specific tab
  const khView = KNOWLEDGE_VARIANTS[moduleId];
  if (khView) return <KnowledgeHub defaultView={khView} />;

  // CodeLibrary variants
  if (moduleId === 'snippets') return <CodeLibrary defaultType="snippet" />;
  if (moduleId === 'components') return <CodeLibrary defaultType="component" />;

  const Component = MODULE_COMPONENTS[moduleId];
  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full text-xs font-black uppercase tracking-widest" style={{ color: 'var(--t3)' }}>
        Module not found: {moduleId}
      </div>
    );
  }

  return <Component />;
}

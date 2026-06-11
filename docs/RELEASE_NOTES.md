# Kuro v0.1.1 - Release Notes

## 🎉 What's New

### 📱 Responsive Window Forms & Grids
- **Container Queries Migration**: Converted all form grids and layout pages inside the Kuro OS desktop windows to use Tailwind v4 container queries (`@sm`, `@md`, `@lg`). This ensures grids adapt seamlessly as windows are drag-resized or positioned, replacing static browser-wide viewport queries.
- **Improved Modal Scroll and Flow**: Wrapped input grids inside creation and editing modals with `@sm:grid-cols-2` and `@md:grid-cols-3` to prevent content squeezing and vertical clipping.
- **Modules Updated**:
  - **Guided Checklists**: Responsive platform/title input controls.
  - **Knowledge Hub**: Stacked editor metadata fields and responsive API base endpoint queries.
  - **Role Advisor**: Responsive platform and role type selector alignment.
  - **Known Issues**: Stacking filters, responsive details grid, and creation forms.
  - **Error Decoder**: Fluid query bar layout, side-by-side diagnosis cards, and responsive engine statistics grid.
  - **Permission Advisor**: Responsive natural language search inputs and collaboration banner text.
  - **System Settings**: Layout grid, API credentials input columns, and keyboard shortcut list cards.
  - **Role Command Center**: Registry role cards grid auto-adjusts from single to triple columns.
  - **Conflict Resolver**: Version comparison cards stacked layout on small window sizes.

---

# Kuro v0.1.0 - Release Notes

## 🎉 What's New

### Rebranding
- **App Name**: Fellow.dev → **Kuro**
- **Database**: `fellow_dev_production.sqlite` → `kuro_production.sqlite`
- **App ID**: `com.fellowdev.app` → `com.kuro.app`
- **Storage Key**: `fellow-dev-storage` → `kuro-storage`
- **Theme**: Updated to modern dark aesthetic matching logo colors

### 🔧 Critical Fixes

#### 1. Notes Sync Issue - RESOLVED ✅
**Problem**: Notes weren't syncing to cloud when app was downloaded fresh.

**Solution**:
- ✅ Auto-sync on app startup
- ✅ Manual sync button in Settings
- ✅ Data migration utilities
- ✅ Comprehensive error handling

**How to Use**:
1. Create notes in Kuro
2. App automatically syncs to cloud on startup
3. Or manually: Settings → Data Backup → "Sync All Data to Cloud"

#### 2. Data Migration - NEW ✅
**New Feature**: Migrate data from old Fellow.dev installation

**How to Use**:
1. Install Kuro
2. Go to Settings → Data Backup
3. Click "Sync All Data to Cloud"
4. All local notes sync to Supabase
5. Access from any device with same email

### 📊 Sync Improvements

#### Auto-Sync on Launch
```
App starts → Checks for unsynced notes → Pushes to cloud automatically
```

#### Manual Sync Control
```
Settings → Data Backup → "Sync All Data to Cloud" → See results
```

#### Sync Status Indicators
- 🟢 **Synced** - Note is in cloud
- 🟡 **Local** - Note not yet synced
- 🔄 **Syncing** - Sync in progress

## 📋 Complete Feature List

### Core Modules (16 Total)
1. ✅ Instance Dashboard - Manage Oracle/Salesforce instances
2. ✅ Task Tracker - Kanban board for daily work
3. ✅ Quick Notes - Persistent notepad with sync
4. ✅ Code Library - Searchable code snippets
5. ✅ Code Vault - File storage with versioning
6. ✅ Knowledge Hub - Unified docs, glossary, APIs, guides
7. ✅ Guided Checklists - Runbook templates
8. ✅ Error Decoder - AI-powered error lookup
9. ✅ Permission Advisor - Role/privilege mapping
10. ✅ Known Issues Tracker - Platform issue logging
11. ✅ Audit Trail - Local + cloud logs
12. ✅ Settings - Theme, browser, API keys, team management
13. ✅ Workspace Switcher - Multi-workspace support
14. ✅ Component Registry - Reusable component tracking
15. ✅ Onboarding - First-launch setup wizard
16. ✅ Command Palette - Quick navigation

### Security Features
- 🔒 Electron safeStorage for credential encryption
- 🔒 Supabase Row-Level Security (RLS)
- 🔒 Context isolation + sandbox mode
- 🔒 Comprehensive audit logging
- 🔒 PIN-based session security

### Data Management
- 💾 Local SQLite database
- ☁️ Cloud sync to Supabase
- 📊 Conflict resolution UI
- 📤 Export/Import backups
- 🔄 Auto-sync on startup

### AI Features (Optional)
- 🤖 Gemini API integration
- 🤖 Error decoder with AI fallback
- 🤖 Permission advisor with natural language
- 🤖 Graceful degradation without API key

### Visual Design
- 🎨 Modern dark theme matching logo
- 🎨 Professional color palette
- 🎨 Smooth animations and transitions
- 🎨 Responsive UI across all devices

## 🚀 Installation

### Windows
1. Download `Kuro Setup 0.1.0.exe`
2. Run installer
3. Follow setup wizard
4. Create profile and set PIN
5. Start using!

### macOS
1. Download `Kuro-0.1.0.dmg`
2. Drag Kuro to Applications
3. Launch from Applications
4. Follow setup wizard

### Linux
1. Download `Kuro-0.1.0.AppImage`
2. Make executable: `chmod +x Kuro-0.1.0.AppImage`
3. Run: `./Kuro-0.1.0.AppImage`
4. Follow setup wizard

## 📖 Getting Started

### First Launch
1. **Onboarding Wizard** - Set name, email, PIN
2. **Create Workspace** - Name your first workspace
3. **Add Instance** - Add Oracle/Salesforce instance
4. **Explore Modules** - Try each feature

### Quick Tips
- 🎯 Use Command Palette (Ctrl+K) to navigate
- 📌 Customize sidebar order via drag-and-drop
- 🔄 Notes auto-sync to cloud on startup
- 💾 Export data regularly for backup
- 🔑 Set Gemini API key for AI features

## 🔄 Sync Workflow

### Local-First Strategy
```
Create Note → Save Locally → Auto-Sync to Cloud → Access Anywhere
```

### Multi-Device Sync
```
Device A: Create note → Sync to cloud
Device B: Launch app → Auto-pull from cloud → Note appears
```

### Conflict Resolution
```
Edit on Device A → Edit on Device B → Conflict detected → Choose resolution
```

## 🐛 Known Issues

None at this time. All Phase 6 features complete and tested.

## 📝 Migration Guide

### From Fellow.dev to Kuro

1. **Install Kuro** - New app installation
2. **First Launch** - Complete onboarding
3. **Sync Data** - Settings → Data Backup → "Sync All Data to Cloud"
4. **Verify** - Check that notes appear in cloud
5. **Multi-Device** - Log in on other devices with same email

### Data Compatibility
- ✅ All Fellow.dev data compatible
- ✅ No data loss during migration
- ✅ Existing Supabase tables work unchanged
- ✅ Conflict resolution still works

## 🔧 Troubleshooting

### Notes Not Syncing?
1. Check internet connection
2. Verify Supabase credentials
3. Click "Sync All Data to Cloud" in Settings
4. Check browser console for errors

### App Won't Start?
1. Restart computer
2. Reinstall Kuro
3. Check system requirements (Node 18+)

### Lost Data?
1. Check local backup (Settings → Export)
2. Check cloud backup (Supabase)
3. Check audit trail for deletion logs

## 📞 Support

- 📧 Email: support@kuro.dev
- 🐛 Report bugs: GitHub Issues
- 💬 Discuss features: GitHub Discussions
- 📚 Documentation: See included guides

## 📊 System Requirements

- **OS**: Windows 10+, macOS 10.13+, Linux (Ubuntu 18+)
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 500MB for app + database
- **Internet**: Required for cloud sync features
- **Node.js**: 18+ (for development)

## 🎯 Roadmap

### Phase 7 (Planned)
- [ ] Team collaboration features
- [ ] Real-time sync
- [ ] Advanced search
- [ ] Custom themes
- [ ] Plugin system

### Phase 8 (Planned)
- [ ] Mobile app
- [ ] Web dashboard
- [ ] Advanced analytics
- [ ] API access
- [ ] Webhooks

## 📄 License

Kuro © 2026. All rights reserved.

## 🙏 Credits

Built with:
- React 19
- Electron 34
- Vite 6
- Tailwind CSS 4
- Supabase
- Zustand
- Framer Motion

---

**Version**: 0.1.0  
**Release Date**: April 15, 2026  
**Status**: Production Ready ✅

**Next Steps**:
1. Download installer for your OS
2. Install and launch
3. Complete onboarding
4. Start managing your work!

Enjoy Kuro! 🚀

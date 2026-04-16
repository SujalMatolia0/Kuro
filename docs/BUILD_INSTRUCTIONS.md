# KuroDes Build Instructions

## Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create `.env` file in project root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_GEMINI_API_KEY=your_gemini_key (optional)
```

### 3. Verify Installation
```bash
npm run lint
```

## Development

### Start Dev Server
```bash
npm run dev
```
This runs:
- Vite dev server on `http://localhost:5173`
- Electron app with HMR

### Build for Development
```bash
npm run build
```

## Production Build

### Build Installer
```bash
npm run dist
```

This creates:
- **Windows**: `release/KuroDes Setup 0.1.0.exe`
- **macOS**: `release/KuroDes-0.1.0.dmg`
- **Linux**: `release/KuroDes-0.1.0.AppImage`

### Build Output
```
release/
├── KuroDes Setup 0.1.0.exe          (Windows installer)
├── KuroDes Setup 0.1.0.exe.blockmap (Update manifest)
└── win-unpacked/                    (Unpacked Windows build)
    ├── KuroDes.exe
    ├── resources/
    ├── node_modules/
    └── ... (Chromium, dependencies)
```

## Troubleshooting

### Build Fails: "better-sqlite3 not found"
```bash
npm rebuild better-sqlite3
npm run dist
```

### Build Fails: "Vite build error"
```bash
rm -rf dist node_modules
npm install
npm run build
```

### Electron Won't Start
```bash
# Clear cache
rm -rf ~/.config/KuroDes
npm run dev
```

### Database Issues
```bash
# Reset database
npm run dev
# In app: Settings → Danger Zone → Erase System Data
```

## Version Updates

### Update Version Number
Edit `package.json`:
```json
{
  "version": "0.2.0"
}
```

### Auto-Update Configuration
Edit `electron-builder.yml`:
```yaml
publish:
  provider: github
  owner: your-github-username
  repo: your-repo-name
```

## Release Checklist

- [ ] Update version in `package.json`
- [ ] Update `PLAN.md` with changes
- [ ] Run `npm run lint` - no errors
- [ ] Run `npm run build` - succeeds
- [ ] Test dev build: `npm run dev`
- [ ] Test production build: `npm run dist`
- [ ] Test installer on target OS
- [ ] Verify notes sync works
- [ ] Check Settings page loads
- [ ] Verify all modules accessible
- [ ] Test keyboard shortcuts
- [ ] Test AI features (if key provided)
- [ ] Create GitHub release with installer
- [ ] Update documentation

## CI/CD Setup (Optional)

### GitHub Actions Example
```yaml
name: Build KuroDes

on: [push, pull_request]

jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run lint
      - run: npm run build
      - run: npm run dist
      
      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: release/
```

## Performance Optimization

### Reduce Bundle Size
```bash
npm run build -- --minify=terser
```

### Analyze Bundle
```bash
npm install -D rollup-plugin-visualizer
# Add to vite.config.ts
```

## Signing & Notarization (macOS)

For production macOS builds:

1. Get Apple Developer Certificate
2. Update `electron-builder.yml`:
```yaml
mac:
  certificateFile: path/to/cert.p12
  certificatePassword: password
  notarize:
    teamId: your-team-id
```

## Windows Code Signing

For production Windows builds:

1. Get code signing certificate
2. Update `electron-builder.yml`:
```yaml
win:
  certificateFile: path/to/cert.pfx
  certificatePassword: password
```

## Deployment

### GitHub Releases
```bash
# Create release with installer
gh release create v0.1.0 release/KuroDes\ Setup\ 0.1.0.exe
```

### Auto-Update
Users will be notified of updates automatically via electron-updater.

---

**Last Updated**: April 2026
**KuroDes Version**: 0.1.0

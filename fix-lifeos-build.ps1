# fix-lifeos-build.ps1
Write-Host "🔧 Fixing LifeOS Build Errors..." -ForegroundColor Cyan

# Step 1: Rename files back to TypeScript
Write-Host "📝 Renaming files to TypeScript..." -ForegroundColor Yellow
$renames = @(
    @{Src = "src/app/routes.js"; Dst = "src/app/routes.ts" },
    @{Src = "src/app/routes/auth.oauth.jsx"; Dst = "src/app/routes/auth.oauth.tsx" },
    @{Src = "src/app/routes/login.jsx"; Dst = "src/app/routes/login.tsx" },
    @{Src = "src/app/routes/logout.jsx"; Dst = "src/app/routes/logout.tsx" },
    @{Src = "src/app/routes/protected.jsx"; Dst = "src/app/routes/protected.tsx" },
    @{Src = "src/components/AuthCallback.jsx"; Dst = "src/components/AuthCallback.tsx" }
)

foreach ($rename in $renames) {
    if (Test-Path $rename.Src) {
        Move-Item -Path $rename.Src -Destination $rename.Dst -Force
        Write-Host "  ✓ Renamed $($rename.Src) -> $($rename.Dst)" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠ File not found: $($rename.Src)" -ForegroundColor Yellow
    }
}

# Step 2: Install missing dependencies
Write-Host "`n📦 Installing missing dependencies..." -ForegroundColor Yellow
npm install -D @tailwindcss/vite @vitejs/plugin-react-swc
npm install -D @types/react @types/react-dom @types/react-router-dom
npm install @react-router/dev

# Step 3: Create/Update tsconfig.json
Write-Host "`n📝 Creating tsconfig.json..." -ForegroundColor Yellow
$tsconfig = @'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true,
    "checkJs": false,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./*"]
    }
  },
  "include": ["src", "vite.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
'@
$tsconfig | Out-File -FilePath "tsconfig.json" -Encoding utf8 -Force

# Step 4: Create tsconfig.node.json
Write-Host "📝 Creating tsconfig.node.json..." -ForegroundColor Yellow
$tsconfigNode = @'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
'@
$tsconfigNode | Out-File -FilePath "tsconfig.node.json" -Encoding utf8 -Force

# Step 5: Update vite.config.ts
Write-Host "📝 Updating vite.config.ts..." -ForegroundColor Yellow
$viteConfig = @'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './'),
    },
  },
  server: {
    port: 3000,
  },
});
'@
$viteConfig | Out-File -FilePath "vite.config.ts" -Encoding utf8 -Force

# Step 6: Create src/vite-env.d.ts
Write-Host "📝 Creating src/vite-env.d.ts..." -ForegroundColor Yellow
$viteEnv = @'
/// <reference types="vite/client" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.module.scss' {
  const content: { [className: string]: string };
  export default content;
}
'@
$viteEnv | Out-File -FilePath "src/vite-env.d.ts" -Encoding utf8 -Force

# Step 7: Fix DashboardPanel.tsx
Write-Host "🔧 Fixing DashboardPanel.tsx..." -ForegroundColor Yellow
$dashboardPanel = Get-Content "src/pages/dashboard/DashboardPanel.jsx" -Raw -ErrorAction SilentlyContinue
if ($dashboardPanel) {
    $dashboardPanel = $dashboardPanel -replace 'useState\(/\*\* @type \{InputMap\} \*/ \(\{\}\)', 'useState<InputMap>({})'
    $dashboardPanel | Out-File -FilePath "src/pages/dashboard/DashboardPanel.tsx" -Encoding utf8 -Force
    Write-Host "  ✓ Fixed DashboardPanel" -ForegroundColor Green
}

# Step 8: Fix VideoStudio.tsx
Write-Host "🔧 Fixing VideoStudio.tsx..." -ForegroundColor Yellow
$videoStudio = Get-Content "src/pages/veriton/src/pages/VideoStudio.jsx" -Raw -ErrorAction SilentlyContinue
if ($videoStudio) {
    # Add missing closing brace if needed
    if (-not ($videoStudio -match '}\s*$')) {
        $videoStudio += "`n}"
    }
    $videoStudio | Out-File -FilePath "src/pages/veriton/src/pages/VideoStudio.tsx" -Encoding utf8 -Force
    Write-Host "  ✓ Fixed VideoStudio" -ForegroundColor Green
}

# Step 9: Create a .eslintrc.js for better error detection
Write-Host "📝 Creating .eslintrc.js..." -ForegroundColor Yellow
$eslintConfig = @'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react', '@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['dist', 'node_modules'],
};
'@
$eslintConfig | Out-File -FilePath ".eslintrc.js" -Encoding utf8 -Force

# Step 10: Update package.json scripts
Write-Host "📝 Updating package.json scripts..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.scripts.dev = "vite"
$packageJson.scripts.build = "tsc -b && vite build"
$packageJson.scripts."build:check" = "tsc --noEmit && vite build"
$packageJson.scripts.preview = "vite preview"
$packageJson.scripts.deploy = "npm run build && npm run preview"
$packageJson.scripts."type-check" = "tsc --noEmit"
$packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "package.json" -Encoding utf8 -Force
Write-Host "  ✓ Updated package.json" -ForegroundColor Green

# Step 11: Clean build cache
Write-Host "`n🧹 Cleaning build cache..." -ForegroundColor Yellow
if (Test-Path "dist") {
    Remove-Item -Path "dist" -Recurse -Force
    Write-Host "  ✓ Removed dist folder" -ForegroundColor Green
}
if (Test-Path "node_modules/.vite") {
    Remove-Item -Path "node_modules/.vite" -Recurse -Force
    Write-Host "  ✓ Removed vite cache" -ForegroundColor Green
}

# Step 12: Try to build
Write-Host "`n🚀 Attempting to build..." -ForegroundColor Cyan
$buildResult = npm run build 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Build successful!" -ForegroundColor Green
    Write-Host "🎉 All fixes applied successfully!" -ForegroundColor Green
}
else {
    Write-Host "`n⚠️ Build still has errors. Here are the details:" -ForegroundColor Yellow
    Write-Host $buildResult -ForegroundColor White
    Write-Host "`n💡 Try running the following commands manually:" -ForegroundColor Cyan
    Write-Host "  npm run type-check    # Check TypeScript errors" -ForegroundColor White
    Write-Host "  npm run build:check   # Build with type checking" -ForegroundColor White
}

# Step 13: Display next steps
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review any remaining errors above" -ForegroundColor White
Write-Host "  2. Run 'npm run dev' to start development server" -ForegroundColor White
Write-Host "  3. Run 'npm run deploy' to deploy" -ForegroundColor White
Write-Host "  4. If you still see errors, check that all imports are correct" -ForegroundColor White
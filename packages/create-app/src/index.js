#!/usr/bin/env node

import { input, select, checkbox, confirm } from '@inquirer/prompts';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execSync } from 'node:child_process';

const CAPABILITIES = [
  { value: 'ask-ai', name: 'Ask Matter AI — query the AI about the current matter', hook: 'useAskMatterAI' },
  { value: 'llm', name: 'LLM — general-purpose language model prompts', hook: 'useLLM' },
  { value: 'ocr', name: 'OCR — extract text from images and PDFs', hook: 'useOCR' },
  { value: 'docs', name: 'Documents — create and manage documents', hook: 'useDocs' },
  { value: 'collections', name: 'Collections — semantic document collections and queries', hook: 'useCollections' },
  { value: 'templates', name: 'Templates — document template merging', hook: 'useTemplate' },
  { value: 'storage', name: 'Storage — key-value storage', hook: 'useStorage' },
  { value: 'contract-review', name: 'Contract Review — AI-powered contract analysis', hook: 'useContractReview' },
  { value: 'submit-result', name: 'Submit Result — return results to the host agent', hook: 'useSubmitResult' },
  { value: 'health', name: 'Health Check — monitor API availability', hook: 'useHealth' },
];

async function main() {
  console.log('\n  ⚖️  Create FTAIP App\n');
  console.log('  Scaffold a new AI Paralegal SDK tool.\n');

  const name = await input({
    message: 'Project name:',
    default: 'my-ftaip-tool',
    validate: (v) => /^[a-z0-9-]+$/.test(v) || 'Use lowercase letters, numbers, and hyphens only',
  });

  const description = await input({
    message: 'Description:',
    default: 'An AI Paralegal SDK tool',
  });

  const capabilities = await checkbox({
    message: 'Which SDK capabilities do you need?',
    choices: CAPABILITIES,
    required: true,
  });

  const styling = await select({
    message: 'Styling approach:',
    choices: [
      { value: 'tailwind', name: 'Tailwind CSS' },
      { value: 'css', name: 'Plain CSS' },
    ],
  });

  const installDeps = await confirm({
    message: 'Install dependencies now?',
    default: true,
  });

  const projectDir = resolve(process.cwd(), name);

  if (existsSync(projectDir)) {
    console.error(`\n  Error: Directory "${name}" already exists.\n`);
    process.exit(1);
  }

  console.log(`\n  Creating ${name}...\n`);

  mkdirSync(join(projectDir, 'src'), { recursive: true });
  mkdirSync(join(projectDir, 'public'), { recursive: true });

  writeFileSync(join(projectDir, 'package.json'), generatePackageJson(name, description, styling));
  writeFileSync(join(projectDir, 'tsconfig.json'), generateTsConfig());
  writeFileSync(join(projectDir, 'vite.config.ts'), generateViteConfig());
  writeFileSync(join(projectDir, 'index.html'), generateIndexHtml(name));
  writeFileSync(join(projectDir, '.env.example'), generateEnvExample());
  writeFileSync(join(projectDir, '.gitignore'), generateGitignore());
  writeFileSync(join(projectDir, 'src/main.tsx'), generateMain());
  writeFileSync(join(projectDir, 'src/App.tsx'), generateApp(capabilities));
  writeFileSync(join(projectDir, 'src/vite-env.d.ts'), generateViteEnv());
  writeFileSync(join(projectDir, 'README.md'), generateReadme(name, description, capabilities));

  if (styling === 'tailwind') {
    writeFileSync(join(projectDir, 'src/index.css'), generateTailwindCss());
  } else {
    writeFileSync(join(projectDir, 'src/index.css'), generatePlainCss());
  }

  console.log('  Created project files.');

  if (installDeps) {
    console.log('  Installing dependencies...\n');
    try {
      execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
    } catch {
      console.log('\n  Warning: npm install failed. Run it manually.');
    }
  }

  console.log(`
  Done! Your project is ready.

  Next steps:

    cd ${name}
    cp .env.example .env     # Fill in your credentials
    npm run dev              # Start the dev server

  Documentation: https://github.com/ftaip/sdk#readme
`);
}

function generatePackageJson(name, description, styling) {
  const deps = {
    '@ftaip/sdk': '^0.7.0',
    react: '^19.0.0',
    'react-dom': '^19.0.0',
  };

  const devDeps = {
    '@types/react': '^19.0.0',
    '@types/react-dom': '^19.0.0',
    '@vitejs/plugin-react': '^4.3.0',
    typescript: '^5.7.0',
    vite: '^6.0.0',
  };

  if (styling === 'tailwind') {
    devDeps['tailwindcss'] = '^4.0.0';
    devDeps['@tailwindcss/vite'] = '^4.0.0';
  }

  return JSON.stringify(
    {
      name,
      private: true,
      version: '0.0.1',
      description,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc -b && vite build',
        preview: 'vite preview',
      },
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2,
  );
}

function generateTsConfig() {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: 'force',
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedSideEffectImports: true,
      },
      include: ['src'],
    },
    null,
    2,
  );
}

function generateViteConfig() {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
`;
}

function generateIndexHtml(name) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function generateEnvExample() {
  return `# AI Paralegal SDK Configuration
# Copy this file to .env and fill in your values.

# Base URL of the AI Paralegal host
VITE_BASE_URL=http://localhost:8000

# Long-lived dev token (Admin > SDK Applications > App Preview)
VITE_DEV_TOKEN=

# API key (Admin > SDK Applications > API Key tab)
VITE_API_KEY=
`;
}

function generateGitignore() {
  return `node_modules
dist
.env
*.local
`;
}

function generateMain() {
  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
}

function generateApp(capabilities) {
  const hookImports = new Set(['useSession', 'SessionGate']);
  const capMap = Object.fromEntries(CAPABILITIES.map((c) => [c.value, c]));

  for (const cap of capabilities) {
    if (capMap[cap]) {
      hookImports.add(capMap[cap].hook);
    }
  }

  const importLine = `import { ${[...hookImports].join(', ')} } from '@ftaip/sdk';`;

  const hookCalls = capabilities
    .filter((c) => capMap[c] && capMap[c].hook !== 'useSession')
    .map((c) => {
      const hook = capMap[c].hook;
      const varName = hook.charAt(3).toLowerCase() + hook.slice(4);
      return `  const ${varName} = ${hook}(client);`;
    })
    .join('\n');

  const sections = capabilities
    .filter((c) => capMap[c] && capMap[c].hook !== 'useSession')
    .map((c) => {
      const cap = capMap[c];
      return `        <section style={{ padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>${cap.name.split(' — ')[0]}</h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>${cap.name.split(' — ')[1] || ''}</p>
          {/* Add your ${cap.hook} UI here */}
        </section>`;
    })
    .join('\n\n');

  return `${importLine}

function ToolContent({ client }: { client: ReturnType<typeof useSession>['client'] }) {
${hookCalls}

  return (
    <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        My FTAIP Tool
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
${sections}
      </div>
    </div>
  );
}

export default function App() {
  const { session, client } = useSession({
    devToken: import.meta.env.VITE_DEV_TOKEN || undefined,
    baseUrl: import.meta.env.VITE_BASE_URL || undefined,
    apiKey: import.meta.env.VITE_API_KEY || undefined,
  });

  return (
    <SessionGate session={session}>
      <ToolContent client={client} />
    </SessionGate>
  );
}
`;
}

function generateViteEnv() {
  return `/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASE_URL: string;
  readonly VITE_DEV_TOKEN: string;
  readonly VITE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
`;
}

function generateTailwindCss() {
  return `@import "tailwindcss";
`;
}

function generatePlainCss() {
  return `*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  color: #1f2937;
  background: #ffffff;
}
`;
}

function generateReadme(name, description, capabilities) {
  const capMap = Object.fromEntries(CAPABILITIES.map((c) => [c.value, c]));
  const hookList = capabilities
    .filter((c) => capMap[c])
    .map((c) => `- \`${capMap[c].hook}\` — ${capMap[c].name.split(' — ')[1] || capMap[c].name}`)
    .join('\n');

  return `# ${name}

${description}

Built with the [AI Paralegal SDK](https://github.com/ftaip/sdk).

## Setup

\`\`\`bash
cp .env.example .env   # Fill in your credentials
npm install
npm run dev
\`\`\`

## SDK Hooks Used

${hookList}

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The built files in \`dist/\` can be deployed to any static hosting service, then registered as an SDK Application in the AI Paralegal admin panel.
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

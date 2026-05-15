#!/usr/bin/env node

/**
 * Static Export Build Helper
 *
 * Usage:
 *   NEXT_STATIC_EXPORT=true npm run build
 *   or
 *   node scripts/static-export.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 StoryTree Static Export Build');
console.log('=' .repeat(50));

const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

if (!isStaticExport) {
  console.log('⚠️  Not in static export mode.');
  console.log('   Set NEXT_STATIC_EXPORT=true to enable static export.');
  console.log('');
  console.log('   Example:');
  console.log('   NEXT_STATIC_EXPORT=true npm run build');
  process.exit(0);
}

console.log('✅ Static export mode enabled');
console.log('');

// Check for problematic patterns
console.log('📋 Checking for static export compatibility...');

const issues = [];

// Check for API routes
const apiDir = path.join(process.cwd(), 'src/app/api');
if (fs.existsSync(apiDir)) {
  const files = getAllFiles(apiDir);
  const routeFiles = files.filter(f => f.endsWith('/route.ts') || f.endsWith('/route.js'));
  if (routeFiles.length > 0) {
    issues.push({
      type: 'warning',
      message: `Found ${routeFiles.length} API routes (will be ignored in static export)`,
      files: routeFiles.slice(0, 5),
    });
  }
}

// Check for Server Components with data fetching
const appDir = path.join(process.cwd(), 'src/app');
if (fs.existsSync(appDir)) {
  const serverComponents = findServerComponents(appDir);
  if (serverComponents.length > 0) {
    issues.push({
      type: 'warning',
      message: `Found ${serverComponents.length} potential Server Components that may need adaptation`,
      files: serverComponents.slice(0, 5),
    });
  }
}

// Output results
if (issues.length > 0) {
  console.log('');
  console.log('⚠️  Found the following issues:');
  issues.forEach((issue, i) => {
    console.log(`\n${i + 1}. [${issue.type.toUpperCase()}] ${issue.message}`);
    issue.files.forEach(f => {
      console.log(`   - ${f.replace(process.cwd(), '.')}`);
    });
  });
} else {
  console.log('✅ No issues found!');
}

console.log('');
console.log('📦 Starting Next.js static build...');
console.log('');

try {
  execSync('npx next build', {
    stdio: 'inherit',
    env: { ...process.env, NEXT_STATIC_EXPORT: 'true' },
  });

  console.log('');
  console.log('✅ Build completed successfully!');

  // Verify output
  const outDir = path.join(process.cwd(), 'out');
  if (fs.existsSync(outDir)) {
    const stats = getDirectoryStats(outDir);
    console.log('');
    console.log('📊 Output statistics:');
    console.log(`   Total files: ${stats.files}`);
    console.log(`   Total size: ${formatBytes(stats.size)}`);
    console.log(`   HTML pages: ${stats.htmlFiles}`);
    console.log(`   Directories: ${stats.directories}`);
  }
} catch (error) {
  console.error('');
  console.error('❌ Build failed!');
  process.exit(1);
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function findServerComponents(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (file.startsWith('(')) return; // Skip route groups

    const fullPath = path.join(dirPath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      findServerComponents(fullPath, arrayOfFiles);
    } else if ((fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) && !fullPath.includes('_')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (
        content.includes('getServerSideProps') ||
        content.includes('getStaticProps') ||
        content.includes('generateMetadata')
      ) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

function getDirectoryStats(dirPath) {
  let files = 0;
  let size = 0;
  let htmlFiles = 0;
  let directories = 0;

  function walk(dir) {
    const items = fs.readdirSync(dir);
    directories++;

    items.forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        files++;
        size += stat.size;
        if (item.endsWith('.html')) {
          htmlFiles++;
        }
      }
    });
  }

  walk(dirPath);

  return { files, size, htmlFiles, directories };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Script to find and fix unused Portal component imports
 * Finds cases where components are imported as Portal* but used as base component names
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, extension) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
      files.push(...findFiles(fullPath, extension));
    } else if (item.isFile() && item.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files;
}

function fixUnusedPortalImports() {
  const tsxFiles = findFiles(path.join(__dirname, '..'), '.tsx');
  let totalChanges = 0;

  const componentMappings = [
    { base: 'Button', portal: 'PortalButton' },
    { base: 'Card', portal: 'PortalCard' },
    { base: 'Badge', portal: 'PortalBadge' },
    { base: 'Input', portal: 'PortalInput' },
  ];

  for (const filePath of tsxFiles) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileChanged = false;

    for (const { base, portal } of componentMappings) {
      // Check if file uses <BaseComponent> in JSX
      const usesBaseInJSX = new RegExp(`<${base}\\s|</${base}>`).test(content);

      // Check if file imports as PortalComponent
      const importsAsPortal = new RegExp(`import.*${base}\\s+as\\s+${portal}.*from`).test(content);

      // Check if PortalComponent is actually used in JSX
      const usesPortalInJSX = new RegExp(`<${portal}\\s|</${portal}>`).test(content);

      // If base component is used but imported as Portal, fix it
      if (usesBaseInJSX && importsAsPortal && !usesPortalInJSX) {
        // Replace: import { Component as PortalComponent } from ...
        content = content.replace(
          new RegExp(
            `import\\s+{\\s*${base}\\s+as\\s+${portal}\\s*}\\s+from\\s+['"]@/components/ui/${base}['"]`,
            'g'
          ),
          `import { ${base} } from '@/components/ui/${base}'`
        );

        // Also handle cases with other imports in the same statement
        content = content.replace(
          new RegExp(
            `import\\s+{\\s*${base}\\s+as\\s+${portal}([^}]*)\\}\\s+from\\s+['"]@/components/ui/${base}['"]`,
            'g'
          ),
          (match, rest) => {
            const otherImports = rest.trim();
            if (otherImports && otherImports.startsWith(',')) {
              return `import { ${base}${otherImports} } from '@/components/ui/${base}'`;
            }
            return `import { ${base} } from '@/components/ui/${base}'`;
          }
        );

        fileChanged = true;
      }
    }

    if (fileChanged) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
      totalChanges++;
    }
  }

  console.log(`\n📊 Summary: ${totalChanges} files updated`);
}

console.log('🔄 Finding and fixing unused Portal component imports...\n');
fixUnusedPortalImports();
console.log('\n✨ Done!');

/**
 * Extract public English copy from TSX service page object literals without
 * evaluating repository code. Used only by authoring/parity checks.
 */
import fs from 'node:fs';
import ts from 'typescript';

const pages = {
  shopify: {
    path: 'app/[locale]/(website)/services/[slug]/page.tsx',
    variable: 'services',
  },
  subscriptions: {
    path: 'app/[locale]/(website)/services/shopify-subscriptions/page.tsx',
    variable: 'copy',
  },
};

function parseLiteral(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isParenthesizedExpression(node)) return parseLiteral(node.expression);
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return parseLiteral(node.expression);
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(parseLiteral);
  if (ts.isObjectLiteralExpression(node)) {
    const out = {};
    for (const item of node.properties) {
      if (!ts.isPropertyAssignment(item)) throw new Error('Unsupported non-literal service property: ' + item.getText());
      const key = ts.isIdentifier(item.name) || ts.isStringLiteral(item.name) || ts.isNumericLiteral(item.name)
        ? item.name.text : null;
      if (!key) throw new Error('Unsupported service key: ' + item.name.getText());
      out[key] = parseLiteral(item.initializer);
    }
    return out;
  }
  throw new Error('Unsupported dynamic literal: ' + node.getText().slice(0, 120));
}

function extractPage({ path, variable }) {
  const source = fs.readFileSync(path, 'utf8');
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let found;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(file) === variable) {
      if (found) throw new Error('Ambiguous duplicate variable ' + variable);
      found = node.initializer;
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (!found) throw new Error('Missing variable ' + variable + ' in ' + path);
  // The subscriptions object can now include a German JSON import. Inspect
  // only the original English literal instead of evaluating unrelated values.
  if (variable === 'copy') {
    const root = ts.isAsExpression(found) || ts.isSatisfiesExpression(found)
      ? found.expression : found;
    if (!ts.isObjectLiteralExpression(root)) throw new Error('Expected copy object literal');
    const english = root.properties.find(property =>
      ts.isPropertyAssignment(property) && property.name.getText(file) === 'en'
    );
    if (!english) throw new Error('Missing English subscriptions copy');
    return parseLiteral(english.initializer);
  }
  const result = parseLiteral(found);
  if (variable === 'services') {
    const out = {};
    for (const [slug, copy] of Object.entries(result)) {
      if (!copy.en || !copy.he) throw new Error('Missing English/Hebrew service: ' + slug);
      out[slug] = copy.en;
    }
    return out;
  }
  throw new Error('Unexpected inline variable: ' + variable);
}

const extracted = Object.fromEntries(Object.entries(pages).map(([name, page]) => [name, extractPage(page)]));
process.stdout.write(JSON.stringify(extracted));

/**
 * ESLint Plugin: Translation Pattern Enforcement
 *
 * Portal (error):
 * - Disallow bare useTranslations() — use usePortalTranslations() or useTranslations('portal' / 'portal.*')
 * - Disallow redundant `portal.` key prefixes under a portal namespace
 *
 * Website / portal UI (warn):
 * - Hardcoded JSX text that looks like user-facing copy
 */

const PORTAL_PATH_RE =
  /(?:^|[\\/])(?:app[\\/]\[locale\][\\/]portal|components[\\/]portal|lib[\\/]hooks)(?:[\\/]|$)/i;

const WEBSITE_PATH_RE =
  /(?:^|[\\/])(?:components[\\/](?:sections|layout|templates|forms|ui)|app[\\/]\[locale\][\\/]\(website\))(?:[\\/]|$)/i;

const HELPER_MODULE = '@/lib/i18n/translations';

const ALLOWED_HARDCODED = new Set([
  'CartShift',
  'CartShift Studio',
  'Shopify',
  'WordPress',
  'WooCommerce',
  'PayPal',
  'Google',
  'OK',
  'FAQ',
  'SEO',
  'API',
  'URL',
  'ID',
  'USD',
  'ILS',
  'EN',
  'HE',
  '•',
  '·',
  '|',
  '—',
  '–',
  '...',
  '…',
  '©',
]);

const HARDCODED_TEXT_RE = /[A-Za-z\u0590-\u05FF]{2,}/;
const MOSTLY_CODE_RE = /^[\d\s.,:%$#@/\\_+*=<>()[\]{}'"!?-]+$/;

function normalizePath(filename) {
  return filename.replace(/\\/g, '/');
}

function isPortalFile(filename) {
  return PORTAL_PATH_RE.test(normalizePath(filename));
}

function isWebsiteFile(filename) {
  return WEBSITE_PATH_RE.test(normalizePath(filename));
}

function isPortalNamespace(ns) {
  return typeof ns === 'string' && (ns === 'portal' || ns.startsWith('portal.'));
}

function getNamespaceFromCall(call) {
  if (!call || call.type !== 'CallExpression') return null;
  if (call.callee.type !== 'Identifier') return null;

  const name = call.callee.name;
  if (name === 'usePortalTranslations') {
    if (call.arguments.length === 0) return 'portal';
    const arg = call.arguments[0];
    if (arg?.type === 'Literal' && typeof arg.value === 'string') return arg.value;
    return 'portal';
  }
  if (name === 'useAnalyzerTranslations') return 'analyzer';
  if (name === 'useCvTranslations') return 'cv';
  if (name === 'useProposalTranslations') return 'proposal';
  if (name === 'useCommonTranslations' || name === 'useWebsiteTranslations') return '';

  if (name === 'useTranslations' || name === 'getTranslations') {
    if (call.arguments.length === 0) return '';
    const arg = call.arguments[0];
    if (arg?.type === 'Literal' && typeof arg.value === 'string') return arg.value;
    if (arg?.type === 'ObjectExpression') {
      const nsProp = arg.properties.find(
        p => p.type === 'Property' && p.key.type === 'Identifier' && p.key.name === 'namespace'
      );
      if (nsProp?.value?.type === 'Literal' && typeof nsProp.value.value === 'string') {
        return nsProp.value.value;
      }
    }
  }
  return null;
}

function getTranslationCall(node) {
  if (node.type !== 'CallExpression') return null;
  if (node.callee.type === 'Identifier' && /^t([A-Z][a-zA-Z]*)?$/.test(node.callee.name)) {
    return node;
  }
  if (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    (node.callee.property.name === 't' || node.callee.property.name === 'translate')
  ) {
    return node;
  }
  return null;
}

function ensureHelperImport(fixer, context, helperName) {
  const sourceCode = context.getSourceCode();
  const ast = sourceCode.ast;
  const existing = ast.body.find(
    n => n.type === 'ImportDeclaration' && n.source.value === HELPER_MODULE
  );

  if (existing) {
    const hasSpecifier = existing.specifiers.some(
      s => s.type === 'ImportSpecifier' && s.imported.name === helperName
    );
    if (hasSpecifier) return null;
    const lastSpec = existing.specifiers[existing.specifiers.length - 1];
    return fixer.insertTextAfter(lastSpec, `, ${helperName}`);
  }

  const firstImport = ast.body.find(n => n.type === 'ImportDeclaration');
  const importLine = `import { ${helperName} } from '${HELPER_MODULE}';\n`;
  if (firstImport) {
    return fixer.insertTextBefore(firstImport, importLine);
  }
  return fixer.insertTextBeforeRange([0, 0], importLine);
}

function removeUseTranslationsIfUnused(fixer, context) {
  const sourceCode = context.getSourceCode();
  const text = sourceCode.getText();
  // Keep import if other useTranslations calls remain
  if ((text.match(/\buseTranslations\s*\(/g) || []).length > 1) return null;

  const importDecl = sourceCode.ast.body.find(
    n =>
      n.type === 'ImportDeclaration' &&
      n.source.value === 'next-intl' &&
      n.specifiers.some(s => s.type === 'ImportSpecifier' && s.imported.name === 'useTranslations')
  );
  if (!importDecl) return null;

  if (importDecl.specifiers.length === 1) {
    return fixer.remove(importDecl);
  }

  const spec = importDecl.specifiers.find(
    s => s.type === 'ImportSpecifier' && s.imported.name === 'useTranslations'
  );
  if (!spec) return null;

  const specs = importDecl.specifiers;
  const idx = specs.indexOf(spec);
  if (idx < specs.length - 1) {
    return fixer.removeRange([spec.range[0], specs[idx + 1].range[0]]);
  }
  // Last specifier — remove preceding comma
  const prev = specs[idx - 1];
  return fixer.removeRange([prev.range[1], spec.range[1]]);
}

const enforcePortalTranslations = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce portal namespaced translations and forbid redundant portal. key prefixes',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useNamespacedHook:
        "Portal files must use usePortalTranslations() or useTranslations('portal') instead of useTranslations().",
      removePortalPrefix:
        "Remove \"portal.\" prefix when using a portal namespace. Use t('files.title') instead of t('portal.files.title').",
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (!isPortalFile(filename)) return {};

    /** @type {Map<string, string>} */
    const translationVars = new Map();

    return {
      VariableDeclarator(node) {
        if (!node.init) return;
        const ns = getNamespaceFromCall(node.init);
        if (ns === null) return;

        if (node.id.type === 'Identifier') {
          translationVars.set(node.id.name, ns);
        }

        const call = node.init;
        if (
          call.type === 'CallExpression' &&
          call.callee.type === 'Identifier' &&
          call.callee.name === 'useTranslations' &&
          call.arguments.length === 0
        ) {
          context.report({
            node: call,
            messageId: 'useNamespacedHook',
            fix(fixer) {
              const fixes = [fixer.replaceText(call, 'usePortalTranslations()')];
              const importFix = ensureHelperImport(fixer, context, 'usePortalTranslations');
              if (importFix) fixes.push(importFix);
              const removeImport = removeUseTranslationsIfUnused(fixer, context);
              if (removeImport) fixes.push(removeImport);
              return fixes;
            },
          });
        }
      },

      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'useTranslations' &&
          node.arguments.length === 0
        ) {
          // Covered when assigned; still catch unassigned calls
          const parent = node.parent;
          if (parent?.type === 'VariableDeclarator' && parent.init === node) return;

          context.report({
            node,
            messageId: 'useNamespacedHook',
            fix(fixer) {
              const fixes = [fixer.replaceText(node, 'usePortalTranslations()')];
              const importFix = ensureHelperImport(fixer, context, 'usePortalTranslations');
              if (importFix) fixes.push(importFix);
              return fixes;
            },
          });
        }

        const translationCall = getTranslationCall(node);
        if (!translationCall) return;

        let namespace = null;
        if (translationCall.callee.type === 'Identifier') {
          namespace = translationVars.get(translationCall.callee.name) ?? null;
        }
        if (!isPortalNamespace(namespace)) return;

        const keyArg = translationCall.arguments[0];
        if (!keyArg) return;

        if (keyArg.type === 'Literal' && typeof keyArg.value === 'string') {
          if (keyArg.value.startsWith('portal.')) {
            context.report({
              node: keyArg,
              messageId: 'removePortalPrefix',
              fix(fixer) {
                const fixed = keyArg.value.replace(/^portal\./, '');
                const quote = keyArg.raw[0];
                return fixer.replaceText(keyArg, `${quote}${fixed}${quote}`);
              },
            });
          }
        }

        if (keyArg.type === 'TemplateLiteral') {
          const hasPrefix = keyArg.quasis.some(q => q.value.raw.includes('portal.'));
          if (hasPrefix) {
            context.report({
              node: keyArg,
              messageId: 'removePortalPrefix',
              fix(fixer) {
                let fixed = '`';
                keyArg.quasis.forEach((quasi, i) => {
                  fixed += quasi.value.raw.replace(/portal\./g, '');
                  if (i < keyArg.expressions.length) {
                    fixed += '${' + context.getSourceCode().getText(keyArg.expressions[i]) + '}';
                  }
                });
                fixed += '`';
                return fixer.replaceText(keyArg, fixed);
              },
            });
          }
        }
      },
    };
  },
};

function isIgnorableJsxText(raw) {
  const text = raw.replace(/\s+/g, ' ').trim();
  if (!text) return true;
  if (ALLOWED_HARDCODED.has(text)) return true;
  if (MOSTLY_CODE_RE.test(text)) return true;
  if (!HARDCODED_TEXT_RE.test(text)) return true;
  if (text.length <= 1) return true;
  if (/^[A-Z0-9]{2,5}$/.test(text)) return true;
  return false;
}

const noHardcodedJsxText = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Warn on hardcoded user-facing JSX text in website/portal UI',
      recommended: false,
    },
    schema: [],
    messages: {
      hardcoded:
        'Hardcoded UI string "{{text}}". Move it to messages/src and use a translation helper.',
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (!isWebsiteFile(filename) && !isPortalFile(filename)) return {};
    if (/\.(test|spec|stories)\.[tj]sx?$/.test(filename)) return {};

    return {
      JSXText(node) {
        const text = node.value.replace(/\s+/g, ' ').trim();
        if (isIgnorableJsxText(node.value)) return;
        if (text.length < 3) return;
        context.report({
          node,
          messageId: 'hardcoded',
          data: { text: text.slice(0, 60) },
        });
      },
    };
  },
};

export const plugin = {
  meta: {
    name: 'eslint-plugin-portal-translations',
    version: '2.0.0',
  },
  rules: {
    'enforce-portal-translations': enforcePortalTranslations,
    'no-hardcoded-jsx-text': noHardcodedJsxText,
  },
};

export default plugin;

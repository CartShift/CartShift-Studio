/**
 * ESLint Plugin: Portal Translation Pattern Enforcement
 * Enforces standardized translation pattern for portal files:
 * - Must use useTranslations('portal') in portal files
 * - Must NOT use 'portal.' prefix when using namespaced hook
 * - Prevents useTranslations() without namespace in portal files
 */

const PORTAL_FILE_PATTERN = /app\[locale]\/portal/;

function isPortalFile(filename) {
  return PORTAL_FILE_PATTERN.test(filename);
}

function getUseTranslationsCall(node) {
  if (
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'useTranslations'
  ) {
    return node;
  }
  return null;
}

function getTranslationCall(node) {
  if (node.type === 'CallExpression') {
    // Direct call: t('portal.key')
    if (
      node.callee.type === 'Identifier' &&
      (node.callee.name === 't' || node.callee.name === 'translate')
    ) {
      return node;
    }
    // Member expression: something.t('portal.key')
    if (
      node.callee.type === 'MemberExpression' &&
      node.callee.property.type === 'Identifier' &&
      (node.callee.property.name === 't' || node.callee.property.name === 'translate')
    ) {
      return node;
    }
  }
  return null;
}

function hasPortalPrefix(key) {
  if (typeof key === 'string') {
    return key.startsWith("'portal.") || key.startsWith('"portal.') || key.startsWith('`portal.');
  }
  if (key.type === 'TemplateLiteral') {
    return key.quasis.some(quasi => quasi.value.raw.includes('portal.'));
  }
  return false;
}

function removePortalPrefix(key) {
  if (typeof key === 'string') {
    if (key.startsWith("'portal.")) {
      return key.replace("'portal.", "'");
    }
    if (key.startsWith('"portal.')) {
      return key.replace('"portal.', '"');
    }
    if (key.startsWith('`portal.')) {
      return key.replace('`portal.', '`');
    }
  }
  return key;
}

const useTranslationsRule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce useTranslations(\'portal\') in portal files',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useNamespacedHook: 'Portal files must use useTranslations(\'portal\') instead of useTranslations().',
      removePortalPrefix: 'Remove "portal." prefix when using useTranslations(\'portal\'). Use t(\'files.title\') instead of t(\'portal.files.title\').',
    },
  },

  create(context) {
    const filename = context.getFilename();
    if (!isPortalFile(filename)) {
      return {};
    }

    let hasNamespacedHook = false;
    let translationVariableName = null;

    return {
      VariableDeclarator(node) {
        if (node.init) {
          const call = getUseTranslationsCall(node.init);
          if (call) {
            const args = call.arguments;
            
            // Check if using useTranslations() without namespace
            if (args.length === 0) {
              context.report({
                node: call,
                messageId: 'useNamespacedHook',
                fix(fixer) {
                  return fixer.replaceText(call, "useTranslations('portal')");
                },
              });
            }
            
            // Check if using useTranslations('portal')
            if (args.length === 1 && 
                args[0].type === 'Literal' && 
                args[0].value === 'portal') {
              hasNamespacedHook = true;
              if (node.id.type === 'Identifier') {
                translationVariableName = node.id.name;
              }
            }
          }
        }
      },

      CallExpression(node) {
        const translationCall = getTranslationCall(node);
        if (!translationCall || !hasNamespacedHook) {
          return;
        }

        const args = translationCall.arguments;
        if (args.length > 0) {
          const keyArg = args[0];
          
          // Check for 'portal.' prefix in string literals
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
          
          // Check for 'portal.' prefix in template literals
          if (keyArg.type === 'TemplateLiteral') {
            const hasPrefix = keyArg.quasis.some(quasi => 
              quasi.value.raw.includes('portal.')
            );
            
            if (hasPrefix) {
              context.report({
                node: keyArg,
                messageId: 'removePortalPrefix',
                fix(fixer) {
                  // Fix template literal by removing portal. from quasis
                  const fixedQuasis = keyArg.quasis.map(quasi => {
                    const fixed = quasi.value.raw.replace(/portal\./g, '');
                    return { ...quasi, value: { ...quasi.value, raw: fixed } };
                  });
                  
                  // Reconstruct template literal
                  let fixed = '`';
                  fixedQuasis.forEach((quasi, i) => {
                    fixed += quasi.value.raw;
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
        }
      },
    };
  },
};

export const plugin = {
  meta: {
    name: 'eslint-plugin-portal-translations',
    version: '1.0.0',
  },
  rules: {
    'enforce-portal-translations': useTranslationsRule,
  },
};

export default plugin;

/**
 * ESLint Plugin: RTL Logical Properties
 * Auto-fixes physical CSS properties to logical ones for RTL support.
 *
 * Mappings:
 * - ml-* → ms-* (margin-left → margin-inline-start)
 * - mr-* → me-* (margin-right → margin-inline-end)
 * - pl-* → ps-* (padding-left → padding-inline-start)
 * - pr-* → pe-* (padding-right → padding-inline-end)
 * - left-* → start-* (left → inset-inline-start)
 * - right-* → end-* (right → inset-inline-end)
 */

const PHYSICAL_TO_LOGICAL = {
  'ml-': 'ms-',
  'mr-': 'me-',
  'pl-': 'ps-',
  'pr-': 'pe-',
  'left-': 'start-',
  'right-': 'end-',
};

const PHYSICAL_PATTERN = /(?:^|\s)(ml-|mr-|pl-|pr-|left-|right-)[\w\d/[\].%-]*/g;

function replacePhysicalWithLogical(value) {
  return value.replace(PHYSICAL_PATTERN, (match) => {
    const trimmed = match.trimStart();
    const prefix = match.slice(0, match.length - trimmed.length);

    for (const [physical, logical] of Object.entries(PHYSICAL_TO_LOGICAL)) {
      if (trimmed.startsWith(physical)) {
        return prefix + trimmed.replace(physical, logical);
      }
    }
    return match;
  });
}

function hasPhysicalProperty(value) {
  return PHYSICAL_PATTERN.test(value);
}

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce logical CSS properties for RTL support in className attributes',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      useLogicalProperty: 'Use logical properties (ms-, me-, ps-, pe-, start-, end-) instead of physical ones (ml-, mr-, pl-, pr-, left-, right-) for better RTL support.',
    },
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'className') return;

        const value = node.value;
        if (!value) return;

        // Handle string literals: className="ml-4 mr-2"
        if (value.type === 'Literal' && typeof value.value === 'string') {
          if (hasPhysicalProperty(value.value)) {
            context.report({
              node: value,
              messageId: 'useLogicalProperty',
              fix(fixer) {
                const fixed = replacePhysicalWithLogical(value.value);
                return fixer.replaceText(value, `"${fixed}"`);
              },
            });
          }
          return;
        }

        // Handle JSX expressions: className={...}
        if (value.type === 'JSXExpressionContainer') {
          const expr = value.expression;

          // className={"ml-4"}
          if (expr.type === 'Literal' && typeof expr.value === 'string') {
            if (hasPhysicalProperty(expr.value)) {
              context.report({
                node: expr,
                messageId: 'useLogicalProperty',
                fix(fixer) {
                  const fixed = replacePhysicalWithLogical(expr.value);
                  return fixer.replaceText(expr, `"${fixed}"`);
                },
              });
            }
            return;
          }

          // className={`ml-4 ${condition}`} - template literals
          if (expr.type === 'TemplateLiteral') {
            expr.quasis.forEach((quasi) => {
              if (hasPhysicalProperty(quasi.value.raw)) {
                context.report({
                  node: quasi,
                  messageId: 'useLogicalProperty',
                  fix(fixer) {
                    const fixed = replacePhysicalWithLogical(quasi.value.raw);
                    return fixer.replaceText(quasi, fixed);
                  },
                });
              }
            });
            return;
          }

          // className={cn("ml-4", ...)} or className={clsx("ml-4", ...)}
          if (expr.type === 'CallExpression') {
            processCallExpressionArgs(expr.arguments, context);
          }

          // className={condition ? "ml-4" : "mr-4"}
          if (expr.type === 'ConditionalExpression') {
            processConditionalExpression(expr, context);
          }
        }
      },
    };
  },
};

function processCallExpressionArgs(args, context) {
  args.forEach((arg) => {
    if (arg.type === 'Literal' && typeof arg.value === 'string') {
      if (hasPhysicalProperty(arg.value)) {
        context.report({
          node: arg,
          messageId: 'useLogicalProperty',
          fix(fixer) {
            const fixed = replacePhysicalWithLogical(arg.value);
            return fixer.replaceText(arg, `"${fixed}"`);
          },
        });
      }
    } else if (arg.type === 'TemplateLiteral') {
      arg.quasis.forEach((quasi) => {
        if (hasPhysicalProperty(quasi.value.raw)) {
          context.report({
            node: quasi,
            messageId: 'useLogicalProperty',
            fix(fixer) {
              const fixed = replacePhysicalWithLogical(quasi.value.raw);
              return fixer.replaceText(quasi, fixed);
            },
          });
        }
      });
    } else if (arg.type === 'ConditionalExpression') {
      processConditionalExpression(arg, context);
    } else if (arg.type === 'LogicalExpression') {
      processLogicalExpression(arg, context);
    } else if (arg.type === 'CallExpression') {
      processCallExpressionArgs(arg.arguments, context);
    }
  });
}

function processConditionalExpression(expr, context) {
  [expr.consequent, expr.alternate].forEach((branch) => {
    if (branch.type === 'Literal' && typeof branch.value === 'string') {
      if (hasPhysicalProperty(branch.value)) {
        context.report({
          node: branch,
          messageId: 'useLogicalProperty',
          fix(fixer) {
            const fixed = replacePhysicalWithLogical(branch.value);
            return fixer.replaceText(branch, `"${fixed}"`);
          },
        });
      }
    }
  });
}

function processLogicalExpression(expr, context) {
  if (expr.right.type === 'Literal' && typeof expr.right.value === 'string') {
    if (hasPhysicalProperty(expr.right.value)) {
      context.report({
        node: expr.right,
        messageId: 'useLogicalProperty',
        fix(fixer) {
          const fixed = replacePhysicalWithLogical(expr.right.value);
          return fixer.replaceText(expr.right, `"${fixed}"`);
        },
      });
    }
  }
}

export const plugin = {
  meta: {
    name: 'eslint-plugin-rtl-logical-properties',
    version: '1.0.0',
  },
  rules: {
    'enforce-logical-properties': rule,
  },
};

export default plugin;

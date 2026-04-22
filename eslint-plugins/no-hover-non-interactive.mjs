/**
 * ESLint Plugin: No Hover on Non-Interactive Elements
 *
 * Flags `hover:` and `group-hover:` CSS classes that create hover effects
 * on or within non-interactive HTML elements.
 *
 * Detection:
 * 1. `hover:` on non-interactive elements → flagged directly
 * 2. `group-hover:` on elements whose nearest `group` parent is non-interactive → flagged
 *
 * Interactive elements (allowed): a, button, input, select, textarea, label, option, summary, details
 * Also allowed: elements with onClick, cursor-pointer, cursor-help, role="button"/"link", tabIndex
 * Also allowed: custom React components (uppercase names), elements inside interactive parents
 *
 * Handles: motion.div and other member expressions (treated as their base HTML element)
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERACTIVE_ELEMENTS = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'label',
  'option',
  'summary',
  'details',
]);

const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'tab',
  'menuitem',
  'option',
  'switch',
  'checkbox',
  'radio',
]);

/**
 * Cursor utility classes that signal an interactive hover context.
 * cursor-pointer: explicitly clickable
 * cursor-help: shows informational tooltip on hover
 * cursor-zoom-in / cursor-zoom-out: zoomable/interactive media
 */
const CURSOR_INTERACTIVE_REGEX = /\bcursor-(?:pointer|help|zoom-in|zoom-out)\b/;

// ─── Tag Name Helpers ─────────────────────────────────────────────────────────

/**
 * Get the base HTML tag name from a JSX element.
 * - `<div>` → 'div', `<span>` → 'span'
 * - `<motion.div>` → 'div', `<motion.span>` → 'span'
 * - `<Card>`, `<Link>` → null (custom component, assume interactive)
 * - `<Card.Section>` → null (custom component)
 */
function getBaseTagName(node) {
  const tagName = node.openingElement.name;

  if (tagName.type === 'JSXIdentifier') {
    if (/^[a-z]/.test(tagName.name)) return tagName.name;
    return null; // Custom React component (uppercase)
  }

  // Member expressions: motion.div, motion.span, Card.Section
  if (tagName.type === 'JSXMemberExpression') {
    const prop = tagName.property;
    // TypeScript ESLint parser uses JSXIdentifier (not Identifier) for JSX property names
    const propName = prop.type === 'Identifier' || prop.type === 'JSXIdentifier' ? prop.name : null;
    if (propName && /^[a-z]/.test(propName)) {
      return propName; // motion.div → 'div'
    }
    return null; // Card.Section → custom component
  }

  return null;
}

// ─── String Extraction ────────────────────────────────────────────────────────

/**
 * Extract a simple string value from a className attribute value node.
 * Returns null for dynamic expressions that can't be statically analyzed.
 */
function extractSimpleString(value) {
  if (value.type === 'Literal' && typeof value.value === 'string') {
    return value.value;
  }
  if (value.type === 'JSXExpressionContainer') {
    const expr = value.expression;
    if (expr.type === 'Literal' && typeof expr.value === 'string') {
      return expr.value;
    }
  }
  return null;
}

// ─── Cursor Pattern Detection ─────────────────────────────────────────────────

/**
 * Recursively check if any string argument in a cn()/clsx() call contains
 * an interactive cursor pattern.
 */
function argsContainCursor(args) {
  for (const arg of args) {
    if (arg.type === 'Literal' && typeof arg.value === 'string') {
      if (CURSOR_INTERACTIVE_REGEX.test(arg.value)) return true;
    } else if (arg.type === 'TemplateLiteral') {
      for (const quasi of arg.quasis) {
        if (CURSOR_INTERACTIVE_REGEX.test(quasi.value.raw)) return true;
      }
    } else if (arg.type === 'ConditionalExpression') {
      if (argsContainCursor([arg.consequent, arg.alternate])) return true;
    } else if (arg.type === 'LogicalExpression') {
      if (argsContainCursor([arg.right])) return true;
    } else if (arg.type === 'CallExpression') {
      if (argsContainCursor(arg.arguments)) return true;
    }
  }
  return false;
}

/**
 * Check if a className attribute value contains an interactive cursor pattern.
 */
function classNameValueHasInteractiveCursor(value) {
  const str = extractSimpleString(value);
  if (str && CURSOR_INTERACTIVE_REGEX.test(str)) return true;

  if (value.type === 'JSXExpressionContainer') {
    const expr = value.expression;
    if (expr.type === 'CallExpression') {
      return argsContainCursor(expr.arguments);
    }
  }
  return false;
}

// ─── AST Parent Walking ───────────────────────────────────────────────────────

/**
 * Check if a node is used as a JSX attribute value.
 * e.g. trigger={<span>...</span>} — the <span> is inside a JSXAttribute.
 */
function isInsideJSXAttributeValue(node) {
  let current = node.parent;
  while (current) {
    if (current.type === 'JSXAttribute') return true;
    if (
      current.type === 'JSXElement' ||
      current.type === 'JSXFragment' ||
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'Program'
    ) {
      break;
    }
    current = current.parent;
  }
  return false;
}

/**
 * Walk up the AST to check if a node is nested inside an interactive parent.
 * Checks up to 5 levels of JSXElement nesting.
 *
 * Interactive parents: <a>, <Link>, or any uppercase component name.
 */
function isInsideInteractiveParent(node) {
  let current = node.parent;
  let jsxDepth = 0;

  while (current) {
    if (current.type === 'JSXElement' && current !== node) {
      jsxDepth++;
      if (jsxDepth > 5) break;

      const opening = current.openingElement;
      if (opening && opening.name) {
        const parentTag = opening.name;
        if (parentTag.type === 'JSXIdentifier') {
          if (parentTag.name === 'a' || parentTag.name === 'Link') return true;
          if (/^[A-Z]/.test(parentTag.name)) return true;
        }
      }
    }
    current = current.parent;
  }

  return false;
}

// ─── Interactivity Check ──────────────────────────────────────────────────────

/**
 * Determine if a JSX element is interactive by checking its tag name, attributes,
 * and parent context.
 *
 * Note: The `group` CSS class is NOT treated as an interactivity marker. It's a
 * Tailwind utility for hover propagation, not a semantic indicator. Elements must
 * have explicit interactivity markers: onClick, cursor-pointer, interactive tag name,
 * ARIA role, or be wrapped in an interactive parent (Link, button, etc.).
 */
function isInteractiveJSXElement(node) {
  const opening = node.openingElement;
  if (!opening) return true;

  const baseTag = getBaseTagName(node);

  // Custom React components (uppercase names or complex member expressions)
  // are assumed interactive since we can't know their internal structure.
  if (baseTag === null) return true;

  // Known interactive HTML elements
  if (INTERACTIVE_ELEMENTS.has(baseTag)) return true;

  // Elements used as JSX attribute values are likely interactive
  // e.g. trigger={<span className="hover:...">...</span>}
  if (isInsideJSXAttributeValue(node)) return true;

  // Check attributes for interactivity markers
  for (const attr of opening.attributes) {
    if (attr.type !== 'JSXAttribute') continue;

    const attrName = attr.name.name;

    // Click or double-click handlers
    if (attrName === 'onClick' || attrName === 'onDoubleClick') return true;

    // Keyboard focusable
    if (attrName === 'tabIndex') return true;

    // Interactive cursor classes in className (cursor-pointer, cursor-help, etc.)
    if (attrName === 'className' && attr.value) {
      if (classNameValueHasInteractiveCursor(attr.value)) return true;
    }

    // ARIA roles that imply interactivity
    if (attrName === 'role' && attr.value) {
      const str = extractSimpleString(attr.value);
      if (str && INTERACTIVE_ROLES.has(str)) return true;
    }
  }

  // Element is inside an interactive parent wrapper (e.g. <Link>, <a>, custom component).
  if (isInsideInteractiveParent(node)) return true;

  return false;
}

// ─── Group Class Detection ────────────────────────────────────────────────────

/**
 * Check if a className value node contains the `group` class.
 * Handles string literals, template literals, and cn()/clsx() calls.
 */
function classNameContainsGroup(value) {
  if (value.type === 'Literal' && typeof value.value === 'string') {
    return /\bgroup\b(?!-)/.test(value.value);
  }

  if (value.type === 'JSXExpressionContainer') {
    const expr = value.expression;

    if (expr.type === 'Literal' && typeof expr.value === 'string') {
      return /\bgroup\b(?!-)/.test(expr.value);
    }

    if (expr.type === 'TemplateLiteral') {
      return expr.quasis.some(q => /\bgroup\b(?!-)/.test(q.value.raw));
    }

    if (expr.type === 'CallExpression') {
      return callArgsContainGroup(expr.arguments);
    }

    if (expr.type === 'ConditionalExpression') {
      return stringNodeContainsGroup(expr.consequent) || stringNodeContainsGroup(expr.alternate);
    }

    if (expr.type === 'LogicalExpression') {
      return stringNodeContainsGroup(expr.right);
    }
  }

  return false;
}

/**
 * Check if a single AST node (Literal or TemplateLiteral) contains `group`.
 */
function stringNodeContainsGroup(node) {
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return /\bgroup\b(?!-)/.test(node.value);
  }
  if (node.type === 'TemplateLiteral') {
    return node.quasis.some(q => /\bgroup\b(?!-)/.test(q.value.raw));
  }
  return false;
}

/**
 * Recursively check cn()/clsx() arguments for the `group` class.
 */
function callArgsContainGroup(args) {
  for (const arg of args) {
    if (stringNodeContainsGroup(arg)) return true;
    if (arg.type === 'ConditionalExpression') {
      if (stringNodeContainsGroup(arg.consequent) || stringNodeContainsGroup(arg.alternate)) {
        return true;
      }
    }
    if (arg.type === 'LogicalExpression') {
      if (stringNodeContainsGroup(arg.right)) return true;
    }
    if (arg.type === 'CallExpression') {
      if (callArgsContainGroup(arg.arguments)) return true;
    }
  }
  return false;
}

/**
 * Find the nearest ancestor JSXElement with the `group` class.
 * Walks up the AST tree, checking each parent JSXElement's className.
 * Returns the group parent node, or null if not found.
 */
function findGroupParent(node) {
  let current = node.parent;
  let depth = 0;

  while (current && depth < 10) {
    if (current.type === 'JSXElement') {
      depth++;

      const classNameAttr = current.openingElement.attributes.find(
        attr => attr.type === 'JSXAttribute' && attr.name.name === 'className'
      );

      if (classNameAttr && classNameAttr.value && classNameContainsGroup(classNameAttr.value)) {
        return current;
      }
    }

    // Stop at function boundaries — group must be in the same component
    if (
      current.type === 'FunctionDeclaration' ||
      current.type === 'FunctionExpression' ||
      current.type === 'ArrowFunctionExpression' ||
      current.type === 'Program'
    ) {
      break;
    }

    current = current.parent;
  }

  return null;
}

// ─── Hover Class Detection ────────────────────────────────────────────────────

/**
 * Check if a single CSS class uses the `hover:` variant.
 * e.g. "hover:bg-blue-50" → true, "dark:hover:bg-blue-50" → true
 * "group-hover:text-blue" → false
 */
function hasHoverVariant(cls) {
  const parts = cls.split(':');
  return parts.length > 1 && parts.slice(0, -1).includes('hover');
}

/**
 * Check if a single CSS class uses the `group-hover:` variant.
 * e.g. "group-hover:scale-110" → true, "dark:group-hover:bg-blue" → true
 * "hover:bg-blue" → false
 */
function hasGroupHoverVariant(cls) {
  const parts = cls.split(':');
  return parts.length > 1 && parts.slice(0, -1).includes('group-hover');
}

/**
 * Extract hover: classes from a className string.
 */
function getHoverClasses(className) {
  return className.split(/\s+/).filter(hasHoverVariant);
}

/**
 * Extract group-hover: classes from a className string.
 */
function getGroupHoverClasses(className) {
  return className.split(/\s+/).filter(hasGroupHoverVariant);
}

// ─── Reporting ────────────────────────────────────────────────────────────────

function reportHoverClasses(classString, reportNode, context, elementName) {
  const hoverClasses = getHoverClasses(classString);
  if (hoverClasses.length > 0) {
    context.report({
      node: reportNode,
      messageId: 'noHoverNonInteractive',
      data: {
        element: elementName,
        classes: hoverClasses.join(', '),
      },
    });
  }
}

function reportGroupHoverClasses(classString, reportNode, context, elementName, parentElementName) {
  const groupHoverClasses = getGroupHoverClasses(classString);
  if (groupHoverClasses.length > 0) {
    context.report({
      node: reportNode,
      messageId: 'noGroupHoverNonInteractive',
      data: {
        element: elementName,
        classes: groupHoverClasses.join(', '),
        parentElement: parentElementName,
      },
    });
  }
}

// ─── Expression Processing ────────────────────────────────────────────────────

/**
 * Recursively process call expression arguments (cn(), clsx(), etc.).
 */
function processCallArgs(args, context, elementName, groupParent) {
  args.forEach(arg => {
    if (arg.type === 'Literal' && typeof arg.value === 'string') {
      reportHoverClasses(arg.value, arg, context, elementName);
      if (groupParent) {
        reportGroupHoverClasses(
          arg.value,
          arg,
          context,
          elementName,
          getBaseTagName(groupParent) || 'element'
        );
      }
    } else if (arg.type === 'TemplateLiteral') {
      arg.quasis.forEach(quasi => {
        reportHoverClasses(quasi.value.raw, quasi, context, elementName);
        if (groupParent) {
          reportGroupHoverClasses(
            quasi.value.raw,
            quasi,
            context,
            elementName,
            getBaseTagName(groupParent) || 'element'
          );
        }
      });
    } else if (arg.type === 'ConditionalExpression') {
      processConditional(arg, context, elementName, groupParent);
    } else if (arg.type === 'LogicalExpression') {
      processLogical(arg, context, elementName, groupParent);
    } else if (arg.type === 'CallExpression') {
      processCallArgs(arg.arguments, context, elementName, groupParent);
    }
  });
}

function processConditional(expr, context, elementName, groupParent) {
  [expr.consequent, expr.alternate].forEach(branch => {
    if (branch.type === 'Literal' && typeof branch.value === 'string') {
      reportHoverClasses(branch.value, branch, context, elementName);
      if (groupParent) {
        reportGroupHoverClasses(
          branch.value,
          branch,
          context,
          elementName,
          getBaseTagName(groupParent) || 'element'
        );
      }
    } else if (branch.type === 'TemplateLiteral') {
      branch.quasis.forEach(quasi => {
        reportHoverClasses(quasi.value.raw, quasi, context, elementName);
        if (groupParent) {
          reportGroupHoverClasses(
            quasi.value.raw,
            quasi,
            context,
            elementName,
            getBaseTagName(groupParent) || 'element'
          );
        }
      });
    }
  });
}

function processLogical(expr, context, elementName, groupParent) {
  if (expr.right.type === 'Literal' && typeof expr.right.value === 'string') {
    reportHoverClasses(expr.right.value, expr.right, context, elementName);
    if (groupParent) {
      reportGroupHoverClasses(
        expr.right.value,
        expr.right,
        context,
        elementName,
        getBaseTagName(groupParent) || 'element'
      );
    }
  } else if (expr.right.type === 'TemplateLiteral') {
    expr.right.quasis.forEach(quasi => {
      reportHoverClasses(quasi.value.raw, quasi, context, elementName);
      if (groupParent) {
        reportGroupHoverClasses(
          quasi.value.raw,
          quasi,
          context,
          elementName,
          getBaseTagName(groupParent) || 'element'
        );
      }
    });
  }
}

// ─── Main Check Function ──────────────────────────────────────────────────────

/**
 * Check a className attribute value for hover classes and report findings.
 * Handles: string literals, template literals, cn()/clsx() calls, ternaries,
 * logical expressions.
 */
function checkClassNameValue(value, context, elementName, node) {
  // Determine the group parent for group-hover: checks
  const groupParent = findGroupParent(node);
  const groupParentIsInteractive = groupParent ? isInteractiveJSXElement(groupParent) : true; // No group parent found → don't flag group-hover (might be in a component we can't analyze)
  const parentName = groupParent ? getBaseTagName(groupParent) || 'element' : null;

  // String literal: className="hover:bg-blue-50"
  if (value.type === 'Literal' && typeof value.value === 'string') {
    reportHoverClasses(value.value, value, context, elementName);
    if (groupParent && !groupParentIsInteractive) {
      reportGroupHoverClasses(value.value, value, context, elementName, parentName);
    }
    return;
  }

  // JSX expression container: className={...}
  if (value.type === 'JSXExpressionContainer') {
    const expr = value.expression;

    // className={"hover:bg-blue-50"}
    if (expr.type === 'Literal' && typeof expr.value === 'string') {
      reportHoverClasses(expr.value, expr, context, elementName);
      if (groupParent && !groupParentIsInteractive) {
        reportGroupHoverClasses(expr.value, expr, context, elementName, parentName);
      }
      return;
    }

    // className={`hover:bg-blue-50 ${condition}`}
    if (expr.type === 'TemplateLiteral') {
      expr.quasis.forEach(quasi => {
        reportHoverClasses(quasi.value.raw, quasi, context, elementName);
        if (groupParent && !groupParentIsInteractive) {
          reportGroupHoverClasses(quasi.value.raw, quasi, context, elementName, parentName);
        }
      });
      return;
    }

    // className={cn("hover:bg-blue-50", ...)} or className={clsx(...)}
    if (expr.type === 'CallExpression') {
      const gp = groupParent && !groupParentIsInteractive ? groupParent : null;
      processCallArgs(expr.arguments, context, elementName, gp);
      return;
    }

    // className={condition ? "hover:bg-blue-50" : "bg-blue-50"}
    if (expr.type === 'ConditionalExpression') {
      const gp = groupParent && !groupParentIsInteractive ? groupParent : null;
      processConditional(expr, context, elementName, gp);
      return;
    }

    // className={condition && "hover:bg-blue-50"}
    if (expr.type === 'LogicalExpression') {
      const gp = groupParent && !groupParentIsInteractive ? groupParent : null;
      processLogical(expr, context, elementName, gp);
      return;
    }
  }
}

// ─── Rule Definition ──────────────────────────────────────────────────────────

const rule = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow hover: and group-hover: CSS classes on non-interactive HTML elements',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      noHoverNonInteractive:
        'Avoid using hover: classes ({{classes}}) on non-interactive <{{element}}> elements. Hover states should only appear on interactive elements like buttons, links, or elements with click handlers.',
      noGroupHoverNonInteractive:
        'Avoid using group-hover: classes ({{classes}}) on <{{element}}> inside non-interactive group parent <{{parentElement}}>. Either make the parent interactive (wrap in Link, add onClick) or remove the decorative hover effects.',
    },
  },

  create(context) {
    return {
      JSXElement(node) {
        // Skip interactive elements entirely
        if (isInteractiveJSXElement(node)) return;

        // Find className attribute
        const classNameAttr = node.openingElement.attributes.find(
          attr => attr.type === 'JSXAttribute' && attr.name.name === 'className'
        );

        if (!classNameAttr || !classNameAttr.value) return;

        const elementName = getBaseTagName(node) || node.openingElement.name.name || 'element';
        checkClassNameValue(classNameAttr.value, context, elementName, node);
      },
    };
  },
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const plugin = {
  meta: {
    name: 'eslint-plugin-no-hover-non-interactive',
    version: '2.0.0',
  },
  rules: {
    'no-hover-non-interactive': rule,
  },
};

export default plugin;

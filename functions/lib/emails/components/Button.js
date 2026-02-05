"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const ActionButton = ({ href, children, variant = 'primary', fullWidth = false, }) => {
    const isPrimary = variant === 'primary';
    const buttonStyle = {
        ...styles.base,
        ...(isPrimary ? styles.primary : styles.secondary),
        ...(fullWidth ? styles.fullWidth : {}),
    };
    return ((0, jsx_runtime_1.jsx)(components_1.Button, { href: href, style: buttonStyle, children: children }));
};
exports.ActionButton = ActionButton;
const styles = {
    base: {
        display: 'inline-block',
        padding: '12px 24px',
        borderRadius: theme_1.theme.borderRadius.md,
        fontSize: theme_1.theme.fontSize.base,
        fontWeight: '600',
        textDecoration: 'none',
        textAlign: 'center',
        cursor: 'pointer',
    },
    primary: {
        backgroundColor: theme_1.theme.colors.primary,
        color: '#ffffff',
    },
    secondary: {
        backgroundColor: '#ffffff',
        color: theme_1.theme.colors.primary,
        border: `1px solid ${theme_1.theme.colors.primary}`,
    },
    fullWidth: {
        display: 'block',
        width: '100%',
    },
};
//# sourceMappingURL=Button.js.map
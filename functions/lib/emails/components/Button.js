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
        padding: '14px 28px',
        borderRadius: '10px',
        fontSize: theme_1.theme.fontSize.base,
        fontWeight: '700',
        textDecoration: 'none',
        textAlign: 'center',
        cursor: 'pointer',
        boxShadow: '0 8px 18px rgba(37, 99, 235, 0.20)',
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
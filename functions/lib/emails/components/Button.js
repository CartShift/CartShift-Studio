"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const ActionButton = ({ href, children, variant = 'primary', fullWidth = false, }) => {
    const buttonStyle = {
        ...styles.base,
        ...styles[variant],
        ...(fullWidth ? styles.fullWidth : {}),
    };
    return ((0, jsx_runtime_1.jsx)(components_1.Button, { href: href, style: buttonStyle, children: children }));
};
exports.ActionButton = ActionButton;
const styles = {
    base: {
        display: 'inline-block',
        padding: '15px 30px',
        borderRadius: '12px',
        fontSize: theme_1.theme.fontSize.base,
        fontWeight: '700',
        textDecoration: 'none',
        textAlign: 'center',
        cursor: 'pointer',
        lineHeight: '1.2',
        boxShadow: '0 14px 26px rgba(37, 99, 235, 0.24)',
    },
    primary: {
        backgroundColor: theme_1.theme.colors.primary,
        color: '#ffffff',
        border: `1px solid ${theme_1.theme.colors.primaryDark}`,
    },
    secondary: {
        backgroundColor: theme_1.theme.colors.primarySoft,
        color: theme_1.theme.colors.primary,
        border: `1px solid ${theme_1.theme.colors.info.border}`,
        boxShadow: 'none',
    },
    outline: {
        backgroundColor: '#ffffff',
        color: theme_1.theme.colors.text.primary,
        border: `1px solid ${theme_1.theme.colors.borderStrong}`,
        boxShadow: 'none',
    },
    fullWidth: {
        display: 'block',
        width: '100%',
    },
};
//# sourceMappingURL=Button.js.map
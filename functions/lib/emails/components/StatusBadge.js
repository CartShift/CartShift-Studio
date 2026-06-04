"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBadge = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const StatusBadge = ({ children, type = 'neutral' }) => {
    const style = styles[type] || styles.neutral;
    return (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.base, ...style }, children: children });
};
exports.StatusBadge = StatusBadge;
const baseStyle = {
    display: 'inline-block',
    padding: '7px 14px',
    borderRadius: theme_1.theme.borderRadius.full,
    fontSize: theme_1.theme.fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    margin: '0',
    border: `1px solid ${theme_1.theme.colors.border}`,
    lineHeight: '1.2',
};
const styles = {
    base: baseStyle,
    neutral: {
        backgroundColor: '#f1f5f9',
        color: '#475569',
        borderColor: '#cbd5e1',
    },
    info: {
        backgroundColor: theme_1.theme.colors.info.bg,
        color: theme_1.theme.colors.info.text,
        borderColor: theme_1.theme.colors.info.border,
    },
    success: {
        backgroundColor: theme_1.theme.colors.success.bg,
        color: theme_1.theme.colors.success.text,
        borderColor: theme_1.theme.colors.success.border,
    },
    warning: {
        backgroundColor: theme_1.theme.colors.warning.bg,
        color: theme_1.theme.colors.warning.text,
        borderColor: theme_1.theme.colors.warning.border,
    },
    error: {
        backgroundColor: theme_1.theme.colors.error.bg,
        color: theme_1.theme.colors.error.text,
        borderColor: theme_1.theme.colors.error.border,
    },
};
//# sourceMappingURL=StatusBadge.js.map
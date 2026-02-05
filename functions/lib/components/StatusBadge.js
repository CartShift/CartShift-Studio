"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusBadge = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const StatusBadge = ({ children, type = 'neutral' }) => {
    const style = styles[type] || styles.neutral;
    return ((0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.base, ...style }, children: children }));
};
exports.StatusBadge = StatusBadge;
const baseStyle = {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: theme_1.theme.borderRadius.full,
    fontSize: theme_1.theme.fontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    margin: '0',
};
const styles = {
    base: baseStyle,
    neutral: {
        backgroundColor: '#f1f5f9',
        color: '#475569',
    },
    info: theme_1.theme.colors.info,
    success: theme_1.theme.colors.success,
    warning: theme_1.theme.colors.warning,
    error: theme_1.theme.colors.error,
};
//# sourceMappingURL=StatusBadge.js.map
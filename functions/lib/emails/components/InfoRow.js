"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoRow = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const InfoRow = ({ label, value, isTotal = false, valueAlign = 'right' }) => {
    return ((0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.row, children: (0, jsx_runtime_1.jsxs)(components_1.Row, { children: [(0, jsx_runtime_1.jsx)(components_1.Column, { children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.label, ...(isTotal ? styles.totalLabel : {}) }, children: label }) }), (0, jsx_runtime_1.jsx)(components_1.Column, { align: valueAlign, children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.value, ...(isTotal ? styles.totalValue : {}) }, children: value }) })] }) }));
};
exports.InfoRow = InfoRow;
const styles = {
    row: {
        padding: '11px 0',
        borderBottom: `1px solid ${theme_1.theme.colors.border}`,
    },
    label: {
        margin: '0',
        fontSize: theme_1.theme.fontSize.sm,
        color: theme_1.theme.colors.text.secondary,
        fontWeight: '600',
        lineHeight: '1.5',
    },
    value: {
        margin: '0',
        fontSize: theme_1.theme.fontSize.base,
        color: theme_1.theme.colors.text.primary,
        fontWeight: '700',
        lineHeight: '1.5',
    },
    totalLabel: {
        fontSize: theme_1.theme.fontSize.base,
        color: theme_1.theme.colors.text.primary,
        fontWeight: '700',
    },
    totalValue: {
        fontSize: theme_1.theme.fontSize.xl,
        color: theme_1.theme.colors.primary,
        fontWeight: '800',
    },
};
//# sourceMappingURL=InfoRow.js.map
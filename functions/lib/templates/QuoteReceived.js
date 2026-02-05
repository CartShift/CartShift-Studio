"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteReceived = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const theme_1 = require("../theme");
const QuoteReceived = ({ requestTitle, totalAmount, actionUrl, }) => {
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: "New Quote", preview: `You received a quote for ${requestTitle}`, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: styles.heading, children: "Quote Ready for Review" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.intro, children: ["We have prepared a quote for your request ", (0, jsx_runtime_1.jsx)("strong", { children: requestTitle }), "."] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.card, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.amountLabel, children: "TOTAL ESTIMATE" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.amount, children: totalAmount }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: styles.divider }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.note, children: "This quote includes all deliverables discussed. Please review and approve to proceed." })] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, variant: "primary", children: "Review & Approve" }) })] }));
};
exports.QuoteReceived = QuoteReceived;
const styles = {
    heading: {
        fontSize: theme_1.theme.fontSize.xxl,
        fontWeight: '700',
        textAlign: 'center',
        margin: '0 0 24px',
        color: theme_1.theme.colors.text.primary,
    },
    intro: {
        textAlign: 'center',
        fontSize: theme_1.theme.fontSize.base,
        color: theme_1.theme.colors.text.primary,
        marginBottom: '32px',
    },
    card: {
        backgroundColor: '#fff',
        border: `1px solid ${theme_1.theme.colors.border}`,
        borderRadius: theme_1.theme.borderRadius.lg,
        padding: '32px',
        textAlign: 'center',
        marginBottom: '32px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    },
    amountLabel: {
        fontSize: theme_1.theme.fontSize.sm,
        fontWeight: '600',
        color: theme_1.theme.colors.text.secondary,
        letterSpacing: '1px',
        marginBottom: '8px',
    },
    amount: {
        fontSize: '36px',
        fontWeight: '800',
        color: theme_1.theme.colors.primary,
        margin: '0 0 24px',
        letterSpacing: '-1px',
    },
    divider: {
        borderColor: theme_1.theme.colors.border,
        margin: '0 auto 16px',
        width: '40px',
    },
    note: {
        fontSize: theme_1.theme.fontSize.sm,
        color: theme_1.theme.colors.text.secondary,
        margin: '0',
        lineHeight: '1.5',
    },
    action: {
        textAlign: 'center',
    },
};
exports.default = exports.QuoteReceived;
//# sourceMappingURL=QuoteReceived.js.map
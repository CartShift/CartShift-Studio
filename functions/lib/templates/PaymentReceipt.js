"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentReceipt = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const InfoRow_1 = require("../components/InfoRow");
const theme_1 = require("../theme");
const PaymentReceipt = ({ requestTitle, totalAmount, paymentId, actionUrl, }) => {
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: "Payment Receipt", preview: `Receipt for ${requestTitle}`, children: [(0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.iconContainer, children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.icon, children: "\u2705" }) }), (0, jsx_runtime_1.jsx)(components_1.Heading, { style: styles.heading, children: "Payment Successful" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.intro, children: ["Thank you! We have received your payment for ", (0, jsx_runtime_1.jsx)("strong", { children: requestTitle }), "."] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.receipt, children: [(0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Amount Paid", value: totalAmount, isTotal: true }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Payment ID", value: paymentId }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Date", value: new Date().toLocaleDateString() }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: { borderColor: theme_1.theme.colors.border, margin: '16px 0' } }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.footer, children: "An invoice PDF has been generated and is available in your portal." })] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: "View Invoice" }) })] }));
};
exports.PaymentReceipt = PaymentReceipt;
const styles = {
    iconContainer: {
        textAlign: 'center',
        marginBottom: '16px',
    },
    icon: {
        fontSize: '48px',
        margin: '0',
    },
    heading: {
        fontSize: theme_1.theme.fontSize.xxl,
        fontWeight: '700',
        textAlign: 'center',
        margin: '0 0 16px',
        color: theme_1.theme.colors.text.primary,
    },
    intro: {
        textAlign: 'center',
        fontSize: theme_1.theme.fontSize.base,
        color: theme_1.theme.colors.text.secondary,
        marginBottom: '32px',
    },
    receipt: {
        backgroundColor: '#fff',
        border: `1px solid ${theme_1.theme.colors.border}`,
        borderRadius: theme_1.theme.borderRadius.md,
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    footer: {
        fontSize: theme_1.theme.fontSize.xs,
        color: theme_1.theme.colors.text.muted,
        fontStyle: 'italic',
        margin: '0',
    },
    action: {
        textAlign: 'center',
        marginBottom: '8px',
    },
};
exports.default = exports.PaymentReceipt;
//# sourceMappingURL=PaymentReceipt.js.map
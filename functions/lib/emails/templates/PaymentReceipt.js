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
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: "Payment Receipt", preview: `Receipt for ${requestTitle}`, children: [(0, jsx_runtime_1.jsx)(Layout_1.EmailHero, { eyebrow: "Payment confirmed", title: "Payment successful", description: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["Thank you. We received your payment for ", (0, jsx_runtime_1.jsx)("strong", { children: requestTitle }), "."] }) }), (0, jsx_runtime_1.jsxs)(Layout_1.SurfaceCard, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.receiptLabel, children: "Receipt summary" }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Amount Paid", value: totalAmount, isTotal: true }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Payment ID", value: paymentId }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Date", value: new Date().toLocaleDateString() }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: { borderColor: theme_1.theme.colors.border, margin: '16px 0' } }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.footer, children: "An invoice PDF has been generated and is available in your portal." })] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: "View Invoice" }) }), (0, jsx_runtime_1.jsx)(Layout_1.FinePrint, { children: "Keep this email for your records." })] }));
};
exports.PaymentReceipt = PaymentReceipt;
const styles = {
    receiptLabel: {
        color: theme_1.theme.colors.primary,
        fontSize: theme_1.theme.fontSize.xs,
        fontWeight: '700',
        letterSpacing: '1.4px',
        margin: '0 0 12px',
        textTransform: 'uppercase',
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
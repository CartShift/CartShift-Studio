"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilestoneCompleted = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const theme_1 = require("../theme");
const MilestoneCompleted = ({ requestTitle, milestoneTitle, actionUrl, }) => {
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: "Milestone Completed", preview: `Milestone "${milestoneTitle}" has been completed`, children: [(0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.iconContainer, children: (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.icon, children: "\uD83C\uDFAF" }) }), (0, jsx_runtime_1.jsx)(components_1.Heading, { style: styles.heading, children: "Milestone Reached!" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.intro, children: ["Progress update for ", (0, jsx_runtime_1.jsx)("strong", { children: requestTitle }), "."] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.card, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.label, children: "COMPLETED MILESTONE" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.milestoneTitle, children: milestoneTitle })] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.message, children: "We are making great progress on your project. You can view the updated timeline and details in the portal." }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: "View Progress" }) })] }));
};
exports.MilestoneCompleted = MilestoneCompleted;
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
    card: {
        backgroundColor: theme_1.theme.colors.success.bg,
        border: `1px solid ${theme_1.theme.colors.success.text}`,
        borderRadius: theme_1.theme.borderRadius.md,
        padding: '24px',
        textAlign: 'center',
        marginBottom: '32px',
    },
    label: {
        fontSize: theme_1.theme.fontSize.xs,
        fontWeight: '700',
        color: theme_1.theme.colors.success.text,
        letterSpacing: '1px',
        marginBottom: '8px',
    },
    milestoneTitle: {
        fontSize: theme_1.theme.fontSize.xl,
        fontWeight: '700',
        color: theme_1.theme.colors.success.text,
        margin: '0',
    },
    message: {
        textAlign: 'center',
        color: theme_1.theme.colors.text.primary,
        fontSize: theme_1.theme.fontSize.base,
        marginBottom: '32px',
        lineHeight: '1.6',
    },
    action: {
        textAlign: 'center',
    },
};
exports.default = exports.MilestoneCompleted;
//# sourceMappingURL=MilestoneCompleted.js.map
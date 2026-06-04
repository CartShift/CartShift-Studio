"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MilestoneCompleted = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const theme_1 = require("../theme");
const MilestoneCompleted = ({ requestTitle, milestoneTitle, actionUrl, }) => {
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: "Milestone Completed", preview: `Milestone "${milestoneTitle}" has been completed`, children: [(0, jsx_runtime_1.jsx)(Layout_1.EmailHero, { eyebrow: "Progress update", title: "Milestone completed", description: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: ["A key step is finished for ", (0, jsx_runtime_1.jsx)("strong", { children: requestTitle }), "."] }) }), (0, jsx_runtime_1.jsxs)(Layout_1.SurfaceCard, { tone: "success", align: "center", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.mark, children: "Done" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.label, children: "Completed milestone" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.milestoneTitle, children: milestoneTitle })] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.message, children: "The timeline has been updated with the latest progress, deliverables, and next steps." }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: "View Progress" }) })] }));
};
exports.MilestoneCompleted = MilestoneCompleted;
const styles = {
    mark: {
        backgroundColor: theme_1.theme.colors.success.bg,
        border: `1px solid ${theme_1.theme.colors.success.border}`,
        borderRadius: theme_1.theme.borderRadius.full,
        color: theme_1.theme.colors.success.text,
        display: 'inline-block',
        fontSize: theme_1.theme.fontSize.xs,
        fontWeight: '700',
        letterSpacing: '1.2px',
        margin: '0 0 18px',
        padding: '8px 16px',
        textTransform: 'uppercase',
    },
    label: {
        fontSize: theme_1.theme.fontSize.xs,
        fontWeight: '700',
        color: theme_1.theme.colors.success.text,
        letterSpacing: '1px',
        margin: '0 0 8px',
        textTransform: 'uppercase',
    },
    milestoneTitle: {
        fontSize: theme_1.theme.fontSize.xl,
        fontWeight: '700',
        color: theme_1.theme.colors.success.text,
        margin: '0',
    },
    message: {
        textAlign: 'center',
        color: theme_1.theme.colors.text.secondary,
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
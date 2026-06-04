"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusUpdate = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const StatusBadge_1 = require("../components/StatusBadge");
const theme_1 = require("../theme");
const StatusUpdate = ({ requestTitle, statusLabel, actionUrl }) => {
    // Map label to visual type
    const getStatusType = (label) => {
        const l = label.toLowerCase();
        if (l.includes('progress'))
            return 'info';
        if (l.includes('review'))
            return 'warning';
        if (l.includes('delivered') || l.includes('paid'))
            return 'success';
        if (l.includes('closed'))
            return 'neutral';
        return 'neutral';
    };
    const statusType = getStatusType(statusLabel);
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: `Status Update: ${requestTitle}`, preview: `Your request is now ${statusLabel}`, children: [(0, jsx_runtime_1.jsx)(Layout_1.EmailHero, { eyebrow: "Project status", title: "Your request has moved forward", description: "A status change was posted in the portal. The latest comments, files, and next steps are available there." }), (0, jsx_runtime_1.jsxs)(Layout_1.SurfaceCard, { tone: "info", align: "center", children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.subheading, children: "Your request" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.title, children: requestTitle }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.connector, children: "Updated to" }), (0, jsx_runtime_1.jsx)(StatusBadge_1.StatusBadge, { type: statusType, children: statusLabel })] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.message, children: "Open the request to review what changed and keep the work moving with the team." }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: "View Request" }) })] }));
};
exports.StatusUpdate = StatusUpdate;
const styles = {
    subheading: {
        margin: '0 0 8px',
        color: theme_1.theme.colors.text.secondary,
        fontSize: theme_1.theme.fontSize.sm,
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    title: {
        margin: '0 0 16px',
        fontSize: theme_1.theme.fontSize.xl,
        fontWeight: '700',
        color: theme_1.theme.colors.text.primary,
    },
    connector: {
        display: 'block',
        fontSize: theme_1.theme.fontSize.xs,
        color: theme_1.theme.colors.primary,
        fontWeight: '700',
        letterSpacing: '1px',
        margin: '0 0 12px',
        textTransform: 'uppercase',
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
exports.default = exports.StatusUpdate;
//# sourceMappingURL=StatusUpdate.js.map
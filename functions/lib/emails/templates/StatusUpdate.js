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
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: `Status Update: ${requestTitle}`, preview: `Your request is now ${statusLabel}`, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: styles.heading, children: "Status Information" }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.statusContainer, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.subheading, children: "Your request:" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.title, children: requestTitle }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.arrow, children: "\u2193" }), (0, jsx_runtime_1.jsx)(StatusBadge_1.StatusBadge, { type: statusType, children: statusLabel })] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.message, children: "The status of your request has been updated. You can view the details and any new comments in the portal." }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: "View Request" }) })] }));
};
exports.StatusUpdate = StatusUpdate;
const styles = {
    heading: {
        fontSize: theme_1.theme.fontSize.xxl,
        fontWeight: '700',
        textAlign: 'center',
        margin: '0 0 32px',
        color: theme_1.theme.colors.text.primary,
    },
    statusContainer: {
        backgroundColor: '#fff',
        border: `1px dashed ${theme_1.theme.colors.border}`,
        borderRadius: theme_1.theme.borderRadius.lg,
        padding: '32px',
        textAlign: 'center',
        marginBottom: '32px',
    },
    subheading: {
        margin: '0 0 8px',
        color: theme_1.theme.colors.text.secondary,
        fontSize: theme_1.theme.fontSize.sm,
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    title: {
        margin: '0 0 16px',
        fontSize: theme_1.theme.fontSize.lg,
        fontWeight: '600',
        color: theme_1.theme.colors.text.primary,
    },
    arrow: {
        display: 'block',
        fontSize: '24px',
        color: theme_1.theme.colors.text.muted,
        marginBottom: '16px',
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
exports.default = exports.StatusUpdate;
//# sourceMappingURL=StatusUpdate.js.map
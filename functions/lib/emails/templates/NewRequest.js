"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewRequest = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const StatusBadge_1 = require("../components/StatusBadge");
const InfoRow_1 = require("../components/InfoRow");
const theme_1 = require("../theme");
const NewRequest = ({ clientName, organizationName, requestTitle, requestDescription, requestType, requestPriority, actionUrl, requestId, }) => {
    const priorityType = requestPriority.toLowerCase() === 'urgent' || requestPriority.toLowerCase() === 'high'
        ? 'error'
        : requestPriority.toLowerCase() === 'low'
            ? 'info'
            : 'warning';
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: `New Request: ${requestTitle}`, preview: `New request from ${organizationName}`, children: [(0, jsx_runtime_1.jsx)(Layout_1.EmailHero, { eyebrow: "Agency action required", title: "New request received", description: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("strong", { children: clientName }), " from ", (0, jsx_runtime_1.jsx)("strong", { children: organizationName }), " submitted a new request for review."] }) }), (0, jsx_runtime_1.jsxs)(Layout_1.SurfaceCard, { children: [(0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Title", value: requestTitle }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Type", value: requestType }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: "Priority", value: (0, jsx_runtime_1.jsx)(StatusBadge_1.StatusBadge, { type: priorityType, children: requestPriority }) }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: { borderColor: theme_1.theme.colors.border, margin: '12px 0' } }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.label, children: "Description" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.description, children: ["\"", requestDescription, "\""] })] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: "View Request in Portal" }) }), (0, jsx_runtime_1.jsxs)(Layout_1.FinePrint, { children: ["Request ID: ", requestId] })] }));
};
exports.NewRequest = NewRequest;
const styles = {
    label: {
        fontSize: theme_1.theme.fontSize.sm,
        color: theme_1.theme.colors.text.secondary,
        fontWeight: '700',
        letterSpacing: '0.5px',
        margin: '0 0 8px',
    },
    description: {
        fontSize: theme_1.theme.fontSize.base,
        color: theme_1.theme.colors.text.primary,
        fontStyle: 'italic',
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
    },
    action: {
        textAlign: 'center',
        marginBottom: '24px',
    },
};
exports.default = exports.NewRequest;
//# sourceMappingURL=NewRequest.js.map
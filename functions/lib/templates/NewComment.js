"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewComment = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const theme_1 = require("../theme");
const NewComment = ({ userName, requestTitle, commentText, actionUrl, }) => {
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: "New Message", preview: `${userName} sent a message regarding ${requestTitle}`, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: styles.heading, children: "New Message" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.intro, children: [(0, jsx_runtime_1.jsx)("strong", { children: userName }), " left a comment on ", (0, jsx_runtime_1.jsx)("strong", { children: requestTitle }), "."] }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.commentBox, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.commentLabel, children: "MESSAGE:" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.commentText, children: ["\"", commentText, "\""] })] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, variant: "secondary", children: "Reply in Portal" }) })] }));
};
exports.NewComment = NewComment;
const styles = {
    heading: {
        fontSize: theme_1.theme.fontSize.xl,
        fontWeight: '700',
        textAlign: 'center',
        margin: '0 0 24px',
        color: theme_1.theme.colors.text.primary,
    },
    intro: {
        textAlign: 'center',
        fontSize: theme_1.theme.fontSize.base,
        color: theme_1.theme.colors.text.primary,
        marginBottom: '24px',
    },
    commentBox: {
        backgroundColor: '#fff',
        borderLeft: `4px solid ${theme_1.theme.colors.primary}`,
        borderTop: `1px solid ${theme_1.theme.colors.border}`,
        borderRight: `1px solid ${theme_1.theme.colors.border}`,
        borderBottom: `1px solid ${theme_1.theme.colors.border}`,
        borderRadius: '4px',
        padding: '24px',
        marginBottom: '32px',
    },
    commentLabel: {
        fontSize: theme_1.theme.fontSize.xs,
        fontWeight: '700',
        color: theme_1.theme.colors.text.muted,
        letterSpacing: '1px',
        marginBottom: '8px',
    },
    commentText: {
        fontSize: theme_1.theme.fontSize.base,
        color: theme_1.theme.colors.text.primary,
        fontStyle: 'italic',
        lineHeight: '1.6',
        margin: '0',
        whiteSpace: 'pre-wrap',
    },
    action: {
        textAlign: 'center',
    },
};
exports.default = exports.NewComment;
//# sourceMappingURL=NewComment.js.map
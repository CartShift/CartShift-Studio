"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewComment = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const theme_1 = require("../theme");
const NewComment = ({ userName, requestTitle, commentText, actionUrl }) => {
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: "New Message", preview: `${userName} sent a message regarding ${requestTitle}`, children: [(0, jsx_runtime_1.jsx)(Layout_1.EmailHero, { eyebrow: "New portal message", title: "You have a new message", description: (0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("strong", { children: userName }), " left a comment on ", (0, jsx_runtime_1.jsx)("strong", { children: requestTitle }), "."] }) }), (0, jsx_runtime_1.jsxs)(Layout_1.SurfaceCard, { children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.commentLabel, children: "Message" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.commentText, children: ["\"", commentText, "\""] })] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: "Reply in Portal" }) })] }));
};
exports.NewComment = NewComment;
const styles = {
    commentLabel: {
        fontSize: theme_1.theme.fontSize.xs,
        fontWeight: '700',
        color: theme_1.theme.colors.primary,
        letterSpacing: '1.4px',
        margin: '0 0 10px',
        textTransform: 'uppercase',
    },
    commentText: {
        borderLeft: `3px solid ${theme_1.theme.colors.primary}`,
        fontSize: theme_1.theme.fontSize.lg,
        color: theme_1.theme.colors.text.primary,
        fontStyle: 'italic',
        lineHeight: '1.7',
        margin: '0',
        paddingLeft: '16px',
        whiteSpace: 'pre-wrap',
    },
    action: {
        textAlign: 'center',
    },
};
exports.default = exports.NewComment;
//# sourceMappingURL=NewComment.js.map
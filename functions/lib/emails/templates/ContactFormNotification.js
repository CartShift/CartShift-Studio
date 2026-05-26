"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContactFormNotification = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const InfoRow_1 = require("../components/InfoRow");
const theme_1 = require("../theme");
const ContactFormNotification = ({ name, email, company, projectType, message, locale, leadsUrl, }) => {
    const isHe = locale === 'he';
    const title = isHe ? 'פנייה חדשה מהאתר' : 'New website inquiry';
    const intro = isHe
        ? 'התקבלה פנייה חדשה מטופס יצירת הקשר.'
        : 'A new high-intent inquiry was submitted via the contact form.';
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { title: title, preview: `${name} — ${projectType || 'inquiry'}`, children: [(0, jsx_runtime_1.jsx)(components_1.Heading, { style: styles.heading, children: title }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.intro, children: intro }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.card, children: [(0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'שם' : 'Name', value: name }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'אימייל' : 'Email', value: email }), company ? (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'חברה' : 'Company', value: company }) : null, projectType ? ((0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'סוג פרויקט' : 'Project type', value: projectType })) : null, (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'שפה' : 'Locale', value: locale.toUpperCase() }), message ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(components_1.Hr, { style: { borderColor: theme_1.theme.colors.border, margin: '12px 0' } }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.label, children: isHe ? 'הודעה:' : 'Message:' }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.description, children: message })] })) : null] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: leadsUrl, children: isHe ? 'פתיחת ליד במערכת' : 'View in leads dashboard' }) }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.replyHint, children: isHe
                    ? `השיבו ישירות ל-${email} כדי להגיב במהירות.`
                    : `Reply directly to ${email} for a fast response.` })] }));
};
exports.ContactFormNotification = ContactFormNotification;
const styles = {
    heading: {
        fontSize: theme_1.theme.fontSize.xxl,
        fontWeight: '700',
        textAlign: 'center',
        margin: '0 0 24px',
        color: theme_1.theme.colors.text.primary,
    },
    intro: {
        fontSize: theme_1.theme.fontSize.base,
        lineHeight: '1.6',
        color: theme_1.theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: '32px',
    },
    card: {
        backgroundColor: '#f8fafc',
        padding: '24px',
        borderRadius: theme_1.theme.borderRadius.md,
        marginBottom: '32px',
        border: `1px solid ${theme_1.theme.colors.border}`,
    },
    label: {
        fontSize: theme_1.theme.fontSize.sm,
        color: theme_1.theme.colors.text.secondary,
        fontWeight: '600',
        marginBottom: '8px',
    },
    description: {
        fontSize: theme_1.theme.fontSize.base,
        color: theme_1.theme.colors.text.primary,
        lineHeight: '1.6',
        whiteSpace: 'pre-wrap',
        margin: 0,
    },
    action: {
        textAlign: 'center',
        marginBottom: '24px',
    },
    replyHint: {
        textAlign: 'center',
        color: theme_1.theme.colors.text.muted,
        fontSize: theme_1.theme.fontSize.sm,
    },
};
exports.default = exports.ContactFormNotification;
//# sourceMappingURL=ContactFormNotification.js.map
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
    const activeLocale = isHe ? 'he' : 'en';
    const align = isHe ? 'right' : 'left';
    const valueAlign = isHe ? 'left' : 'right';
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { locale: activeLocale, title: title, preview: `${name} — ${projectType || 'inquiry'}`, children: [(0, jsx_runtime_1.jsx)(Layout_1.EmailHero, { eyebrow: isHe ? 'ליד חדש' : 'New lead', title: title, description: intro, align: align }), (0, jsx_runtime_1.jsxs)(Layout_1.SurfaceCard, { align: align, children: [(0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'שם' : 'Name', value: name, valueAlign: valueAlign }), (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'אימייל' : 'Email', value: email, valueAlign: valueAlign }), company ? ((0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'חברה' : 'Company', value: company, valueAlign: valueAlign })) : null, projectType ? ((0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'סוג פרויקט' : 'Project type', value: projectType, valueAlign: valueAlign })) : null, (0, jsx_runtime_1.jsx)(InfoRow_1.InfoRow, { label: isHe ? 'שפה' : 'Locale', value: locale.toUpperCase(), valueAlign: valueAlign }), message ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(components_1.Hr, { style: { borderColor: theme_1.theme.colors.border, margin: '12px 0' } }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.label, textAlign: align }, children: isHe ? 'הודעה' : 'Message' }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.description, textAlign: align }, children: message })] })) : null] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: leadsUrl, children: isHe ? 'פתיחת ליד במערכת' : 'View in leads dashboard' }) }), (0, jsx_runtime_1.jsx)(Layout_1.FinePrint, { children: isHe
                    ? `השיבו ישירות ל-${email} כדי להגיב במהירות.`
                    : `Reply directly to ${email} for a fast response.` })] }));
};
exports.ContactFormNotification = ContactFormNotification;
const styles = {
    label: {
        fontSize: theme_1.theme.fontSize.sm,
        color: theme_1.theme.colors.text.secondary,
        fontWeight: '700',
        margin: '0 0 8px',
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
};
exports.default = exports.ContactFormNotification;
//# sourceMappingURL=ContactFormNotification.js.map
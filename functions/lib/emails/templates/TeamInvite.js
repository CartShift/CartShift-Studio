"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamInvite = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const theme_1 = require("../theme");
const copy = {
    en: {
        title: 'You are invited to CartShift Studio',
        preview: (organizationName) => `Join ${organizationName} on CartShift Studio`,
        intro: (inviterName, organizationName) => `${inviterName} invited you to join ${organizationName} on CartShift Studio.`,
        expiry: 'This invitation expires in 7 days.',
        body: 'Accept the invitation to access the client portal, requests, files, proposals, and project updates.',
        action: 'Accept invitation',
        safety: 'If you were not expecting this invitation, you can safely ignore this email.',
        orgLabel: 'Organization ID',
    },
    he: {
        title: 'הוזמנתם ל-CartShift Studio',
        preview: (organizationName) => `הצטרפות אל ${organizationName} ב-CartShift Studio`,
        intro: (inviterName, organizationName) => `${inviterName} הזמין/ה אתכם להצטרף אל ${organizationName} ב-CartShift Studio.`,
        expiry: 'ההזמנה זמינה למשך 7 ימים.',
        body: 'אשרו את ההזמנה כדי להיכנס לפורטל הלקוחות, בקשות, קבצים, הצעות מחיר ועדכוני פרויקט.',
        action: 'אישור ההזמנה',
        safety: 'אם לא ציפיתם להזמנה הזו, אפשר להתעלם מהאימייל בבטחה.',
        orgLabel: 'מזהה ארגון',
    },
};
const TeamInvite = ({ inviterName = 'A team member', organizationName, actionUrl, orgId, locale = 'en', }) => {
    const activeLocale = locale === 'he' ? 'he' : 'en';
    const isRtl = activeLocale === 'he';
    const text = copy[activeLocale];
    const align = isRtl ? 'right' : 'left';
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { locale: activeLocale, title: text.title, preview: text.preview(organizationName), children: [(0, jsx_runtime_1.jsx)(Layout_1.EmailHero, { eyebrow: isRtl ? 'הזמנה לפורטל' : 'Portal invitation', title: text.title, description: text.intro(inviterName, organizationName), align: align }), (0, jsx_runtime_1.jsxs)(Layout_1.SurfaceCard, { tone: "info", align: align, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.organizationLabel, textAlign: align }, children: isRtl ? 'ארגון' : 'Organization' }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.organizationName, textAlign: align }, children: organizationName }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.noticeText, textAlign: align }, children: text.expiry })] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.body, textAlign: align }, children: text.body }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: text.action }) }), orgId ? ((0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.meta, children: [text.orgLabel, ": ", orgId] })) : null, (0, jsx_runtime_1.jsx)(Layout_1.FinePrint, { align: align, children: text.safety })] }));
};
exports.TeamInvite = TeamInvite;
const styles = {
    organizationLabel: {
        color: theme_1.theme.colors.primary,
        fontSize: theme_1.theme.fontSize.xs,
        fontWeight: '700',
        letterSpacing: '1.4px',
        margin: '0 0 8px',
        textTransform: 'uppercase',
    },
    organizationName: {
        color: theme_1.theme.colors.text.primary,
        fontSize: theme_1.theme.fontSize.xl,
        fontWeight: '700',
        lineHeight: '1.35',
        margin: '0 0 14px',
    },
    noticeText: {
        color: theme_1.theme.colors.info.text,
        fontSize: theme_1.theme.fontSize.sm,
        fontWeight: '700',
        lineHeight: '1.6',
        margin: '0',
    },
    body: {
        color: theme_1.theme.colors.text.secondary,
        fontSize: theme_1.theme.fontSize.base,
        lineHeight: '1.7',
        margin: '0 0 28px',
    },
    action: {
        margin: '0 0 24px',
        textAlign: 'center',
    },
    meta: {
        color: theme_1.theme.colors.text.muted,
        fontSize: theme_1.theme.fontSize.xs,
        lineHeight: '1.5',
        margin: '0 0 18px',
        textAlign: 'center',
    },
};
exports.default = exports.TeamInvite;
//# sourceMappingURL=TeamInvite.js.map
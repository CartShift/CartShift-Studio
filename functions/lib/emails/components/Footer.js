"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const Footer = ({ locale = 'en' }) => {
    const currentYear = new Date().getFullYear();
    const isRtl = locale === 'he';
    return ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.footer, children: [(0, jsx_runtime_1.jsx)(components_1.Hr, { style: styles.divider }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.brand, children: "CartShift Studio" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.text, children: ["\u00A9 ", currentYear, " CartShift Studio.", ' ', isRtl ? 'כל הזכויות שמורות.' : 'All rights reserved.'] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.subText, children: isRtl ? 'פיתוח, עיצוב וצמיחה למסחר דיגיטלי' : 'E-commerce development, design and growth' }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.utilityLinks, children: [(0, jsx_runtime_1.jsx)(components_1.Link, { href: "https://cart-shift.com", style: styles.link, children: isRtl ? 'אתר' : 'Website' }), ' ', "\u2022", ' ', (0, jsx_runtime_1.jsx)(components_1.Link, { href: "https://portal.cart-shift.com", style: styles.link, children: isRtl ? 'פורטל לקוחות' : 'Client portal' }), ' ', "\u2022", ' ', (0, jsx_runtime_1.jsx)(components_1.Link, { href: "mailto:hello@cart-shift.com", style: styles.link, children: isRtl ? 'יצירת קשר' : 'Contact' })] })] }));
};
exports.Footer = Footer;
const styles = {
    footer: {
        padding: `${theme_1.theme.spacing.s8} ${theme_1.theme.spacing.s10}`,
        backgroundColor: theme_1.theme.colors.navy,
        textAlign: 'center',
    },
    divider: {
        borderColor: '#20314a',
        margin: `0 0 ${theme_1.theme.spacing.s6}`,
    },
    brand: {
        color: theme_1.theme.colors.text.inverse,
        fontSize: theme_1.theme.fontSize.sm,
        fontWeight: '700',
        letterSpacing: '1.6px',
        margin: '0 0 10px',
    },
    text: {
        fontSize: theme_1.theme.fontSize.xs,
        color: theme_1.theme.colors.text.inverseMuted,
        margin: '0 0 4px',
        lineHeight: '1.5',
    },
    subText: {
        fontSize: theme_1.theme.fontSize.xs,
        color: '#8798ad',
        margin: '0 0 16px',
    },
    utilityLinks: {
        fontSize: theme_1.theme.fontSize.xs,
        color: '#8798ad',
    },
    link: {
        color: theme_1.theme.colors.cyan,
        textDecoration: 'none',
    },
};
//# sourceMappingURL=Footer.js.map
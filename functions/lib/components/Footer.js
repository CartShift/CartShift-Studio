"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Footer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const Footer = () => {
    const currentYear = new Date().getFullYear();
    return ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.footer, children: [(0, jsx_runtime_1.jsx)(components_1.Hr, { style: styles.divider }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.text, children: ["\u00A9 ", currentYear, " CartShift Studio. All rights reserved."] }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.subText, children: "Premium E-commerce Development & Design" }), (0, jsx_runtime_1.jsxs)(components_1.Text, { style: styles.utilityLinks, children: [(0, jsx_runtime_1.jsx)(components_1.Link, { href: "https://cart-shift.com", style: styles.link, children: "Website" }), " \u2022", ' ', (0, jsx_runtime_1.jsx)(components_1.Link, { href: "https://portal.cart-shift.com", style: styles.link, children: "Client Portal" }), " \u2022", ' ', (0, jsx_runtime_1.jsx)(components_1.Link, { href: "mailto:hello@cart-shift.com", style: styles.link, children: "Contact Support" })] })] }));
};
exports.Footer = Footer;
const styles = {
    footer: {
        padding: `${theme_1.theme.spacing.s6} ${theme_1.theme.spacing.s10}`,
        backgroundColor: '#f1f5f9',
        textAlign: 'center',
    },
    divider: {
        borderColor: '#e2e8f0',
        margin: `0 0 ${theme_1.theme.spacing.s6} 0`,
    },
    text: {
        fontSize: theme_1.theme.fontSize.xs,
        color: theme_1.theme.colors.text.secondary,
        margin: '0 0 4px',
        lineHeight: '1.5',
    },
    subText: {
        fontSize: theme_1.theme.fontSize.xs,
        color: theme_1.theme.colors.text.muted,
        margin: '0 0 16px',
        fontStyle: 'italic',
    },
    utilityLinks: {
        fontSize: theme_1.theme.fontSize.xs,
        color: theme_1.theme.colors.text.muted,
    },
    link: {
        color: theme_1.theme.colors.text.secondary,
        textDecoration: 'none',
    },
};
//# sourceMappingURL=Footer.js.map
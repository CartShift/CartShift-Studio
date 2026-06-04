"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinePrint = exports.SurfaceCard = exports.EmailHero = exports.Layout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const Footer_1 = require("./Footer");
const Layout = ({ children, preview, title = 'CartShift Studio', locale = 'en', }) => {
    const isRtl = locale === 'he';
    return ((0, jsx_runtime_1.jsxs)(components_1.Html, { lang: locale, dir: isRtl ? 'rtl' : 'ltr', children: [(0, jsx_runtime_1.jsxs)(components_1.Head, { children: [(0, jsx_runtime_1.jsx)("title", { children: title }), (0, jsx_runtime_1.jsx)(components_1.Font, { fontFamily: "Rubik", fallbackFontFamily: ['Arial', 'Helvetica', 'sans-serif'], webFont: {
                            url: 'https://portal.cart-shift.com/fonts/Rubik-Regular.ttf',
                            format: 'truetype',
                        }, fontWeight: 400, fontStyle: "normal" }), (0, jsx_runtime_1.jsx)(components_1.Font, { fontFamily: "Rubik", fallbackFontFamily: ['Arial', 'Helvetica', 'sans-serif'], webFont: {
                            url: 'https://portal.cart-shift.com/fonts/Rubik-Bold.ttf',
                            format: 'truetype',
                        }, fontWeight: 700, fontStyle: "normal" })] }), preview && (0, jsx_runtime_1.jsx)(components_1.Preview, { children: preview }), (0, jsx_runtime_1.jsx)(components_1.Body, { style: styles.body, children: (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.outer, children: (0, jsx_runtime_1.jsxs)(components_1.Container, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.topAccent }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.wordmark, children: "CARTSHIFT" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.studio, children: "STUDIO" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.headerLine, children: isRtl ? 'מסחר דיגיטלי. בנוי נכון.' : 'Digital commerce, built with intent.' })] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.content, children: children }), (0, jsx_runtime_1.jsx)(Footer_1.Footer, { locale: locale })] }) }) })] }));
};
exports.Layout = Layout;
const EmailHero = ({ eyebrow, title, description, align = 'center', }) => {
    return ((0, jsx_runtime_1.jsxs)(components_1.Section, { style: { ...styles.hero, textAlign: align }, children: [eyebrow ? (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.heroEyebrow, children: eyebrow }) : null, (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.heroTitle, textAlign: align }, children: title }), description ? ((0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.heroDescription, textAlign: align }, children: description })) : null] }));
};
exports.EmailHero = EmailHero;
const SurfaceCard = ({ children, tone = 'default', align = 'left', }) => {
    const toneStyle = cardTones[tone] || cardTones.default;
    return ((0, jsx_runtime_1.jsx)(components_1.Section, { style: { ...styles.surfaceCard, ...toneStyle, textAlign: align }, children: children }));
};
exports.SurfaceCard = SurfaceCard;
const FinePrint = ({ children, align = 'center', }) => {
    return (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.finePrint, textAlign: align }, children: children });
};
exports.FinePrint = FinePrint;
const cardTones = {
    default: {
        backgroundColor: theme_1.theme.colors.surfaceRaised,
        borderColor: theme_1.theme.colors.border,
    },
    info: {
        backgroundColor: theme_1.theme.colors.info.soft,
        borderColor: theme_1.theme.colors.info.border,
    },
    success: {
        backgroundColor: theme_1.theme.colors.success.soft,
        borderColor: theme_1.theme.colors.success.border,
    },
    warning: {
        backgroundColor: theme_1.theme.colors.warning.soft,
        borderColor: theme_1.theme.colors.warning.border,
    },
    error: {
        backgroundColor: theme_1.theme.colors.error.soft,
        borderColor: theme_1.theme.colors.error.border,
    },
    dark: {
        backgroundColor: theme_1.theme.colors.navyMuted,
        borderColor: '#263a56',
    },
};
const styles = {
    body: {
        backgroundColor: theme_1.theme.colors.background,
        margin: '0',
        padding: '0',
        fontFamily: theme_1.theme.fontFamily.sans,
    },
    outer: {
        padding: '32px 12px',
    },
    container: {
        backgroundColor: theme_1.theme.colors.surface,
        margin: '0 auto',
        padding: '0',
        borderRadius: '22px',
        boxShadow: theme_1.theme.shadows.card,
        maxWidth: '640px',
        overflow: 'hidden',
        border: `1px solid ${theme_1.theme.colors.border}`,
    },
    topAccent: {
        backgroundColor: theme_1.theme.colors.cyan,
        height: '5px',
        lineHeight: '5px',
    },
    header: {
        backgroundColor: theme_1.theme.colors.navy,
        padding: '34px 40px 30px',
        textAlign: 'center',
    },
    wordmark: {
        color: theme_1.theme.colors.text.inverse,
        fontSize: '25px',
        fontWeight: '700',
        letterSpacing: '5px',
        lineHeight: '1',
        margin: '0',
    },
    studio: {
        color: theme_1.theme.colors.cyan,
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '8px',
        lineHeight: '1',
        margin: '8px 0 0',
    },
    headerLine: {
        color: theme_1.theme.colors.text.inverseMuted,
        fontSize: theme_1.theme.fontSize.sm,
        lineHeight: '1.6',
        margin: '18px 0 0',
    },
    content: {
        padding: '42px 42px 36px',
    },
    hero: {
        margin: '0 0 30px',
    },
    heroEyebrow: {
        color: theme_1.theme.colors.primary,
        fontSize: theme_1.theme.fontSize.xs,
        fontWeight: '700',
        letterSpacing: '1.6px',
        lineHeight: '1.4',
        margin: '0 0 10px',
        textTransform: 'uppercase',
    },
    heroTitle: {
        color: theme_1.theme.colors.text.primary,
        fontSize: theme_1.theme.fontSize.display,
        fontWeight: '700',
        lineHeight: '1.18',
        letterSpacing: '0',
        margin: '0',
    },
    heroDescription: {
        color: theme_1.theme.colors.text.secondary,
        fontSize: theme_1.theme.fontSize.base,
        lineHeight: '1.75',
        margin: '16px 0 0',
    },
    surfaceCard: {
        border: `1px solid ${theme_1.theme.colors.border}`,
        borderRadius: theme_1.theme.borderRadius.xl,
        margin: '0 0 28px',
        padding: '24px',
        boxShadow: theme_1.theme.shadows.soft,
    },
    finePrint: {
        color: theme_1.theme.colors.text.muted,
        fontSize: theme_1.theme.fontSize.xs,
        lineHeight: '1.7',
        margin: '18px 0 0',
    },
};
//# sourceMappingURL=Layout.js.map
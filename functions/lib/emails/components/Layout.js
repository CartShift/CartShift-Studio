"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Layout = void 0;
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
                        }, fontWeight: 700, fontStyle: "normal" })] }), preview && (0, jsx_runtime_1.jsx)(components_1.Preview, { children: preview }), (0, jsx_runtime_1.jsx)(components_1.Body, { style: styles.body, children: (0, jsx_runtime_1.jsxs)(components_1.Container, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.wordmark, children: "CARTSHIFT" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.studio, children: "STUDIO" }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.headerLine, children: isRtl ? 'מסחר דיגיטלי. בנוי נכון.' : 'Digital commerce, built with intent.' })] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.content, children: children }), (0, jsx_runtime_1.jsx)(Footer_1.Footer, { locale: locale })] }) })] }));
};
exports.Layout = Layout;
const styles = {
    body: {
        backgroundColor: '#f3f6fb',
        margin: '0',
        fontFamily: theme_1.theme.fontFamily.sans,
    },
    container: {
        backgroundColor: theme_1.theme.colors.surface,
        margin: '32px auto',
        padding: '0',
        borderRadius: '18px',
        boxShadow: '0 14px 40px rgba(15, 23, 42, 0.10)',
        maxWidth: '600px',
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#102a43',
        padding: '28px 40px 24px',
        textAlign: 'center',
    },
    wordmark: {
        color: '#ffffff',
        fontSize: '24px',
        fontWeight: '700',
        letterSpacing: '5px',
        lineHeight: '1',
        margin: '0',
    },
    studio: {
        color: '#7dd3fc',
        fontSize: '10px',
        fontWeight: '700',
        letterSpacing: '8px',
        lineHeight: '1',
        margin: '8px 0 0',
    },
    headerLine: {
        color: '#cbd5e1',
        fontSize: '12px',
        lineHeight: '1.5',
        margin: '16px 0 0',
    },
    content: {
        padding: '38px 40px 34px',
    },
};
//# sourceMappingURL=Layout.js.map
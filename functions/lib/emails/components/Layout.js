"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Layout = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const theme_1 = require("../theme");
const Footer_1 = require("./Footer");
const Layout = ({ children, preview, title = 'CartShift Studio' }) => {
    return ((0, jsx_runtime_1.jsxs)(components_1.Html, { children: [(0, jsx_runtime_1.jsxs)(components_1.Head, { children: [(0, jsx_runtime_1.jsx)("title", { children: title }), (0, jsx_runtime_1.jsx)(components_1.Font, { fontFamily: "Roboto", fallbackFontFamily: "Helvetica", webFont: {
                            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Mu4mxKKTU1Kg.woff2',
                            format: 'woff2',
                        }, fontWeight: 400, fontStyle: "normal" }), (0, jsx_runtime_1.jsx)(components_1.Font, { fontFamily: "Roboto", fallbackFontFamily: "Helvetica", webFont: {
                            url: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.woff2',
                            format: 'woff2',
                        }, fontWeight: 700, fontStyle: "normal" })] }), preview && (0, jsx_runtime_1.jsx)(components_1.Preview, { children: preview }), (0, jsx_runtime_1.jsx)(components_1.Body, { style: styles.body, children: (0, jsx_runtime_1.jsxs)(components_1.Container, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.header, children: (0, jsx_runtime_1.jsx)(components_1.Img, { src: "https://cart-shift.com/assets/logo-email.png" // Ensure this asset exists or use a robust URL
                                , alt: "CartShift Studio", width: "150", style: styles.logo }) }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.content, children: children }), (0, jsx_runtime_1.jsx)(Footer_1.Footer, {})] }) })] }));
};
exports.Layout = Layout;
const styles = {
    body: {
        backgroundColor: theme_1.theme.colors.background,
        margin: '0',
        fontFamily: theme_1.theme.fontFamily.sans,
    },
    container: {
        backgroundColor: theme_1.theme.colors.surface,
        margin: '40px auto',
        padding: '0',
        borderRadius: theme_1.theme.borderRadius.lg,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxWidth: '600px',
        overflow: 'hidden',
    },
    header: {
        backgroundColor: theme_1.theme.colors.primary,
        padding: `${theme_1.theme.spacing.s8} 0`,
        textAlign: 'center',
    },
    logo: {
        margin: '0 auto',
        display: 'block',
        // Fallback for missing image - maybe use text if image fails
    },
    content: {
        padding: theme_1.theme.spacing.s10,
    },
};
//# sourceMappingURL=Layout.js.map
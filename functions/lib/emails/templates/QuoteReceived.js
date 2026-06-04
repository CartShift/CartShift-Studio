"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuoteReceived = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const components_1 = require("@react-email/components");
const Layout_1 = require("../components/Layout");
const Button_1 = require("../components/Button");
const copy = {
    he: {
        title: 'הצעת המחיר שלך מוכנה',
        preview: (requestTitle) => `הצעת המחיר עבור ${requestTitle} מוכנה לצפייה`,
        eyebrow: 'הצעה מותאמת עבורך',
        greeting: (clientName) => (clientName ? `היי ${clientName},` : 'היי,'),
        intro: (requestTitle) => `ריכזנו עבורך הצעה מסודרת עבור ${requestTitle}, כדי שיהיה קל לעבור על הפרטים ולהחליט בנחת על הצעד הבא.`,
        amountLabel: 'סך ההצעה',
        amountNote: 'הפירוט המלא, תנאי ההצעה והשלבים הבאים מחכים לך בקישור.',
        summaryTitle: 'מה מחכה לך בהצעה?',
        highlights: [
            'פירוט ברור של העבודה והעלויות',
            'תמונה מסודרת של התהליך והשלבים הבאים',
            'אפשרות לעבור על הכל בקצב שלך ולשלוח שאלות',
        ],
        validUntil: (date) => `ההצעה זמינה לעיון עד ${date}`,
        timeframe: (value) => `זמן עבודה משוער: ${value}`,
        action: 'לצפייה בהצעה',
        reassurance: 'פתיחת ההצעה אינה מחייבת. אם תרצו לדייק משהו, נשמח לעבור עליו יחד.',
        closing: 'אנחנו כאן לכל שאלה או התאמה. אפשר פשוט להשיב למייל הזה.',
        signature: 'בברכה,\nצוות CartShift Studio',
    },
    en: {
        title: 'Your proposal is ready',
        preview: (requestTitle) => `Your proposal for ${requestTitle} is ready to view`,
        eyebrow: 'Prepared for you',
        greeting: (clientName) => (clientName ? `Hi ${clientName},` : 'Hi,'),
        intro: (requestTitle) => `We prepared a clear proposal for ${requestTitle}, so you can review the details comfortably and decide on the next step with confidence.`,
        amountLabel: 'Proposal total',
        amountNote: 'The full scope, proposal terms and next steps are waiting for you at the link.',
        summaryTitle: 'What you will find inside',
        highlights: [
            'A clear breakdown of the work and pricing',
            'A structured view of the process and next steps',
            'Space to review everything at your pace and ask questions',
        ],
        validUntil: (date) => `Available for review until ${date}`,
        timeframe: (value) => `Estimated timeframe: ${value}`,
        action: 'View your proposal',
        reassurance: 'Opening the proposal does not commit you to anything. If something needs refining, we will be happy to review it together.',
        closing: 'We are here for any question or adjustment. Simply reply to this email.',
        signature: 'Warm regards,\nThe CartShift Studio team',
    },
};
const QuoteReceived = ({ requestTitle, totalAmount, actionUrl, locale = 'en', clientName, validUntil, timeframe, }) => {
    const activeLocale = locale === 'he' ? 'he' : 'en';
    const isRtl = activeLocale === 'he';
    const text = copy[activeLocale];
    const align = isRtl ? 'right' : 'left';
    return ((0, jsx_runtime_1.jsxs)(Layout_1.Layout, { locale: activeLocale, title: text.title, preview: text.preview(requestTitle), children: [(0, jsx_runtime_1.jsx)(Layout_1.EmailHero, { eyebrow: text.eyebrow, title: text.title, align: align }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.greeting, textAlign: align }, children: text.greeting(clientName) }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.intro, textAlign: align }, children: text.intro(requestTitle) }), (0, jsx_runtime_1.jsxs)(components_1.Section, { style: styles.amountCard, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.amountLabel, children: text.amountLabel }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: styles.amount, children: totalAmount }), (0, jsx_runtime_1.jsx)(components_1.Hr, { style: styles.amountDivider }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.amountNote, textAlign: align }, children: text.amountNote }), (validUntil || timeframe) && ((0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.metadata, textAlign: align }, children: [
                            validUntil ? text.validUntil(validUntil) : null,
                            timeframe ? text.timeframe(timeframe) : null,
                        ]
                            .filter(Boolean)
                            .join('  |  ') }))] }), (0, jsx_runtime_1.jsxs)(Layout_1.SurfaceCard, { align: align, children: [(0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.highlightsTitle, textAlign: align }, children: text.summaryTitle }), text.highlights.map(highlight => ((0, jsx_runtime_1.jsxs)(components_1.Text, { style: { ...styles.highlight, textAlign: align }, children: [(0, jsx_runtime_1.jsx)("span", { style: styles.check, children: "\u2022" }), " ", highlight] }, highlight)))] }), (0, jsx_runtime_1.jsx)(components_1.Section, { style: styles.action, children: (0, jsx_runtime_1.jsx)(Button_1.ActionButton, { href: actionUrl, children: text.action }) }), (0, jsx_runtime_1.jsx)(Layout_1.FinePrint, { children: text.reassurance }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.closing, textAlign: align }, children: text.closing }), (0, jsx_runtime_1.jsx)(components_1.Text, { style: { ...styles.signature, textAlign: align }, children: text.signature })] }));
};
exports.QuoteReceived = QuoteReceived;
const styles = {
    greeting: {
        color: '#243b53',
        fontSize: '17px',
        fontWeight: '700',
        lineHeight: '1.6',
        margin: '0 0 8px',
    },
    intro: {
        color: '#486581',
        fontSize: '16px',
        lineHeight: '1.8',
        margin: '0 0 26px',
    },
    amountCard: {
        backgroundColor: '#07111f',
        border: '1px solid #263a56',
        borderRadius: '18px',
        margin: '0 0 28px',
        padding: '28px 24px',
        textAlign: 'center',
    },
    amountLabel: {
        color: '#b8c5d6',
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '1.4px',
        margin: '0 0 8px',
        textTransform: 'uppercase',
    },
    amount: {
        color: '#ffffff',
        fontSize: '42px',
        fontWeight: '700',
        letterSpacing: '0',
        lineHeight: '1.1',
        margin: '0',
    },
    amountDivider: {
        borderColor: '#38bdf8',
        margin: '18px auto 14px',
        width: '56px',
    },
    amountNote: {
        color: '#cbd5e1',
        fontSize: '14px',
        lineHeight: '1.7',
        margin: '0',
    },
    metadata: {
        color: '#94a3b8',
        fontSize: '12px',
        lineHeight: '1.6',
        margin: '14px 0 0',
    },
    highlightsTitle: {
        color: '#243b53',
        fontSize: '15px',
        fontWeight: '700',
        margin: '0 0 10px',
    },
    highlight: {
        color: '#486581',
        fontSize: '14px',
        lineHeight: '1.7',
        margin: '7px 0',
    },
    check: {
        color: '#2563eb',
        fontWeight: '700',
    },
    action: {
        margin: '0 0 16px',
        textAlign: 'center',
    },
    closing: {
        color: '#486581',
        fontSize: '14px',
        lineHeight: '1.7',
        margin: '24px 0 14px',
    },
    signature: {
        color: '#243b53',
        fontSize: '14px',
        fontWeight: '700',
        lineHeight: '1.7',
        margin: '0',
        whiteSpace: 'pre-line',
    },
};
exports.default = exports.QuoteReceived;
//# sourceMappingURL=QuoteReceived.js.map
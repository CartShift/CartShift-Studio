import { Section, Text, Heading, Hr } from '@react-email/components';
import { Layout } from '../components/Layout';
import { ActionButton } from '../components/Button';

interface QuoteReceivedProps {
  requestTitle: string;
  totalAmount: string;
  actionUrl: string;
  locale?: 'en' | 'he';
  clientName?: string;
  validUntil?: string;
  timeframe?: string;
}

const copy = {
  he: {
    title: 'הצעת המחיר שלך מוכנה',
    preview: (requestTitle: string) => `הצעת המחיר עבור ${requestTitle} מוכנה לצפייה`,
    eyebrow: 'הצעה מותאמת עבורך',
    greeting: (clientName?: string) => (clientName ? `היי ${clientName},` : 'היי,'),
    intro: (requestTitle: string) =>
      `ריכזנו עבורך הצעה מסודרת עבור ${requestTitle}, כדי שיהיה קל לעבור על הפרטים ולהחליט בנחת על הצעד הבא.`,
    amountLabel: 'סך ההצעה',
    amountNote: 'הפירוט המלא, תנאי ההצעה והשלבים הבאים מחכים לך בקישור.',
    summaryTitle: 'מה מחכה לך בהצעה?',
    highlights: [
      'פירוט ברור של העבודה והעלויות',
      'תמונה מסודרת של התהליך והשלבים הבאים',
      'אפשרות לעבור על הכל בקצב שלך ולשלוח שאלות',
    ],
    validUntil: (date: string) => `ההצעה זמינה לעיון עד ${date}`,
    timeframe: (value: string) => `זמן עבודה משוער: ${value}`,
    action: 'לצפייה בהצעה',
    reassurance: 'פתיחת ההצעה אינה מחייבת. אם תרצו לדייק משהו, נשמח לעבור עליו יחד.',
    closing: 'אנחנו כאן לכל שאלה או התאמה. אפשר פשוט להשיב למייל הזה.',
    signature: 'בברכה,\nצוות CartShift Studio',
  },
  en: {
    title: 'Your proposal is ready',
    preview: (requestTitle: string) => `Your proposal for ${requestTitle} is ready to view`,
    eyebrow: 'Prepared for you',
    greeting: (clientName?: string) => (clientName ? `Hi ${clientName},` : 'Hi,'),
    intro: (requestTitle: string) =>
      `We prepared a clear proposal for ${requestTitle}, so you can review the details comfortably and decide on the next step with confidence.`,
    amountLabel: 'Proposal total',
    amountNote: 'The full scope, proposal terms and next steps are waiting for you at the link.',
    summaryTitle: 'What you will find inside',
    highlights: [
      'A clear breakdown of the work and pricing',
      'A structured view of the process and next steps',
      'Space to review everything at your pace and ask questions',
    ],
    validUntil: (date: string) => `Available for review until ${date}`,
    timeframe: (value: string) => `Estimated timeframe: ${value}`,
    action: 'View your proposal',
    reassurance: 'Opening the proposal does not commit you to anything. If something needs refining, we will be happy to review it together.',
    closing: 'We are here for any question or adjustment. Simply reply to this email.',
    signature: 'Warm regards,\nThe CartShift Studio team',
  },
};

export const QuoteReceived = ({
  requestTitle,
  totalAmount,
  actionUrl,
  locale = 'en',
  clientName,
  validUntil,
  timeframe,
}: QuoteReceivedProps) => {
  const activeLocale = locale === 'he' ? 'he' : 'en';
  const isRtl = activeLocale === 'he';
  const text = copy[activeLocale];
  const align = isRtl ? ('right' as const) : ('left' as const);

  return (
    <Layout
      locale={activeLocale}
      title={text.title}
      preview={text.preview(requestTitle)}
    >
      <Text style={{ ...styles.eyebrow, textAlign: align }}>{text.eyebrow}</Text>
      <Heading style={{ ...styles.heading, textAlign: align }}>{text.title}</Heading>

      <Text style={{ ...styles.greeting, textAlign: align }}>{text.greeting(clientName)}</Text>
      <Text style={{ ...styles.intro, textAlign: align }}>{text.intro(requestTitle)}</Text>

      <Section style={styles.amountCard}>
        <Text style={styles.amountLabel}>{text.amountLabel}</Text>
        <Text style={styles.amount}>{totalAmount}</Text>
        <Hr style={styles.amountDivider} />
        <Text style={{ ...styles.amountNote, textAlign: align }}>{text.amountNote}</Text>
        {(validUntil || timeframe) && (
          <Text style={{ ...styles.metadata, textAlign: align }}>
            {[validUntil ? text.validUntil(validUntil) : null, timeframe ? text.timeframe(timeframe) : null]
              .filter(Boolean)
              .join('  |  ')}
          </Text>
        )}
      </Section>

      <Section style={styles.highlights}>
        <Text style={{ ...styles.highlightsTitle, textAlign: align }}>{text.summaryTitle}</Text>
        {text.highlights.map(highlight => (
          <Text key={highlight} style={{ ...styles.highlight, textAlign: align }}>
            <span style={styles.check}>✓</span> {highlight}
          </Text>
        ))}
      </Section>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>{text.action}</ActionButton>
      </Section>

      <Text style={styles.reassurance}>{text.reassurance}</Text>
      <Text style={{ ...styles.closing, textAlign: align }}>{text.closing}</Text>
      <Text style={{ ...styles.signature, textAlign: align }}>{text.signature}</Text>
    </Layout>
  );
};

const styles = {
  eyebrow: {
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    margin: '0 0 10px',
  },
  heading: {
    color: '#102a43',
    fontSize: '30px',
    fontWeight: '700',
    lineHeight: '1.25',
    margin: '0 0 26px',
  },
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
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '16px',
    margin: '0 0 24px',
    padding: '24px',
    textAlign: 'center' as const,
  },
  amountLabel: {
    color: '#486581',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.8px',
    margin: '0 0 8px',
  },
  amount: {
    color: '#1d4ed8',
    fontSize: '38px',
    fontWeight: '700',
    letterSpacing: '-0.8px',
    lineHeight: '1.1',
    margin: '0',
  },
  amountDivider: {
    borderColor: '#bfdbfe',
    margin: '18px auto 14px',
    width: '56px',
  },
  amountNote: {
    color: '#486581',
    fontSize: '14px',
    lineHeight: '1.7',
    margin: '0',
  },
  metadata: {
    color: '#627d98',
    fontSize: '12px',
    lineHeight: '1.6',
    margin: '14px 0 0',
  },
  highlights: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    margin: '0 0 26px',
    padding: '18px 20px 14px',
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
    color: '#059669',
    fontWeight: '700',
  },
  action: {
    margin: '0 0 16px',
    textAlign: 'center' as const,
  },
  reassurance: {
    color: '#627d98',
    fontSize: '12px',
    lineHeight: '1.7',
    margin: '0 auto 24px',
    maxWidth: '440px',
    textAlign: 'center' as const,
  },
  closing: {
    color: '#486581',
    fontSize: '14px',
    lineHeight: '1.7',
    margin: '0 0 14px',
  },
  signature: {
    color: '#243b53',
    fontSize: '14px',
    fontWeight: '700',
    lineHeight: '1.7',
    margin: '0',
    whiteSpace: 'pre-line' as const,
  },
};

export default QuoteReceived;

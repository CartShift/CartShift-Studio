import { Section, Text, Hr } from '@react-email/components';
import { EmailHero, FinePrint, Layout, SurfaceCard } from '../components/Layout';
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
    reassurance:
      'Opening the proposal does not commit you to anything. If something needs refining, we will be happy to review it together.',
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
    <Layout locale={activeLocale} title={text.title} preview={text.preview(requestTitle)}>
      <EmailHero eyebrow={text.eyebrow} title={text.title} align={align} />
      <Text style={{ ...styles.greeting, textAlign: align }}>{text.greeting(clientName)}</Text>
      <Text style={{ ...styles.intro, textAlign: align }}>{text.intro(requestTitle)}</Text>

      <Section style={styles.amountCard}>
        <Text style={styles.amountLabel}>{text.amountLabel}</Text>
        <Text style={styles.amount}>{totalAmount}</Text>
        <Hr style={styles.amountDivider} />
        <Text style={{ ...styles.amountNote, textAlign: align }}>{text.amountNote}</Text>
        {(validUntil || timeframe) && (
          <Text style={{ ...styles.metadata, textAlign: align }}>
            {[
              validUntil ? text.validUntil(validUntil) : null,
              timeframe ? text.timeframe(timeframe) : null,
            ]
              .filter(Boolean)
              .join('  |  ')}
          </Text>
        )}
      </Section>

      <SurfaceCard align={align}>
        <Text style={{ ...styles.highlightsTitle, textAlign: align }}>{text.summaryTitle}</Text>
        {text.highlights.map(highlight => (
          <Text key={highlight} style={{ ...styles.highlight, textAlign: align }}>
            <span style={styles.check}>•</span> {highlight}
          </Text>
        ))}
      </SurfaceCard>

      <Section style={styles.action}>
        <ActionButton href={actionUrl}>{text.action}</ActionButton>
      </Section>

      <FinePrint>{text.reassurance}</FinePrint>
      <Text style={{ ...styles.closing, textAlign: align }}>{text.closing}</Text>
      <Text style={{ ...styles.signature, textAlign: align }}>{text.signature}</Text>
    </Layout>
  );
};

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
    textAlign: 'center' as const,
  },
  amountLabel: {
    color: '#b8c5d6',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '1.4px',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
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
    textAlign: 'center' as const,
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
    whiteSpace: 'pre-line' as const,
  },
};

export default QuoteReceived;

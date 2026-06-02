'use client';
import { Document, Font, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { BillingDocumentType, BillingProfile, Organization, PaymentRecord, Request } from '@/lib/types/portal';

Font.register({ family: 'Rubik', fonts: [{ src: '/fonts/Rubik-Regular.ttf' }, { src: '/fonts/Rubik-Bold.ttf', fontWeight: 700 }] });

const styles = StyleSheet.create({
  page: { padding: 38, fontFamily: 'Rubik', fontSize: 9, color: '#172033' },
  rtl: { direction: 'rtl', textAlign: 'right' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1 solid #d9e2ef' },
  brand: { fontSize: 21, fontWeight: 700, color: '#1463ff' },
  logo: { width: 90, maxHeight: 34, objectFit: 'contain', marginBottom: 5 },
  muted: { color: '#667085', marginTop: 3 },
  title: { fontSize: 18, fontWeight: 700, textAlign: 'right' },
  badge: { marginTop: 7, color: '#087443', textAlign: 'right', fontWeight: 700 },
  columns: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 20 },
  column: { flex: 1 },
  section: { color: '#667085', fontSize: 8, fontWeight: 700, textTransform: 'uppercase', marginBottom: 7 },
  line: { marginBottom: 3, lineHeight: 1.35 },
  reference: { marginTop: 22, padding: 11, backgroundColor: '#f5f8ff', borderRadius: 4 },
  table: { marginTop: 24 },
  row: { flexDirection: 'row', paddingVertical: 8, borderBottom: '1 solid #edf1f7' },
  tableHead: { backgroundColor: '#f7f9fc', fontWeight: 700, color: '#526071' },
  desc: { flex: 4 }, qty: { flex: 1, textAlign: 'center' }, money: { flex: 1.6, textAlign: 'right' },
  totals: { marginTop: 17, marginLeft: 'auto', width: 235 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  grand: { paddingTop: 8, borderTop: '2 solid #d9e2ef', fontWeight: 700, fontSize: 11 },
  balance: { color: '#1463ff' },
  box: { marginTop: 20, padding: 11, backgroundColor: '#f7f9fc', borderRadius: 4 },
  footer: { position: 'absolute', left: 38, right: 38, bottom: 28, borderTop: '1 solid #e6ebf2', paddingTop: 9, color: '#7d8998', textAlign: 'center', fontSize: 8 },
});

const labels = {
  en: { payment_request: 'Payment Request', invoice: 'Invoice', paid_invoice: 'Paid Invoice', payment_receipt: 'Payment Receipt', from: 'From', billTo: 'Bill To', issue: 'Issue date', due: 'Due date', request: 'Request reference', description: 'Description', qty: 'Qty', unit: 'Unit price', subtotal: 'Subtotal', tax: 'VAT / Tax', total: 'Total', paid: 'Amount paid', balance: 'Balance due', terms: 'Payment terms', instructions: 'Payment instructions', payment: 'Payment details', thanks: 'Thank you for your business. This document is a payment record and is not a certified Israeli tax invoice or receipt.' },
  he: { payment_request: 'דרישת תשלום', invoice: 'חשבונית', paid_invoice: 'חשבונית ששולמה', payment_receipt: 'אישור תשלום', from: 'מאת', billTo: 'עבור', issue: 'תאריך הפקה', due: 'מועד תשלום', request: 'מזהה בקשה', description: 'תיאור', qty: 'כמות', unit: 'מחיר יחידה', subtotal: 'סכום ביניים', tax: 'מע״מ / מס', total: 'סה״כ', paid: 'שולם', balance: 'יתרה לתשלום', terms: 'תנאי תשלום', instructions: 'הנחיות תשלום', payment: 'פרטי תשלום', thanks: 'תודה על שיתוף הפעולה. מסמך זה הוא תיעוד תשלום ואינו חשבונית מס או קבלה מאושרת בישראל.' },
} as const;

const date = (value?: Date | { toDate: () => Date }) => value ? new Intl.DateTimeFormat('en-GB').format(value instanceof Date ? value : value.toDate()) : '';
const money = (amount: number, currency: string, locale: string) => new Intl.NumberFormat(locale === 'he' ? 'he-IL' : 'en-US', { style: 'currency', currency }).format(amount / 100);

export function InvoiceDocument({ request, organization, billingProfile, payments = [], documentType, invoiceId = `REQ-${request.id.slice(0, 8).toUpperCase()}`, date: issueDate = new Date(), locale = 'en' }: {
  request: Request; organization: Organization; billingProfile?: BillingProfile | null; payments?: PaymentRecord[]; documentType: BillingDocumentType; invoiceId?: string; date?: Date; locale?: string;
}) {
  const lang = locale === 'he' ? 'he' : 'en'; const t = labels[lang]; const rtl = lang === 'he';
  const items = request.lineItems ?? [{ id: 'fallback', description: request.title, quantity: 1, unitPrice: request.subtotal ?? request.totalAmount ?? 0 }];
  const subtotal = request.subtotal ?? items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxRate = request.taxRate ?? billingProfile?.defaultTaxRate ?? 0; const taxAmount = request.taxAmount ?? Math.round(subtotal * taxRate);
  const total = request.totalAmount ?? subtotal + taxAmount; const paid = request.amountPaid ?? payments.reduce((sum, payment) => sum + payment.amount, 0); const balance = Math.max(0, request.balanceDue ?? total - paid);
  const lastPayment = payments[0]; const profile = billingProfile ?? { businessName: 'CartShift Studio', defaultCurrency: request.currency ?? 'USD', defaultTaxRate: 0 };
  const currency = request.currency ?? profile.defaultCurrency;
  const bank = profile.bankDetails;
  const bankText = bank ? [bank.bankName, bank.branchNumber && `Branch ${bank.branchNumber}`, bank.accountNumber && `Account ${bank.accountNumber}`, bank.beneficiaryName, bank.iban && `IBAN ${bank.iban}`, bank.swift && `SWIFT ${bank.swift}`].filter(Boolean).join(' · ') : '';
  return <Document><Page size="A4" style={[styles.page, rtl ? styles.rtl : {}]}>
    <View style={styles.header}><View>{profile.logoUrl && <Image style={styles.logo} src={profile.logoUrl} />}<Text style={styles.brand}>{profile.businessName}</Text><Text style={styles.muted}>{profile.legalName}</Text><Text style={styles.muted}>{profile.email}</Text></View><View><Text style={styles.title}>{t[documentType]}</Text><Text style={styles.muted}>{invoiceId}</Text>{paid > 0 && <Text style={styles.badge}>{t.paid}: {money(paid, currency, lang)}</Text>}</View></View>
    <View style={styles.columns}><View style={styles.column}><Text style={styles.section}>{t.from}</Text><Text style={styles.line}>{profile.businessName}</Text>{profile.vatId && <Text style={styles.line}>{profile.vatId}</Text>}<Text style={styles.line}>{[profile.addressLine1, profile.addressLine2, profile.city, profile.country, profile.postalCode].filter(Boolean).join(', ')}</Text><Text style={styles.line}>{profile.phone}</Text></View><View style={styles.column}><Text style={styles.section}>{t.billTo}</Text><Text style={styles.line}>{organization.billingName || organization.name}</Text>{organization.billingTaxId && <Text style={styles.line}>{organization.billingTaxId}</Text>}<Text style={styles.line}>{organization.billingEmail}</Text><Text style={styles.line}>{[organization.billingAddressLine1, organization.billingAddressLine2, organization.billingCity, organization.billingCountry, organization.billingPostalCode].filter(Boolean).join(', ')}</Text></View></View>
    <View style={styles.reference}><Text style={styles.line}>{t.request}: {invoiceId}</Text><Text style={styles.line}>{request.title}</Text><Text style={styles.line}>{t.issue}: {date(issueDate)}</Text>{request.paymentDueAt && <Text style={styles.line}>{t.due}: {date(request.paymentDueAt)}</Text>}</View>
    <View style={styles.table}><View style={[styles.row, styles.tableHead]}><Text style={styles.desc}>{t.description}</Text><Text style={styles.qty}>{t.qty}</Text><Text style={styles.money}>{t.unit}</Text><Text style={styles.money}>{t.total}</Text></View>{items.map(item => <View key={item.id} style={styles.row}><Text style={styles.desc}>{item.description}</Text><Text style={styles.qty}>{item.quantity}</Text><Text style={styles.money}>{money(item.unitPrice, currency, lang)}</Text><Text style={styles.money}>{money(item.quantity * item.unitPrice, currency, lang)}</Text></View>)}</View>
    <View style={styles.totals}><View style={styles.totalRow}><Text>{t.subtotal}</Text><Text>{money(subtotal, currency, lang)}</Text></View><View style={styles.totalRow}><Text>{t.tax} ({(taxRate * 100).toFixed(2)}%)</Text><Text>{money(taxAmount, currency, lang)}</Text></View><View style={[styles.totalRow, styles.grand]}><Text>{t.total}</Text><Text>{money(total, currency, lang)}</Text></View><View style={styles.totalRow}><Text>{t.paid}</Text><Text>{money(paid, currency, lang)}</Text></View><View style={[styles.totalRow, styles.balance]}><Text>{t.balance}</Text><Text>{money(balance, currency, lang)}</Text></View></View>
    {profile.defaultPaymentTerms && <View style={styles.box}><Text style={styles.section}>{t.terms}</Text><Text>{profile.defaultPaymentTerms}</Text></View>}
    {(profile.paymentInstructions || bankText) && <View style={styles.box}><Text style={styles.section}>{t.instructions}</Text>{profile.paymentInstructions && <Text>{profile.paymentInstructions}</Text>}{bankText && <Text style={styles.muted}>{bankText}</Text>}</View>}
    {lastPayment && <View style={styles.box}><Text style={styles.section}>{t.payment}</Text><Text>{lastPayment.method}{lastPayment.reference ? ` · ${lastPayment.reference}` : ''} · {date(lastPayment.paidAt)}</Text></View>}
    <Text style={styles.footer}>{t.thanks}</Text>
  </Page></Document>;
}

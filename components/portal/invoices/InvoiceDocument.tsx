'use client';

import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { Request, Organization } from '@/lib/types/portal';
import { format } from 'date-fns';

// Register fonts (standard fonts usually work, but for better styling we can register)
// We'll stick to standard Helvetica for reliability in this implementation

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 20,
  },
  brand: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0284c7', // Brand Primary
    marginBottom: 8,
  },
  brandSub: {
    fontSize: 10,
    color: '#64748b',
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#0f172a',
    textAlign: 'right',
  },
  invoiceMeta: {
    marginTop: 8,
    textAlign: 'right',
    fontSize: 10,
    color: '#64748b',
  },
  grid: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  col: {
    flex: 1,
  },
  colRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
    paddingTop: 8,
  },
  th: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  td: {
    fontSize: 10,
    color: '#0f172a',
  },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },

  summary: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryBlock: {
    width: 200,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0284c7', // Brand Primary
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 20,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
  },
});

interface InvoiceDocumentProps {
  request: Request;
  organization: Organization;
  invoiceId?: string;
  date?: Date;
}

const formatCurrency = (amount: number, currency: string = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  return formatter.format(amount / 100);
};

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  request,
  organization,
  invoiceId = `INV-${request.id.substring(0, 8).toUpperCase()}`,
  date = new Date(),
}) => {
  const currency = request.currency || 'USD';
  const lineItems = request.lineItems || [
    {
      id: '1',
      description: request.title,
      quantity: 1,
      unitPrice: request.totalAmount || 0,
    },
  ];

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = 0; // Assuming 0 for now or add logic later
  const total = subtotal + tax;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>CartShift Studio</Text>
            <Text style={styles.brandSub}>Premium E-commerce Development</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Invoice</Text>
            <Text style={styles.invoiceMeta}>#{invoiceId}</Text>
            <Text style={styles.invoiceMeta}>Date: {format(date, 'MMM d, yyyy')}</Text>
            {request.paidAt && (
              <Text style={{ ...styles.invoiceMeta, color: '#059669', fontWeight: 'bold' }}>
                PAID on {format(request.paidAt.toDate(), 'MMM d, yyyy')}
              </Text>
            )}
          </View>
        </View>

        {/* Bill To / From */}
        <View style={styles.grid}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>From</Text>
            <Text style={styles.text}>CartShift Studio</Text>
            <Text style={styles.text}>Tel Aviv, Israel</Text>
            <Text style={styles.text}>hello@cart-shift.com</Text>
          </View>
          <View style={styles.colRight}>
            <Text style={styles.sectionTitle}>Bill To</Text>
            <Text style={styles.text}>{organization.name}</Text>
            <Text style={styles.text}>ID: {organization.id}</Text>
            {organization.website && <Text style={styles.text}>{organization.website}</Text>}
          </View>
        </View>

        {/* Line Items */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Price</Text>
            <Text style={[styles.th, styles.colTotal]}>Total</Text>
          </View>

          {lineItems.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colPrice]}>
                {formatCurrency(item.unitPrice, currency)}
              </Text>
              <Text style={[styles.td, styles.colTotal]}>
                {formatCurrency(item.quantity * item.unitPrice, currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryBlock}>
            <View style={styles.summaryRow}>
              <Text style={styles.text}>Subtotal</Text>
              <Text style={styles.text}>{formatCurrency(subtotal, currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.text}>Tax (0%)</Text>
              <Text style={styles.text}>{formatCurrency(tax, currency)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(total, currency)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business.</Text>
          <Text style={{ marginTop: 4 }}>CartShift Studio | Premium E-commerce Solutions</Text>
        </View>
      </Page>
    </Document>
  );
};

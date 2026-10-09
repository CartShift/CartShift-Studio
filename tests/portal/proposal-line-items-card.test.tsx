import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { useFieldArray, useForm } from 'react-hook-form';
import { RadixProvider } from '@/components/providers/RadixProvider';
import { ProposalLineItemsCard } from '@/components/portal/pricing/ProposalLineItemsCard';

type Values = {
  lineItems: { id: string; description: string; quantity: number; unitPrice: number; pricingType?: string }[];
  includeTax: boolean;
};

const messages = {
  portal: {
    common: { delete: 'Delete' },
    pricing: { form: {
      lineItems: 'Line items',
      addItem: 'Add item',
      itemDescription: 'Description',
      quantity: 'Quantity',
      unitPrice: 'Unit price',
      subtotal: 'Subtotal',
      tax: 'VAT',
      total: 'Total',
    }},
  },
};

function Harness() {
  const { register, control } = useForm<Values>({
    defaultValues: {
      lineItems: [{ id: 'keep-me', description: 'Development', quantity: 1, unitPrice: 100 }],
      includeTax: true,
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lineItems' });
  return (
    <ProposalLineItemsCard
      rows={fields.map((field, index) => ({
        key: field.id,
        idRegistration: register(`lineItems.${index}.id`),
        descriptionRegistration: register(`lineItems.${index}.description`),
        pricingTypeRegistration: register(`lineItems.${index}.pricingType`),
        quantityRegistration: register(`lineItems.${index}.quantity`, { valueAsNumber: true }),
        unitPriceRegistration: register(`lineItems.${index}.unitPrice`, { valueAsNumber: true }),
      }))}
      currency="ILS"
      pricingTypeOptions={[{ value: 'fixed', label: 'Fixed' }]}
      subtotal={100}
      taxAmount={18}
      totalAmount={118}
      includeTaxRegistration={register('includeTax')}
      onAdd={() => append({ id: 'new-row', description: '', quantity: 1, unitPrice: 0 })}
      onRemove={remove}
    />
  );
}

function renderEditor(dir: 'ltr' | 'rtl') {
  return render(
    <NextIntlClientProvider locale={dir === 'rtl' ? 'he' : 'en'} messages={messages}>
      <RadixProvider dir={dir}><Harness /></RadixProvider>
    </NextIntlClientProvider>
  );
}

describe('shared proposal line items', () => {
  it.each(['ltr', 'rtl'] as const)('keeps add/remove controls and totals accessible in %s', async dir => {
    const user = userEvent.setup();
    renderEditor(dir);
    expect(screen.getByText('Line items')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'VAT' })).toBeChecked();
    expect(document.querySelector('input[name="lineItems.0.id"]')).toHaveValue('keep-me');

    await user.click(screen.getByRole('button', { name: 'Add item' }));
    expect(screen.getAllByRole('spinbutton')).toHaveLength(4);
    expect(screen.getAllByRole('button', { name: 'Delete' })).toHaveLength(2);

    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);
    expect(screen.getAllByRole('spinbutton')).toHaveLength(2);
  });
});

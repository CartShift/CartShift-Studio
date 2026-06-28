import { beforeAll, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadixProvider } from '@/components/providers/RadixProvider';
import { Dropdown } from '@/components/ui/Dropdown';
import { ModalBackdrop, ModalContent } from '@/components/ui/ModalBackdrop';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';

beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture ??= () => false;
  HTMLElement.prototype.setPointerCapture ??= () => undefined;
  HTMLElement.prototype.releasePointerCapture ??= () => undefined;
  Element.prototype.scrollIntoView ??= () => undefined;
});

function renderWithRadix(ui: React.ReactNode, dir: 'ltr' | 'rtl' = 'ltr') {
  return render(<RadixProvider dir={dir}>{ui}</RadixProvider>);
}

describe('Radix-backed UI primitives', () => {
  it('closes a dialog with Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    function DialogHarness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>Open settings</button>
          <ModalBackdrop isOpen={open} onClick={() => setOpen(false)}>
            <ModalContent accessibleTitle="Settings">
              <button type="button">Focusable action</button>
            </ModalContent>
          </ModalBackdrop>
        </>
      );
    }
    renderWithRadix(<DialogHarness />);

    const trigger = screen.getByRole('button', { name: 'Open settings' });
    await user.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Settings' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Settings' })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('uses the Dialog action-sheet presentation on mobile', async () => {
    vi.mocked(window.matchMedia).mockImplementationOnce(
      query =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList
    );
    const user = userEvent.setup();
    renderWithRadix(
      <Dropdown
        trigger={<button type="button">Mobile actions</button>}
        items={[{ label: 'Archive', onClick: vi.fn() }]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Mobile actions' }));
    expect(await screen.findByRole('dialog', { name: 'Actions' })).toBeInTheDocument();
  });

  it('supports keyboard menu selection and skips disabled actions', async () => {
    const user = userEvent.setup();
    const enabledAction = vi.fn();
    const disabledAction = vi.fn();
    renderWithRadix(
      <Dropdown
        trigger={<button type="button">More actions</button>}
        items={[
          { label: 'Unavailable', onClick: disabledAction, disabled: true },
          { label: 'Archive', onClick: enabledAction },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'More actions' }));
    const archiveItem = await screen.findByRole('menuitem', { name: 'Archive' });
    act(() => archiveItem.focus());
    await user.keyboard('{Enter}');
    expect(enabledAction).toHaveBeenCalledOnce();
    expect(disabledAction).not.toHaveBeenCalled();
  });

  it('exposes select validation and emits normalized values', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithRadix(
      <Select
        label="Currency"
        error="Choose a currency"
        placeholder="Select currency"
        options={[
          { value: 'USD', label: 'US Dollar' },
          { value: 'ILS', label: 'Israeli Shekel' },
        ]}
        onValueChange={onValueChange}
      />
    );

    const trigger = screen.getByRole('combobox', { name: 'Currency' });
    expect(trigger).toHaveAttribute('aria-invalid', 'true');
    expect(trigger).toHaveAccessibleDescription('Choose a currency');
    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Israeli Shekel' }));
    expect(onValueChange).toHaveBeenCalledWith('ILS');
  });

  it('toggles switches through the Radix switch contract', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithRadix(<Switch label="Email updates" checked={false} onChange={onChange} />);

    const control = screen.getByRole('switch', { name: 'Email updates' });
    await user.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

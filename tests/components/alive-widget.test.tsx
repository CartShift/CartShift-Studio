import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AliveExperience from '@/app/[locale]/(standalone)/portfolio-v5/AliveExperience';
import { getPortfolioShowcases } from '@/lib/portfolio-showcase';

describe('ALIVE floating portfolio chat', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ai: false, voice: false }),
    }));
    // jsdom does not implement the native non-modal dialog methods.
    HTMLDialogElement.prototype.show = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts as a small corner launcher without adding a hero section', async () => {
    const { container } = render(<AliveExperience locale="en" projects={getPortfolioShowcases('en')}/>);
    const launcher = await screen.findByRole('button', { name: 'Ask about my work' });
    expect(launcher.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('.alive-entry')).toBeNull();
    expect(container.querySelector('.alive-launch')).toBeNull(); // portaled to body
    expect(document.querySelector('.alive-dialog--compact')).toBeTruthy();
    expect(document.querySelector('.alive-dialog')?.hasAttribute('open')).toBe(false);
  });

  it('opens non-modally and supports an opt-in expanded workbench', async () => {
    render(<AliveExperience locale="en" projects={getPortfolioShowcases('en')}/>);
    const launcher = await screen.findByRole('button', { name: 'Ask about my work' });
    fireEvent.click(launcher);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('false');
    expect(dialog.classList.contains('alive-dialog--compact')).toBe(true);
    expect(launcher.getAttribute('aria-expanded')).toBe('true');
    expect(await screen.findByRole('button', { name: 'Explore projects and demos' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Explore projects and demos' }));
    expect(dialog.classList.contains('alive-dialog--expanded')).toBe(true);
    expect(screen.getAllByText('StarLinker').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Back to compact chat' }));
    expect(dialog.classList.contains('alive-dialog--compact')).toBe(true);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    await waitFor(() => expect(dialog.hasAttribute('open')).toBe(false));
    expect(launcher.getAttribute('aria-expanded')).toBe('false');
  });

  it('preserves a localized RTL control and closes accessibly', async () => {
    render(<AliveExperience locale="he" projects={getPortfolioShowcases('he')}/>);
    const launcher = await screen.findByRole('button', { name: 'שאלו על העבודות שלי' });
    fireEvent.click(launcher);
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('dir')).toBe('rtl');
    fireEvent.click(screen.getByRole('button', { name: 'סגירת החוויה' }));
    await waitFor(() => expect(launcher.getAttribute('aria-expanded')).toBe('false'));
    expect(dialog.hasAttribute('open')).toBe(false);
  });
});

import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChallengeLab, ProjectMiniLab } from '@/app/[locale]/(standalone)/portfolio-v5/AliveLab';

describe('ALIVE interactive project simulations', () => {
  it('prevents graph mutations for viewers and permits undo for editors', () => {
    const { container } = render(<ProjectMiniLab slug="starlinker" locale="en"/>);
    fireEvent.click(screen.getByRole('button', { name: /Authorize \+ apply/i }));
    expect(screen.getByText(/Viewer permission denies the write/i)).toBeTruthy();
    expect(container.querySelector('.alive-graph-node--2')?.className).not.toContain('is-created');
    fireEvent.click(screen.getByRole('button', { name: 'Editor' }));
    fireEvent.click(screen.getByRole('button', { name: /Authorize \+ apply/i }));
    expect(container.querySelector('.alive-graph-node--2')?.className).toContain('is-created');
    fireEvent.click(screen.getByRole('button', { name: /Undo/i }));
    expect(container.querySelector('.alive-graph-node--2')?.className).not.toContain('is-created');
  });

  it('finds the synthetic document discrepancy only after verification', () => {
    render(<ProjectMiniLab slug="rightflow" locale="en"/>);
    expect(screen.queryByText(/75 discrepancy/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Run verification/i }));
    expect(screen.getByText(/75 discrepancy/i)).toBeTruthy();
  });

  it('moves the alarm simulation through local finite states', () => {
    render(<ProjectMiniLab slug="wakemyway" locale="en"/>);
    fireEvent.click(screen.getByRole('button', { name: /Simulate alarm/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Respond' }));
    fireEvent.click(screen.getByRole('button', { name: /Confirm awake/i }));
    expect(screen.getAllByText('Awake')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: /Start over/i }));
    expect(screen.getAllByText('Scheduled')).toHaveLength(2);
  });

  it('links a sample lead to a project only after stage transitions', () => {
    render(<ProjectMiniLab slug="cartshift-studio" locale="en"/>);
    expect(screen.getByText(/Lead details captured/)).toBeTruthy();
    for (let i = 0; i < 3; i += 1) fireEvent.click(screen.getByRole('button', { name: /Advance workflow/i }));
    expect(screen.getByText(/Project linked to original lead/i)).toBeTruthy();
  });

  it('gates release readiness on all three prerequisites', () => {
    render(<ProjectMiniLab slug="ensemblis" locale="en"/>);
    expect(screen.getByText(/Distribution blocked/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Approved artwork' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Release metadata' }));
    expect(screen.getByText(/Ready for distribution review/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Audio master' }));
    expect(screen.getByText(/Distribution blocked/i)).toBeTruthy();
  });

  it('renders Challenge Me constraints and connects its related public project', () => {
    const visited: string[] = [];
    render(<ChallengeLab locale="en" onExplore={slug => visited.push(slug)}/>);
    fireEvent.change(screen.getByLabelText('What would you build?'), { target: { value: 'A workflow that approves documents safely' } });
    fireEvent.click(screen.getByRole('button', { name: /Explore an approach/i }));
    const result = screen.getByRole('status', { name: 'Solution outline' });
    expect(within(result).getByText(/A traceable operations workflow/i)).toBeTruthy();
    fireEvent.click(within(result).getByRole('button', { name: /Explore relevant work/i }));
    expect(visited).toEqual(['rightflow']);
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Counter } from '@/components/ui/Counter';

describe('Counter', () => {
  it('renders the real target value before the animation enters view', () => {
    render(<Counter value={98} suffix="%" inView={false} />);
    expect(screen.getByText('98%')).toBeInTheDocument();
  });

  it('keeps compound suffixes meaningful in the initial render', () => {
    render(<Counter value={24} suffix="/7" inView={false} />);
    expect(screen.getByText('24/7')).toBeInTheDocument();
  });
});

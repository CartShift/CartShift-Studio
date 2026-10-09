import { describe, expect, it } from 'vitest';
import { positionTourCard } from '@/lib/portal/tour-position';

describe('onboarding card positioning', () => {
  it('clamps card position within a small viewport', () => {
    expect(positionTourCard({ left: 240, top: 40, bottom: 72 }, 320, 480)).toEqual({
      top: 44,
      left: 16,
    });
  });

  it('keeps the card below an element when space allows', () => {
    expect(positionTourCard({ left: 80, top: 40, bottom: 80 }, 1440, 900)).toEqual({
      top: 96,
      left: 80,
    });
  });

  it('places the card above a low target when there is space', () => {
    expect(positionTourCard({ left: 50, top: 650, bottom: 700 }, 1200, 760)).toEqual({
      top: 214,
      left: 50,
    });
  });
});

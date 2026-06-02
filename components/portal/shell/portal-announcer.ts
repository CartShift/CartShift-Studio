/** Updates the portal live region for screen reader announcements. */
export function announcePortal(message: string): void {
  if (typeof document === 'undefined' || !message.trim()) return;

  const region = document.getElementById('portal-announcer');
  if (!region) return;

  region.textContent = '';
  // Force screen readers to notice the change on the next assignment
  void region.offsetHeight;
  region.textContent = message;
}

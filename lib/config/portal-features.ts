/**
 * Projects must not be advertised to users until corresponding Firestore security
 * rules have been deployed and role/tenant smoke tests have passed.
 *
 * Default OFF on every environment (including existing production deployments).
 */
export const PORTAL_PROJECTS_ENABLED =
  process.env.NEXT_PUBLIC_PORTAL_PROJECTS_ENABLED === 'true';

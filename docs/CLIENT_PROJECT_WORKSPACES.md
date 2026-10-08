# CartShift Client Project Workspaces

## Delivered on the feature branch

A new project entity lives beneath a client organization without replacing existing requests or billing. The agency and client project views support status, milestones, public summary, next step, blockers and responsibility, HTTPS preview links, versioned deliverables, client review decisions, materials checklist, launch readiness, scope, manual work logs, change proposals, client-visible updates, and linked service requests.

Templates: Shopify theme, product catalog, SEO and custom, with Hebrew and English labels. Agency client profiles link to filtered project lists. The client dashboard highlights active projects.

## Data, security and privacy

- Firestore collection: portal_projects, with project records keyed by project ID.
- Nested review collection per project stores per-user decisions. The reviewRevisions registry records current deliverable/change versions and Firestore rules check revision equality before client approval.
- Agency access is protected against self-promotion: accountType/isAgency/agencyRole changes require a pending agency invite, and org membership creation requires an authorized matching invite or an existing organization admin.
- Existing portal_requests optionally contain projectId; old records work without migration.
- Agency may edit projects. Clients can read only their organization and submit their own review decisions.
- The full shared project record is client-visible, including notes and logged work. Never store passwords, third-party tokens, or confidential internal notes there.

## Release prerequisites

1. Run branch CI: lint/typecheck, Vitest, and Next build.
2. Review the new Firestore rules and deploy them to the correct Firebase project with an authorized CLI account. GitHub merge alone does not deploy Firestore rules.
3. Test with two separate organizations and distinct agency/client accounts to verify permission boundaries.
4. Verify review decisions and revisions, readiness with vendor blockers, old Requests and quote/payment lifecycle.
5. Perform actual mobile/desktop RTL/LTR testing, ideally on a preview deployment.
6. Only then merge and roll out. Do not publish any Shopify theme or import live Arava records as part of this code release.

## Explicit limitations / follow-up

- Readiness is a workflow indicator, not a technical Shopify publishing lock.
- Approved extra scope does not automatically bill or adjust approved base estimates.
- Gmail, Drive, Shopify and GitHub data ingestion is not automatic; authentication and user consent are separate integration projects. Client updates can be copied for manual email delivery.
- Generated update drafts use deterministic project facts, not an external AI model.
- High-volume work logs and long-running activity streams should eventually move from project arrays to subcollections.
- Arava must be created as an actual client project only after rollout and checking that client-visible data is appropriate.

## Safe feature activation

Project routes, navigation and client dashboard widgets are disabled by default behind
`NEXT_PUBLIC_PORTAL_PROJECTS_ENABLED=true`. Merging this branch alone does not expose
unusable project pages on existing installations. After the new `firestore.rules`
are deployed to the correct Firebase project and security/RTL smoke tests pass,
set the variable in the correct Vercel environment and redeploy deliberately.
Never enable first and deploy rules later.

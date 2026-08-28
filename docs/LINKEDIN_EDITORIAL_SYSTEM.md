# LinkedIn Editorial System

The LinkedIn automation separates topic judgment, writing, skeptical editing, deterministic validation, and publishing. Technical correctness remains necessary, but it is no longer sufficient for a post to reach the queue.

## Pipeline

1. **Context gathering** reads the author profile, current blog inventory, recent confirmed posts, performance availability, and recent git history with `npm run social:linkedin:editorial:context`.
2. **Topic selection** generates four narrow candidates. Each needs a concrete situation, engineering tension, visible opinion, technical mechanism, source references, and semantic signature. This pass does not draft copy.
3. **Drafting** writes one 150-250 word post around the selected situation and opinion. It may use a general observation or first-person preference, but not an unsupported personal incident.
4. **Skeptical review** acts as a separate senior-engineer editor. It scores twelve quality dimensions and explicitly flags AI-generic language, documentation tone, LinkedIn-template structure, weak opinion, unsupported claims, and predictable endings.
5. **Rewrite and re-review** addresses every required change. A failed draft may be rewritten three times. The rewrite normally removes 15-25 percent instead of adding more explanation.
6. **Deterministic validation** runs before publishing. It rejects missing review metadata, generic CTA phrases, em dashes, hype language, excessive lists, slogan-heavy paragraph patterns, unsupported personal claims, repeated openings or endings, repeated structures, and high semantic similarity.
7. **Publishing** remains queue-based and personal-profile only. The local publisher derives the final editorial fingerprint, writes confirmed metadata to the ledger, and updates memory only after LinkedIn confirms success.

## Author profile

[`config/linkedin-editorial.json`](../config/linkedin-editorial.json) stores the durable voice contract:

- senior full-stack and product engineer
- product behavior matters as much as technical correctness
- UX and architecture are connected
- clear state ownership and reduced ambiguity matter
- opinions should be visible, nuanced, and technically defensible
- AI and automation should be discussed without hype

The profile allows honest preferences such as "I prefer" and general observations such as "I keep seeing". It does not treat those phrases as mandatory hooks.

## Grounding and personal claims

Each queue item declares one grounding mode:

- `general-observation`
- `published-source`
- `repository-evidence`
- `verified-experience`

Specific claims about a client, company, team, dated incident, implementation, result, or metric are rejected unless the exact claim and its source reference appear in `verifiedPersonalClaims`. Repository history can support what changed in the codebase, but it cannot prove a business outcome or private experience.

## Quality review

The skeptical review scores these dimensions from 0-5:

- central idea
- concrete situation
- author perspective
- human voice
- technical credibility
- product specificity
- natural rhythm
- useful ending
- response potential
- value beyond documentation
- technical restraint
- source integrity

Passing requires every score to be at least 3, the four human/authenticity dimensions to be at least 4, and the total to be at least 48/60. AI-generic, documentation, and thought-leader likelihood must each be 1 or lower. Every risk flag must be false, with no unsupported claims or remaining changes.

## Repetition protection

The queue validator compares the new post with the last six confirmed posts:

- semantic-signature content-word similarity
- opening fingerprint similarity
- ending fingerprint similarity
- consecutive structure pattern reuse

High similarity blocks publishing. Moderate semantic or wording similarity is reported as a warning for the skeptical editor. The same structure pattern cannot be used more than twice consecutively.

## Stale-data example

### Before

> Stale data is not a backend detail. It is a product state.
>
> Every mutation needs a state contract:
>
> - what changes immediately
> - what waits for server confirmation
> - what rolls back on failure
> - which cached views reconcile afterward
>
> Before your next mutation ships, write down what every affected screen should show.

The technical content is correct, but the structure reads like a compact engineering lesson followed by generic advice.

### After

> You update an order from a side drawer, close it, and the table behind it still shows the previous status.
>
> The request succeeded. The drawer even showed a success toast. But the product now has two answers for the same order, and the person using it has no good reason to trust either one.
>
> I like optimistic updates for actions that are easy to reverse. I do not like using them to make an uncertain write look settled. The implementation is not finished when the button owner looks correct. It is finished when the other views that carry the same fact can no longer contradict it.
>
> That usually means deciding which cache gets patched immediately, which queries should be invalidated, and what the interface says if the write fails after the optimistic state appears. The exact choice depends on how expensive a refetch is and how many screens share the entity.
>
> A useful test is to complete the mutation, then open another surface that shows the same record. If the two views tell different stories, there is still product work hiding inside the state-management work.

The technical idea now emerges from recognizable product behavior, the opinion is visible, and the ending is a concrete test rather than a generic instruction.

## Regression tests

Run the focused editorial suite with coverage thresholds:

```bash
npm run test:linkedin-editorial:coverage
```

The tests cover stage-specific prompts, required review and rewrite ordering, generic CTA rejection, em-dash and list limits, unsupported personal claims, malformed grounding, AI-generic risk scores, and recent-post repetition checks.

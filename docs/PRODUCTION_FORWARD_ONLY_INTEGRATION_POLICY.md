# KieliValmis Production Forward-Only Integration Policy

Policy ID: ANTI-REGRESSION-001
Status: MANDATORY
Scope: KieliValmis / Floently Learn production, server work, GitHub branches,
release candidates, emergency fixes, and parallel improvement work.

## Core rule

Production is forward-only.

No branch, workspace, old release clone, previous checkpoint, package,
archive, local copy, or parallel improvement branch may replace the
currently approved production lineage.

Every new production candidate MUST contain the current production source
commit as an ancestor before it can be promoted.

An older branch may contribute ONLY its intended changes. Its older copy of
unrelated application files must never overwrite newer production work.

## Why this policy exists

KieliValmis has repeatedly experienced regressions where previously repaired
behavior later returned. Repeated examples have affected roleplay, microphone
/STT behavior, cards, navigation, and Everyday Finnish.

This pattern means individual bug fixes are not sufficient. Integration and
deployment lineage must also be protected mechanically.

## Source-of-truth rule

The following concepts MUST always be kept separate:

1. currently deployed production artifact;
2. Git commit from which that artifact was built;
3. current server working-tree branch;
4. parallel development/improvement branches;
5. previous release or rollback artifacts.

A server checkout is NOT automatically the currently deployed production
version.

A Docker image is NOT allowed to be treated as reproducible production unless
its source Git commit is recorded or otherwise proven.

## Forward-only ancestry gate

Before any candidate can become production:

    git merge-base --is-ancestor DEPLOYED_PRODUCTION_SHA CANDIDATE_SHA

MUST succeed.

Failure means deployment is prohibited.

This check does not prove application correctness by itself. It proves that
the candidate did not silently discard the current production lineage.

## Existing parallel branches

If work was created from an older production base:

DO NOT:

- reset production to that branch;
- copy the entire repository over production;
- copy broad folders whose unrelated contents may be stale;
- force-push production to that branch;
- deploy that branch directly because its own tests pass.

Instead:

1. identify the exact intended commits/files/capabilities;
2. begin from the latest approved production head;
3. replay only the intended work using an explicit rebase, cherry-pick,
   narrowly reviewed patch, or equivalent controlled integration;
4. resolve conflicts in favor of preserving already-approved production
   behavior unless an explicit replacement decision has been made;
5. run every protected invariant gate;
6. build a candidate from that exact resulting commit;
7. deploy only that exact tested commit.

## Protected invariant rule

A successful feature-specific test is not enough.

Before production promotion, the candidate must pass the protected regression
suite for at least:

- roleplay role identity and conversation continuity;
- roleplay microphone and STT;
- public STT upload/proxy/backend/provider path;
- cards session/deck/answer behavior;
- Everyday Finnish route/path behavior;
- navigation/deep-link/back behavior;
- authentication/session behavior;
- subscription/access behavior;
- other critical production invariants added later.

Every confirmed production regression becomes a permanent test fixture.

A previously fixed regression test must never be deleted merely because a
different implementation is introduced. It may be replaced only by an
equivalent or stronger test with documented justification.

## Emergency server fixes

If an emergency fix is made directly on the production server:

1. commit it immediately on an explicit hotfix/reliability branch;
2. push it to GitHub;
3. add or update the regression test that proves the incident;
4. integrate it into the canonical forward production lineage;
5. do not allow unrelated work to be promoted until this reconciliation is
   complete.

No important server-only fix may remain outside Git history.

## Promotion rule

Production promotion is an integration operation, not a branch replacement.

The approved process is:

CURRENT PRODUCTION
        |
        +-- existing production fixes
        |
        +-- new reliability fixes
        |
        +-- selected changes from parallel improvement work
        |
        +-- complete invariant gates
        |
        +-- immutable candidate artifact
        |
        +-- post-deploy canaries
        |
        +-- NEW PRODUCTION

The old improvement branch itself does not become production.

## Deployment identity

Every deployment must record:

- previous production Git SHA;
- candidate Git SHA;
- built image/artifact identifier;
- deployment time;
- invariant-gate result;
- post-deployment canary result;
- rollback artifact identifier.

The exact tested artifact must be the artifact deployed.

## Rollback rule

Rollback means redeploying the previous known-good artifact.

Rollback must NOT be implemented by resetting the production Git branch to an
older source tree and then continuing development from that old tree.

After rollback, the forward development branch must still contain the newer
history so the root cause can be repaired without losing unrelated fixes.

## Merge/conflict rule

A conflict involving a previously protected production capability is never
resolved by taking one side wholesale.

The resolver must inspect the intended behaviors and preserve all still-valid
capabilities.

Examples include:

- roleplay reliability;
- STT reliability;
- cards;
- Everyday Finnish;
- navigation;
- subscriptions;
- authentication.

## No broad workspace promotion

Workspaces are working areas, not release authorities.

The existence of a clean workspace does not authorize production deployment.

A workspace may be deleted once its unique commits/artifacts are safely stored,
but its changes enter production only through the forward-only integration
process defined here.

## Stop condition

If the current deployed production source SHA cannot be proven, production
promotion STOPS.

Determine deployment provenance first.

If required protected tests do not exist, create them before promotion.

If a candidate does not descend from production, rebuild the candidate from
the latest production lineage.

## Non-negotiable release condition

A deployment is forbidden unless:

    PRODUCTION_ANCESTRY_GATE=PASS
    PROTECTED_INVARIANT_GATES=PASS
    CANDIDATE_ARTIFACT_IDENTITY=PASS
    POST_DEPLOY_CANARY=PASS

This policy applies regardless of which developer, AI agent, machine, branch,
workspace, or executor performs the work.

## Bidirectional artifact-source identity

Production artifact verification is bidirectional.

A candidate must prove both:

1. every expected tracked application source file is represented correctly in
   the built artifact; and
2. every application source file present in the artifact is explained by the
   candidate Git source.

The final required state is:

    TRACKED_SOURCE_MISSING_OR_DIFFERENT=0
    UNEXPLAINED_RUNTIME_SOURCE=0

Generated caches, bytecode, mounted persistence, and other explicitly
classified runtime artifacts may be excluded only through documented rules.

A one-directional source comparison is insufficient.

## Composite source overlay prohibition

Targeted Docker source overlays may be used only as explicitly documented
emergency recovery artifacts.

They are NOT an acceptable normal production release architecture.

The normal production backend must be reproducibly built from one canonical
Git commit.

A clean production build must carry that exact Git revision in immutable image
metadata.

A later targeted fix must be integrated back into canonical Git before an
unrelated release may be promoted.

Production must never depend indefinitely on remembering which historical
source files were layered into an image.

## Live capability reconciliation rule

When current production contains source from divergent histories, no branch
may be declared canonical merely because most files match it.

Every divergent or live-only application source capability must be classified
and reconciled first.

Allowed classifications are:

- KEEP;
- MERGE;
- REPLACE;
- DELETE.

Each decision requires documented evidence.

KEEP and MERGE capabilities require permanent regression protection before
reconciliation is complete.

DELETE requires evidence that the behavior is obsolete, duplicate, unreachable,
unsafe, or intentionally superseded.

## Worktree-safe cleanup rule

Repository cleanup must account for Git worktree relationships before deleting
any repository directory.

Before deleting a Git repository or workspace:

    git worktree list

must be inspected where applicable.

In addition, candidate directories containing a `.git` file must be inspected
for `gitdir:` pointers into another workspace.

A repository directory must NOT be deleted while another preserved worktree
depends on its Git metadata.

If a linked worktree is intended to survive independently, convert or migrate
it safely before deleting the parent Git directory.

Cleanup safety is part of production reliability because lost or broken Git
metadata can cause valid pending work to be forgotten and later overwritten.

## Runtime reconciliation ledger

When production does not correspond exactly to one Git commit, maintain a
reconciliation ledger containing:

- deployed image identity;
- rollback artifact identity;
- divergent tracked files;
- live-only source files;
- known Git origins;
- user-visible capabilities;
- KEEP/MERGE/REPLACE/DELETE decisions;
- regression-test evidence;
- reconciliation commit identities.

No clean replacement artifact may be promoted while unresolved runtime source
items remain in that ledger.

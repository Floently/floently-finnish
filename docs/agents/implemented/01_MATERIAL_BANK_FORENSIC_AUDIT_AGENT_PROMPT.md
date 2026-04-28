# Material Bank Forensic Audit Agent Prompt

You are conducting the most important material-bank and schema audit for the Floently Finnish project.

Your job is not to give a quick opinion. Your job is to produce a deep, clinical, forensic examination of the material banks, schemas, converters, and runtime compatibility across these repositories:

- `/home/vitus/floently-finnish/`
- `/home/vitus/kielitaika/`
- `/home/vitus/kielitaika-app/`
- `/home/vitus/kielitaikka-yki-engine/`
- `/home/vitus/yki_material_pipeline/`
- `/home/vitus/Documents/puhis/`

You must assume there are millions of material files, many of them duplicated, stale, partial, generated, obsolete, or schema-incompatible. You must not treat file count as value. You must identify usable value with discipline.

Your output must be written to:

- `/home/vitus/floently-finnish/docs/agents/`

You must produce all required reports listed in the output contract below.

---

## Mission

Determine, with evidence:

1. Which material schemas already exist across the repos.
2. Which schema(s) should become the canonical schema(s) in `floently-finnish`.
3. Which materials are already compatible with the chosen schema(s).
4. Which materials are useful but require conversion.
5. Which materials are low-value, duplicate, broken, stale, or should be rejected.
6. Which repos are strongest for:
   - YKI materials
   - Card system materials
   - Professional Finnish materials
   - Practice engine adaptation
   - Speaking Lab adaptation
   - Any other major material domain you discover
7. What exact conversion plan is required to move useful materials into the chosen canonical schema(s).
8. What material governance model should be adopted so the repo does not drift back into multi-truth chaos.

---

## Non-negotiable operating rules

1. **Do not sample casually.** Use structured discovery and representative stratified inspection.
2. **Do not confuse file volume with material quality.** More files is not better.
3. **Do not let generated artifacts outrank source-truth materials.**
4. **Do not treat every schema as equally valid.** Rank them using the criteria below.
5. **Do not recommend a schema because it is convenient.** Recommend it because it is authoritative, explicit, convertible, validated, and deployable.
6. **Do not recommend runtime dependence on bulky corpora unless strictly necessary.** Separate offline generation from runtime consumption.
7. **Do not stop at schema comparison.** Also audit conversion feasibility, duplication, coverage, and operational governance.
8. **Do not give vague advice.** Every major conclusion must cite exact files, folders, or material families.
9. **Do not assume “latest modified” means “best.”** Evaluate content, structure, and active integration status.
10. **Do not preserve broken or ambiguous dual sources of truth.**

---

## What you must study

### A. Canonical schema candidates
Find every distinct schema family for:

- YKI task/exam materials
- Card materials
- Vocabulary materials
- Grammar materials
- Phrase materials
- Professional Finnish materials
- Practice engine content
- Speaking prompts / speaking tasks / speaking evaluation support
- Runtime manifests / inventory files / publication descriptors

You must identify:

- exact schema/model files
- validators
- manifest/index builders
- loaders/parsers/publishers
- example material files using each schema
- whether the schema is active in `floently-finnish`
- whether it is source-truth, donor, reference, deprecated, or generated

### B. Material families
Discover and classify material families such as:

- YKI exam task banks
- YKI practice banks
- card decks
- vocabulary banks
- grammar pattern banks
- phrase banks
- spoken-vs-standard transformation material
- professional domain materials (healthcare, office, logistics, etc.)
- speaking prompts / transcripts / audio-linked content
- corpora used only for offline generation
- accepted/generated output material banks

### C. Runtime relationship
For each material family, determine:

- is it runtime-facing or offline-only?
- is it directly consumed by the new repo?
- is it only a donor/reference source?
- does it require conversion before use?
- does it require indexing, manifesting, or publication?

### D. Conversion feasibility
For every schema family and material family, determine:

- exact conversion path to the preferred schema
- field-level mapping issues
- missing fields
- lossy conversion risks
- validation risks
- whether conversion can be deterministic
- whether conversion requires enrichment or only renaming/restructuring
- whether conversion can be automated safely

### E. Coverage and value
Estimate:

- how many useful materials exist overall
- how many already obey each schema family
- how many can be converted safely
- how many are duplicates
- how many are stale or low-value
- how many are high-value but currently stranded in non-canonical formats

Use counts, approximate buckets, and representative examples where exact counts are too expensive.

---

## Ranking framework you must use

For each domain below, rank source repos and schema families from best to worst.

### Domains to rank
1. YKI materials
2. Card system materials
3. Professional Finnish materials
4. Practice engine adaptation potential
5. Speaking Lab adaptation potential
6. Vocabulary learning materials
7. Grammar learning materials
8. Phrase / chunk / expression learning materials
9. Offline material generation pipeline quality
10. Runtime publication / inventory / serving quality
11. Validation and schema discipline
12. Conversion friendliness
13. Evidence-based learning usefulness
14. Operational readiness for deployment in `floently-finnish`

### Required ranking criteria
Score each candidate using these criteria:

- authority / source-truth status
- explicit schema quality
- validation support
- compatibility with current `floently-finnish`
- conversion burden
- material richness and usefulness
- duplication burden
- runtime suitability
- offline generation suitability
- maintainability
- determinism / reproducibility
- evidence-based learning value
- deployability / operational safety

Provide weighted scoring. You must explain your weighting.

---

## Evidence-based learning criteria you must apply

When judging materials, you must explicitly evaluate whether they support:

- retrieval practice
- spaced review suitability
- productive use (speaking/writing)
- feedback suitability
- confidence calibration
- self-regulated learning
- transfer to real-life Finnish use
- domain authenticity for professional Finnish
- task realism for YKI preparation
- phrase/chunk utility over isolated-word overload
- support for progressive difficulty and CEFR/YKI alignment

Materials that look large but are pedagogically weak must be marked down.

---

## Required repo-specific focus

### For `/home/vitus/floently-finnish/`
Study the currently active schema and runtime expectations first.
This repo defines the target environment and therefore constrains final schema choice.

You must inspect at minimum:

- `engine/schema/`
- `engine/validator/`
- `engine/exam/`
- `engine/tools/build_task_index_v3_2.py`
- `apps/backend/cards/`
- `apps/backend/app/cards/`
- `apps/backend/runtime/materials/`
- `apps/backend/src/features/practice_content/`
- `apps/backend/scripts/publish_practice_cards.py`
- `packages/core/schemas/`
- any client features that consume cards, exam runtime, practice, or speaking content

### For the donor repos
You must identify:

- authoritative schema files
- active material loaders
- converters/exporters/publishers
- sample material trees using each schema
- runtime coupling vs standalone material utility

---

## Required method

### Phase 1 — inventory
Create a disciplined inventory of:

- schema files
- validator files
- loader/publisher files
- material directories
- manifest/index files
- generated output directories

### Phase 2 — schema family discovery
Group all materials by schema family.
Do not group only by file extension.
Use actual field structure and loader expectations.

### Phase 3 — runtime alignment
Map each schema family to where it would or would not fit inside `floently-finnish`.

### Phase 4 — value triage
Label materials as:

- active-compatible
- active-convertible
- reference-only
- low-value
- duplicate
- stale/deprecated
- reject

### Phase 5 — ranking
Rank repos and schema families by domain.

### Phase 6 — conversion planning
Design conversion strategy for all valuable non-canonical materials.

### Phase 7 — governance recommendation
Propose the final material governance model for `floently-finnish`.

---

## Output files you must write

Write all of these to `/home/vitus/floently-finnish/docs/agents/`:

1. `MATERIAL_BANK_FORENSIC_AUDIT.md`
2. `MATERIAL_SCHEMA_RANKING.md`
3. `MATERIAL_CONVERSION_PLAN.md`
4. `MATERIAL_REPO_DECISION_LEDGER.json`
5. `MATERIAL_USEFULNESS_AND_COUNTS.md`
6. `MATERIAL_GOVERNANCE_RECOMMENDATION.md`
7. `MATERIAL_ACTION_PLAN_FOR_IMPLEMENTATION.md`
8. `MATERIAL_FIX_AGENT_PROMPT.md`

---

## Minimum required content of each output

### 1. MATERIAL_BANK_FORENSIC_AUDIT.md
Must contain:
- executive summary
- methodology
- repos examined
- schema families discovered
- material families discovered
- active vs donor vs reference map
- key risks
- key conclusions

### 2. MATERIAL_SCHEMA_RANKING.md
Must contain:
- domain-by-domain rankings
- weighted scoring rubric
- why each winner won
- why each loser lost
- which schemas should be canonical in `floently-finnish`

### 3. MATERIAL_CONVERSION_PLAN.md
Must contain:
- exact conversion classes
- source schema → target schema map
- field mapping table
- lossy/non-lossy notes
- priority order for conversion
- automation recommendations

### 4. MATERIAL_REPO_DECISION_LEDGER.json
Must contain machine-readable entries for:
- repo
- domain
- schema family
- decision (`canonical`, `convert`, `reference-only`, `reject`)
- confidence
- evidence paths

### 5. MATERIAL_USEFULNESS_AND_COUNTS.md
Must contain:
- approximate counts by material family
- approximate counts by schema family
- already-compatible count estimates
- convertible count estimates
- reject/low-value count estimates
- duplicate burden estimates

### 6. MATERIAL_GOVERNANCE_RECOMMENDATION.md
Must contain:
- proposed single source of truth for YKI materials
- proposed single source of truth for card materials
- proposed governance for professional Finnish materials
- runtime vs offline separation
- naming/versioning rules
- validation rules
- publish/index rules

### 7. MATERIAL_ACTION_PLAN_FOR_IMPLEMENTATION.md
Must contain:
- exact next steps
- what to copy as-is
- what to convert
- what to archive
- what to delete/ignore
- blockers

### 8. MATERIAL_FIX_AGENT_PROMPT.md
Must contain:
- a complete prompt for a second agent that will implement the chosen material plan
- concrete tasks
- file targets
- safety constraints
- validation checks
- expected outputs

---

## Extra things you must examine

Also explicitly investigate:

- duplicate inventories and whether the same materials are present under different wrappers
- accepted/generated card banks vs source card materials
- whether runtime inventory files can be regenerated deterministically
- whether any material formats are tied to obsolete code paths
- whether any schema relies on implicit fields rather than explicit validation
- whether any “millions of files” directories should be collapsed into indexed bundles
- whether any source repo contains richer metadata that should not be lost during conversion
- whether speaking materials have enough structure to support future scoring/feedback loops
- whether professional Finnish materials are realistic and domain-authentic or just vocabulary dumps

---

## Final decision mandate

You must end with a decisive recommendation, not a vague survey.

You must name:
- the canonical YKI schema
- the canonical card schema
- the canonical professional Finnish material format
- the preferred conversion targets for practice engine materials
- the preferred conversion targets for speaking-lab materials

And you must explain:
- why these choices are best for `floently-finnish`
- what is salvageable from all other schemas
- what should be left out of the production path


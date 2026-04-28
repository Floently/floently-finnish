# Pass 5 Quarantine Manifest

Pass 5 did not move any additional source paths into quarantine.

Final duplicate-source quarantine state inherited from earlier passes:

- `apps/backend/cards/` -> `/home/vitus/floently-finnish-duplication-quarantine/apps/backend/cards/`
- `apps/backend/audio/` -> `/home/vitus/floently-finnish-duplication-quarantine/apps/backend/audio/`
- `apps/backend/yki/` -> `/home/vitus/floently-finnish-duplication-quarantine/apps/backend/yki/`

Verified after Pass 5:

- these duplicate source trees remain absent from the live repo
- no live canonical `apps/backend/app/*` caller still depends on those removed trees

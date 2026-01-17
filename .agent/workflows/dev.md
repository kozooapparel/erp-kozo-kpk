---
description: ERP Kozo KPK Development Workflow - Turbo mode untuk bypass manual accept
---

// turbo-all

# ERP Kozo KPK Development

## Commands yang sering digunakan:

### Development
1. Start dev server: `npm run dev`
2. Build project: `npm run build`
3. Lint: `npm run lint`

### Database
4. Push migration: `$env:SUPABASE_ACCESS_TOKEN="sbp_b4dabd71ba4942352bc028217a8c43302d55bd47"; npx supabase db push`
5. Generate types: `npx supabase gen types typescript --project-id agyiycqfuvovxabfcgrw > src/types/supabase.ts`

### Git
6. Stage all: `git add .`
7. Commit: `git commit -m "message"`
8. Push: `git push`

### Install packages
9. Install: `npm install <package>`
10. Install dev: `npm install -D <package>`

# Database Reset

This folder contains a script to completely reset the database schema.

## Usage

### Via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `reset.sql`
4. Run the query
5. Then run the migration in `migrations/20260128000000_unified_schema.sql`

### Via Supabase CLI

```bash
# Reset the database
supabase db reset

# Or manually run the reset script
psql $DATABASE_URL -f supabase/reset/reset.sql

# Then apply migrations
supabase db push
```

### Via psql directly

```bash
# Connect to your database
psql $DATABASE_URL

# Run reset script
\i supabase/reset/reset.sql

# Run migration
\i supabase/migrations/20260128000000_unified_schema.sql
```

## Warning

**This script will permanently delete ALL data including:**
- All users (public.users table, not auth.users)
- All groups, members, check-ins, badges, invites
- All gym locations
- All routine files in storage

If you also want to delete auth users (completely fresh start), uncomment the relevant lines at the bottom of `reset.sql`.

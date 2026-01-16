.PHONY: start stop restart supabase-start supabase-stop supabase-status db-reset dev install
.PHONY: seed-demo

SUPABASE ?= supabase
SUPABASE_START_ARGS ?= --exclude vector
SUPABASE_DB_CONTAINER ?= supabase_db_gym-crew

install:
	npm i

supabase-start:
	$(SUPABASE) start $(SUPABASE_START_ARGS)

supabase-stop:
	$(SUPABASE) stop

supabase-status:
	@$(SUPABASE) status || (echo "" && echo "Supabase isn't running yet. Run: make supabase-start" && exit 1)

doctor:
	@echo "Docker context: $$(docker context show 2>/dev/null || echo '(unknown)')"
	@docker ps >/dev/null 2>&1 && echo "Docker: OK" || (echo "Docker: NOT REACHABLE (start Colima/Docker Desktop)" && exit 1)
	@$(SUPABASE) status || true

db-reset:
	$(SUPABASE) db reset

seed-demo:
	@echo "Seeding demo data into local Supabase DB..."
	@docker exec -i $(SUPABASE_DB_CONTAINER) psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase/seeds/demo_seed.sql

dev:
	npm run dev

# Starts local Supabase (Docker) then runs the Next.js dev server.
start: supabase-start dev

# Stops local Supabase (Docker). (Next dev server is stopped with Ctrl+C.)
stop: supabase-stop

restart:
	$(MAKE) stop
	$(MAKE) start



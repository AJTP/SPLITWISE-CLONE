build:
	@echo "Building the application..."
	@docker-compose build

start:
	@echo "Starting backend and database..."
	@docker-compose up -d backend database
	@docker-compose logs -f backend database

start-frontend:
	@echo "Starting frontend..."
	@docker-compose up -d frontend
	@docker-compose logs -f frontend

start-all:
	@echo "Starting backend, database and frontend..."
	@docker-compose up -d backend database frontend
	@docker-compose logs -f backend database frontend

stop:
	@echo "Stopping the application..."
	@docker-compose down

dev-frontend:
	@echo "Starting frontend in development mode..."
	@cd splitwise-clone && npm run dev

install-frontend:
	@echo "Installing frontend dependencies..."
	@cd splitwise-clone && npm install

reset:
	@echo "Resetting the application (removes volumes and migrations)..."
	@docker-compose down -v
	@sudo rm -rf ./backend/prisma/migrations

build-test:
	@echo "Building the test environment..."
	@docker-compose --profile tests build tests

populate:
	@echo "Populating the database with sample data..."
	@docker-compose exec backend npm run db:seed

test:
	@echo "Running tests..."
	@docker-compose --profile tests run --rm tests sh -c "npm test -- --watchAll $(if $(match), -t '$(match)',) $(if $(file), --testPathPattern='$(file)',)"
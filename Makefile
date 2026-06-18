build:
	@echo "Building the application..."
	@docker-compose build

start:
	@echo "Starting the application..."
	@docker-compose up -d
	@docker-compose logs -f backend database

stop:
	@echo "Stopping the application..."
	@docker-compose down

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
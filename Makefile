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
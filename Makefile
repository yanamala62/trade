.PHONY: help install run-backend run-frontend build-frontend sync-android test test-cov docker-up docker-down lint

help:
	@echo "Available commands:"
	@echo "  make install        Install Python and Node dependencies"
	@echo "  make run-backend    Start the FastAPI backend server"
	@echo "  make run-frontend   Start the Vite/React frontend development server"
	@echo "  make build-frontend Build production frontend bundle"
	@echo "  make sync-android   Build and sync bundle into Capacitor Android APK project"
	@echo "  make open-android   Open the Android project in Android Studio"
	@echo "  make test           Run backend unit and integration tests"
	@echo "  make test-cov       Run tests with coverage report"
	@echo "  make docker-up      Start all services with Docker Compose"
	@echo "  make docker-down    Stop Docker Compose services"
	@echo "  make lint           Run code formatting and linter checks"

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

run-backend:
	cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

run-frontend:
	cd frontend && npm run dev

build-frontend:
	cd frontend && npm run build

sync-android:
	cd frontend && npm run build && npx cap sync

open-android:
	cd frontend && npx cap open android

test:
	cd backend && pytest -v tests/

test-cov:
	cd backend && pytest --cov=app --cov-report=term-missing tests/

docker-up:
	docker compose up -d

docker-down:
	docker compose down

lint:
	cd backend && ruff check app tests

.PHONY: help dev dev-front dev-ai install check check-front check-ai test test-front test-ai clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
YELLOW := \033[1;33m
GREEN := \033[1;32m
RESET := \033[0m

##@ General

help: ## Display this help message
	@echo "$(GREEN)Deep Quest - Monorepo Commands$(RESET)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(YELLOW)<target>$(RESET)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(YELLOW)%-15s$(RESET) %s\n", $$1, $$2 } /^##@/ { printf "\n%s\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

dev: ## Run both AI and Front servers concurrently
	@echo "$(GREEN)Starting AI and Front servers...$(RESET)"
	@trap 'kill 0' SIGINT; \
	$(MAKE) dev-ai & \
	AI_PID=$$!; \
	$(MAKE) dev-front & \
	FRONT_PID=$$!; \
	wait $$AI_PID $$FRONT_PID

dev-front: ## Run only Front server
	@echo "$(GREEN)Starting Front server...$(RESET)"
	@cd web && pnpm dev

dev-ai: ## Run only AI server
	@echo "$(GREEN)Starting AI server...$(RESET)"
	@cd ai && uv run langgraph dev

##@ Installation

install: install-front install-ai ## Install dependencies for both projects

install-front: ## Install Front dependencies
	@echo "$(GREEN)Installing Front dependencies...$(RESET)"
	@cd web && pnpm install

install-ai: ## Install AI dependencies
	@echo "$(GREEN)Installing AI dependencies...$(RESET)"
	@cd ai && uv sync

##@ Quality Checks

check: check-front check-ai ## Run quality checks for both projects

check-front: ## Run Front quality checks (type-check + lint + format)
	@echo "$(GREEN)Running Front quality checks...$(RESET)"
	@cd web && pnpm check-all

check-ai: ## Run AI quality checks (ruff + mypy + format)
	@echo "$(GREEN)Running AI quality checks...$(RESET)"
	@cd ai && uv run make lint

##@ Testing

test: test-front test-ai ## Run tests for both projects

test-front: ## Run Front tests
	@echo "$(GREEN)Running Front tests...$(RESET)"
	@cd web && pnpm test

test-ai: ## Run AI tests
	@echo "$(GREEN)Running AI tests...$(RESET)"
	@cd ai && uv run make test

##@ Utilities

clean: clean-front clean-ai ## Clean build artifacts for both projects

clean-front: ## Clean Front build artifacts
	@echo "$(GREEN)Cleaning Front build artifacts...$(RESET)"
	@cd web && rm -rf .next node_modules/.cache

clean-ai: ## Clean AI cache and build artifacts
	@echo "$(GREEN)Cleaning AI cache...$(RESET)"
	@cd ai && find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@cd ai && find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@cd ai && find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null || true
	@cd ai && find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true

sync-categories: ## Sync question categories from common-contents to both projects
	@echo "$(GREEN)Syncing question categories...$(RESET)"
	@cd web && pnpm sync:categories

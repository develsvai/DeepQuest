#!/bin/bash

# Git hooks installation script for Deep Quest project
# This script installs the custom git hooks to your local .git/hooks directory

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log functions
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "This script must be run from within a git repository"
    exit 1
fi

# Get git directory and hooks directory
GIT_DIR="$(git rev-parse --git-dir)"
HOOKS_DIR="$GIT_DIR/hooks"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

info "Installing Deep Quest git hooks..."
info "Git directory: $GIT_DIR"
info "Hooks directory: $HOOKS_DIR"
info "Source directory: $SCRIPT_DIR"

# Create hooks directory if it doesn't exist
if [ ! -d "$HOOKS_DIR" ]; then
    info "Creating hooks directory..."
    mkdir -p "$HOOKS_DIR"
fi

# Array of hooks to install
HOOKS_TO_INSTALL=("post-checkout")

# Installation counter
installed_count=0
updated_count=0
skipped_count=0

# Install each hook
for hook in "${HOOKS_TO_INSTALL[@]}"; do
    source_hook="$SCRIPT_DIR/$hook"
    target_hook="$HOOKS_DIR/$hook"

    # Check if source hook exists
    if [ ! -f "$source_hook" ]; then
        warn "Source hook '$hook' not found, skipping..."
        skipped_count=$((skipped_count + 1))
        continue
    fi

    # Check if target hook already exists
    if [ -f "$target_hook" ]; then
        # Check if it's already a symlink to our hook
        if [ -L "$target_hook" ] && [ "$(readlink "$target_hook")" = "$source_hook" ]; then
            info "Hook '$hook' is already installed and up to date"
            continue
        fi

        # Ask user if they want to overwrite existing hook
        echo
        warn "Hook '$hook' already exists at: $target_hook"

        if [ -L "$target_hook" ]; then
            info "Current target is a symlink to: $(readlink "$target_hook")"
        fi

        read -p "Do you want to overwrite it? [y/N]: " -n 1 -r
        echo

        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Skipping hook '$hook'"
            skipped_count=$((skipped_count + 1))
            continue
        fi

        # Remove existing hook
        rm "$target_hook"
        updated_count=$((updated_count + 1))
        info "Removed existing hook '$hook'"
    else
        installed_count=$((installed_count + 1))
    fi

    # Create symlink to our hook
    if ln -s "$source_hook" "$target_hook"; then
        info "Installed hook '$hook' → $target_hook"
    else
        error "Failed to install hook '$hook'"
        exit 1
    fi
done

# Summary
echo
info "Hook installation completed!"
info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Installed: $installed_count hooks"
info "Updated: $updated_count hooks"
info "Skipped: $skipped_count hooks"

if [ $installed_count -gt 0 ] || [ $updated_count -gt 0 ]; then
    echo
    info "The following hooks are now active:"
    for hook in "${HOOKS_TO_INSTALL[@]}"; do
        target_hook="$HOOKS_DIR/$hook"
        if [ -L "$target_hook" ] && [ "$(readlink "$target_hook")" = "$SCRIPT_DIR/$hook" ]; then
            info "  ✓ $hook"
        fi
    done

    echo
    info "🎉 Git hooks installation successful!"
    info "Your environment files (.env, .env.local) will now be automatically"
    info "copied to new worktrees when you create them."

    echo
    info "To test the setup, try creating a new worktree:"
    info "  git worktree add ../test-branch new-branch-name"
else
    warn "No hooks were installed or updated"
fi

echo
info "For more information, see: .github/hooks/README.md"
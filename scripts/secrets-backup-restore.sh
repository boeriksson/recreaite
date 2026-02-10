#!/bin/bash

# Amplify Secrets Backup & Restore Script
#
# This script backs up and restores Amplify Gen 2 sandbox secrets
# stored in AWS SSM Parameter Store.
#
# Usage:
#   ./scripts/secrets-backup-restore.sh backup    # Backup secrets to file
#   ./scripts/secrets-backup-restore.sh restore   # Restore secrets from file
#   ./scripts/secrets-backup-restore.sh list      # List current secrets

set -e

BACKUP_FILE=".secrets-backup.json"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/.."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# List all secrets
list_secrets() {
    echo -e "${GREEN}Current Amplify sandbox secrets:${NC}"
    echo ""
    npx ampx sandbox secret list 2>/dev/null || echo "No secrets found or sandbox not running"

    echo ""
    echo -e "${YELLOW}All Amplify secrets in SSM (across environments):${NC}"
    aws ssm get-parameters-by-path \
        --path "/amplify" \
        --recursive \
        --query "Parameters[?contains(Name, 'GEMINI') || contains(Name, 'API_KEY') || contains(Name, 'SECRET')].Name" \
        --output text 2>/dev/null | tr '\t' '\n' | grep -v "resource_reference" || echo "None found"
}

# Backup secrets to file
backup_secrets() {
    echo -e "${GREEN}Backing up Amplify secrets...${NC}"
    echo ""

    # Get list of secret names from Amplify CLI (format: " - SECRET_NAME")
    SECRET_LIST=$(npx ampx sandbox secret list 2>/dev/null || echo "")

    if [ -z "$SECRET_LIST" ] || [ "$SECRET_LIST" = "No secrets found or sandbox not running" ]; then
        echo -e "${YELLOW}No secrets found via 'ampx sandbox secret list'.${NC}"
        echo ""
        echo "Trying to find secrets directly in SSM..."
        echo ""
    fi

    # Parse secret names (remove " - " prefix)
    SECRET_NAMES=$(echo "$SECRET_LIST" | sed 's/^ - //' | grep -v "^$" || echo "")

    # Find sandbox identifier from SSM paths
    SANDBOX_PATH=$(aws ssm get-parameters-by-path \
        --path "/amplify" \
        --recursive \
        --query "Parameters[?contains(Name, 'sandbox')].Name" \
        --output text 2>/dev/null | tr '\t' '\n' | grep -v "resource_reference" | head -1 || echo "")

    if [ -z "$SANDBOX_PATH" ]; then
        echo -e "${YELLOW}Could not find sandbox secrets in SSM.${NC}"
        echo "You may need to use 'manual' mode instead."
        exit 1
    fi

    # Extract the sandbox prefix (e.g., /amplify/recreaite/bosandevind-sandbox-xxx/)
    SANDBOX_PREFIX=$(echo "$SANDBOX_PATH" | sed 's|/[^/]*$||')
    echo -e "Found sandbox path: ${GREEN}$SANDBOX_PREFIX${NC}"
    echo ""

    # Get all secrets under this sandbox path
    SECRETS_JSON=$(aws ssm get-parameters-by-path \
        --path "$SANDBOX_PREFIX" \
        --with-decryption \
        --query "Parameters[*].{Name:Name,Value:Value}" \
        --output json 2>/dev/null || echo "[]")

    # Check if we got any secrets
    SECRET_COUNT=$(echo "$SECRETS_JSON" | python3 -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

    if [ "$SECRET_COUNT" = "0" ]; then
        echo -e "${YELLOW}No secrets found in sandbox path.${NC}"
        exit 0
    fi

    # Create backup JSON using Python for reliable JSON handling
    python3 << EOF
import json
from datetime import datetime

ssm_secrets = json.loads('''$SECRETS_JSON''')

backup = {
    "_backup_date": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "_sandbox_prefix": "$SANDBOX_PREFIX",
    "_warning": "SENSITIVE DATA - Do not commit to git!",
    "secrets": {}
}

for param in ssm_secrets:
    # Extract just the secret name from the full path
    name = param["Name"].split("/")[-1]
    value = param["Value"]
    backup["secrets"][name] = value
    print(f"  ✓ Backed up: {name}")

with open("$BACKUP_DIR/$BACKUP_FILE", "w") as f:
    json.dump(backup, f, indent=2)

print(f"\nBacked up {len(backup['secrets'])} secret(s)")
EOF

    echo ""
    echo -e "${GREEN}Backup saved to: $BACKUP_FILE${NC}"
    echo -e "${RED}WARNING: This file contains sensitive data. Do not commit to git!${NC}"

    # Check if .gitignore has the backup file
    if ! grep -q "$BACKUP_FILE" "$BACKUP_DIR/.gitignore" 2>/dev/null; then
        echo ""
        echo -e "${YELLOW}Adding $BACKUP_FILE to .gitignore...${NC}"
        echo "" >> "$BACKUP_DIR/.gitignore"
        echo "# Secrets backup (sensitive!)" >> "$BACKUP_DIR/.gitignore"
        echo "$BACKUP_FILE" >> "$BACKUP_DIR/.gitignore"
    fi
}

# Restore secrets from file
restore_secrets() {
    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
        echo "Run './scripts/secrets-backup-restore.sh backup' first."
        exit 1
    fi

    echo -e "${GREEN}Restoring Amplify secrets from backup...${NC}"
    echo ""

    # Parse the JSON and restore each secret
    python3 << EOF
import json
import subprocess
import sys

with open("$BACKUP_DIR/$BACKUP_FILE", "r") as f:
    data = json.load(f)

secrets = data.get("secrets", {})

if not secrets:
    print("No secrets found in backup file.")
    sys.exit(0)

print(f"Found {len(secrets)} secret(s) to restore:")
print("")

for name, value in secrets.items():
    print(f"Restoring: {name}...")
    # Use subprocess to pipe the value to ampx
    process = subprocess.Popen(
        ["npx", "ampx", "sandbox", "secret", "set", name],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    stdout, stderr = process.communicate(input=value + "\n")

    if process.returncode == 0:
        print(f"  ✓ Restored: {name}")
    else:
        print(f"  ✗ Failed to restore {name}: {stderr.strip()}")

print("")
print("Restore complete!")
print("")
print("NOTE: You may need to restart your sandbox for changes to take effect:")
print("  npx ampx sandbox")
EOF
}

# Manual backup helper
manual_backup() {
    echo -e "${GREEN}Manual Secret Backup${NC}"
    echo ""
    echo "Enter your secrets manually. They will be saved to $BACKUP_FILE"
    echo "(Press Enter with empty name to finish)"
    echo ""

    # Create temp file for Python to read
    TEMP_FILE=$(mktemp)

    while true; do
        read -p "Secret name (or Enter to finish): " SECRET_NAME
        if [ -z "$SECRET_NAME" ]; then
            break
        fi
        read -sp "Secret value for $SECRET_NAME: " SECRET_VALUE
        echo ""
        echo "$SECRET_NAME=$SECRET_VALUE" >> "$TEMP_FILE"
        echo -e "  ${GREEN}✓${NC} Added: $SECRET_NAME"
    done

    if [ ! -s "$TEMP_FILE" ]; then
        echo "No secrets entered."
        rm -f "$TEMP_FILE"
        exit 0
    fi

    # Create backup JSON
    python3 << EOF
import json
from datetime import datetime

backup = {
    "_backup_date": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "_warning": "SENSITIVE DATA - Do not commit to git!",
    "secrets": {}
}

with open("$TEMP_FILE", "r") as f:
    for line in f:
        line = line.strip()
        if "=" in line:
            name, value = line.split("=", 1)
            backup["secrets"][name] = value

with open("$BACKUP_DIR/$BACKUP_FILE", "w") as f:
    json.dump(backup, f, indent=2)

print(f"\nBacked up {len(backup['secrets'])} secret(s) to $BACKUP_FILE")
EOF

    rm -f "$TEMP_FILE"
    echo -e "${RED}WARNING: This file contains sensitive data!${NC}"
}

# Show secret value (for verification)
show_secret() {
    SECRET_NAME="${2:-GEMINI_API_KEY}"
    echo -e "${YELLOW}Looking for secret: $SECRET_NAME${NC}"

    # Find and show the secret (masked)
    VALUE=$(aws ssm get-parameters-by-path \
        --path "/amplify" \
        --recursive \
        --with-decryption \
        --query "Parameters[?contains(Name, '$SECRET_NAME')].{Path:Name,Value:Value}" \
        --output json 2>/dev/null)

    python3 << EOF
import json

data = json.loads('''$VALUE''')
for item in data:
    path = item["Path"]
    value = item["Value"]
    # Mask the value (show first 4 and last 4 chars)
    if len(value) > 12:
        masked = value[:4] + "..." + value[-4:]
    else:
        masked = "****"
    print(f"  {path}")
    print(f"    Value: {masked}")
    print("")
EOF
}

# Main
case "${1:-}" in
    backup)
        backup_secrets
        ;;
    restore)
        restore_secrets
        ;;
    list)
        list_secrets
        ;;
    manual)
        manual_backup
        ;;
    show)
        show_secret "$@"
        ;;
    *)
        echo "Amplify Secrets Backup & Restore"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  list      - List current sandbox secrets"
        echo "  backup    - Backup secrets to $BACKUP_FILE"
        echo "  restore   - Restore secrets from $BACKUP_FILE"
        echo "  manual    - Manually enter secrets to backup"
        echo "  show      - Show secret value (masked) from SSM"
        echo ""
        echo "Example workflow:"
        echo "  1. ./scripts/secrets-backup-restore.sh backup"
        echo "  2. npx ampx sandbox delete"
        echo "  3. npx ampx sandbox"
        echo "  4. ./scripts/secrets-backup-restore.sh restore"
        ;;
esac

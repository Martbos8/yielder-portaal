#!/bin/bash
# ============================================================================
# Start PRD v2 — Recommendation Engine + Backend
# Gebruik: bash START-V2.sh
# ============================================================================

echo -e "\033[36m"
echo "╔══════════════════════════════════════════════════╗"
echo "║  PRD v2 — Recommendation Engine + Backend        ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "\033[0m"

cd ~/Documents/Yielder-Portaal/portaal-app || exit 1

# Check of v1 klaar is
TODO_COUNT=$(grep -c "Status: TODO" prd.md 2>/dev/null)
if [ "$TODO_COUNT" -gt 0 ]; then
  echo -e "\033[33m[!] PRD v1 heeft nog $TODO_COUNT onafgeronde taken.\033[0m"
  echo ""
  read -r "confirm?Toch doorgaan? (j/n): "
  if [[ "$confirm" != "j" ]]; then
    echo "Gestopt. Wacht tot v1 klaar is."
    exit 0
  fi
fi

# Backup v1 PRD
cp prd.md prd-v1-done.md
echo -e "\033[32m[1/3] PRD v1 gebackupt naar prd-v1-done.md\033[0m"

# Activeer v2
cp prd-v2.md prd.md
echo -e "\033[32m[2/3] PRD v2 geactiveerd\033[0m"

# Start Ralph
echo -e "\033[32m[3/3] Ralph starten...\033[0m"
echo ""
ralph 30

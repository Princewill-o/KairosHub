#!/bin/zsh
# Double-click to start (or restart) Kairos at http://localhost:4173
cd "$(dirname "$0")"
# Stop an older copy that is still using the port
lsof -ti tcp:4173 | xargs kill 2>/dev/null
sleep 1
npm run dev

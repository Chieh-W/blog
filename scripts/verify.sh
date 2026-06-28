#!/usr/bin/env bash
set -euo pipefail
curl -I http://localhost:9053
curl http://localhost:9053 | head -n 20

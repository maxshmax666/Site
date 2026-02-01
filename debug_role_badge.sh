#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

grep -q "role:" src/app/layout/Header.tsx || true

perl -0777 -i -pe 's/(<div className="ml-auto flex items-center gap-2">)/$1\n          <div className="px-3 py-2 rounded-xl text-xs bg-white\/10 text-white\/80">role: {String(role)}<\/div>/s' src/app/layout/Header.tsx

echo "✅ role badge added to Header. Restart dev server."

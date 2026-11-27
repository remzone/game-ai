#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
temp=$(mktemp -d)
trap 'rm -rf "$temp"' EXIT
npm pack three@0.170.0 --pack-destination "$temp" --silent
mkdir -p dist/vendor
tar -xOzf "$temp/three-0.170.0.tgz" package/build/three.module.min.js > dist/vendor/three.module.min.js
tar -xOzf "$temp/three-0.170.0.tgz" package/LICENSE > dist/vendor/three.LICENSE.txt

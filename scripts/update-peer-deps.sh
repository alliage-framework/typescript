#!/bin/bash

source "$(dirname $(readlink -f $0))/_parameters.sh"

ALLIAGE_VERSION=$(jq -r ".devDependencies[\"$ALLIAGE_PACKAGE_NAME\"]" "package.json")
ALLIAGE_CORE_VERSION=$(jq -r ".devDependencies[\"$ALLIAGE_CORE_PACKAGE_NAME\"]" "package.json")

MANIFEST_DEPS=$(jq -r '.alliageManifest.dependencies | join(" ")' package.json)

DEV_DEPS="{ \"$ALLIAGE_PACKAGE_NAME\": \"$ALLIAGE_VERSION\""
for package in $MANIFEST_DEPS; do
  DEV_DEPS="$DEV_DEPS, \"$package\": \"$ALLIAGE_CORE_VERSION\""
done
for package in $DEV_DEPS_TO_PEER_DEPS; do
  VERSION=$(jq -r ".devDependencies[\"$package\"]" package.json)
  DEV_DEPS="$DEV_DEPS, \"$package\": \"$VERSION\""
done
DEV_DEPS="$DEV_DEPS }"

jq ".peerDependencies = $DEV_DEPS" package.json >package.json.new
rm package.json
mv package.json.new package.json

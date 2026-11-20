#!/usr/bin/env bash
# Run as deploy user: bash releases/<sha>/deploy.sh ghcr.io/owner/repo <sha>
set -Eeuo pipefail
umask 077

readonly root=/opt/game-assistant
readonly release="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly image_prefix="${1:?Expected GHCR image prefix}"
readonly image_tag="${2:?Expected full commit SHA}"
[[ "$image_prefix" =~ ^ghcr\.io/[a-z0-9._/-]+$ ]] || { echo 'Invalid image prefix' >&2; exit 1; }
[[ "$image_tag" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid commit SHA' >&2; exit 1; }
[[ "$release" == "$root/releases/$image_tag" ]] || { echo 'Unexpected release directory' >&2; exit 1; }
[[ -f "$root/.env" ]] || { echo "Create $root/.env first" >&2; exit 1; }

# Also serialize manual deployments, including rollback, against CI deployments.
exec 9>"$root/.deploy.lock"
flock -w 600 9
printf 'IMAGE_PREFIX=%s\nIMAGE_TAG=%s\n' "$image_prefix" "$image_tag" > "$release/.images.env"
compose=(docker compose --project-name aigameassistant --env-file "$root/.env"
    --env-file "$release/.images.env" -f "$release/compose.yml")
"${compose[@]}" config --quiet

# Pull everything before changing running containers. Do not stop the old stack first.
"${compose[@]}" pull
if ! "${compose[@]}" up -d --remove-orphans --wait --wait-timeout 300; then
    "${compose[@]}" ps
    echo 'Deployment failed. Inspect docker compose logs on the server. No automatic DB rollback.' >&2
    exit 1
fi

# Test the public HTTPS route as well as container health. DNS must already point here.
domain="$(docker inspect --format '{{range .Config.Env}}{{println .}}{{end}}' \
    "$("${compose[@]}" ps -q caddy)" | sed -n 's/^APP_DOMAIN=//p')"
if ! curl --fail --silent --show-error --retry 12 --retry-all-errors --retry-delay 5 \
    --connect-timeout 10 --max-time 15 "https://$domain/healthz" > /dev/null; then
    echo 'HTTPS smoke check failed. Inspect Caddy logs and DNS; current-release was not updated.' >&2
    exit 1
fi
printf '%s\n' "$image_tag" > "$root/.current-release.tmp"
mv "$root/.current-release.tmp" "$root/current-release"
echo "Deployed $image_tag"

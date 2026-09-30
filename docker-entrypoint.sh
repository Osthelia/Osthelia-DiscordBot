#!/bin/sh
set -e

# The data volume can be bind mounted from the host, which may not match
# the image's node user (uid 1000). Fix ownership before dropping to it.
if [ "$(id -u)" = '0' ]; then
    mkdir -p /app/data
    chown -R node:node /app/data
    exec gosu node "$@"
fi

exec "$@"

#!/bin/bash
# Deploy script for Clinident - clinident.trycompany.es
set -e

SERVER="trycompany.es_cuvhwcdclkp@94.143.138.107"
ROOT="root@94.143.138.107"
REMOTE_PATH="/var/www/vhosts/trycompany.es/clinident.trycompany.es"
BUILD_VERSION="$(date +%Y%m%d%H%M%S)"

echo "=== Clinident Deploy (build $BUILD_VERSION) ==="

# 1. Build
echo "1. Building..."
npm run build

# 2. Inject BUILD_VERSION into the built sw.js (NOT into source — source keeps the placeholder)
echo "2. Injecting BUILD_VERSION=$BUILD_VERSION into dist/sw.js..."
sed -i "s/__BUILD_VERSION__/$BUILD_VERSION/g" dist/sw.js

# 3. Limpiar TODOS los assets antiguos en el server (los hashes cambian cada build,
#    si no se borra se acumulan bundles huérfanos que el SW viejo seguía sirviendo)
echo "3. Cleaning old assets on server..."
ssh $ROOT "find $REMOTE_PATH/assets -type f -delete 2>/dev/null || true"

# 4. Subir dist al server
echo "4. Uploading dist to server..."
scp -r dist/* $SERVER:$REMOTE_PATH/

# 5. Subir .htaccess con cache headers correctos
echo "5. Uploading .htaccess with cache rules..."
scp deploy/.htaccess $SERVER:$REMOTE_PATH/.htaccess

# 6. Fix permissions
echo "6. Fixing permissions..."
ssh $ROOT "chmod 755 $REMOTE_PATH/assets/ && find $REMOTE_PATH -type f -exec chmod 644 {} +"

echo ""
echo "Done! https://clinident.trycompany.es ($BUILD_VERSION)"
echo "Verifica con:"
echo "  curl -I https://clinident.trycompany.es/sw.js"
echo "  curl -I https://clinident.trycompany.es/index.html"

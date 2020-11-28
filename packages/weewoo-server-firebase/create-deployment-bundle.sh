#!/bin/bash
set -euxo pipefail

echo "Removing existing Webpack dist folder..."
rm -rf deploy

echo "Running Webpack..."
yarn run webpack

echo "Creating a minimal package.json..."
node create-package-json-for-bundle.js > deploy/package.json

echo "Printing objects in dist folder..."
du -a --bytes deploy/*
du -a -h deploy/*

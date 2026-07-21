#!/usr/bin/env bash

DEPLOY_USER="${DEPLOY_USER:-kicktipp}"
DEPLOY_HOST="${DEPLOY_HOST:-regulus.uberspace.de}"
APP_NAME="${APP_NAME:-kicktipp}"
APP_DIR="${APP_DIR:-/home/${DEPLOY_USER}/kicktipp-deluxe}"
RELEASES_DIR="${RELEASES_DIR:-/home/${DEPLOY_USER}/releases}"
SERVICE_NAME="${SERVICE_NAME:-kicktipp}"
DOMAIN="${DOMAIN:-https://kicktipp.schultypografie.de}"
LOCAL_PORT="${LOCAL_PORT:-3000}"
BUILD_PLATFORM="${BUILD_PLATFORM:-linux/amd64}"
BUILD_NODE_IMAGE="${BUILD_NODE_IMAGE:-node:20.19.5-bookworm-slim}"

SSH_TARGET="${DEPLOY_USER}@${DEPLOY_HOST}"

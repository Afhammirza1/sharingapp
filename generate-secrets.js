#!/usr/bin/env node

/**
 * Generate secure secrets for ShareNear environment variables
 * Run: node generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Generating secure secrets for ShareNear...\n');

// Generate secure random strings
const sessionSecret = crypto.randomBytes(32).toString('hex');
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('Copy these values to your .env file:\n');
console.log('SESSION_SECRET=' + sessionSecret);
console.log('JWT_SECRET=' + jwtSecret);

console.log('\n✅ Secrets generated successfully!');
console.log('⚠️  Keep these secrets secure and never commit them to version control.');
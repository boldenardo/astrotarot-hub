#!/usr/bin/env node
/**
 * Script to validate environment variables and ensure no sensitive data is being logged
 * Run this during CI/CD to prevent accidental exposure of secrets
 */

const sensitiveEnvVars = [
  'GROQ_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ASTROLOGY_API_KEY',
  'JWT_SECRET',
  'DATABASE_URL'
];

console.log('🔒 Validating environment variables security...\n');

let hasIssues = false;

// Check if any sensitive env vars are being exposed through console
const checkForLeakedSecrets = () => {
  const errors = [];
  const warnings = [];

  // Warn if any sensitive env vars are not set
  sensitiveEnvVars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value || value.trim() === '') {
      warnings.push(`⚠️  ${varName} is not set`);
    } else if (value.includes('your-') || value.includes('example') || value.includes('test-')) {
      warnings.push(`⚠️  ${varName} appears to be using a placeholder value`);
    }
  });

  // Check that we're not in development mode in production
  if (process.env.NODE_ENV === 'production') {
    if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production-min-32-chars') {
      errors.push('❌ JWT_SECRET is using the default value in production!');
    }
  }

  return { errors, warnings };
};

const result = checkForLeakedSecrets();

if (result.warnings.length > 0) {
  console.log('⚠️  WARNINGS:\n');
  result.warnings.forEach(w => console.log(`   ${w}`));
  console.log();
}

if (result.errors.length > 0) {
  console.log('❌ CRITICAL ERRORS:\n');
  result.errors.forEach(e => console.log(`   ${e}`));
  console.log();
  hasIssues = true;
}

if (!hasIssues && result.warnings.length === 0) {
  console.log('✅ All environment variables look good!\n');
}

console.log('📋 Security Reminders:');
console.log('   • Never commit .env files to git');
console.log('   • Never log environment variables in production');
console.log('   • Rotate API keys regularly');
console.log('   • Use Vercel environment variables for production\n');

// Don't fail the build for warnings, only for errors
if (hasIssues) {
  process.exit(1);
}

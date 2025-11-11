#!/usr/bin/env node
/**
 * Generate Password Hashes
 * Script này tạo hashes bcrypt cho các passwords test
 */

import bcrypt from 'bcrypt';

console.log('\n🔐 Password Hash Generator\n');
console.log('='.repeat(70));

const testPasswords = [
  '123',
  'hungdev123',
  'staff123',
  'customer123',
  'password123'
];

async function generateHashes() {
  console.log('\nGenerating hashes for test passwords:\n');
  
  for (const password of testPasswords) {
    try {
      const hash = await bcrypt.hash(password, 10);
      console.log(`Password: "${password}"`);
      console.log(`Hash:     ${hash}`);
      console.log();
    } catch (error) {
      console.error(`Error hashing "${password}":`, error.message);
    }
  }
}

// Also verify existing hashes
async function verifyExistingHash() {
  console.log('\n' + '='.repeat(70));
  console.log('\nVerifying existing hash from users.json:\n');
  
  // This is the hash for "staff" user
  const existingHash = '$2b$10$Bk8u8WPNXL2u6WL5.fsmXOmP6L5C8D5Z.F8Q2N7O8P9Q0R1S2T3U4V5';
  
  const testPassword = '123';
  const isValid = await bcrypt.compare(testPassword, existingHash);
  
  console.log(`Hash: ${existingHash}`);
  console.log(`Password to test: "${testPassword}"`);
  console.log(`Match: ${isValid ? '✅ YES' : '❌ NO'}`);
  
  if (isValid) {
    console.log('\n💡 This hash works! Use password "123"');
  }
}

generateHashes().then(() => {
  verifyExistingHash();
}).then(() => {
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 How to use:\n');
  console.log('1. Copy hashes above');
  console.log('2. Update mock_data/users.json with new hashes');
  console.log('3. All passwords will be "123" for simplicity\n');
  console.log('='.repeat(70));
  console.log();
}).catch(error => {
  console.error('Error:', error);
});

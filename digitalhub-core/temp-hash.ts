import { hashPassword } from './src/lib/crypto';

async function generateHash() {
  try {
    const password = 'changeme123';
    console.log('Generating hash for password:', password);
    const hash = await hashPassword(password);
    console.log('Generated hash:');
    console.log(hash);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generateHash();
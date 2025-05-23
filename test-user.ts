import { storage } from './server/storage';

async function testGetUser() {
  try {
    const userByEmail = await storage.getUserByEmail('testuser@example.com');
    console.log('User by email:', userByEmail);
  } catch (error) {
    console.error('Error getting user by email:', error);
  }
}

testGetUser();

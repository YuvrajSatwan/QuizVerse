import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'

// Your Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyADdBE6gn8_mkZQg-gjCwWrUQ8bCSGtHN0",
  authDomain: "quizverse-54259.firebaseapp.com",
  projectId: "quizverse-54259",
  storageBucket: "quizverse-54259.firebasestorage.app",
  messagingSenderId: "304440143780",
  appId: "1:304440143780:web:713b8693a2b2f0b3299b31",
  measurementId: "G-H4YKTDHGTK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Test function to verify Firebase connectivity
export const testFirebaseConnection = async () => {
  try {
    console.log('Testing Firebase connection...')
    const testRef = await addDoc(collection(db, 'test'), {
      test: true,
      timestamp: serverTimestamp()
    })
    console.log('Firebase connection successful! Test document ID:', testRef.id)
    return true
  } catch (error) {
    console.error('Firebase connection failed:', error)
    return false
  }
}

export default app


# Firebase Setup Guide

## Issue: Quiz Creation Not Working

The quiz creation functionality is currently not working because of Firebase configuration issues. Here's how to fix it:

### 1. Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `quizverse-54259`
3. In the left sidebar, click on "Firestore Database"
4. If not already enabled, click "Create Database"
5. Choose "Start in test mode" for development (allows all reads/writes)

### 2. Deploy Security Rules (Optional)

If you want to use custom security rules:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init firestore`
4. Deploy the rules: `firebase deploy --only firestore:rules`

### 3. Alternative: Use Test Mode

For development, you can simply enable "test mode" in the Firebase Console:
1. Go to Firestore Database
2. Click on "Rules" tab
3. Make sure the rules allow read/write access

### 4. Verify Configuration

After setup, the quiz creation should work. Check the browser console for any error messages.

### Common Issues:

1. **"Missing or insufficient permissions"**: Firestore security rules are too restrictive
2. **"Firestore is not enabled"**: Need to enable Firestore in Firebase Console
3. **Network errors**: Check internet connection and Firebase project configuration

### Production Security Rules

For production, replace the permissive rules with proper authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /quizzes/{quizId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

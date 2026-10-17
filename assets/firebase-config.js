/*
 * MODEL AI Firebase web configuration.
 * This is public client configuration, not an Admin/service-account secret.
 * Verify it in Firebase Console → Project settings → Your apps if needed.
 */
(() => {
  'use strict';
  const config = {
    apiKey: 'AIzaSyDUcWSbU-ELP7Erx9yGPbq65clsn2ME8pk',
    authDomain: 'model-ai-727b1.firebaseapp.com',
    projectId: 'model-ai-727b1',
    appId: '1:970799402645:web:4e2a93dbacbfd6ee97d59c',
    messagingSenderId: '970799402645',
    measurementId: 'G-0EW8BHNTH3'
  };
  window.MODEL_AI_FIREBASE_CONFIG = config;
  window.MODEL_AI_FIREBASE_CONFIGURED = Object.values(config).every(
    value => typeof value === 'string' && value.length > 0 && !value.startsWith('PASTE_')
  );
})();

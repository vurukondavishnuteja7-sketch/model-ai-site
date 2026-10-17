/*
 * MODEL AI Firebase web configuration.
 * This is public client configuration, not an Admin/service-account secret.
 * Verify it in Firebase Console → Project settings → Your apps if needed.
 */
(() => {
  'use strict';
  const config = {
    apiKey: 'AIzaSyDX1ru4Tt19yqfIe3oKUtc3yn5v_155fms',
    authDomain: 'modelaitools.firebaseapp.com',
    projectId: 'modelaitools',
    appId: '1:833872426359:web:67a321c8b5619ca79d5d72',
    messagingSenderId: '833872426359',
    measurementId: 'G-DZM6GER0W6'
  };
  window.MODEL_AI_FIREBASE_CONFIG = config;
  window.MODEL_AI_FIREBASE_CONFIGURED = Object.values(config).every(
    value => typeof value === 'string' && value.length > 0 && !value.startsWith('PASTE_')
  );
})();

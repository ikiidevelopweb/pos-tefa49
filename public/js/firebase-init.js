/* ================================================================
   FIREBASE INIT — koneksi ke Firestore + adapter real-time
   ================================================================
   Memakai Firebase compat SDK (lewat <script src>) agar:
   - Tidak butuh bundler/build step (cocok untuk static hosting Vercel)
   - Tetap berjalan bila dites lokal dari file://
   - Mudah diberi real-time listener (onSnapshot) untuk sinkron lintas device
   ================================================================ */

// ⚠️ GANTI dengan konfigurasi project Firebase Anda sendiri:
// Firebase Console → Project Settings → General → "Your apps" → SDK config
window.firebaseConfig = {
  apiKey: "AIzaSyAsgQtXBh3u1SL4-TD-cPAwNjklbachpkc",
  authDomain: "tefa-f002b.firebaseapp.com",
  projectId: "tefa-f002b",
  storageBucket: "tefa-f002b.firebasestorage.app",
  messagingSenderId: "514249026560",
  appId: "1:514249026560:web:09ad40c65932ee789dbce5",
  measurementId: "G-6BHY6LN9X0"
};

(function initFirebase() {
  try {
    if (!window.firebase) {
      console.error('❌ Firebase SDK tidak termuat (cek koneksi internet / urutan <script> di index.html).');
      window._firebaseReady = true;
      document.dispatchEvent(new Event('firebase-ready'));
      return;
    }

    firebase.initializeApp(window.firebaseConfig);
    const db = firebase.firestore();

    // Cache offline (IndexedDB) — app tetap bisa dipakai saat koneksi lemah/putus
    db.enablePersistence({ synchronizeTabs: true }).catch(function (err) {
      if (err.code === 'failed-precondition') {
        console.warn('Persistence: ada beberapa tab terbuka, hanya 1 tab yang bisa mode offline.');
      } else if (err.code === 'unimplemented') {
        console.warn('Persistence tidak didukung oleh browser ini.');
      }
    });

    // Adapter tipis di atas Firestore SDK, dipakai oleh sync.js
    window._firebase = {
      db: db,
      doc: function (dbRef, col, docId) { return dbRef.collection(col).doc(docId); },
      getDoc: function (ref) { return ref.get(); },
      setDoc: function (ref, data) { return ref.set(data); },
      deleteDoc: function (ref) { return ref.delete(); },
      onSnapshot: function (ref, onNext, onError) { return ref.onSnapshot(onNext, onError); }
    };

    window._firebaseReady = true;
    document.dispatchEvent(new Event('firebase-ready'));
    console.log('✅ Firebase siap. Sinkronisasi real-time aktif.');
  } catch (err) {
    console.error('❌ Firebase init gagal:', err);
    window._firebaseReady = true; // tetap resolve agar app tidak hang
    document.dispatchEvent(new Event('firebase-ready'));
  }
})();

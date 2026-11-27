import admin from "firebase-admin";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const keyPath = path.join(__dirname, "serviceAccountKey.json");

// Firebase is optional: without a service-account key, uploads are stored on this
// computer instead (see uploadController.js) and `bucket` is null.
let bucket = null;

if (existsSync(keyPath)) {
  const serviceAccount = JSON.parse(readFileSync(keyPath));

  // Initialize Firebase Admin SDK
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "preptrack-bde72.firebasestorage.app",
  });

  bucket = admin.storage().bucket();
  console.log("☁️  File uploads: Firebase Storage");
} else {
  console.log("💾 File uploads: local disk (no Firebase key found)");
}

export default bucket;

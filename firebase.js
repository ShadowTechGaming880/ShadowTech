import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAzfJpkNp_YG-7NWemcO5_IpwBd8RKWJ_U",
  authDomain: "shadowtech-46227.firebaseapp.com",
  projectId: "shadowtech-46227",
  storageBucket: "shadowtech-46227.firebasestorage.app",
  messagingSenderId: "835221476923",
  appId: "1:835221476923:web:abf36af9c5080aa73cee1e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
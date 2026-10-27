
import { auth } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const message = document.getElementById("profileMessage");
const email = document.getElementById("profileEmail");
const logoutButton = document.getElementById("logoutButton");

logoutButton.hidden = true;

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    message.textContent = `Welcome, ${user.displayName || "Gamer"}! 🎮`;
    email.textContent = user.email || "";
    logoutButton.hidden = false;
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.replace("index.html");
    } catch (error) {
        message.textContent = "Logout failed. Please try again.";
    }
});

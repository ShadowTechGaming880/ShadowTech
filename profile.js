
import { auth } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const logoutButton = document.getElementById("logoutButton");

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.replace("login.html");
        return;
    }

    profileName.textContent = user.displayName || "Gamer";
    profileEmail.textContent = user.email || "No email available";
    logoutButton.hidden = false;
});

logoutButton.addEventListener("click", async () => {
    try {
        await signOut(auth);
        window.location.replace("index.html");
    } catch (error) {
        alert("Could not log out. Please try again.");
        console.error(error);
    }
});

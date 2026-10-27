
import { auth } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const loginLink = document.getElementById("loginLink");
const signupLink = document.getElementById("signupLink");
const profileLink = document.getElementById("profileLink");
const userGreeting = document.getElementById("userGreeting");
const logoutButton = document.getElementById("logoutButton");

onAuthStateChanged(auth, (user) => {
    if (loginLink) loginLink.hidden = !!user;
    if (signupLink) signupLink.hidden = !!user;
    if (profileLink) profileLink.hidden = !user;

    if (userGreeting) {
        userGreeting.hidden = !user;
        userGreeting.textContent = user
            ? `Hi, ${user.displayName || "Gamer"}!`
            : "";
    }

    if (logoutButton) logoutButton.hidden = !user;
});

if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            await signOut(auth);
            window.location.href = "index.html";
        } catch (error) {
            alert("Could not log out. Please try again.");
            console.error(error);
        }
    });
}

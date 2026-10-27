
import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const form = document.getElementById("loginForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Logging in...";

    try {
        const result = await signInWithEmailAndPassword(
            auth, email, password
        );

        message.textContent =
            `Welcome back, ${result.user.displayName || "gamer"}! 🎮`;

        form.reset();
    } catch (error) {
        const messages = {
            "auth/invalid-credential":
                "Email or password is incorrect.",
            "auth/user-not-found":
                "No account found. Please sign up first.",
            "auth/invalid-email":
                "Please enter a valid email address.",
            "auth/too-many-requests":
                "Too many attempts. Please try again later."
        };

        message.textContent =
            messages[error.code] || "Login failed. Please try again.";
    }
});


import { auth } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

const form = document.getElementById("signupForm");
const message = document.getElementById("message");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Creating your account...";

    try {
        const result = await createUserWithEmailAndPassword(
            auth, email, password
        );

        await updateProfile(result.user, {
            displayName: username
        });

        message.textContent = "Account created successfully! 🎮";
        form.reset();
    } catch (error) {
        const messages = {
            "auth/email-already-in-use": "This email is already registered.",
            "auth/invalid-email": "Please enter a valid email address.",
            "auth/weak-password": "Please choose a stronger password."
        };

        message.textContent =
            messages[error.code] || "Could not create account. Please try again.";
    }
});

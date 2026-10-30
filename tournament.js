
import { auth } from "./firebase.js";

import { onAuthStateChanged } from
    "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    runTransaction,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

// Reuse the Firebase app already initialized by firebase.js.
const db = getFirestore(auth.app);

const tournamentForm = document.getElementById("tournamentForm");
const tournamentList = document.getElementById("tournamentList");
const formMessage = document.getElementById("formMessage");
const listMessage = document.getElementById("listMessage");
const createButton = document.getElementById("createButton");
const authStatus = document.getElementById("authStatus");
const loginLink = document.getElementById("loginLink");
const tournamentSearch = document.getElementById("tournamentSearch");
const gameFilter = document.getElementById("gameFilter");

const tournamentsRef = collection(db, "tournaments");

let currentUser = null;
let allTournaments = [];
let unsubscribeTournaments = null;
let registrationBusy = false;

function setMessage(element, message, isError = false) {
    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#fda4af" : "#aaa9c2";
}

function safeDate(value) {
    if (!value) return "Date to be announced";

    // Parse a date-only value in local time to avoid timezone shifts.
    const parts = value.split("-").map(Number);

    if (parts.length !== 3 || parts.some(Number.isNaN)) {
        return "Date to be announced";
    }

    const date = new Date(parts[0], parts[1] - 1, parts[2]);

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function isPastDate(value) {
    if (!value) return false;

    const parts = value.split("-").map(Number);
    if (parts.length !== 3 || parts.some(Number.isNaN)) return false;

    const chosen = new Date(parts[0], parts[1] - 1, parts[2]);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    return chosen < today;
}

function updateStats() {
    const tournamentCount = document.getElementById("tournamentCount");
    const gameCount = document.getElementById("gameCount");
    const registrationCount = document.getElementById("registrationCount");

    if (tournamentCount) {
        tournamentCount.textContent = allTournaments.length;
    }

    if (gameCount) {
        gameCount.textContent = new Set(
            allTournaments.map(item => item.game)
        ).size;
    }

    if (registrationCount) {
        registrationCount.textContent = allTournaments.reduce(
            (total, item) => total + (Number(item.participantCount) || 0),
            0
        );
    }
}

function makeElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;

    return element;
}

function renderTournaments() {
    if (!tournamentList) return;

    const searchText = tournamentSearch
        ? tournamentSearch.value.trim().toLowerCase()
        : "";

    const selectedGame = gameFilter ? gameFilter.value : "all";

    const filtered = allTournaments.filter(tournament => {
        const matchesSearch =
            String(tournament.name || "").toLowerCase().includes(searchText) ||
            String(tournament.game || "").toLowerCase().includes(searchText);

        const matchesGame =
            selectedGame === "all" || tournament.game === selectedGame;

        return matchesSearch && matchesGame;
    });

    tournamentList.replaceChildren();

    if (filtered.length === 0) {
        setMessage(
            listMessage,
            allTournaments.length === 0
                ? "No tournaments yet. Sign in to create the first one."
                : "No matching tournaments. Try another search."
        );
        return;
    }

    setMessage(listMessage, `${filtered.length} tournament(s) found.`);

    filtered.forEach(tournament => {
        const card = makeElement("article", "tournament-card");
        const top = makeElement("div", "tournament-card-top");

        top.appendChild(makeElement(
            "span",
            "game-chip",
            tournament.game || "Gaming"
        ));

        const capacity = Number(tournament.capacity) || 0;
        const count = Number(tournament.participantCount) || 0;
        const isFull = capacity > 0 && count >= capacity;
        const status = makeElement(
            "span",
            `status-chip${isFull ? " full" : ""}`,
            isFull ? "FULL" : "OPEN"
        );

        top.appendChild(status);

        card.appendChild(top);
        card.appendChild(makeElement("h3", "", tournament.name || "Tournament"));

        card.appendChild(makeElement(
            "p",
            "",
            `Hosted by ${tournament.organizerName || "ShadowTech gamer"}`
        ));

        const meta = makeElement("div", "tournament-meta");

        meta.appendChild(makeElement(
            "span",
            "",
            `📅 ${safeDate(tournament.startDate)}`
        ));

        meta.appendChild(makeElement(
            "span",
            "",
            `👥 ${count} / ${capacity} participants`
        ));

        meta.appendChild(makeElement(
            "span",
            "",
            `🏆 ${tournament.format || "Tournament"}`
        ));

        card.appendChild(meta);

        const actions = makeElement("div", "tournament-actions");

        const registerButton = makeElement(
            "button",
            "",
            currentUser ? "Register to compete" : "Log in to register"
        );

        registerButton.type = "button";
        registerButton.disabled =
            !currentUser || isFull || registrationBusy;

        registerButton.addEventListener("click", () => {
            registerForTournament(tournament.id);
        });

        actions.appendChild(registerButton);

        if (currentUser && currentUser.uid === tournament.createdBy) {
            const deleteButton = makeElement("button", "", "Delete tournament");
            deleteButton.type = "button";

            deleteButton.addEventListener("click", () => {
                removeTournament(tournament.id, tournament.name);
            });

            actions.appendChild(deleteButton);
        }

        card.appendChild(actions);
        tournamentList.appendChild(card);
    });
}

async function createTournament(event) {
    event.preventDefault();

    if (!currentUser) {
        setMessage(formMessage, "Please log in before creating a tournament.", true);
        return;
    }

    const name = document.getElementById("tournamentName").value.trim();
    const game = document.getElementById("tournamentGame").value;
    const capacity = Number(document.getElementById("playerLimit").value);
    const format = document.getElementById("tournamentFormat").value;
    const startDate = document.getElementById("tournamentDate").value;

    if (!name || !game || !capacity || !format || !startDate) {
        setMessage(formMessage, "Please complete every field.", true);
        return;
    }

    if (isPastDate(startDate)) {
        setMessage(formMessage, "Choose today or a future date.", true);
        return;
    }

    createButton.disabled = true;
    createButton.textContent = "Creating...";
    setMessage(formMessage, "Publishing your tournament...");

    try {
        const organizerName =
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "ShadowTech gamer";

        await addDoc(tournamentsRef, {
            name,
            game,
            capacity,
            format,
            startDate,
            participantCount: 0,
            createdBy: currentUser.uid,
            organizerName,
            createdAt: serverTimestamp()
        });

        tournamentForm.reset();
        document.getElementById("playerLimit").value = "16";

        setMessage(formMessage, "Tournament created successfully!");
    } catch (error) {
        console.error("Tournament creation failed:", error);

        setMessage(
            formMessage,
            "Could not create the tournament. Check your Firestore rules and try again.",
            true
        );
    } finally {
        createButton.disabled = false;
        createButton.textContent = "+ Create tournament";
    }
}

async function registerForTournament(tournamentId) {
    if (!currentUser) {
        setMessage(listMessage, "Please log in to register.", true);
        return;
    }

    if (registrationBusy) return;

    registrationBusy = true;
    renderTournaments();

    try {
        const tournamentRef = doc(db, "tournaments", tournamentId);
        const registrationRef = doc(
            db,
            "tournaments",
            tournamentId,
            "registrations",
            currentUser.uid
        );

        await runTransaction(db, async transaction => {
            const tournamentSnapshot = await transaction.get(tournamentRef);
            const registrationSnapshot = await transaction.get(registrationRef);

            if (!tournamentSnapshot.exists()) {
                throw new Error("This tournament no longer exists.");
            }

            if (registrationSnapshot.exists()) {
                throw new Error("You are already registered for this tournament.");
            }

            const tournament = tournamentSnapshot.data();
            const capacity = Number(tournament.capacity) || 0;
            const count = Number(tournament.participantCount) || 0;

            if (capacity < 1 || count >= capacity) {
                throw new Error("Sorry, this tournament is full.");
            }

            transaction.set(registrationRef, {
                uid: currentUser.uid,
                displayName:
                    currentUser.displayName ||
                    currentUser.email?.split("@")[0] ||
                    "ShadowTech gamer",
                registeredAt: serverTimestamp()
            });

            transaction.update(tournamentRef, {
                participantCount: count + 1
            });
        });

        setMessage(listMessage, "You're registered! Good luck in the tournament.");
    } catch (error) {
        console.error("Tournament registration failed:", error);

        setMessage(
            listMessage,
            error.message || "Registration failed. Please try again.",
            true
        );
    } finally {
        registrationBusy = false;
        renderTournaments();
    }
}

async function removeTournament(tournamentId, tournamentName) {
    if (!currentUser) return;

    const confirmed = window.confirm(
        `Delete "${tournamentName}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
        await deleteDoc(doc(db, "tournaments", tournamentId));
        setMessage(listMessage, "Tournament deleted.");
    } catch (error) {
        console.error("Tournament deletion failed:", error);

        setMessage(
            listMessage,
            "Could not delete this tournament. Check your Firestore rules.",
            true
        );
    }
}

function watchTournaments() {
    if (unsubscribeTournaments) {
        unsubscribeTournaments();
    }

    unsubscribeTournaments = onSnapshot(
        tournamentsRef,
        snapshot => {
            allTournaments = snapshot.docs.map(item => ({
                id: item.id,
                ...item.data()
            }));

            allTournaments.sort((a, b) => {
                const dateA = a.startDate || "";
                const dateB = b.startDate || "";
                return dateA.localeCompare(dateB);
            });

            updateStats();
            renderTournaments();
        },
        error => {
            console.error("Could not load tournaments:", error);

            setMessage(
                listMessage,
                "Could not load tournaments. Check your internet connection and Firestore rules.",
                true
            );
        }
    );
}

if (tournamentForm) {
    tournamentForm.addEventListener("submit", createTournament);
}

if (tournamentSearch) {
    tournamentSearch.addEventListener("input", renderTournaments);
}

if (gameFilter) {
    gameFilter.addEventListener("change", renderTournaments);
}

onAuthStateChanged(auth, user => {
    currentUser = user;

    if (authStatus) {
        authStatus.textContent = user
            ? `Signed in as ${user.displayName || user.email?.split("@")[0] || "Gamer"}`
            : "Not signed in";
    }

    if (loginLink) {
        loginLink.hidden = Boolean(user);
    }

    if (createButton) {
        createButton.disabled = !user;
    }

    if (user) {
        setMessage(formMessage, "You're signed in and can create tournaments.");
    } else {
        setMessage(formMessage, "Log in to create and join tournaments.");
    }

    renderTournaments();
});

watchTournaments();

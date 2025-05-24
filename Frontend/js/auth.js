// js/auth.js

// Ensure Firebase is initialized in firebase-init.js and `auth` and `db` are globally accessible.

// --- GET FORM REFERENCES ---
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');

// --- GET NAVBAR LINK REFERENCES (for dynamic visibility) ---
const loginLi = document.querySelector('.login-li');
const signupLi = document.querySelector('.signup-li');
const logoutLi = document.querySelector('.logout-li');
const logoutLink = document.getElementById('logout-link');
const reportLi = document.querySelector('.report-li'); // New: Get the Report list item
const reportLink = document.getElementById('report-link'); // New: Get the Report link itself
const homeLink = document.getElementById('home-link'); // Get the Home link
const liveMapLink = document.getElementById('live-map-link'); // Get the Live Map link
const donateLink = document.getElementById('donate-link'); // Get the Donate link

let currentUser = null; // To store the current authenticated user

// Function to show a specific section and hide others
function showSection(sectionId) {
    const sections = document.querySelectorAll('.main-content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
        // Special handling for map sections to ensure they render correctly
        // These global functions are exposed by map.js and report.js
        if (sectionId === 'map' && typeof initLiveMap === 'function') {
            initLiveMap(); // Re-initialize or refresh the main live map
        }
        if (sectionId === 'report-disaster' && typeof initializeReportMap === 'function') {
            initializeReportMap(); // Initialize or refresh the report map
        }
    }
}

// --- SIGN UP LOGIC ---
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = signupForm['name'].value;
        const email = signupForm['email'].value;
        const password = signupForm['password'].value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                console.log('User signed up:', cred.user);
                return db.collection('users').doc(cred.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                // Using alert for simplicity, consider a custom modal in production
                alert('Sign up successful! Welcome to ReliefLink.');
                // Redirection handled by onAuthStateChanged
            })
            .catch((error) => {
                const errorMessage = error.message;
                console.error('Sign up error:', errorMessage);
                alert('Sign up failed: ' + errorMessage);
            });
    });
}

// --- LOGIN LOGIC ---
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const email = loginForm['email'].value;
        const password = loginForm['password'].value;

        auth.signInWithEmailAndPassword(email, password)
            .then((cred) => {
                console.log('User logged in:', cred.user);
                // Using alert for simplicity, consider a custom modal in production
                alert('Login successful! Welcome back.');
                // Redirection handled by onAuthStateChanged
            })
            .catch((error) => {
                const errorMessage = error.message;
                console.error('Login error:', errorMessage);
                alert('Login failed: ' + errorMessage);
            });
    });
}

// --- LOGOUT LOGIC ---
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut().then(() => {
            console.log('User signed out');
            // Using alert for simplicity, consider a custom modal in production
            alert('You have been signed out.');
            window.location.href = './login.html'; // Redirect to login page after logout
        }).catch((error) => {
            console.error('Logout error:', error.message);
            alert('Logout failed: ' + error.message);
        });
    });
}

// --- NAVIGATION LINK CLICK HANDLERS ---
// Attach event listeners to the navigation links to show respective sections
if (homeLink) {
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('home'); // Show the home carousel
    });
}

if (liveMapLink) {
    liveMapLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('map'); // Show the live map section
    });
}

if (donateLink) {
    donateLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('donate'); // Show the donate section
    });
}

// New: Handle Report link click
if (reportLink) {
    reportLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('report-disaster'); // Show the disaster reporting form
    });
}

// --- AUTH STATE CHANGE LISTENER ---
// This listens for changes in the user's sign-in state (login, logout, initial load)
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in.
        currentUser = user;
        console.log('User is signed in:', currentUser.email);

        // If the user is on the login or signup page, redirect to index.html
        const currentPage = window.location.pathname;
        if (currentPage.endsWith('login.html') || currentPage.endsWith('signup.html')) {
            window.location.href = './index.html';
        }

        // Update navbar for logged in user: Hide Login/Signup, Show Logout and Report
        if (loginLi) loginLi.style.display = 'none';
        if (signupLi) signupLi.style.display = 'none';
        if (logoutLi) logoutLi.style.display = 'block';
        if (reportLi) reportLi.style.display = 'block'; // Show Report link

        // Ensure a default section is shown when logged in (e.g., home or report)
        // Check if there's a hash in the URL and if it corresponds to a valid section
        const currentHash = window.location.hash.substring(1); // Get hash without '#'
        if (!currentHash || !document.getElementById(currentHash) || !document.getElementById(currentHash).classList.contains('main-content-section')) {
             showSection('home'); // Default to home if no valid hash is present or not a main section
        } else {
            showSection(currentHash); // Show section based on hash if it exists and is a main section
        }

    } else {
        // User is signed out.
        currentUser = null;
        console.log('User is signed out.');

        // Update navbar for logged out user: Show Login/Signup, Hide Logout and Report
        if (loginLi) loginLi.style.display = 'block';
        if (signupLi) signupLi.style.display = 'block';
        if (logoutLi) logoutLi.style.display = 'none';
        if (reportLi) reportLi.style.display = 'none'; // Hide Report link

        // If on index.html and logged out, always show the home section
        const currentPage = window.location.pathname;
        if (currentPage.endsWith('index.html')) {
            showSection('home'); // Always show home when logged out on index
        }
    }
});
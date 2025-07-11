// js/auth.js

// Ensure Firebase is initialized in firebase-init.js and auth and db are globally accessible.

// --- GET FORM REFERENCES ---
const signupForm = document.getElementById('signup-form');
const loginForm = document.getElementById('login-form');

// --- GET NAVBAR LINK REFERENCES (for dynamic visibility) ---
const loginLi = document.querySelector('.login-li');
const signupLi = document.querySelector('.signup-li');
const logoutLi = document.querySelector('.logout-li');
const logoutLink = document.getElementById('logout-link');
const reportLi = document.querySelector('.report-li'); // Get the Report list item
const reportLink = document.getElementById('report-link'); // Get the Report link itself
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

        // Special handling for map sections to ensure map initialization/invalidation
        if (sectionId === 'map-section' && typeof initLiveMap === 'function') {
            initLiveMap(); // Call the function from map.js to initialize/refresh the main map
        } else if (sectionId === 'report-section' && typeof initializeReportMap === 'function') {
            initializeReportMap(); // Call the function from report.js to initialize/refresh the report map
        }
    }
}

// Function to display messages (success/error)
function displayMessage(message, isError = false) {
    const messageBox = document.getElementById('message-box');
    if (messageBox) {
        messageBox.textContent = message;
        messageBox.className = 'message-box ' + (isError ? 'error' : 'success');
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    } else {
        console.warn('Message box element not found.');
        if (isError) {
            console.error(message);
        } else {
            console.log(message);
        }
    }
}

// --- AUTH STATE LISTENER ---
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // User is signed in.
        currentUser = user;
        console.log('User is signed in:', currentUser.email);

        // Update navbar for logged in user: Hide Login/Signup, Show Logout and Report
        if (loginLi) loginLi.style.display = 'none';
        if (signupLi) signupLi.style.display = 'none';
        if (logoutLi) logoutLi.style.display = 'block';
        if (reportLi) reportLi.style.display = 'block'; // Show Report link

        // Ensure a default section is shown when logged in (e.g., home or report)
        const currentHash = window.location.hash.substring(1); // Get hash without '#'
        if (!currentHash || !document.getElementById(currentHash) || !document.getElementById(currentHash).classList.contains('main-content-section')) {
             showSection('home-section'); // Default to home if no valid hash is present or not a main section
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
            showSection('home-section'); // Always show home section on index.html if logged out
        }
        // If on login.html or signup.html, they remain visible as they are not "sections" managed by showSection
    }
});


// --- EVENT LISTENERS FOR NAVBAR LINKS ---
if (homeLink) {
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('home-section');
        history.pushState(null, '', '#home-section'); // Update URL hash
    });
}

if (liveMapLink) {
    liveMapLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('map-section');
        history.pushState(null, '', '#map-section'); // Update URL hash
    });
}

if (donateLink) {
    donateLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('donate-section');
        history.pushState(null, '', '#donate-section'); // Update URL hash
    });
}

if (reportLink) {
    reportLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (currentUser) { // Only allow reporting if logged in
            showSection('report-section');
            history.pushState(null, '', '#report-section'); // Update URL hash
        } else {
            displayMessage('Please log in to report a disaster.', true);
            // Optionally, redirect to login page or show login modal
            setTimeout(() => {
                window.location.href = './login.html';
            }, 1000);
        }
    });
}

// Handler for the "Report a Disaster" button in the carousel
window.handleReportButtonClick = function() {
    if (currentUser) {
        showSection('report-section');
        history.pushState(null, '', '#report-section');
    } else {
        displayMessage('Please log in to report a disaster.', true);
        // Optionally, redirect to login page or show login modal
        setTimeout(() => {
            window.location.href = './login.html';
        }, 1000);
    }
};


// --- LOGIN FORM SUBMISSION ---
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm['email'].value;
        const password = loginForm['password'].value;

        auth.signInWithEmailAndPassword(email, password)
            .then((cred) => {
                console.log('User logged in:', cred.user);
                // Redirect to index.html after successful login
                window.location.href = './index.html#home-section'; // Redirect to home section
            })
            .catch((error) => {
                console.error('Login error:', error.message);
                alert(error.message); // Display Firebase error message
            });
    });
}

// --- SIGNUP FORM SUBMISSION ---
if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = signupForm['name'].value; // You might want to store this in Firestore later
        const email = signupForm['email'].value;
        const password = signupForm['password'].value;

        auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                console.log('User signed up:', cred.user);
                // After successful signup, redirect to login or directly to home
                window.location.href = './index.html#home-section'; // Redirect to home section
            })
            .catch((error) => {
                console.error('Signup error:', error.message);
                alert(error.message); // Display Firebase error message
            });
    });
}

// --- LOGOUT ---
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        auth.signOut()
            .then(() => {
                console.log('User signed out.');
                // No need to redirect explicitly, onAuthStateChanged handles UI updates
                // If you want to force a redirect to login:
                // window.location.href = './login.html';
            })
            .catch((error) => {
                console.error('Logout error:', error.message);
                alert(error.message);
            });
    });
}
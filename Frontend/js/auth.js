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

// Function to update UI based on authentication state
async function updateUIForAuthState(user) {
    currentUser = user;
    if (user) {
        try {
            // Verify token with backend
            const token = await user.getIdToken();
            const response = await fetch(`${API_URL}/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token })
            });
            
            if (!response.ok) {
                throw new Error('Failed to verify token with backend');
            }

            // Show authenticated nav items
            loginLi.style.display = 'none';
            signupLi.style.display = 'none';
            logoutLi.style.display = 'block';
            reportLi.style.display = 'block';
            
            // Update user profile if available
            await updateUserProfile();
        } catch (error) {
            console.error('Error verifying token:', error);
            await firebase.auth().signOut();
        }
    } else {
        // Show non-authenticated nav items
        loginLi.style.display = 'block';
        signupLi.style.display = 'block';
        logoutLi.style.display = 'none';
        reportLi.style.display = 'none';
    }
}

// Function to update user profile
async function updateUserProfile() {
    try {
        const profileData = await callApi('/auth/profile');
        // Update UI with profile data if needed
        console.log('Profile loaded:', profileData);
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Event listener for authentication state changes
firebase.auth().onAuthStateChanged(async (user) => {
    await updateUIForAuthState(user);
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
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm['email'].value;
        const password = loginForm['password'].value;

        try {
            // Sign in with Firebase
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get user profile from backend
            const profile = await userApi.getProfile();
            console.log('Logged in successfully:', profile);
            
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Login error:', error);
            alert(error.message);
        }
    });
}

// --- SIGNUP FORM SUBMISSION ---
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = signupForm['name'].value; // You might want to store this in Firestore later
        const email = signupForm['email'].value;
        const password = signupForm['password'].value;

        try {
            // Create user in Firebase
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update profile in backend
            await userApi.updateProfile({
                email: email,
                displayName: signupForm.name.value
            });
            
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Signup error:', error);
            alert(error.message);
        }
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
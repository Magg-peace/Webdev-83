// js/report.js

// Ensure firebase-init.js has been loaded and `auth`, `db`, and `storage` are globally accessible.
// Also ensure the displayMessage function from auth.js is available or re-declared here if this script runs independently.

let reportMap = null;
let marker = null;
let selectedLat = null;
let selectedLng = null;

// Re-declare displayMessage if report.js might load before auth.js,
// or ensure auth.js loads first and exposes it globally.
// For this setup, we assume auth.js loads first and makes it global.
// If not, uncomment and adapt the following:
/*
const messageBox = document.getElementById('message-box');
function displayMessage(message, isError = false) {
    if (messageBox) {

        messageBox.textContent = message;
        messageBox.className = 'message-box ' + (isError ? 'error' : 'success');
        messageBox.style.display = 'block';
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 5000);
    } else {
        console.warn('Message box element not found in report.js context.');
        if (isError) {
            console.error(message);
        } else {
            console.log(message);
        }
    }
}
*/


// Make initializeReportMap globally accessible so auth.js can call it
window.initializeReportMap = function() {
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const selectedCoordsSpan = document.getElementById('selected-coords');

    // Only initialize map if it hasn't been initialized yet
    if (!reportMap) {
        reportMap = L.map('report-map').setView([20.5937, 78.9629], 5); // Default to India center

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(reportMap);

        reportMap.on('click', function(e) {
            // Clear existing marker if any
            if (marker) {
                reportMap.removeLayer(marker);
            }

            // Add new marker
            marker = L.marker(e.latlng).addTo(reportMap);
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;
            latitudeInput.value = selectedLat;
            longitudeInput.value = selectedLng;
            selectedCoordsSpan.textContent = `${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`;
        });

        // Try to get user's current location on map load
        reportMap.locate({ setView: true, maxZoom: 12 });
        reportMap.on('locationfound', function(e) {
            if (marker) {
                reportMap.removeLayer(marker);
            }
            marker = L.marker(e.latlng).addTo(reportMap)
                .bindPopup("Your current location").openPopup();
            selectedLat = e.latlng.lat;
            selectedLng = e.latlng.lng;
            latitudeInput.value = selectedLat;
            longitudeInput.value = selectedLng;
            selectedCoordsSpan.textContent = `${selectedLat.toFixed(4)}, ${selectedLng.toFixed(4)}`;
        });
        reportMap.on('locationerror', function(e) {
            console.warn("Location access denied or error:", e.message);
            displayMessage("Could not determine your current location. Please select a location on the map manually.", true);
        });
    } else {
        // If map already exists (e.g., section was hidden and now shown again),
        // invalidate its size to ensure it renders correctly in the visible div.
        reportMap.invalidateSize();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const disasterReportForm = document.getElementById('disaster-report-form');
    // Ensure correct IDs are used for form elements as per index.html
    const disasterTypeInput = document.getElementById('disaster-type'); // Corrected ID
    const locationDescriptionInput = document.getElementById('location-description'); // Corrected ID
    const urgencyLevelInput = document.getElementById('urgency-level'); // Corrected ID
    const needsInput = document.getElementById('needs'); // Corrected ID
    const reporterNameInput = document.getElementById('reporter-name'); // Corrected ID
    const reporterContactInput = document.getElementById('reporter-contact'); // Corrected ID
    const imageUploadInput = document.getElementById('disaster-image'); // Corrected ID
    const imagePreview = document.getElementById('image-preview'); // Corrected ID

    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const selectedCoordsSpan = document.getElementById('selected-coords');
    const reportMessageDiv = document.getElementById('report-message'); // This will be managed by displayMessage now

    // Initialize Firebase Storage
    const storage = firebase.storage();

    // Event listener for image preview
    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                imagePreview.src = '#';
                imagePreview.style.display = 'none';
            }
        });
    }

    // Handle form submission
    if (disasterReportForm) {
        disasterReportForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission (page reload)

            // Validate that a location has been selected on the map
            if (selectedLat === null || selectedLng === null) {
                displayMessage("Please select a disaster location on the map.", true);
                return;
            }

            const disasterType = disasterTypeInput.value;
            const locationDescription = locationDescriptionInput.value;
            const urgencyLevel = urgencyLevelInput.value;
            const needs = needsInput.value;
            const reporterName = reporterNameInput.value;
            const reporterContact = reporterContactInput.value;
            const imageFile = imageUploadInput.files[0]; // Get the selected image file
            const userId = firebase.auth().currentUser ? firebase.auth().currentUser.uid : 'anonymous'; // Get current user ID

            let imageUrl = null; // To store the URL of the uploaded image

            // Show loading message
            displayMessage("Submitting report and uploading image...", false);

            try {
                // 1. Upload image to Firebase Storage if a file is selected
                if (imageFile) {
                    // Create a storage reference
                    // Using a timestamp and user ID to ensure unique file names
                    const storageRef = storage.ref(`disaster_images/${userId}/${Date.now()}_${imageFile.name}`);
                    const uploadTask = storageRef.put(imageFile);

                    // Await the upload completion and get the download URL
                    await uploadTask;
                    imageUrl = await storageRef.getDownloadURL();
                    console.log("Image uploaded:", imageUrl);
                }

                // 2. Store report details (including image URL if available) in Firestore
                // Data will be stored in /artifacts/{appId}/public/data/disasterReports
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                const collectionPath = `artifacts/${appId}/public/data/disasterReports`;

                await firebase.firestore().collection(collectionPath).add({
                    userId: userId,
                    disasterType: disasterType,
                    locationDescription: locationDescription,
                    urgencyLevel: urgencyLevel,
                    needs: needs,
                    reporterName: reporterName,
                    reporterContact: reporterContact,
                    latitude: selectedLat,
                    longitude: selectedLng,
                    imageUrl: imageUrl, // Store the uploaded image URL
                    timestamp: firebase.firestore.FieldValue.serverTimestamp() // Use Firestore server timestamp
                });

                displayMessage("Disaster report submitted successfully! NGOs and rescue teams in the vicinity have been notified (simulated).");
                disasterReportForm.reset(); // Clear the form fields
                // Reset map marker and coordinates display
                if (marker) {
                    reportMap.removeLayer(marker);
                    marker = null;
                }
                selectedLat = null;
                selectedLng = null;
                latitudeInput.value = '';
                longitudeInput.value = '';
                selectedCoordsSpan.textContent = 'N/A';
                // Hide image preview
                imagePreview.src = '#';
                imagePreview.style.display = 'none';

                // Simulate sending notifications to NGOs/rescue teams
                console.log(`SIMULATED: Notification sent for a ${disasterType} at ${locationDescription} (${selectedLat}, ${selectedLng}).`);
                console.log("In a real application, a backend service would now send emails/SMS to nearby NGOs/rescue centers.");

            } catch (error) {
                console.error("Error submitting disaster report or uploading image:", error);
                displayMessage(`Error submitting report: ${error.message}`, true);
            }
        });
    }
});

// Make initLiveMap globally accessible from map.js as well, if it exists.
// This ensures that when the "Live Map" link is clicked, the main map is also initialized/refreshed.
// This is a safety check as map.js should ideally expose it already.
if (typeof initLiveMap === 'function') {
    window.initLiveMap = initLiveMap;
}

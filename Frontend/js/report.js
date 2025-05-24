// js/report.js

// Ensure firebase-init.js has been loaded and `auth`, `db`, and `storage` are globally accessible.
// We'll need `firebase.storage()` now.

let reportMap = null;
let marker = null;
let selectedLat = null;
let selectedLng = null;

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
            // Optionally show a message to the user that location could not be determined
        });
    } else {
        // If map already exists (e.g., section was hidden and now shown again),
        // invalidate its size to ensure it renders correctly in the visible div.
        reportMap.invalidateSize();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const disasterReportForm = document.getElementById('disaster-report-form');
    const disasterTypeInput = document.getElementById('disasterType');
    const descriptionInput = document.getElementById('description');
    const imageUploadInput = document.getElementById('imageUpload'); // New: Image upload input
    const imagePreview = document.getElementById('imagePreview'); // New: Image preview element
    const contactInfoInput = document.getElementById('contactInfo');
    const latitudeInput = document.getElementById('latitude');
    const longitudeInput = document.getElementById('longitude');
    const selectedCoordsSpan = document.getElementById('selected-coords');
    const reportMessageDiv = document.getElementById('report-message');

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

    // Function to display messages to the user (success/error)
    function displayMessage(message, isError = false) {
        reportMessageDiv.textContent = message;
        reportMessageDiv.style.display = 'block';
        reportMessageDiv.className = isError ? 'message-box error' : 'message-box success'; // Apply CSS classes
        setTimeout(() => {
            reportMessageDiv.style.display = 'none';
        }, 5000); // Hide message after 5 seconds
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
            const description = descriptionInput.value;
            const contactInfo = contactInfoInput.value;
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
                    description: description,
                    contactInfo: contactInfo,
                    latitude: selectedLat,
                    longitude: selectedLng,
                    imageUrl: imageUrl, // Store the uploaded image URL
                    timestamp: firebase.firestore.FieldValue.serverTimestamp() // Use Firestore server timestamp
                });

                displayMessage("Disaster report submitted successfully!");
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
                console.log(`Simulating notification for a ${disasterType} at ${selectedLat}, ${selectedLng}.`);
                console.log("A backend service would now send emails/SMS to nearby NGOs/rescue centers.");

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

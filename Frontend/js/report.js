// js/report.js

// Ensure firebase-init.js has been loaded and API functions are available from api.js
// Also ensure the displayMessage function from auth.js is available

let reportMap = null;
let marker = null;
let selectedLat = null;
let selectedLng = null;

// Cache DOM elements
const reportForm = document.getElementById('report-form');
const disasterTypeSelect = document.getElementById('disaster-type');
const severitySelect = document.getElementById('severity');
const descriptionInput = document.getElementById('description');
const locationInput = document.getElementById('location');
const imagesInput = document.getElementById('images');
const selectedCoordsSpan = document.getElementById('selected-coords');

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
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!selectedLat || !selectedLng) {
            displayMessage('Please select a location on the map', true);
            return;
        }

        try {
            // Prepare the report data
            const reportData = {
                type: disasterTypeSelect.value,
                severity: severitySelect.value,
                description: descriptionInput.value,
                location: locationInput.value,
                coordinates: {
                    latitude: selectedLat,
                    longitude: selectedLng
                },
                timestamp: new Date().toISOString()
            };

            // Submit the report first
            const response = await disasterApi.createDisaster(reportData);

            // Handle image uploads if any
            if (imagesInput.files.length > 0) {
                const imageUrls = await uploadImagesToFirebase(imagesInput.files, response.id);
                await disasterApi.updateDisaster(response.id, {
                    imageUrls: imageUrls
                });
            }

            displayMessage('Report submitted successfully!', false);
            resetForm();
            
            // Redirect to map view after successful submission
            setTimeout(() => {
                window.location.href = 'index.html#map-section';
            }, 2000);

        } catch (error) {
            console.error('Error submitting report:', error);
            displayMessage('Failed to submit report: ' + error.message, true);
        }
    });

    // Upload images to Firebase Storage
    async function uploadImagesToFirebase(files, disasterId) {
        const imageUrls = [];
        const storageRef = firebase.storage().ref();

        for (const file of files) {
            const timestamp = Date.now();
            const fileName = `${timestamp}-${file.name}`;
            const fileRef = storageRef.child(`disasters/${disasterId}/${fileName}`);
            
            try {
                await fileRef.put(file);
                const downloadUrl = await fileRef.getDownloadURL();
                imageUrls.push(downloadUrl);
            } catch (error) {
                console.error('Error uploading image:', error);
                // Continue with other images even if one fails
            }
        }

        return imageUrls;
    }

    // Reset form fields
    function resetForm() {
        reportForm.reset();
        if (marker) {
            reportMap.removeLayer(marker);
            marker = null;
        }
        selectedLat = null;
        selectedLng = null;
        selectedCoordsSpan.textContent = 'No location selected';
    }

    // Get form elements
    const reportForm = document.getElementById('report-form');
    const disasterTypeSelect = document.getElementById('disaster-type');
    const locationInput = document.getElementById('location');
    const descriptionInput = document.getElementById('description');
    const severitySelect = document.getElementById('severity');

    // Function to load existing disasters
    async function loadDisasters() {
        try {
            const disasters = await disasterApi.getAllDisasters();
            const select = document.getElementById('disaster-type');
            select.innerHTML = '<option value="">Select a disaster</option>';

            disasters.forEach(disaster => {
                const option = document.createElement('option');
                option.value = disaster.id;
                option.textContent = `${disaster.type} - ${disaster.location}`;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading disasters:', error);
            alert('Failed to load disasters. Please try again.');
        }
    }

    // Load disasters when the page loads
    document.addEventListener('DOMContentLoaded', loadDisasters);

    // Handle report form submission
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const reportData = {
                disasterId: disasterTypeSelect.value,
                location: locationInput.value,
                description: descriptionInput.value,
                severity: severitySelect.value,
                status: 'new'
            };

            try {
                const newReport = await reportApi.createReport(reportData);
                alert('Report submitted successfully!');
                reportForm.reset();

                // Redirect to the reports list or refresh the current page
                window.location.href = 'index.html#reports';
            } catch (error) {
                console.error('Error submitting report:', error);
                alert('Failed to submit report. Please try again.');
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

// Function to submit disaster report
async function submitDisasterReport(reportData) {
    try {
        const response = await disasterApi.createDisaster(reportData);
        
        if (response.id) {
            // Upload images if any were selected
            const imageFiles = document.getElementById('images').files;
            if (imageFiles.length > 0) {
                const imageUrls = await uploadImages(imageFiles, response.id);
                
                // Update disaster report with image URLs
                await disasterApi.updateDisaster(response.id, {
                    imageUrls: imageUrls
                });
            }
            
            displayMessage('Disaster report submitted successfully!', false);
            resetForm();
            return true;
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        displayMessage('Failed to submit report: ' + error.message, true);
        return false;
    }
}

// Helper function to upload images
async function uploadImages(files, disasterId) {
    const imageUrls = [];
    const storageRef = firebase.storage().ref();

    for (let file of files) {
        try {
            const fileRef = storageRef.child(`disaster-images/${disasterId}/${file.name}`);
            await fileRef.put(file);
            const url = await fileRef.getDownloadURL();
            imageUrls.push(url);
        } catch (error) {
            console.error('Error uploading image:', error);
            // Continue with other images even if one fails
        }
    }

    return imageUrls;
}

// Function to reset the form
function resetForm() {
    document.getElementById('report-form').reset();
    if (marker) {
        reportMap.removeLayer(marker);
        marker = null;
    }
    selectedLat = null;
    selectedLng = null;
    document.getElementById('selected-coords').textContent = 'No location selected';
}

// Event listener for form submission
document.getElementById('report-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedLat || !selectedLng) {
        displayMessage('Please select a location on the map', true);
        return;
    }

    const formData = {
        type: document.getElementById('disaster-type').value,
        severity: document.getElementById('severity').value,
        description: document.getElementById('description').value,
        latitude: selectedLat,
        longitude: selectedLng,
        location: document.getElementById('location').value,
        timestamp: new Date().toISOString()
    };

    const success = await submitDisasterReport(formData);
    if (success) {
        // Optionally redirect to the map view after successful submission
        setTimeout(() => {
            window.location.href = 'index.html#map-section';
        }, 2000);
    }
});

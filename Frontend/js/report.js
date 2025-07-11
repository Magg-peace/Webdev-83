let reportMap;
let selectedLatLng;

document.addEventListener("DOMContentLoaded", function () {
  // Initialize the report map
// 🔥 Ensure the section is visible before map is created
document.getElementById('report-section').style.display = 'block';

reportMap = L.map('report-map').setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(reportMap);
setTimeout(() => {
  reportMap.invalidateSize(); // 🔥 this forces proper redraw
}, 300);
let reportMapInitialized = false;

document.getElementById("report-link").addEventListener("click", function () {
  document.getElementById("report-section").style.display = "block";
  document.getElementById("map-section").style.display = "none";
  document.getElementById("donate-section").style.display = "none";

  // 🔥 Initialize map only once
  if (!reportMapInitialized) {
    setTimeout(() => {
      reportMap = L.map('report-map').setView([20.5937, 78.9629], 5);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(reportMap);

      reportMap.on('click', function (e) {
        selectedLatLng = e.latlng;
        document.getElementById('latitude').value = selectedLatLng.lat;
        document.getElementById('longitude').value = selectedLatLng.lng;
        document.getElementById('selected-coords').innerText = `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;

        if (window.lastMarker) reportMap.removeLayer(window.lastMarker);
        window.lastMarker = L.marker(selectedLatLng).addTo(reportMap);
      });

      reportMap.invalidateSize();
      reportMapInitialized = true;
    }, 100); // timeout allows section to become visible
  } else {
    setTimeout(() => {
      reportMap.invalidateSize();
    }, 100);
  }
});


  // Handle map click to get coordinates
  reportMap.on('click', function (e) {
  selectedLatLng = e.latlng;
  document.getElementById('latitude').value = selectedLatLng.lat;
  document.getElementById('longitude').value = selectedLatLng.lng;
  document.getElementById('selected-coords').innerText =
    `${selectedLatLng.lat.toFixed(5)}, ${selectedLatLng.lng.toFixed(5)}`;

  // Remove previous marker
  if (window.lastMarker) {
    reportMap.removeLayer(window.lastMarker);
  }

  // Add marker
  window.lastMarker = L.marker(selectedLatLng).addTo(reportMap);
});


  // Image preview handler
  document.getElementById('disaster-image').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      const img = document.getElementById('image-preview');
      img.src = event.target.result;
      img.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
});

// 🔴 Submit form to backend and trigger email
document.getElementById('disaster-report-form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const type = document.getElementById('disaster-type').value;
  const locationDescription = document.getElementById('location-description').value;
  const latitude = document.getElementById('latitude').value;
  const longitude = document.getElementById('longitude').value;
  const severity = document.getElementById('severity').value;
  const needs = document.getElementById('needs').value;
  const reporterContact = document.getElementById('reporter-contact').value;

  const reportData = {
    type,
    locationDescription,
    latitude,
    longitude,
    severity,
    needs,
    reporterContact
  };

  try {
    const response = await fetch('http://localhost:3000/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    const result = await response.json();

    if (response.ok) {
      alert('✅ Report submitted and email sent!');
      document.getElementById('disaster-report-form').reset();
      document.getElementById('selected-coords').innerText = 'N/A';
      document.getElementById('image-preview').style.display = 'none';
      if (window.lastMarker) {
        reportMap.removeLayer(window.lastMarker);
      }
    } else {
      alert('❌ Failed to submit report: ' + result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
    alert('❌ Could not connect to the server.');
  }
});

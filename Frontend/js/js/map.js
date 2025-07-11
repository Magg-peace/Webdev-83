document.addEventListener("DOMContentLoaded", function () {
  const map = L.map('mapid').setView([20.5937, 78.9629], 5); // Center of India

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const floodIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/2854/2854378.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -30]
  });

  const earthquakeIcon = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3241/3241775.png',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -30]
  });

  L.marker([26.8467, 80.9462], { icon: floodIcon }).addTo(map)
    .bindPopup("<b>Lucknow, UP</b><br>Flood Alert - Water levels rising.");

  L.marker([17.3850, 78.4867], { icon: earthquakeIcon }).addTo(map)
    .bindPopup("<b>Hyderabad, TS</b><br>Minor Earthquake - No major damage reported.");

  L.marker([28.7041, 77.1025], { icon: floodIcon }).addTo(map)
    .bindPopup("<b>Delhi</b><br>Heavy rainfall causing local flooding.");
});

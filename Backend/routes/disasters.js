const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authenticateToken = require('../middleware/auth');

// Get all disasters
router.get('/', async (req, res) => {
    try {
        const disastersSnapshot = await admin.firestore()
            .collection('disasters')
            .orderBy('timestamp', 'desc')
            .get();

        const disasters = [];
        disastersSnapshot.forEach(doc => {
            disasters.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(disasters);
    } catch (error) {
        console.error('Get Disasters Error:', error);
        res.status(500).json({ message: 'Error fetching disasters' });
    }
});

// Get nearby disasters
router.get('/nearby', async (req, res) => {
    try {
        const { lat, lng, radius = 50 } = req.query; // Default 50km radius
        const center = new admin.firestore.GeoPoint(parseFloat(lat), parseFloat(lng));

        // Get all disasters and filter by distance
        const disastersSnapshot = await admin.firestore()
            .collection('disasters')
            .orderBy('timestamp', 'desc')
            .get();

        const disasters = [];
        disastersSnapshot.forEach(doc => {
            const data = doc.data();
            const distance = calculateDistance(
                center.latitude,
                center.longitude,
                data.location.latitude,
                data.location.longitude
            );

            if (distance <= parseFloat(radius)) {
                disasters.push({
                    id: doc.id,
                    ...data,
                    distance: Math.round(distance * 10) / 10 // Round to 1 decimal place
                });
            }
        });

        // Sort by distance
        disasters.sort((a, b) => a.distance - b.distance);
        res.json(disasters);
    } catch (error) {
        console.error('Get Nearby Disasters Error:', error);
        res.status(500).json({ message: 'Error fetching nearby disasters' });
    }
});

// Create a new disaster report (protected route)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            disasterType,
            locationDescription,
            latitude,
            longitude,
            urgencyLevel,
            needs,
            imageUrl = null,
            reporterName,
            reporterContact
        } = req.body;

        const disasterData = {
            disasterType,
            locationDescription,
            location: new admin.firestore.GeoPoint(parseFloat(latitude), parseFloat(longitude)),
            urgencyLevel,
            needs,
            imageUrl,
            reporterName,
            reporterContact,
            reporterId: req.user.uid,
            status: 'active',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await admin.firestore()
            .collection('disasters')
            .add(disasterData);

        res.status(201).json({
            id: docRef.id,
            ...disasterData
        });
    } catch (error) {
        console.error('Create Disaster Error:', error);
        res.status(500).json({ message: 'Error creating disaster report' });
    }
});

// Helper function to calculate distance between two points in km using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(value) {
    return value * Math.PI / 180;
}

module.exports = router;

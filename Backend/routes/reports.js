const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Get all reports
router.get('/', async (req, res) => {
  try {
    const reportsSnapshot = await db.collection('reports').get();
    const reports = [];
    reportsSnapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get reports by disaster ID
router.get('/disaster/:disasterId', async (req, res) => {
  try {
    const reportsSnapshot = await db.collection('reports')
      .where('disasterId', '==', req.params.disasterId)
      .get();
    const reports = [];
    reportsSnapshot.forEach(doc => {
      reports.push({ id: doc.id, ...doc.data() });
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new report
router.post('/', async (req, res) => {
  try {
    const { disasterId, description, location, resources, status } = req.body;
    const newReport = {
      disasterId,
      description,
      location,
      resources,
      status,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('reports').add(newReport);
    res.status(201).json({ id: docRef.id, ...newReport });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a report
router.put('/:id', async (req, res) => {
  try {
    await db.collection('reports').doc(req.params.id).update(req.body);
    res.json({ message: 'Report updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a report
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('reports').doc(req.params.id).delete();
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const authenticateToken = require('../middleware/auth');

// Verify token and get user data
router.post('/verify-token', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token is required' });
        }

        const decodedToken = await admin.auth().verifyIdToken(token);
        if (!decodedToken) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        res.json({
            uid: decodedToken.uid,
            email: decodedToken.email,
            emailVerified: decodedToken.email_verified
        });
    } catch (error) {
        next(error);
    }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
    try {
        const user = await admin.auth().getUser(req.user.uid);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            createdAt: user.metadata.creationTime
        });
    } catch (error) {
        next(error);
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res, next) => {
    try {
        const { displayName, photoURL } = req.body;
        if (!displayName && !photoURL) {
            return res.status(400).json({ message: 'No update parameters provided' });
        }

        const updateParams = {};
        if (displayName) updateParams.displayName = displayName;
        if (photoURL) updateParams.photoURL = photoURL;

        await admin.auth().updateUser(req.user.uid, updateParams);
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        next(error);
    }
});

// Delete user account
router.delete('/profile', authenticateToken, async (req, res, next) => {
    try {
        await admin.auth().deleteUser(req.user.uid);
        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

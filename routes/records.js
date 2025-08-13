const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// GET /api/records
router.get('/', async (req, res) => {
    try {
        const { challengeId, submitter } = req.query;
        const db = admin.firestore();
        let query = db.collection('records');

        if (challengeId) {
            query = query.where('challengeId', '==', challengeId);
        } else if (submitter) {
            query = query.where('submitter', '==', submitter);
        }

        query = query.orderBy('submittedAt', 'desc'); // Assuming 'submittedAt' is the timestamp field

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json({ success: true, data: [] });
        }

        const records = [];
        snapshot.forEach(doc => {
            records.push({ id: doc.id, ...doc.data() });
        });

        res.status(200).json({ success: true, data: records });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// POST /api/records
router.post('/', async (req, res) => {
    try {
        const record = req.body;
        // record에는 challengeId, submitter, videoUrl, comment 등등 포함
        if (!record.challengeId || !record.videoUrl || !record.submitter) {
            return res.status(400).json({ success: false, message: '필수 정보 누락' });
        }
        const db = admin.firestore();
        const docRef = db.collection('records').doc();
        record.timestamp = new Date(); // This might be redundant if submittedAt is used
        await docRef.set(record);
        res.json({ success: true, id: docRef.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

module.exports = router;
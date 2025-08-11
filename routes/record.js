const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

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
        record.timestamp = new Date();
        await docRef.set(record);
        res.json({ success: true, id: docRef.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

module.exports = router;

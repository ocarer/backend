const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
try {
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
    });
    console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    console.error('Please ensure FIREBASE_CONFIG environment variable is correctly set.');
    process.exit(1);
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 10000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// JWT 비밀 키 (환경 변수에서 가져옴)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// JWT 인증 미들웨어
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: '인증 토큰이 제공되지 않았습니다.' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: '인증 토큰 형식이 잘못되었습니다.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
    }
};

// 챌린지 초기 데이터
const challenges = [
    {
        id: '1', rank: 1, name: 'The Hell Challenge', difficulty: 'extreme_demon', description: '가장 높은 순위의 챌린지입니다.', creator: 'ChallengingCreator', verifier: 'GDVerifierPro', levelId: '20000001', views: 3500, completions: 12, isUpcoming: false, timestamp: new Date()
    },
    {
        id: '2', rank: 2, name: 'Firewall', difficulty: 'insane_demon', description: '불의 벽을 뚫고 지나가는 컨셉의 챌린지입니다.', creator: 'FirewallMaster', verifier: 'Verifine', levelId: '20000002', views: 2800, completions: 25, isUpcoming: false, timestamp: new Date()
    },
    {
        id: '3', rank: 3, name: 'The Abyss', difficulty: 'hard_demon', description: '어두운 심연 속으로 들어가는 듯한 분위기의 챌린지입니다.', creator: 'AbyssCreator', verifier: 'Darkness', levelId: '20000003', views: 2500, completions: 50, isUpcoming: false, timestamp: new Date()
    },
    {
        id: '10', rank: 10, name: 'Forest Escape', difficulty: 'medium_demon', description: '평화로운 숲 속을 탈출하는 테마의 챌린지입니다.', creator: 'NatureLover', verifier: 'GreenLeaf', levelId: '20000010', views: 1500, completions: 120, isUpcoming: false, timestamp: new Date()
    },
    {
        id: '15', rank: 15, name: 'Storm Breaker', difficulty: 'easy_demon', description: '폭풍우를 헤쳐나가는 테마의 챌린지입니다.', creator: 'WeatherMan', verifier: 'CloudJumper', levelId: '20000015', views: 1000, completions: 200, isUpcoming: false, timestamp: new Date()
    },
    {
        id: '25', rank: 25, name: 'Ancient Ruins', difficulty: 'easy_demon', description: '오래된 유적을 탐험하는 테마의 챌린지입니다.', creator: 'Explorer', verifier: 'RelicHunter', levelId: '20000025', views: 800, completions: 350, isUpcoming: false, timestamp: new Date()
    },
    {
        id: '101', rank: 101, name: 'Upcoming Challenge Alpha', difficulty: 'insane_demon', description: '새롭게 추가될 예정인 챌린지입니다.', creator: 'FutureCreator', verifier: 'TBD', levelId: '20000101', views: 50, completions: 0, isUpcoming: true, timestamp: new Date()
    },
    {
        id: '102', rank: 102, name: 'Upcoming Challenge Beta', difficulty: 'medium_demon', description: '업커밍 챌린지 중 하나입니다.', creator: 'BetaTester', verifier: 'TBD', levelId: '20000102', views: 30, completions: 0, isUpcoming: true, timestamp: new Date()
    }
];

// 서버 시작 시 챌린지 데이터 초기화 함수
async function initializeChallenges() {
    console.log('데이터베이스에서 챌린지 데이터 확인 중...');
    const challengesCollection = db.collection('challenges');
    const snapshot = await challengesCollection.get();

    // 데이터가 없는 경우에만 초기화 진행
    if (snapshot.empty) {
        console.log('챌린지 데이터가 없어 초기 데이터를 추가합니다.');
        const batch = db.batch();
        challenges.forEach(challenge => {
            const docRef = challengesCollection.doc(challenge.id);
            batch.set(docRef, challenge);
        });
        await batch.commit();
        console.log('초기 챌린지 데이터가 Firestore에 성공적으로 추가되었습니다.');
    } else {
        console.log('챌린지 데이터가 이미 존재합니다. 초기화를 건너뜁니다.');
    }
}


// 루트 경로 테스트
app.get('/', (req, res) => {
    res.send('Zre Challenge Backend is running!');
});

// 회원가입 엔드포인트
app.post('/api/signup', async (req, res) => {
    const { nickname, email, password } = req.body;

    if (!nickname || !email || !password) {
        return res.status(400).json({ message: '닉네임, 이메일, 비밀번호를 모두 입력해주세요.' });
    }

    try {
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();
        if (doc.exists) {
            return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await userRef.set({
            nickname,
            email,
            password: hashedPassword,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({ message: '회원가입 성공! 이제 로그인해주세요.' });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ message: '회원가입 중 오류가 발생했습니다.', error: error.message });
    }
});

// 로그인 엔드포인트
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
    }

    try {
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        const user = doc.data();
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        const token = jwt.sign(
            { email: user.email, nickname: user.nickname },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: '로그인 성공!',
            user: { email: user.email, nickname: user.nickname },
            token
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ message: '로그인 중 오류가 발생했습니다.', error: error.message });
    }
});

// 모든 챌린지 목록을 가져오는 API 엔드포인트
app.get('/challenges', async (req, res) => {
    console.log('GET /challenges 요청이 들어왔습니다.');
    try {
        const challengesCollection = db.collection('challenges');
        const snapshot = await challengesCollection.orderBy('rank').get();
        const challenges = snapshot.docs.map(doc => doc.data());
        res.json(challenges);
    } catch (error) {
        console.error('챌린지 데이터 로드 중 오류 발생:', error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 특정 ID의 챌린지 정보를 가져오는 API 엔드포인트
app.get('/challenges/:id', async (req, res) => {
    const challengeId = req.params.id;
    console.log(`GET /challenges/${challengeId} 요청이 들어왔습니다.`);
    try {
        const docRef = db.collection('challenges').doc(challengeId);
        const doc = await docRef.get();
        if (!doc.exists) {
            res.status(404).json({ message: '챌린지를 찾을 수 없습니다.' });
        } else {
            res.json(doc.data());
        }
    } catch (error) {
        console.error(`챌린지 ${challengeId} 로드 중 오류 발생:`, error);
        res.status(500).json({ message: '서버 오류' });
    }
});

// 기록 제출 엔드포인트 (인증 미들웨어 적용)
app.post('/api/records', authMiddleware, async (req, res) => {
    const recordData = req.body;
    const { email } = req.user;

    if (!recordData.challengeId || !recordData.videoUrl) {
        return res.status(400).json({ message: '필수 기록 데이터(챌린지 ID, 영상 URL)가 누락되었습니다.' });
    }

    try {
        const newRecord = {
            ...recordData,
            submitter: email,
            submittedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('records').add(newRecord);

        res.status(201).json({ message: '기록이 성공적으로 제출되었습니다!', recordId: docRef.id });
    } catch (error) {
        console.error('기록 제출 오류:', error);
        res.status(500).json({ message: '기록 제출 중 오류가 발생했습니다.', error: error.message });
    }
});


// 챌린지 순위 업데이트 엔드포인트
app.put('/challenges/:id/rank', authMiddleware, async (req, res) => {
    const challengeId = req.params.id;
    const { newRank } = req.body;

    if (typeof newRank !== 'number' || newRank <= 0) {
        return res.status(400).json({ message: '유효한 순위(number)를 입력해주세요.' });
    }

    try {
        const challengeRef = db.collection('challenges').doc(challengeId);
        const doc = await challengeRef.get();

        if (!doc.exists) {
            return res.status(404).json({ message: '업데이트할 챌린지를 찾을 수 없습니다.' });
        }

        await challengeRef.update({
            rank: newRank,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ message: `챌린지 ${challengeId}의 순위가 ${newRank}로 업데이트되었습니다.` });

    } catch (error) {
        console.error(`챌린지 순위 업데이트 중 오류 발생:`, error);
        res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
    }
});


// 서버 시작
app.listen(PORT, async () => {
    console.log(`Backend server listening on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
    // 서버 시작 시 데이터 초기화 로직 실행
    await initializeChallenges();
});

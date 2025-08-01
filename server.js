const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt'); // 비밀번호 해싱을 위한 라이브러리
const jwt = require('jsonwebtoken'); // JWT(JSON Web Token) 생성을 위한 라이브러리
const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
// Render 환경 변수에서 서비스 계정 정보를 가져옵니다.
// FIREBASE_CONFIG 환경 변수에 Firebase 서비스 계정 JSON 내용을 직접 붙여넣거나,
// 각 필드를 개별 환경 변수로 설정할 수 있습니다. 여기서는 JSON 문자열을 파싱합니다.
try {
    const firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig)
    });
    console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    console.error('Please ensure FIREBASE_CONFIG environment variable is correctly set.');
    process.exit(1); // Firebase 초기화 실패 시 앱 종료
}

const db = admin.firestore(); // Firestore 인스턴스 가져오기
const app = express();
const PORT = process.env.PORT || 10000; // Render는 기본적으로 10000 포트를 사용합니다.

// 미들웨어 설정
app.use(cors()); // CORS 허용 (프론트엔드와 백엔드 도메인이 다를 경우 필수)
app.use(express.json()); // JSON 요청 본문 파싱

// JWT 비밀 키 (환경 변수에서 가져옴)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // 실제 배포 시에는 강력한 비밀 키 사용

// JWT 인증 미들웨어: 요청 헤더에 포함된 토큰을 검증합니다.
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
        req.user = decoded; // 요청 객체에 사용자 정보 추가
        next();
    } catch (error) {
        return res.status(403).json({ message: '유효하지 않거나 만료된 토큰입니다.' });
    }
};

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
        // 이메일 중복 확인
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();
        if (doc.exists) {
            return res.status(409).json({ message: '이미 존재하는 이메일입니다.' });
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10); // saltRounds 10

        // Firestore에 사용자 저장
        await userRef.set({
            nickname,
            email,
            password: hashedPassword, // 해싱된 비밀번호 저장
            createdAt: admin.firestore.FieldValue.serverTimestamp() // 서버 타임스탬프
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
        // 사용자 조회
        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();

        if (!doc.exists) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        const user = doc.data();

        // 비밀번호 비교
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }

        // JWT 토큰 생성
        const token = jwt.sign(
            { email: user.email, nickname: user.nickname },
            JWT_SECRET,
            { expiresIn: '1h' } // 토큰 유효 기간 1시간
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
        const snapshot = await challengesCollection.orderBy('rank').get(); // 순위별 정렬
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
    const { email } = req.user; // JWT 토큰에서 추출한 사용자 이메일

    if (!recordData.challengeId || !recordData.videoUrl) {
        return res.status(400).json({ message: '필수 기록 데이터(챌린지 ID, 영상 URL)가 누락되었습니다.' });
    }

    try {
        // Firestore에 기록 저장
        const newRecord = {
            ...recordData,
            submitter: email, // 제출자 정보를 토큰에서 가져온 이메일로 설정
            submittedAt: admin.firestore.FieldValue.serverTimestamp() // 서버 타임스탬프
        };

        const docRef = await db.collection('records').add(newRecord);

        res.status(201).json({ message: '기록이 성공적으로 제출되었습니다!', recordId: docRef.id });
    } catch (error) {
        console.error('기록 제출 오류:', error);
        res.status(500).json({ message: '기록 제출 중 오류가 발생했습니다.', error: error.message });
    }
});

// 챌린지 순위 업데이트 엔드포인트
// 이 엔드포인트는 인증 미들웨어(authMiddleware)가 적용되어 로그인된 사용자만 접근할 수 있습니다.
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

        // Firestore 문서 업데이트
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
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}`);
});

// Firestore를 초기화하고 데이터를 추가하는 스크립트
const admin = require('firebase-admin');
const challenges = require('./challenges');

// Firebase Admin SDK를 초기화합니다.
// Render 환경 변수에서 서비스 계정 정보를 불러와야 합니다.
// (실제 환경에서는 환경 변수를 설정해야 함)
// 여기서는 임시로 __firebase_config를 사용하지만,
// 실제 서버에서는 서비스 계정 키 파일을 사용하거나 환경 변수를 설정해야 합니다.
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 챌린지 데이터를 Firestore에 추가하는 비동기 함수
async function initializeChallenges() {
  console.log('Firestore에 챌린지 데이터 추가를 시작합니다...');
  const batch = db.batch();
  const challengesCollection = db.collection('challenges');

  challenges.forEach(challenge => {
    const docRef = challengesCollection.doc(challenge.id);
    batch.set(docRef, challenge);
  });

  try {
    await batch.commit();
    console.log('모든 챌린지 데이터가 Firestore에 성공적으로 추가되었습니다.');
  } catch (error) {
    console.error('Firestore 데이터 추가 중 오류가 발생했습니다:', error);
  }
}

initializeChallenges();

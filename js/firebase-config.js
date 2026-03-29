/**
 * Firebase 설정 및 Firestore 헬퍼
 *
 * ★ 사용 전 아래 firebaseConfig 값을 본인의 Firebase 프로젝트 설정으로 교체하세요.
 *   Firebase Console > 프로젝트 설정 > 일반 > 내 앱 > SDK 설정 및 구성
 */

const firebaseConfig = {
    apiKey: "AIzaSyD7cWEXEsA6-KtICcudAbyszvmj5-0pun8",
    authDomain: "erp-v1-27d17.firebaseapp.com",
    projectId: "erp-v1-27d17",
    storageBucket: "erp-v1-27d17.firebasestorage.app",
    messagingSenderId: "860495140008",
    appId: "1:860495140008:web:c2564b7f7f875c29ee5e9d"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Firestore 컬렉션명
const FIRESTORE_COLLECTION = 'gtp_data';

/**
 * Firestore에 데이터 저장 (fire-and-forget)
 * @param {string} key - 문서 ID (localStorage의 'gtp_' 접두사 제외한 키)
 * @param {*} data - 저장할 데이터 (배열 또는 객체)
 */
function saveToFirestore(key, data) {
    db.collection(FIRESTORE_COLLECTION).doc(key).set({
        items: JSON.parse(JSON.stringify(data)),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(function(e) {
        console.error('[Firebase] 쓰기 실패:', key, e.message);
    });
}

/**
 * 앱 시작 시 Firestore → localStorage 전체 동기화
 * Firestore에 저장된 모든 데이터를 localStorage로 가져옴
 */
async function syncFromFirestore() {
    try {
        const snapshot = await db.collection(FIRESTORE_COLLECTION).get();
        if (!snapshot.empty) {
            snapshot.forEach(function(doc) {
                const data = doc.data().items;
                if (data !== undefined) {
                    localStorage.setItem('gtp_' + doc.id, JSON.stringify(data));
                }
            });
            console.log('[Firebase] 동기화 완료:', snapshot.size, '건');
        } else {
            console.log('[Firebase] Firestore 데이터 없음, localStorage 캐시 사용');
        }
    } catch (e) {
        console.warn('[Firebase] 동기화 실패, localStorage 캐시 사용:', e.message);
    }
}

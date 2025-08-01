// Firestore에 추가될 초기 챌린지 데이터
const challenges = [
    {
        id: '1',
        rank: 1,
        name: 'The Hell Challenge',
        difficulty: 'extreme_demon',
        description: '가장 높은 순위의 챌린지입니다. 2000회 이상의 시도 끝에 클리어된 매우 어려운 챌린지입니다.',
        creator: 'ChallengingCreator',
        verifier: 'GDVerifierPro',
        levelId: '20000001',
        views: 3500,
        completions: 12,
        isUpcoming: false,
        timestamp: new Date()
    },
    {
        id: '2',
        rank: 2,
        name: 'Firewall',
        difficulty: 'insane_demon',
        description: '불의 벽을 뚫고 지나가는 컨셉의 챌린지입니다. 빠르고 정확한 컨트롤이 요구됩니다.',
        creator: 'FirewallMaster',
        verifier: 'Verifine',
        levelId: '20000002',
        views: 2800,
        completions: 25,
        isUpcoming: false,
        timestamp: new Date()
    },
    {
        id: '3',
        rank: 3,
        name: 'The Abyss',
        difficulty: 'hard_demon',
        description: '어두운 심연 속으로 들어가는 듯한 분위기의 챌린지입니다. 복잡한 패턴이 특징입니다.',
        creator: 'AbyssCreator',
        verifier: 'Darkness',
        levelId: '20000003',
        views: 2500,
        completions: 50,
        isUpcoming: false,
        timestamp: new Date()
    },
    {
        id: '10',
        rank: 10,
        name: 'Forest Escape',
        difficulty: 'medium_demon',
        description: '평화로운 숲 속을 탈출하는 테마의 챌린지입니다. 하지만 곳곳에 숨겨진 함정이 있습니다.',
        creator: 'NatureLover',
        verifier: 'GreenLeaf',
        levelId: '20000010',
        views: 1500,
        completions: 120,
        isUpcoming: false,
        timestamp: new Date()
    },
    {
        id: '15',
        rank: 15,
        name: 'Storm Breaker',
        difficulty: 'easy_demon',
        description: '폭풍우를 헤쳐나가는 테마의 챌린지입니다. 비교적 쉽지만, 속도감이 있습니다.',
        creator: 'WeatherMan',
        verifier: 'CloudJumper',
        levelId: '20000015',
        views: 1000,
        completions: 200,
        isUpcoming: false,
        timestamp: new Date()
    },
    {
        id: '25',
        rank: 25,
        name: 'Ancient Ruins',
        difficulty: 'easy_demon',
        description: '오래된 유적을 탐험하는 테마의 챌린지입니다. Legacy 리스트에 포함될 예정입니다.',
        creator: 'Explorer',
        verifier: 'RelicHunter',
        levelId: '20000025',
        views: 800,
        completions: 350,
        isUpcoming: false,
        timestamp: new Date()
    },
    {
        id: '101',
        rank: 101,
        name: 'Upcoming Challenge Alpha',
        difficulty: 'insane_demon',
        description: '새롭게 추가될 예정인 챌린지입니다. 난이도가 높을 것으로 예상됩니다.',
        creator: 'FutureCreator',
        verifier: 'TBD',
        levelId: '20000101',
        views: 50,
        completions: 0,
        isUpcoming: true,
        timestamp: new Date()
    },
    {
        id: '102',
        rank: 102,
        name: 'Upcoming Challenge Beta',
        difficulty: 'medium_demon',
        description: '업커밍 챌린지 중 하나입니다. 독특한 디자인이 특징입니다.',
        creator: 'BetaTester',
        verifier: 'TBD',
        levelId: '20000102',
        views: 30,
        completions: 0,
        isUpcoming: true,
        timestamp: new Date()
    }
];

// 이 데이터를 다른 파일에서 사용할 수 있도록 export
module.exports = challenges;

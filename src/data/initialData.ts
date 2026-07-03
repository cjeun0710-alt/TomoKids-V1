/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Mission, CalendarEvent, RewardCoupon, DailyReport } from '../types';

// 초기 미션 데이터 (생활 + 학습 하이브리드 루틴)
export const initialMissions: Mission[] = [
  {
    id: 'm1',
    title: '스스로 양치하기',
    category: 'life',
    description: '식사 후에 스스로 양치질 3분 동안 하기',
    icon: 'Sparkles',
    status: 'todo',
    difficulty: 'easy',
    points: 5,
  },
  {
    id: 'm2',
    title: '파닉스 영어 영상 1편 보기',
    category: 'study',
    description: '오늘의 파닉스 영어(A-Z 발음학습) 영상을 집중해서 10분 시청해요.',
    icon: 'BookOpen',
    status: 'completed', // 예시 완료 상태
    difficulty: 'medium',
    points: 10,
    completedAt: '2026-05-22T08:30:00Z',
  },
  {
    id: 'm3',
    title: '장난감 스스로 정리정돈',
    category: 'life',
    description: '방에 어질러진 블록과 장난감을 상자에 이쁘게 정리하기',
    icon: 'Smile',
    status: 'todo',
    difficulty: 'easy',
    points: 5,
  },
  {
    id: 'm4',
    title: '오늘의 연산 5문제 풀기',
    category: 'study',
    description: '더하기, 빼기 학습 카드를 풀고 실력을 쑥쑥 키워요.',
    icon: 'Calculator',
    status: 'todo',
    difficulty: 'medium',
    points: 10,
  },
  {
    id: 'm5',
    title: '어린이용 건강 비타민 먹기',
    category: 'life',
    description: '아침 영양제와 오메가3 맛있게 꼭꼭 씹어 먹기',
    icon: 'Flame',
    status: 'approved', // 부모가 확인 및 승인완료한 상태
    difficulty: 'easy',
    points: 3,
    completedAt: '2026-05-22T07:15:00Z',
  }
];

// 일정 캘린더 데이터 (치과 방문, 학원 등 일정과 자투리 시간 5~10분 맞춤 학습 연계 추천)
export const initialEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: '어린이 치과 6개월 검진',
    type: 'hospital',
    date: '2026-05-23', // 내일 날짜
    time: '15:30',
    reminderSetting: '30m',
    suggestedContent: {
      title: '충치 벌레 대모험 (튼튼 이빨 동화)',
      summary: '치과는 무서운 곳이 아니라 이빨을 반짝반짝하게 살려주는 히어로들의 기지라는 5분 3D 애니메이션 동화입니다. 다녀오면 용감한 보상 별 5개!',
      duration: '5분',
      url: 'https://example.com/dentist-story',
    }
  },
  {
    id: 'e2',
    title: '태권도 품새 연습',
    type: 'academy_sports',
    date: '2026-05-22', // 오늘 날짜
    time: '16:00',
    reminderSetting: '10m',
    suggestedContent: {
      title: '씩씩하게 에너지 충전! 스트레칭',
      summary: '도장에 가기 전 몸풀기 체조 비디오. 재미있는 동물 따라하기 포즈로 굳은 몸을 유연하게 만듭니다.',
      duration: '8분',
      url: 'https://example.com/stretch',
    }
  },
  {
    id: 'e3',
    title: '초등학교 하원 및 미술학원',
    type: 'academy_arts',
    date: '2026-05-22',
    time: '13:00',
    reminderSetting: 'none',
  }
];

// 아이가 획득한 포인트로 부모와 실제로 교환할 수 있는 오프라인 쿠폰
export const initialCoupons: RewardCoupon[] = [
  {
    id: 'c1',
    title: '아빠랑 보드게임 20분 하기',
    requiredPoints: 15,
    icon: 'Gamepad2',
    status: 'available',
  },
  {
    id: 'c2',
    title: '주말에 원하는 특식/간식 직접 고르기 (예: 아이스크림 3단)',
    requiredPoints: 25,
    icon: 'IceCream',
    status: 'locked',
  },
  {
    id: 'c3',
    title: '원하는 키즈카페 2시간 마음껏 놀기 쿠폰',
    requiredPoints: 40,
    icon: 'Sparkles',
    status: 'locked',
  },
  {
    id: 'c4',
    title: '엄마 아빠가 소원 하나 들어주기! (야간 산책 등)',
    requiredPoints: 50,
    icon: 'Gift',
    status: 'locked',
  }
];

// 주간 카드뉴스 브리핑 데이터
export const weeklyReport: DailyReport = {
  weekStartDate: '2026-05-18',
  highlights: [
    '지호가 월요일부터 금요일까지 5일 연속 아침 양치질을 스스로 완료했어요! 습관 정착의 신호예요.',
    '주간 학습 미션 달성률이 지난주 대비 15% 상승해 스스로 학습 능력이 크게 발달했습니다.',
    '두 번의 치과 대비 동화를 보고, 치과 가기에 흥미와 용기를 드러내는 긍정 변화를 보여주었습니다.'
  ],
  growthArea: '스스로 장난감 정리정돈',
  completedCount: 14,
  totalPointsGained: 78,
  messageForParents: '우리 지호가 이번 주는 약속을 어기지 않으려고 정말 많은 노력을 기울였어요. 특히 정리정돈 미션은 시작은 서툴렀어도 포기하지 않고 별을 다 받아냈답니다. 지호가 귀가하면 어깨를 꼭 안아주시며 따뜻한 신체 접촉과 칭찬을 나눠주세요!'
};

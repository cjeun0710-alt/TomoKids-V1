/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, ClipboardList, Award, MessageCircle, BarChart3, Clock, Smile, 
  ChevronRight, Sparkles, Check, CheckCircle2, AlertCircle, Plus, Trash2, CalendarDays, 
  Lightbulb, X, Image, FileText, Send, Heart, RefreshCw
} from 'lucide-react';
import { Mission, CalendarEvent, RewardCoupon, EmotionType, DailyReport, EventType } from '../types';

export const getEventTypeConfig = (type: EventType) => {
  switch (type) {
    case 'school':
      return { emoji: '🏫', color: 'bg-indigo-100 text-indigo-755 border border-indigo-200', label: '학교/유치원' };
    case 'academy_math':
      return { emoji: '🔢', color: 'bg-amber-100 text-amber-850 border border-amber-200', label: '수학 학원' };
    case 'academy_english':
      return { emoji: '🔤', color: 'bg-violet-100 text-violet-850 border border-violet-200', label: '영어 학원' };
    case 'academy_korean':
      return { emoji: '✍️', color: 'bg-teal-100 text-teal-850 border border-teal-200', label: '국어 학원' };
    case 'academy_arts':
      return { emoji: '🎨', color: 'bg-rose-105 text-rose-800 border border-rose-200', label: '미술 학원' };
    case 'academy_music':
      return { emoji: '🎹', color: 'bg-purple-100 text-purple-850 border border-purple-200', label: '음악 학원' };
    case 'academy_sports':
      return { emoji: '🥋', color: 'bg-emerald-100 text-emerald-850 border border-emerald-200', label: '체육/태권도' };
    case 'academy_etc':
      return { emoji: '📚', color: 'bg-amber-100 text-amber-800 border border-amber-200', label: '기타 학원' };
    case 'hospital':
      return { emoji: '🏥', color: 'bg-red-100 text-red-700 border border-red-200', label: '병원치료' };
    case 'family':
      return { emoji: '👨‍👩‍👧', color: 'bg-sky-100 text-sky-850 border border-sky-200', label: '가족 행사' };
    case 'other':
    default:
      return { emoji: '🎈', color: 'bg-slate-100 text-slate-705 border border-slate-200', label: '기타 일정' };
  }
};

interface ParentsModeProps {
  userName: string;
  missions: Mission[];
  events: CalendarEvent[];
  coupons: RewardCoupon[];
  currentEmotion: EmotionType | null;
  totalPoints: number;
  onUpdateMissions: (newMissions: Mission[]) => void;
  onUpdateEvents: (newEvents: CalendarEvent[]) => void;
  onUpdateCoupons: (newCoupons: RewardCoupon[]) => void;
  onResetData: () => void;
  weeklyReportData: DailyReport;
  onSelectEmotion: (emotion: EmotionType) => void;
}

export const ParentsMode: React.FC<ParentsModeProps> = ({
  userName = '지호',
  missions,
  events,
  coupons,
  currentEmotion,
  totalPoints,
  onUpdateMissions,
  onUpdateEvents,
  onUpdateCoupons,
  onResetData,
  weeklyReportData,
  onSelectEmotion,
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'calendar' | 'coupons'>('status');
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // 맞춤 대화 코칭 입력 및 결과 상태
  const [customCoachPrompt, setCustomCoachPrompt] = useState('');
  const [customAiLoading, setCustomAiLoading] = useState(false);
  const [customDialogueResult, setCustomDialogueResult] = useState<{
    prompt: string;
    emotion: string;
    intro: string;
    steps: {
      type: 'parent' | 'kid' | 'coach';
      sender: string;
      text: string;
      subText?: string;
    }[];
    proTips: string[];
  } | null>(null);

  // 캘린더 일정 추가 폼 상태
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-05-22');
  const [newEventTime, setNewEventTime] = useState('14:00');
  const [newEventType, setNewEventType] = useState<EventType>('academy_math');
  const [newEventReminder, setNewEventReminder] = useState<'30m' | '10m' | 'none'>('30m');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [recurrenceDuration, setRecurrenceDuration] = useState('7');
  const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);

  // 미션 수동 추가 폼 상태
  const [showAddMissionModal, setShowAddMissionModal] = useState(false);
  const [newMissionTitle, setNewMissionTitle] = useState('');
  const [newMissionCategory, setNewMissionCategory] = useState<'life' | 'study'>('life');
  const [newMissionDifficulty, setNewMissionDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [newMissionPoints, setNewMissionPoints] = useState(10);
  const [newMissionDesc, setNewMissionDesc] = useState('');

  // 캘린더 날짜 필터 (기본은 오늘 날짜 2026-05-22 기준)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState('2026-05-22');

  // 감정 날씨 맵핑
  const emotionDetails = {
    sunny: { label: '맑고 신남', emoji: '☀️', color: 'text-amber-500 bg-amber-50' },
    cloudy: { label: '보통', emoji: '☁️', color: 'text-blue-400 bg-blue-50' },
    rainy: { label: '기분 흐림/위로필요', emoji: '🌧️', color: 'text-indigo-600 bg-indigo-50 border-indigo-200 border' },
    rainbow: { label: '설레고 행복함', emoji: '🌈', color: 'text-purple-500 bg-purple-50' },
    starry: { label: '완벽한 기분', emoji: '⭐', color: 'text-yellow-600 bg-yellow-50' },
  };

  // 통계 계산
  const totalMissionsCount = missions.length;
  const completedMissionsCount = missions.filter(m => m.status === 'completed' || m.status === 'approved').length;
  const pendingApprovalCount = missions.filter(m => m.status === 'completed').length;
  const achievementRate = totalMissionsCount > 0 ? Math.round((completedMissionsCount / totalMissionsCount) * 100) : 0;

  // 피드백/승인 처리
  const handleApproveMission = (id: string) => {
    const updated = missions.map(m => {
      if (m.id === id) {
        return { ...m, status: 'approved' as const };
      }
      return m;
    });
    onUpdateMissions(updated);
  };

  // 쿠폰 최종 실물 사용/수락 승인 처리
  const handleApproveCouponRequest = (id: string, action: 'approve' | 'reject') => {
    const updated = coupons.map(c => {
      if (c.id === id) {
        return { ...c, status: action === 'approve' ? ('used' as const) : ('available' as const) };
      }
      return c;
    });
    onUpdateCoupons(updated);
  };

  // 일정 추가 핸들러
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    // 만약 치과 방문 일정이면, 치과 관련 짧은 학습용 콘텐츠를 AI/데이터 룰 기반으로 자동 부착
    let customSuggestedContent = undefined;
    if (newEventTitle.includes('치과') || newEventTitle.includes('병원')) {
      customSuggestedContent = {
        title: '반짝반짝 씩씩하게 충치 퇴치 동화 🦸',
        summary: '소아과나 치과 치료에서 듣게 되는 레이저 기기 소리와 물 나오는 장치를 쉽고 재미있는 친구들의 용기 모험으로 친절하게 설명하는 사전 교육 동영상입니다.',
        duration: '6분',
        url: 'https://example.com/hospital-brave',
      };
    } else if (newEventType.startsWith('academy') || newEventTitle.includes('공부') || newEventTitle.includes('학원')) {
      customSuggestedContent = {
        title: '포기하지 않는 마음! 집중 스트레칭 체조 🤸',
        summary: '학원에 가거나 머리를 쓰기 전, 신체를 좌우로 흔들어 피로를 풀고 두뇌 집중력을 200% 올려주는 5분 음악 율동 스케치 콘텐츠 입니다.',
        duration: '5분',
        url: 'https://example.com/brain-gym',
      };
    }

    const recId = recurrence !== 'none' ? 'rec_' + Date.now() : undefined;
    const dateParts = newEventDate.split('-');
    const year = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1;
    const day = parseInt(dateParts[2], 10);

    const datesToGenerate: string[] = [];
    if (recurrence === 'none') {
      datesToGenerate.push(newEventDate);
    } else {
      const count = parseInt(recurrenceDuration, 10) || 7;
      for (let i = 0; i < count; i++) {
        const d = new Date(year, month, day);
        if (recurrence === 'daily') {
          d.setDate(day + i);
        } else if (recurrence === 'weekly') {
          d.setDate(day + (i * 7));
        } else if (recurrence === 'monthly') {
          d.setMonth(month + i);
        }
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        datesToGenerate.push(`${yyyy}-${mm}-${dd}`);
      }
    }

    const createdEvents: CalendarEvent[] = datesToGenerate.map((dateStr, idx) => {
      let finalTitle = newEventTitle;
      if (recurrence !== 'none') {
        const recurrenceLabel = recurrence === 'daily' ? '매일' : recurrence === 'weekly' ? '매주' : '매월';
        finalTitle = `${newEventTitle} (${recurrenceLabel} 🔁 ${idx + 1}/${datesToGenerate.length})`;
      }

      return {
        id: `e_new_${Date.now()}_${idx}`,
        title: finalTitle,
        type: newEventType,
        date: dateStr,
        time: newEventTime,
        reminderSetting: newEventReminder,
        suggestedContent: customSuggestedContent,
        recurrence: recurrence,
        recurrenceId: recId,
      };
    });

    onUpdateEvents([...events, ...createdEvents]);
    setNewEventTitle('');
    setRecurrence('none');
    setRecurrenceDuration('7');
  };

  // 일정 삭제 핸들러 (반복 일정 분기)
  const handleDeleteEventClick = (ev: CalendarEvent) => {
    if (ev.recurrenceId) {
      setEventToDelete(ev);
    } else {
      if (confirm(`'${ev.title}' 일정을 삭제하시겠습니까?`)) {
        const updated = events.filter(e => e.id !== ev.id);
        onUpdateEvents(updated);
      }
    }
  };

  const deleteSingleOccurrence = () => {
    if (!eventToDelete) return;
    const updated = events.filter(e => e.id !== eventToDelete.id);
    onUpdateEvents(updated);
    setEventToDelete(null);
  };

  const deleteAllInSeries = () => {
    if (!eventToDelete || !eventToDelete.recurrenceId) return;
    const updated = events.filter(e => e.recurrenceId !== eventToDelete.recurrenceId);
    onUpdateEvents(updated);
    setEventToDelete(null);
  };

  // 신규 미션 등록 핸들러
  const handleAddMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionTitle.trim()) return;

    const created: Mission = {
      id: 'm_new_' + Date.now(),
      title: newMissionTitle,
      category: newMissionCategory,
      description: newMissionDesc || `${newMissionTitle}을 스스로 성실하게 달성해 보세요!`,
      icon: newMissionCategory === 'study' ? 'BookOpen' : 'Smile',
      status: 'todo',
      difficulty: newMissionDifficulty,
      points: Number(newMissionPoints),
    };

    onUpdateMissions([...missions, created]);
    setNewMissionTitle('');
    setNewMissionDesc('');
    setShowAddMissionModal(false);
  };

  // 미션 삭제 핸들러
  const handleDeleteMission = (id: string) => {
    const updated = missions.filter(m => m.id !== id);
    onUpdateMissions(updated);
  };

  // 주당 미션 완료 추세 (SVG 바 차트용 정지 데이터)
  const chartDays = [
    { name: '월', count: 2, points: 15 },
    { name: '화', count: 3, points: 20 },
    { name: '수', count: 1, points: 10 },
    { name: '목', count: 4, points: 25 },
    { name: '금 (오늘)', count: completedMissionsCount, points: completedMissionsCount * 5 },
  ];

  // AI 스마트 피드백 생성 함수 (Server-Side Gemini API 호출 모사 및 완벽 대화 팁 도출)
  const runAiCoaching = async () => {
    setAiLoading(true);
    setAiResult(null);
    try {
      // 프록시 API 호출 또는 안전한 AI 스크립트. 여기서는 1초 대기 후 아이의 현재 미션 현황 및 감정 날씨를 분석하여 
      // 맞춤 부모 코칭 가이드를 고도로 다듬어진 아동 심리학 가이드로 생성해낸다. (Gemini-like)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      
      const currentEmotionK = currentEmotion ? emotionDetails[currentEmotion].label : '설정 전';
      const studyMissions = missions.filter(m => m.category === 'study' && (m.status === 'completed' || m.status === 'approved')).map(m => m.title).join(', ') || '아직 학습 수행 중';
      const lifeMissions = missions.filter(m => m.category === 'life' && (m.status === 'completed' || m.status === 'approved')).map(m => m.title).join(', ') || '생활 루틴 탐색 중';

      setAiResult(`💡 [아동 심리 코칭 분석 리포트]
• 아이 정서 상태: "${currentEmotionK}" - 정서적 성장을 지원하기 가장 적합한 골든 아워입니다.
• 오늘 확인된 주요 강점: 생활 습관과 성취 욕구가 고르게 발달 중입니다. 특히 [${lifeMissions}]에서 규칙을 완수하며 도파민과 성취 만족도가 높게 기록되었습니다.

🌟 엄마, 아빠를 위한 오늘의 구체적 격려 팁:
지호가 집에 돌아와 양치를 마친 대견한 순간을 마주하시면, 단순히 "잘했어"라는 한 마디로 마치는 것보단, "지호야! 오늘 스스로 치아 보물 기지에 있는 벌레 퇴치 미션을 완벽히 해냈네? 지호가 혼자 힘으로 하니까 이빨이 반짝반짝 별처럼 빛나! 너무 든든해!"라고 칭찬해 주시면 내적 자기주도성이 200% 향상됩니다.`);
    } catch (e) {
      setAiResult('오류가 발생하여 사전에 구성된 고품질 대화 코칭 가이드로 대체합니다: "지호가 치과 방문 일정이 있으므로 안심 대화를 나누어 주세요."');
    } finally {
      setAiLoading(false);
    }
  };

  // 부모가 작성한 문구 맞춤 대화 시나리오 및 코칭 가이드 생성기 (실시간 지능형 시뮬레이션)
  const runCustomDialogueCoaching = async () => {
    if (!customCoachPrompt.trim()) return;
    setCustomAiLoading(true);
    setCustomDialogueResult(null);
    
    await new Promise((resolve) => setTimeout(resolve, 1100));
    
    const promptLower = customCoachPrompt.toLowerCase();
    const emotionK = currentEmotion ? emotionDetails[currentEmotion].label : '설정 전(평온함)';
    const emotionEmoji = currentEmotion ? emotionDetails[currentEmotion].emoji : '😊';
    
    let scenarioTitle = "맞춤 일상 공감 가이드";
    let introText = `현재 지호의 기분이 [${emotionK} ${emotionEmoji}] 상태인 것을 고려하여, 부모님이 남겨주신 "${customCoachPrompt}"에 맞춰 아동 맞춤형 상호작용 피드백을 설계했습니다.`;
    
    let steps: { type: 'parent' | 'kid' | 'coach'; sender: string; text: string; subText?: string }[] = [];
    let proTips: string[] = [];
    
    if (promptLower.includes('공부') || promptLower.includes('학원') || promptLower.includes('숙제') || promptLower.includes('수학') || promptLower.includes('영어') || promptLower.includes('국어') || promptLower.includes('학교') || promptLower.includes('시험')) {
      steps = [
        {
          type: 'parent',
          sender: '엄마 / 아빠의 한마디',
          text: `“지호야! 오늘 우리 멋진 탐험 지도를 보니까 스스로 미션을 클리어하려고 고민을 아주 많이 했더라! 오늘 책 탐험하면서 어떤 흥미진진한 장면이 가장 가슴 떨렸어?”`,
          subText: '💡 "공부해라!"라는 지시보다는 아이가 진행한 "과정"을 호기심 있게 물어봄으로써 자기주도성을 열어줍니다.'
        },
        {
          type: 'kid',
          sender: '지호 (아이의 예상 반응)',
          text: `“음~ 처음엔 수학 규칙 퀴즈가 좀 어려워서 헷갈렸는데, 부모님 말씀대로 천천히 생각해서 풀어보니까 보물상자 열쇠를 연 것 같았어요!”`,
          subText: `아이의 기분이 [${emotionK}]인 상태이므로 평소와 달리 칭찬에 자긍심 가득하게 대답을 수용할 가능성이 큽니다.`
        },
        {
          type: 'coach',
          sender: '대화 전문가 코칭 핵심',
          text: `“절대 점수나 실력이 아닌 ‘노력하고 궁리한 순수한 과정’을 타겟칭하여 리액션해 주십시오. ‘지호가 집중하느라 의자에 엉덩이를 꾹 붙이고 있었던 끈기 그 자체가 너무 대단한 에너지야!’라고 극찬해 주면 두뇌 발달이 가속화됩니다.”`
        },
        {
          type: 'parent',
          sender: '엄마 / 아빠의 화답',
          text: `“어려웠는데 포기하지 않고 끝까지 지킨 지호의 단단한 마음! 지호는 언제나 끝까지 해내는 씩씩한 용사야. 아빠가 우주만큼 응원해!”`
        }
      ];
      proTips = [
        "지시조의 차가운 억양 대신, '우리 같이 탐험을 풀어나가는 요원'이라는 역할 놀이 느낌을 얹어 다정하게 제안해 보세요.",
        "하루에 너무 많은 학습 분량을 재촉하기보다, '하나를 완수했을 때의 성취 쾌감'에 부모가 함께 춤추며 환호해주는 것이 강력합니다."
      ];
    } else if (promptLower.includes('친구') || promptLower.includes('싸움') || promptLower.includes('놀이') || promptLower.includes('괴롭힘') || promptLower.includes('다툼') || promptLower.includes('싸웠')) {
      steps = [
        {
          type: 'parent',
          sender: '엄마 / 아빠의 한마디',
          text: `“지호야, 기분날씨가 [${emotionK}]이네. 혹시 오늘 유치원/학원에서 친구와 지내다가 마음에 속상한 비바람이 불었거나 섭섭함이 마음 구석에 박혔던 일이 있었어?”`,
          subText: '💡 아이가 정직하게 감정을 고백하도록 정서적 안전망을 확인해 주는 부드러운 화두입니다.'
        },
        {
          type: 'kid',
          sender: '지호 (아이의 예상 반응)',
          text: `“준이가 내가 가지고 놀던 블록을 먼저 뺏어갔어요... 그래서 나도 화가 나서 발을 쿵쿵 치고 소리 질렀단 말이야.”`,
          subText: `감정이 상했던 기억이 떠올라 울먹이거나 주먹을 꼭 쥘 수 있으므로, 이때가 부지런한 공감이 개입할 골든타임입니다.`
        },
        {
          type: 'coach',
          sender: '대화 전문가 코칭 핵심',
          text: `“‘소리친 건 나쁜 행동이야!’라며 섣불리 행동의 옳고 그름을 꾸짖기 전에, ‘아이고 속상해라, 지호가 열심히 뚝딱뚝딱 지은 성이었는데 뺏겨서 너무 억울하고 답답했겠구나’ 하고 ‘감정 미러링’을 절대적으로 마쳐 주세요. 감정 안전이 충족되면 마음의 응어리가 녹아 다음 충고를 따릅니다.”`
        },
        {
          type: 'parent',
          sender: '엄마 / 아빠의 화답',
          text: `“어머나, 얼마나 속상하고 억울했을까. 다음엔 ‘이건 지호가 지은 성이니까 기다려줘!’라고 준이 눈을 보며 당당히 외쳐보자. 우리 지호는 용감하게 잘 해낼 수 있어!”`
        }
      ];
      proTips = [
        "친구와의 갈등은 사회성과 규칙 소통을 가장 확실하게 훈련시킬 수 있는 일상 속 최고의 배움터입니다.",
        "비난은 완전히 배제해주시고, 오직 아이의 마음에 상처 난 곳을 호~ 불어주는 따뜻한 연대의 몸짓을 이어가 주세요."
      ];
    } else if (promptLower.includes('정리') || promptLower.includes('청소') || promptLower.includes('장난감') || promptLower.includes('방')) {
      steps = [
        {
          type: 'parent',
          sender: '엄마 / 아빠의 한마디',
          text: `“지호 대장님! 큰일 났어요! 지금 탐험 대피소 본부에 신나게 흩어져 놀던 파란 자동차와 공룡 대원들이 길을 잃어 추위에 떨고 있대요! 1분 안에 상자 구출 기차에 탑승시키는 세이프 작전을 개시해 볼까?”`,
          subText: '💡 강압적으로 "장난감 좀 치워!"라고 소리치는 대신, 지고 지순한 놀이 마술 스토리로 지루한 정리를 흥미 만점 보드게임 미션으로 치환합니다.'
        },
        {
          type: 'kid',
          sender: '지호 (아이의 예상 반응)',
          text: `“앗! 다들 추우면 안 돼! 내가 빨리 구출용 소방 구급 대원이 돼서 다 집어넣을게요! 삐뽀삐뽀!”`,
          subText: `기분날씨가 [${emotionK}] 상태인 지호는 게임 가설을 주도적으로 수긍하며 열정적으로 참여율을 올리게 됩니다.`
        },
        {
          type: 'coach',
          sender: '대화 전문가 코칭 핵심',
          text: `“정리가 끝나면 ‘깔끔하네’로 끝내기보단 ‘우와! 지호 대장 덕분에 공룡 기지가 엄청 따듯하고 아늑해졌어! 공룡들이 지호에게 정말 고맙대!’라고 아이 역할에 대한 찬란한 격려로 만족 지수를 높여주셔야 책임감 세포가 확장됩니다.”`
        }
      ];
      proTips = [
        "정리는 지루한 강제가 아니라 스스로 지도를 다스리고 통제하는 '자아 통제권'의 증폭 행위입니다.",
        "시간 초 세기(예: 사과 시계가 30초 돌기 전까지!) 게임을 활용하면 훨씬 신나고 집중도 깊은 놀이로 연출됩니다."
      ];
    } else if (promptLower.includes('양치') || promptLower.includes('씻기') || promptLower.includes('목욕') || promptLower.includes('샤워') || promptLower.includes('잠')) {
      steps = [
        {
          type: 'parent',
          sender: '엄마 / 아빠의 한마디',
          text: `“치아 숲속 마을에 지금 충치 세균 보스들이 몰래 케이크 성을 지으려고 드릴을 윙윙 돌리기 작당 모의를 한대요! 지호 치카치카 보검 칫솔을 쥐어줄 테니 세균 군단을 깨끗하게 처치해주겠어?”`,
          subText: '💡 씻기를 귀찮아할 때는 명령문 대신 ‘치카치카 마술 검’, ‘거품 군사’ 등 다채로운 스토리를 곁들이세요.'
        },
        {
          type: 'kid',
          sender: '지호 (아이의 예상 반응)',
          text: `“보검 칫솔 발사! 거품 방패 기지로 충치 벌레들을 남김없이 쓱싹 싹쓸이해주겠어요. 캬하하!”`,
          subText: `아이에게는 수동적인 습관을 하나의 놀랍고 짜릿한 신체 정복 스토리로 몰입시키는 마법이 통하게 됩니다.`
        },
        {
          type: 'coach',
          sender: '대화 전문가 코칭 핵심',
          text: `“양치가 끝나면 거꾸로 거울을 정면에서 들여다보게 하여 ‘지호야 거울 속 이가 하얗게 반짝여서 아빠 눈이 부실 지경이야! 충치 세균 대왕이 지호 검술을 보고 엄청 무서워 달아났겠지?’ 하며 주도적 위생의 미를 한 단계 높이십시오.”`
        }
      ];
      proTips = [
        "하기 싫어 끙끙대는 습관 영역은 아이 주도로 판을 다스리고 다변화하여 이끄는 동심 맞춤형 세계관이 명약입니다.",
        "물놀이 오리 인형이나 다정한 샴푸 요정 놀이 등으로 가벼우면서도 경쾌한 접점을 설계하여 이끄세요."
      ];
    } else {
      steps = [
        {
          type: 'parent',
          sender: '엄마 / 아빠의 한마디',
          text: `“지호야, 기분날씨가 [${emotionK} ${emotionEmoji}]이네! 오늘 지호 마음속 소망 전구에 어떤 신나거나 혹은 꼭 말해주고 싶었던 보물 같은 불빛이 총총 켜져 있어?”`,
          subText: '💡 부모가 시선을 정답게 3초 동안 맞추어 사랑스러운 목소리로 아이의 내면 이야기를 정중히 초청하고 경청합니다.'
        },
        {
          type: 'kid',
          sender: '지호 (아이의 예상 반응)',
          text: `“오늘 유치원에서 그림 그리기 미션이 제일 짜릿했어요. 이따가 아빠랑 그림 대결도 같이 펼치면 더 신나겠어요!”`,
          subText: `지호는 부모님이 자기 마음에 온전한 초점을 맞춘 채 기분을 사려 깊게 읽어줄 때 정서 안정 지수가 최대치로 치솟습니다.`
        },
        {
          type: 'coach',
          sender: '대화 전문가 코칭 핵심',
          text: `“남겨주신 부모님의 마음 '${customCoachPrompt}'을 이렇게 다정한 표정, 부드러운 눈맞춤, 그리고 감정이입이 가득 담긴 말투로 번역하여 전달만 하더라도 대화의 기적이 시작됩니다. 아이의 입장을 있는 그대로 품어주는 것부터 연습해보세요.”`
        },
        {
          type: 'parent',
          sender: '엄마 / 아빠의 화답',
          text: `“지호가 그렇다면 엄마 아빠가 언제든 기꺼이 옆에서 지호만의 멋진 작품들을 다 기록하고 응원해 줄게! 안아보자 지호야!”`
        }
      ];
      proTips = [
        "답답한 마음에 설교 일색으로 종결하면 아이는 자신의 감정 마음을 굳게 차단하게 됩니다. 경청 먼저, 조언은 짧게 하세요.",
        "간식 시간이나 이불 속에서 뒹굴거리는 평온한 장소적 접점을 잡아 소통 수용률을 이끌어 주십시오."
      ];
    }
    
    setCustomDialogueResult({
      prompt: customCoachPrompt,
      emotion: emotionK,
      intro: introText,
      steps: steps,
      proTips: proTips
    });
    setCustomAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      
      {/* 부모 모드 전용 세련된 Blue 헤더 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-md">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-800 text-[11px] px-2.5 py-0.5 rounded-full font-bold">부모 코칭 대시보드</span>
                <span className="text-xs text-emerald-600 font-extrabold flex items-center gap-1 animate-pulse">● 실시간 연동 중</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex flex-wrap items-baseline gap-2">
                스마트 키즈 보드
                <span className="text-indigo-600 font-black text-sm sm:text-base bg-indigo-50 px-2.5 py-0.5 rounded-xl border border-indigo-100 shadow-3xs">
                  부모 모드
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              id="weekly-report-trigger"
              onClick={() => setShowWeeklyReport(true)}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              <BarChart3 className="w-4 h-4" />
              <span>📊 주간 브리핑 & 카드뉴스</span>
            </button>

            <button
              id="reset-simulation-btn"
              onClick={() => {
                if(confirm('모든 미션과 일정을 초기 데모 데이터로 다시 원복하시겠습니까?')) {
                  onResetData();
                }
              }}
              title="데이터 초기화"
              className="border border-slate-300 hover:border-red-400 p-2.5 rounded-xl hover:text-red-500 hover:bg-red-50/50 transition-colors text-slate-400 shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=120"
              alt="부모 프로필"
              className="w-10 h-10 rounded-full border-2 border-slate-200 shrink-0 shadow-xs"
            />
          </div>
        </div>

        {/* 대시보드 탭바 */}
        <div className="bg-slate-50 border-t border-slate-250/50">
          <div className="max-w-7xl mx-auto px-4 flex gap-6">
            <button
              id="parents-tab-status"
              onClick={() => setActiveTab('status')}
              className={`py-3.5 px-1 text-sm font-extrabold border-b-3 transition-colors flex items-center gap-2 ${
                activeTab === 'status' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              미션 관리 및 검토 {pendingApprovalCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">{pendingApprovalCount}</span>
              )}
            </button>
            <button
              id="parents-tab-calendar"
              onClick={() => setActiveTab('calendar')}
              className={`py-3.5 px-1 text-sm font-extrabold border-b-3 transition-colors flex items-center gap-2 ${
                activeTab === 'calendar' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              스마트 캘린더 (알림 & 학습연동)
            </button>
            <button
              id="parents-tab-coupons"
              onClick={() => setActiveTab('coupons')}
              className={`py-3.5 px-1 text-sm font-extrabold border-b-3 transition-colors flex items-center gap-2 ${
                activeTab === 'coupons' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              오프라인 쿠폰 및 보상 교환요청
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">
        
        {/* 1. 상단 핵심 지표 요약 카드 (Summary Metrics List) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="summaries-section">
          {/* 달성률 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase">오늘의 목표 달성률</span>
              <span className="text-2xl font-black text-slate-900">{achievementRate}%</span>
              <span className="text-xs text-emerald-600 font-semibold block">{completedMissionsCount}개 미션 해결 / 총 {totalMissionsCount}개</span>
            </div>
            {/* 고품격 써클형 프로그레스 바 직접 구현 */}
            <div className="relative w-14 h-14">
              <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                <path className="text-slate-100" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-indigo-600" strokeDasharray={`${achievementRate}, 100`} strokeWidth="3.2" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-900">
                {achievementRate}%
              </div>
            </div>
          </div>

          {/* 주간 학습 시간 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase">누적 획득한 별 포인트</span>
              <span className="text-2xl font-black text-amber-500">⭐ {totalPoints} / 100</span>
              <span className="text-xs text-indigo-600 font-semibold block">인기 쿠폰 교환 가능</span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl">
              <Award className="w-7 h-7" />
            </div>
          </div>

          {/* 최근 자율 활동 */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 block uppercase">연결된 스마트 일정 수</span>
              <span className="text-2xl font-black text-indigo-900">{events.length}개</span>
              <span className="text-xs text-slate-500 font-semibold block">치과, 학원, 소외방지 연동</span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Calendar className="w-7 h-7" />
            </div>
          </div>

          {/* 아이의 오늘 기분 날씨 확인 및 바로 변경 */}
          <div className="bg-gradient-to-br from-indigo-50/40 to-slate-50/40 p-5 rounded-3xl border border-indigo-150 shadow-sm flex flex-col justify-between">
            <div className="space-y-1 pb-1">
              <span className="text-xs font-extrabold text-indigo-600 block uppercase">👦 지호의 오늘 기분 날씨</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {currentEmotion ? (
                  <>
                    <span className="text-xl">{emotionDetails[currentEmotion].emoji}</span>
                    <span className="text-xs font-black text-indigo-900">{emotionDetails[currentEmotion].label} 기분</span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-slate-405">아이 기분 미설정</span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between gap-1 border-t border-slate-150 pt-1.5">
              <span className="text-[9px] font-black text-slate-400">교제 코칭 연동:</span>
              <div className="flex gap-1">
                {(Object.keys(emotionDetails) as EmotionType[]).map((emo) => {
                  const isSelected = currentEmotion === emo;
                  return (
                    <button
                      key={emo}
                      type="button"
                      id={`parent-emotion-header-${emo}`}
                      onClick={() => onSelectEmotion(emo)}
                      title={emotionDetails[emo].label}
                      className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition-all relative ${
                        isSelected
                          ? 'bg-amber-400 border border-amber-500 scale-110 shadow-xs'
                          : 'bg-white border border-slate-205 hover:bg-slate-50'
                      }`}
                    >
                      <span>{emotionDetails[emo].emoji}</span>
                      {isSelected && (
                        <span className="absolute -top-0.5 -right-0.5 bg-indigo-600 text-white rounded-full w-2 h-2 text-[5px] flex items-center justify-center border border-white font-extrabold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 2. 대시보드 탭별 스크린 */}
        <AnimatePresence mode="wait">
          {activeTab === 'status' && (
            <motion.div
              key="tab-status"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* 왼쪽: 미션 조견 관리 리스트 */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">우리 아이 오늘의 미션 정기판 📋</h2>
                    <p className="text-xs text-slate-400 font-medium">아이의 일상 및 공부 루틴을 관리하거나 자율 미션을 새로 추가 및 체크해 주세요.</p>
                  </div>
                  <button
                    id="add-mission-trigger"
                    onClick={() => setShowAddMissionModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-md transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 루틴 보드 추가</span>
                  </button>
                </div>

                {/* 미션 테이블 */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm" id="missions-board-table">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[11px] bg-slate-50">
                        <th className="py-3 px-4 rounded-l-xl">미션 이름 / 설명</th>
                        <th className="py-3 px-4">분류</th>
                        <th className="py-3 px-4">오늘 수행상태</th>
                        <th className="py-3 px-4">난이도</th>
                        <th className="py-3 px-4">지급별</th>
                        <th className="py-3 px-4 text-center rounded-r-xl">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      {missions.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-4 max-w-xs">
                            <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">{m.title}</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed truncate">{m.description}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                              m.category === 'study' ? 'bg-blue-150 text-blue-700' : 'bg-green-150 text-green-700'
                            }`}>
                              {m.category === 'study' ? '📚 학습' : '🏡 생활'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs">
                            {m.status === 'todo' && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span>수행 미수행 (-%)</span>
                              </div>
                            )}
                            {m.status === 'completed' && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg w-fit border border-amber-200 animate-pulse">
                                  <AlertCircle className="w-3 h-3" />
                                  <span className="font-bold">아이 완료 (승인 대기)</span>
                                </div>
                                <button
                                  id={`approve-mission-${m.id}`}
                                  onClick={() => handleApproveMission(m.id)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] py-1 px-2.5 rounded-md shadow-xs active:scale-95 transition-all"
                                >
                                  확인 및 최고칭찬 별지급
                                </button>
                              </div>
                            )}
                            {m.status === 'approved' && (
                              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl w-fit border border-emerald-100">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>부모님 확인&승인됨 (100% 만족)</span>
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-slate-500 uppercase">{m.difficulty}</td>
                          <td className="py-4 px-4 text-amber-500 font-extrabold text-sm">⭐ {m.points}별</td>
                          <td className="py-4 px-4 text-center">
                            <button
                              id={`delete-mission-${m.id}`}
                              onClick={() => handleDeleteMission(m.id)}
                              className="p-1.5 text-slate-350 hover:text-red-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 오른쪽 상호작용 피드백 코칭 알림 가이드 */}
              <div className="space-y-6">
                {/* 1. 상호작용 코칭 요술 패널 */}
                <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-indigo-950/20 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
                    <MessageCircle className="w-36 h-36" />
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse fill-yellow-200" />
                    <h3 className="text-base sm:text-lg font-black text-yellow-300">오늘의 스마트 대화 코칭 팁</h3>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 space-y-3 leading-relaxed text-sm">
                    {missions.some(m => m.id === 'm3' && m.status === 'todo') ? (
                      <div>
                        <p className="text-neutral-50 font-bold mb-2">지호가 방 구석구석을 이쁘게 스스로 정리하는 날입니다!</p>
                        <blockquote className="border-l-3 border-yellow-300 pl-3 text-xs sm:text-sm italic text-yellow-50 font-medium">
                          "지호야! 오늘 장난감 블록들이 집이 어딘지 몰라서 슬퍼하고 있었는데, 지호가 이쁘게 정정당당하게 상자 속에 쏙 넣어 주었구나! 멍멍이 기자가 취재할 만한 완벽한 정리 용사야!"
                        </blockquote>
                        <p className="text-[10px] text-white/60 font-semibold mt-2">이처럼 자녀가 한 구체적인 행동을 객관적으로 집어 칭찬하는 것이 정서에 매우 좋습니다.</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-neutral-50 font-bold mb-2">양치질 미션이나 파닉스 영어 미션을 해결했다면:</p>
                        <blockquote className="border-l-3 border-yellow-300 pl-3 text-xs sm:text-sm italic text-yellow-50 font-medium">
                          "이가 반짝반짝 빛나니까 오늘 유치원에 하원해서 웃을 때 아빠 이가 다 멀어질 뻔할 정도였어! 스스로 하는 지호 모습에 심장박동이 쿵쾅쿵쾅 기뻐!"
                        </blockquote>
                        <p className="text-[10px] text-white/50 font-semibold mt-2">구체적이고 기분이 극대화되는 위트 있는 비유로 칭찬을 가해 상향 고양을 도우세요.</p>
                      </div>
                    )}
                  </div>

                  {/* Gemini AI 기반 실시간 밀착 맞춤 상호작용 생성기 */}
                  <div className="mt-5 pt-4 border-t border-white/10 space-y-4">
                    <button
                      id="ai-coaching-btn"
                      onClick={runAiCoaching}
                      disabled={aiLoading}
                      className="w-full bg-gradient-to-r from-yellow-300 to-amber-400 hover:from-yellow-200 hover:to-amber-300 disabled:from-slate-700 disabled:to-slate-700 font-extrabold text-slate-900 py-3.5 px-6 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-98 select-none"
                    >
                      <Sparkles className="w-4 h-4 fill-current animate-bounce text-slate-900" />
                      <span>{aiLoading ? 'Gemini AI 아동 코칭 심층 분석 중...' : 'Gemini AI 아동 맞춤칭찬 비책 발굴'}</span>
                    </button>

                    {aiResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-white text-slate-900 p-4.5 rounded-2xl text-xs sm:text-sm border border-yellow-200 leading-relaxed font-semibold transition-all relative"
                      >
                        <button
                          id="clear-ai-result"
                          onClick={() => setAiResult(null)}
                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-650"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <pre className="whitespace-pre-wrap font-sans text-slate-800 text-[11px] sm:text-xs">
                          {aiResult}
                        </pre>
                      </motion.div>
                    )}
                  </div>

                  {/* ✍️ 맞춤형 부모-아이 대화 메이커 */}
                  <div className="mt-6 pt-5 border-t border-white/10 space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs sm:text-sm font-black text-yellow-300 flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-yellow-300 animate-pulse" />
                        <span>✍️ 우리 아이 맞춤 대화 메이커</span>
                      </h4>
                      <p className="text-[10px] text-indigo-100 font-bold">
                        오늘 지호에게 건네고 싶은 말이나 대화하고 싶은 고민 상황을 남겨보세요.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <textarea
                        id="custom-coach-prompt-input"
                        rows={3}
                        value={customCoachPrompt}
                        onChange={(e) => setCustomCoachPrompt(e.target.value)}
                        placeholder="예: '오늘 영어 학원 숙제 신나게 하고 자라고 격려하고 싶어요', '친구랑 낮에 싸웠다는데 마음 아프지 않게 공감해주고 싶어요'"
                        className="w-full bg-indigo-950/60 border border-indigo-700/50 rounded-2xl p-3 text-xs text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-yellow-300 focus:border-transparent transition-all font-semibold resize-none"
                      />
                      <button
                        type="button"
                        id="custom-dialog-coaching-btn"
                        onClick={runCustomDialogueCoaching}
                        disabled={customAiLoading || !customCoachPrompt.trim()}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950/40 disabled:text-slate-500 font-extrabold text-white text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98 select-none"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                        <span>{customAiLoading ? '완전 공감 대화 시나리오 조각 중...' : '맞춤 아동 대화 가이드 생성하기'}</span>
                      </button>
                    </div>

                    {customDialogueResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white text-slate-900 p-5 rounded-2xl border border-indigo-100 space-y-4 animate-fadeIn"
                      >
                        <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                          <div className="space-y-0.5">
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 font-black px-2.5 py-0.5 rounded-full">
                              정서 날씨 {customDialogueResult.emotion} 연동됨
                            </span>
                            <h5 className="font-extrabold text-slate-950 text-xs sm:text-sm mt-1">
                              💬 지호와의 마음 교제 시뮬레이션
                            </h5>
                          </div>
                          <button
                            type="button"
                            id="clear-custom-dialogue-btn"
                            onClick={() => setCustomDialogueResult(null)}
                            className="text-slate-405 hover:text-slate-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {customDialogueResult.intro}
                        </p>

                        {/* 가상 모바일 채팅방 레이아웃 */}
                        <div className="bg-slate-100 rounded-2xl p-3 sm:p-4 space-y-4 max-h-[300px] overflow-y-auto border border-slate-200">
                          {customDialogueResult.steps.map((step, idx) => {
                            if (step.type === 'coach') {
                              return (
                                <div key={idx} className="bg-amber-50 p-3 rounded-xl border border-amber-200/60 space-y-1">
                                  <div className="flex items-center gap-1 text-[10px] font-black text-amber-800">
                                    <Sparkles className="w-3 h-3 fill-amber-500 text-amber-600" />
                                    <span>{step.sender}</span>
                                  </div>
                                  <p className="text-[11px] text-slate-700 leading-relaxed font-extrabold">
                                    {step.text}
                                  </p>
                                </div>
                              );
                            }

                            const isParent = step.type === 'parent';
                            return (
                              <div key={idx} className={`flex flex-col ${isParent ? 'items-end' : 'items-start'} space-y-1`}>
                                <span className="text-[10px] text-slate-400 font-extrabold px-1">
                                  {isParent ? '👤 엄마 / 아빠' : '👦 지호'}
                                </span>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-[11px] sm:text-xs font-semibold leading-relaxed shadow-3xs ${
                                  isParent 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'
                                }`}>
                                  {step.text}
                                </div>
                                {step.subText && (
                                  <span className={`text-[9px] font-bold ${isParent ? 'text-indigo-500 text-right' : 'text-slate-405'}`}>
                                    {step.subText}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* 대화 팁 리스트 */}
                        <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100/50 space-y-2">
                          <span className="block text-[11px] text-indigo-950 font-black">
                            💡 대화를 성공으로 이끄는 비밀 코칭 열쇠:
                          </span>
                          <ul className="space-y-1 text-[10px] text-slate-600 font-bold list-disc pl-3.5">
                            {customDialogueResult.proTips.map((tip, tIdx) => (
                              <li key={tIdx} className="leading-relaxed">
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* 2. 주간 자율 성취 트렌드 차트 (SVG 수제 가로/세로 막대 차트로 가독성 극대화) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">일자별 미션 점수 동선 (주간 누적)</h3>
                    <p className="text-[10px] text-slate-400 font-medium">요일마다 획득한 별빛 루틴 점수 분포 상황</p>
                  </div>

                  <div className="flex h-36 items-end gap-3 pt-4 border-b border-l border-slate-100 px-2 justify-between">
                    {chartDays.map((day, idx) => {
                      const maxPoints = 30;
                      const heightPercent = day.points > 0 ? Math.min((day.points / maxPoints) * 100, 100) : 5;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                          <span className="text-[10px] font-black text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 px-1 py-0.5 rounded">
                            {day.points}별
                          </span>
                          <div className="w-full relative bg-slate-100 rounded-t-lg overflow-hidden h-24 flex items-end">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPercent}%` }}
                              transition={{ delay: idx * 0.1, duration: 0.6 }}
                              className="w-full bg-indigo-500 group-hover:bg-indigo-600 rounded-t-lg"
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">{day.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 탭: 스마트 캘린더 일정 관리 */}
          {activeTab === 'calendar' && (
            <motion.div
              key="tab-calendar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* 왼쪽: 일정 가상 캘린더 그리드 */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-black text-slate-900">어린이 캘린더 일정 스케줄러 📅</h2>
                  <p className="text-xs text-slate-400 font-medium">아이의 병원, 학원, 외식 일정을 잡으면 남는 자투리 시간을 고려해 학습동화와 콘텐츠가 실시간 자동추천 부착됩니다.</p>
                </div>

                {/* 아주 직관적인 월별 주차별 날짜 선택 가로 레일 */}
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {['2026-05-18', '2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23', '2026-05-24'].map((d) => {
                    const isSelected = selectedCalendarDate === d;
                    const dateObj = new Date(d);
                    const isToday = d === '2026-05-22';
                    const days = ['일', '월', '화', '수', '목', '금', '토'];

                    return (
                      <button
                        key={d}
                        id={`date-select-${d}`}
                        onClick={() => setSelectedCalendarDate(d)}
                        className={`px-4 py-3 rounded-2xl border flex flex-col items-center shrink-0 min-w-[70px] select-none transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-[10px] font-bold block">{days[dateObj.getDay()]}</span>
                        <span className="text-lg font-black block mt-0.5">{dateObj.getDate()}</span>
                        {isToday && (
                          <span className={`text-[8px] font-black uppercase px-1 rounded block mt-1 ${
                            isSelected ? 'bg-indigo-200 text-indigo-900' : 'bg-red-500 text-white animate-pulse'
                          }`}>
                            TODAY
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 선택한 날짜에 예정된 일정 요약 */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    ⏰ {selectedCalendarDate}의 주요 일정 목록
                  </h3>

                  <div className="grid grid-cols-1 gap-4">
                    {events.filter(e => e.date === selectedCalendarDate).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-slate-50 border border-slate-200 border-dashed rounded-2xl font-semibold">
                        선택하신 날짜에 예정된 일정이 존재하지 않습니다.<br />오른쪽 폼을 이용해서 새로운 일정을 등록해 보세요.
                      </div>
                    ) : (
                      events.filter(e => e.date === selectedCalendarDate).map((ev) => (
                        <div key={ev.id} className="bg-slate-50 rounded-2xl p-4.5 border border-slate-250 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <div className="flex gap-3.5 items-start">
                            <span className="text-3xl bg-white p-2 rounded-xl shadow-xs border border-slate-100 flex items-center justify-center">
                              {getEventTypeConfig(ev.type).emoji}
                            </span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  getEventTypeConfig(ev.type).color
                                }`}>
                                  {getEventTypeConfig(ev.type).label}
                                </span>
                                <span className="text-xs text-slate-400 font-extrabold">🕒 {ev.time} 예정</span>
                              </div>
                              <h4 className="font-black text-slate-900 text-base">{ev.title}</h4>
                              
                              {/* 자동연동 추천 학습 콘텐츠 노출 */}
                              {ev.suggestedContent && (
                                <div className="mt-3 bg-white p-3 rounded-xl border border-indigo-100 space-y-1.5 max-w-lg">
                                  <span className="inline-flex items-center gap-1.5 text-indigo-700 text-xs font-black">
                                    <Sparkles className="w-3.5 h-3.5 animate-spin fill-current" />
                                    <span>자투리 시간 매칭 콘텐츠 자동 연계:</span>
                                  </span>
                                  <span className="block text-xs font-black text-neutral-800">{ev.suggestedContent.title}</span>
                                  <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{ev.suggestedContent.summary}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            <span className="text-xs text-slate-400 font-bold">
                              {ev.reminderSetting === 'none' ? '알림 없음' : `${ev.reminderSetting} 전 알림`}
                            </span>
                            <button
                              id={`delete-event-${ev.id}`}
                              onClick={() => handleDeleteEventClick(ev)}
                              className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 오른쪽 일정 정보 기입 폼 */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-4">신규 스케줄 일정 등록 ✏️</h3>

                <form onSubmit={handleAddEvent} className="space-y-4 text-xs sm:text-sm font-semibold">
                  <div className="space-y-1.5">
                    <label className="block text-slate-500 font-black">일정 이름:</label>
                    <input
                      type="text"
                      id="event-title-input"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="예시: 신촌어린이 치과 6개월 검진"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white text-slate-800 transition-all font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 font-black">날짜:</label>
                      <input
                        type="date"
                        id="event-date-input"
                        value={newEventDate}
                        onChange={(e) => setNewEventDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white text-slate-850 transition-all font-bold"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-slate-500 font-black">시간:</label>
                      <input
                        type="time"
                        id="event-time-input"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white text-slate-850 transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3 bg-indigo-50/20 p-3 rounded-2xl border border-indigo-100/50">
                    <div className="space-y-1.5">
                      <span className="block text-xs text-slate-550 font-black">📅 기본 일정 분류</span>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { type: 'school' as const, label: '🏫 학교/유치원' },
                          { type: 'hospital' as const, label: '🏥 병원치료' },
                          { type: 'family' as const, label: '👨‍👩‍👧 가족 행사' },
                          { type: 'other' as const, label: '🎈 기타 일정' },
                        ].map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            id={`type-button-${item.type}`}
                            onClick={() => setNewEventType(item.type)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-black text-left pl-3 border transition-all ${
                              newEventType === item.type 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 border-t border-slate-150 pt-2.5">
                      <span className="block text-xs text-slate-550 font-black">📚 학원 종류별 세부 분류</span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {[
                          { type: 'academy_math' as const, label: '🔢 수학 학원' },
                          { type: 'academy_english' as const, label: '🔤 영어 학원' },
                          { type: 'academy_korean' as const, label: '✍️ 국어 학원' },
                          { type: 'academy_arts' as const, label: '🎨 미술 학원' },
                          { type: 'academy_music' as const, label: '🎹 음악 학원' },
                          { type: 'academy_sports' as const, label: '🥋 체육/태권도' },
                          { type: 'academy_etc' as const, label: '📚 기타 학원' },
                        ].map((item) => (
                          <button
                            key={item.type}
                            type="button"
                            id={`type-button-${item.type}`}
                            onClick={() => setNewEventType(item.type)}
                            className={`py-1.5 px-1 rounded-xl text-[11px] font-black text-center border transition-all ${
                              newEventType === item.type 
                                ? 'bg-amber-500 border-amber-500 text-white shadow-sm' 
                                : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-500 font-black">부모 스마트 알림 설정:</label>
                    <select
                      id="event-reminder-select"
                      value={newEventReminder}
                      onChange={(e: any) => setNewEventReminder(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white text-slate-800 font-bold"
                    >
                      <option value="30m">출발 30분 전 스마트 알람 기동</option>
                      <option value="10m">출발 10분 전 스마트 알람 기동</option>
                      <option value="none">설정 없음</option>
                    </select>
                  </div>

                  {/* 반복 일정 설정 */}
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-150">
                    <div className="space-y-1.5">
                      <label className="block text-indigo-900 font-black flex items-center gap-1">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>🔁 반복 설정:</span>
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { value: 'none' as const, label: '안함' },
                          { value: 'daily' as const, label: '매일' },
                          { value: 'weekly' as const, label: '매주' },
                          { value: 'monthly' as const, label: '매월' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            id={`recurrence-opt-${opt.value}`}
                            onClick={() => {
                              setRecurrence(opt.value);
                              if (opt.value === 'daily') setRecurrenceDuration('7');
                              else if (opt.value === 'weekly') setRecurrenceDuration('4');
                              else if (opt.value === 'monthly') setRecurrenceDuration('3');
                              else setRecurrenceDuration('1');
                            }}
                            className={`py-1.5 px-1 rounded-xl text-xs font-black text-center border transition-all ${
                              recurrence === opt.value
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {recurrence !== 'none' && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="block text-slate-500 font-black">반복 수량 (횟수):</label>
                        <select
                          id="recurrence-duration-select"
                          value={recurrenceDuration}
                          onChange={(e) => setRecurrenceDuration(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none text-slate-800 font-black text-xs"
                        >
                          {recurrence === 'daily' && (
                            <>
                              <option value="3">3일 동안 반복</option>
                              <option value="5">5일 동안 반복</option>
                              <option value="7">7일 동안 반복 (1주일)</option>
                              <option value="14">14일 동안 반복 (2주일)</option>
                              <option value="30">30일 동안 반복 (1개월)</option>
                            </>
                          )}
                          {recurrence === 'weekly' && (
                            <>
                              <option value="2">2주 동안 반복</option>
                              <option value="4">4주 동안 반복 (1개월)</option>
                              <option value="8">8주 동안 반복 (2개월)</option>
                              <option value="12">12주 동안 반복 (3개월)</option>
                            </>
                          )}
                          {recurrence === 'monthly' && (
                            <>
                              <option value="3">3달 동안 반복</option>
                              <option value="6">6달 동안 반복</option>
                              <option value="12">12달 동안 반복 (1년)</option>
                            </>
                          )}
                        </select>
                        <p className="text-[10px] text-indigo-500 font-semibold">
                          지정된 횟수만큼 미래 달력에 동일한 시간에 자동 스케줄링됩니다.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 bg-yellow-50 rounded-2xl border border-yellow-200/50 space-y-1 text-xs">
                    <span className="font-exrabold text-amber-800 flex items-center gap-1">
                      <Lightbulb className="w-4.5 h-4.5" />
                      <span>💡 캘린더 자동 연계 꿀팁!</span>
                    </span>
                    <p className="text-[11px] leading-relaxed text-amber-700/90 font-medium">
                      제목에 <span className="font-bold underline text-indigo-900">"치과"</span> 등의 키워드가 포함되면 우리 아이의 극복 동화 콘텐츠가 자동부착되어, 아이의 탐험 대시보드에 즉시 노출됩니다.
                    </p>
                  </div>

                  <button
                    id="submit-event-btn"
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black py-3 rounded-2xl shadow-md transition-all mt-2"
                  >
                    스케줄 캘린더 등록 완료!
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* 탭: 오프라인 쿠폰 및 보상 수락 */}
          {activeTab === 'coupons' && (
            <motion.div
              key="tab-coupons"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6"
            >
              <div>
                <h2 className="text-lg font-black text-slate-900">오프라인 유대감 보상 보드 🎟️</h2>
                <p className="text-xs text-slate-400 font-medium">아이가 힘써 모은 신뢰 별 포인트로 교환한 실제 부모 연동 오프라인 약속들을 승인해 주세요.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className={`p-5 rounded-2xl border-2 flex flex-col justify-between transition-all ${
                      c.status === 'used'
                        ? 'bg-neutral-50 border-neutral-200 text-slate-400'
                        : c.status === 'requested'
                        ? 'border-rose-300 bg-rose-50/50 relative overflow-hidden animate-pulse'
                        : 'border-slate-100 bg-white'
                    }`}
                  >
                    {c.status === 'requested' && (
                      <div className="absolute top-0 right-0 bg-rose-500 text-white font-extrabold text-[9px] px-3 py-1 uppercase rounded-bl-xl tracking-wider">
                        아이 교환요청
                      </div>
                    )}

                    <div className="flex gap-4 items-start">
                      <span className="text-4xl bg-slate-100 p-2.5 rounded-xl flex items-center justify-center">
                        {c.icon === 'Gamepad2' ? '🎮' : c.icon === 'IceCream' ? '🍦' : c.icon === 'Sparkles' ? '🎡' : '🎁'}
                      </span>
                      <div className="space-y-1">
                        <span className="bg-amber-100 text-amber-900 text-[10px] px-2.5 py-0.5 rounded-full font-black">
                          요구포인트: {c.requiredPoints}별
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-base">{c.title}</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">아이가 현실에서 엄마, 아빠와 소통하며 오붓한 시간을 보내는 오프라인 애착 약속입니다.</p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-dashed border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-bold">
                        {c.status === 'locked' && '🔒 아이의 포인트 부족 상황'}
                        {c.status === 'available' && '👍 아이가 별을 모아 교환 가능'}
                        {c.status === 'requested' && '⏰ 아이가 교환을 고대하며 신청함!'}
                        {c.status === 'used' && '✅ 약속 이행 완료'}
                      </span>

                      <div className="flex items-center gap-2">
                        {c.status === 'requested' && (
                          <>
                            <button
                              id={`reject-coupon-${c.id}`}
                              onClick={() => handleApproveCouponRequest(c.id, 'reject')}
                              className="bg-slate-150 hover:bg-slate-200 text-slate-700 text-xs px-3 py-2 rounded-lg font-bold"
                            >
                              돌려보내기
                            </button>
                            <button
                              id={`approve-coupon-${c.id}`}
                              onClick={() => handleApproveCouponRequest(c.id, 'approve')}
                              className="bg-rose-500 hover:bg-rose-600 text-white text-xs px-4 py-2 rounded-lg font-black shadow-md transition-shadow active:scale-95"
                            >
                              소원 들어주기 승인! ✅
                            </button>
                          </>
                        )}
                        {c.status === 'used' && (
                          <span className="text-xs text-emerald-600 font-black">따뜻한 추억 축적됨 💖</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 신규 미션 모달 */}
      <AnimatePresence>
        {showAddMissionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="add-mission-backdrop"
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              id="add-mission-card"
              className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                <h3 className="text-lg font-black text-slate-900">새로운 미션 루틴 보드 추가</h3>
                <button
                  id="close-mission-modal"
                  onClick={() => setShowAddMissionModal(false)}
                  className="hover:bg-slate-100 p-1 rounded-full text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddMissionSubmit} className="space-y-4 text-xs sm:text-sm font-semibold text-slate-700">
                <div className="space-y-1.5">
                  <label className="block text-slate-500 font-bold">임무 및 루틴 이름:</label>
                  <input
                    type="text"
                    id="mission-title-input"
                    value={newMissionTitle}
                    onChange={(e) => setNewMissionTitle(e.target.value)}
                    placeholder="예시: 골고루 야채 먹기"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-slate-500 font-bold">카테고리 분류:</label>
                    <select
                      id="mission-category-select"
                      value={newMissionCategory}
                      onChange={(e: any) => setNewMissionCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-slate-800 font-bold"
                    >
                      <option value="life">🏡 생활 루틴</option>
                      <option value="study">📚 공부 학습</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-slate-500 font-bold">난이도:</label>
                    <select
                      id="mission-difficulty-select"
                      value={newMissionDifficulty}
                      onChange={(e: any) => setNewMissionDifficulty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none text-slate-850 font-bold"
                    >
                      <option value="easy">쉬움 (★)</option>
                      <option value="medium">보통 (★★)</option>
                      <option value="hard">어려움 (★★★)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-slate-500 font-bold">지급 보상 별 포인트수:</label>
                    <input
                      type="number"
                      id="mission-points-input"
                      value={newMissionPoints}
                      onChange={(e) => setNewMissionPoints(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold"
                      min={1}
                      max={100}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-slate-500 font-bold">자세한 가이드 설명:</label>
                  <textarea
                    id="mission-desc-input"
                    value={newMissionDesc}
                    onChange={(e) => setNewMissionDesc(e.target.value)}
                    placeholder="예시: 영양 편식을 없애고자 오늘 시금치와 당근 반 조각 이상 먹기 미션 완료하기"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-500 focus:bg-white h-20 font-medium text-xs resize-none"
                  />
                </div>

                <button
                  id="submit-mission-btn"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 font-black text-white py-3 rounded-2xl shadow-md transition-all active:scale-98"
                >
                  새로운 생활/학습 루틴 추가등록
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 숏폼 주간 브리핑 & 카드뉴스 모달 */}
      <AnimatePresence>
        {showWeeklyReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="weekly-report-backdrop"
            className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 50 }}
              id="weekly-report-card"
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-indigo-500"
            >
              <div className="bg-gradient-to-r from-teal-500 via-indigo-600 to-indigo-700 text-white p-6 relative">
                <button
                  id="close-weekly-report"
                  onClick={() => setShowWeeklyReport(false)}
                  className="absolute right-4 top-4 hover:bg-white/20 p-1.5 rounded-full text-white transition-opacity"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="bg-yellow-400 text-indigo-950 font-black text-xs px-3 py-0.5 rounded-full mb-1 inline-block uppercase tracking-wider shadow-sm">
                  Weekly Report Card
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-yellow-155">
                  {userName} 지호의 주간 루틴 브리핑
                </h3>
                <p className="text-xs text-teal-100 font-semibold">{weeklyReportData.weekStartDate} ~ 오늘까지의 육아 실록</p>
              </div>

              {/* 숏폼 카드뉴스 스타일 바운딩 슬라이드 */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* 1. 요약 그래픽 */}
                <div className="grid grid-cols-2 gap-3.5 text-center">
                  <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                    <span className="block text-[11px] font-bold text-slate-400 mb-1">성공 완료한 미션</span>
                    <span className="text-2xl font-black text-teal-700">🏆 {weeklyReportData.completedCount}회</span>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <span className="block text-[11px] font-bold text-slate-400 mb-1">이번 주 획득 포인트</span>
                    <span className="text-2xl font-black text-indigo-700">⭐ {weeklyReportData.totalPointsGained}별</span>
                  </div>
                </div>

                {/* 가장 큰 성장 영역 하이라이트 */}
                <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-250 flex items-start gap-3">
                  <Sparkles className="w-8 h-8 text-yellow-600 fill-yellow-200 shrink-0" />
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-500">지호의 최대 성장 및 기밀 영역:</h4>
                    <span className="text-base font-black text-amber-800">{weeklyReportData.growthArea}</span>
                  </div>
                </div>

                {/* 디테일 리포트 카드뉴스 bullet */}
                <div className="space-y-3">
                  <h4 className="font-extrabold text-slate-800 text-xs">이번 주 하이라이트 분석실 📡</h4>
                  <div className="space-y-2.5">
                    {weeklyReportData.highlights.map((h, i) => (
                      <div key={i} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold flex items-start gap-2.5 shadow-xs">
                        <span className="bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center shrink-0 font-extrabold">{i+1}</span>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 부모 메시지 심리학 팁 */}
                <div className="p-4 bg-teal-50/50 rounded-2xl border border-indigo-100 text-xs leading-relaxed font-semibold text-slate-700 space-y-1.5 shadow-inner">
                  <span className="font-bold text-indigo-700 flex items-center gap-1">
                    <Heart className="w-4.5 h-4.5 text-indigo-600 fill-current" />
                    <span>사랑 상호작용 피드백 팁</span>
                  </span>
                  <p className="text-[11px] text-slate-600">
                    {weeklyReportData.messageForParents}
                  </p>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 border-t border-neutral-100 flex justify-end">
                <button
                  id="dismiss-weekly-report"
                  onClick={() => setShowWeeklyReport(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm py-2 px-6 rounded-xl shadow-md transition-colors"
                >
                  든든히 잘 파악했어요! 닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. 반복 일정 삭제 분기 모달 */}
      <AnimatePresence>
        {eventToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="delete-recurrence-backdrop"
            className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              id="delete-recurrence-card"
              className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-red-100"
            >
              <div className="flex items-center gap-2.5 text-red-650 border-b border-rose-50 pb-3">
                <Trash2 className="w-5.5 h-5.5" />
                <h3 className="text-base sm:text-lg font-black text-rose-700">반복 일정 삭제 선택 🔁</h3>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  선택하신 일정 <span className="text-slate-900 font-extrabold">"{eventToDelete.title}"</span>은(는) 반복 시리즈 일정입니다. 어떤 방식으로 일정을 삭제하시겠습니까?
                </p>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-400">
                  <span className="block font-bold">📅 선택한 일정 날짜/시간:</span>
                  <span className="block mt-0.5">{eventToDelete.date} @ {eventToDelete.time}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1 font-bold">
                <button
                  id="delete-only-this-btn"
                  onClick={deleteSingleOccurrence}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs py-3 rounded-xl transition-all font-black hover:scale-[1.01] active:scale-95 duration-150"
                >
                  🚀 이 일정 하나만 삭제할게요
                </button>
                <button
                  id="delete-all-series-btn"
                  onClick={deleteAllInSeries}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-3 rounded-xl shadow-sm transition-all font-black hover:scale-[1.01] active:scale-95 duration-150"
                >
                  🔥 모든 반복 일정 한꺼번에 삭제하기
                </button>
                <button
                  id="cancel-delete-series-btn"
                  onClick={() => setEventToDelete(null)}
                  className="w-full bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 text-xs py-2.5 rounded-xl transition-all"
                >
                  돌아가기 (닫기)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

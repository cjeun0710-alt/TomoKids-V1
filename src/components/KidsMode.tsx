/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, BookOpen, Smile, Award, Heart, HelpCircle, AlertCircle, Gamepad2, Gift, IceCream, Star, X, Play } from 'lucide-react';
import { Mission, CalendarEvent, RewardCoupon, EmotionType } from '../types';
import { CharacterGuide } from './CharacterGuide';

interface KidsModeProps {
  userName: string;
  missions: Mission[];
  events: CalendarEvent[];
  coupons: RewardCoupon[];
  currentEmotion: EmotionType | null;
  totalPoints: number;
  onUpdateMissions: (newMissions: Mission[]) => void;
  onSelectEmotion: (emotion: EmotionType) => void;
  onUpdateCoupons: (newCoupons: RewardCoupon[]) => void;
  onGainPoints: (points: number) => void;
}

export const KidsMode: React.FC<KidsModeProps> = ({
  userName = '지호',
  missions,
  events,
  coupons,
  currentEmotion,
  totalPoints,
  onUpdateMissions,
  onSelectEmotion,
  onUpdateCoupons,
  onGainPoints,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'shop'>('map');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [successAnimationId, setSuccessAnimationId] = useState<string | null>(null);
  const [showLearningModal, setShowLearningModal] = useState<CalendarEvent | null>(null);
  const [showConfirmRedeem, setShowConfirmRedeem] = useState<RewardCoupon | null>(null);

  // 드롭 타겟 박스 (완료 상자)의 Ref 및 크기
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // 이모지 및 색상 맵핑
  const emotionDetails = {
    sunny: { emoji: '☀️', label: '신나고 맑음', color: 'from-amber-400 to-orange-400', pet: '😸' },
    cloudy: { emoji: '☁️', label: '그저 그래요', color: 'from-blue-300 to-neutral-400', pet: '🦁' },
    rainy: { emoji: '🌧️', label: '속상하고 찌푸림', color: 'from-indigo-400 to-slate-500', pet: '🐼' },
    rainbow: { emoji: '🌈', label: '행복하고 설렘', color: 'from-pink-400 to-purple-500', pet: '🦄' },
    starry: { emoji: '⭐', label: '엄청 반짝임', color: 'from-yellow-300 to-amber-500', pet: '🐶' },
  };

  const getMissionEmoji = (icon: string) => {
    switch (icon) {
      case 'Sparkles': return '🪥'; // 스스로 양치
      case 'BookOpen': return '📚'; // 파닉스 영어
      case 'Smile': return '🧸'; // 장난감 정리
      case 'Calculator': return '✏️'; // 연산 풀기
      case 'Flame': return '💊'; // 비타민
      default: return '🎯';
    }
  };

  const getMissionColor = (cat: string) => {
    return cat === 'study' 
      ? 'from-blue-100 to-blue-50 border-blue-200 text-blue-800 shadow-blue-100' 
      : 'from-green-100 to-green-50 border-green-200 text-green-800 shadow-green-100';
  };

  // 치과, 태권도 등 내일 및 가까운 일정 구하기
  const todayStr = '2026-05-22';
  const urgentEvent = events.find(e => e.date === todayStr || e.date === '2026-05-23');

  // 드래그 종료 핸들러
  const handleDragEnd = (event: any, info: any, missionId: string) => {
    setDraggedId(null);

    // 드롭 영역의 절대 화면 크기 측정
    if (!dropZoneRef.current) return;
    const dropZoneRect = dropZoneRef.current.getBoundingClientRect();
    const touchX = info.point.x;
    const touchY = info.point.y;

    // 마우스나 손가락이 드롭존 경계 안에 들어갔는지 체크
    const isInsideDropZone =
      touchX >= dropZoneRect.left &&
      touchX <= dropZoneRect.right &&
      touchY >= dropZoneRect.top &&
      touchY <= dropZoneRect.bottom;

    if (isInsideDropZone) {
      triggerMissionComplete(missionId);
    }
  };

  // 드롭 완료 처리
  const triggerMissionComplete = (id: string) => {
    const mission = missions.find((m) => m.id === id);
    if (!mission || mission.status !== 'todo') return;

    // 완료 효과 애니메이션
    setSuccessAnimationId(id);
    
    // 미션 완료 음성 재생
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(`와우! ${mission.title} 미션을 끝냈군요! 드래그 대성공!`);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => {
      // 미션 정보 업데이트 (completed 상태로 변경)
      const updatedMissions = missions.map((m) => {
        if (m.id === id) {
          return { ...m, status: 'completed' as const, completedAt: new Date().toISOString() };
        }
        return m;
      });
      onUpdateMissions(updatedMissions);
      // 포인트 즉시 가산
      onGainPoints(mission.points);
      setSuccessAnimationId(null);
    }, 1000);
  };

  // 쿠폰 교환 신청 신청
  const handleRequestCoupon = (coupon: RewardCoupon) => {
    if (totalPoints < coupon.requiredPoints) return;
    setShowConfirmRedeem(coupon);
  };

  const confirmRedeem = () => {
    if (!showConfirmRedeem) return;
    
    const updatedCoupons = coupons.map((c) => {
      if (c.id === showConfirmRedeem.id) {
        return { ...c, status: 'requested' as const, redeemedAt: new Date().toISOString() };
      }
      return c;
    });

    onUpdateCoupons(updatedCoupons);
    onGainPoints(-showConfirmRedeem.requiredPoints); // 포인트 차감
    setShowConfirmRedeem(null);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(`참 잘했어요! 엄마 아빠께 쿠폰 신청을 전달했습니다!`);
      utter.lang = 'ko-KR';
      window.speechSynthesis.speak(utter);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 via-sky-100 to-indigo-100 pb-16 font-sans overflow-x-hidden relative">
      
      {/* 구름 및 무지개 장식 디자인 배경 요소 */}
      <div className="absolute top-12 left-10 w-24 h-8 bg-white/60 rounded-full blur-sm pointer-events-none" />
      <div className="absolute top-32 right-12 w-36 h-12 bg-white/70 rounded-full blur-xs pointer-events-none animate-pulse" />
      <div className="absolute top-0 inset-x-0 h-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/50 via-sky-200/20 to-transparent pointer-events-none" />

      {/* 상단 무지개 바 */}
      <div className="h-2 bg-gradient-to-r from-red-400 via-orange-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 w-full" />

      {/* 키즈 모드 헤더 */}
      <header className="max-w-6xl mx-auto px-4 pt-6 pb-2 flex flex-col sm:flex-row gap-4 justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 p-2.5 rounded-2xl shadow-md border-2 border-white animate-bounce">
            <Trophy className="w-8 h-8 text-indigo-900 fill-yellow-200" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950 tracking-tight flex flex-wrap items-baseline gap-2">
              스마트 키즈 보드
              <span className="text-indigo-600 font-black text-base sm:text-lg bg-indigo-50/80 px-2.5 py-0.5 rounded-xl border border-indigo-100/80 shadow-3xs">
                나만의 탐험 지도
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-indigo-900/70 font-bold">
              반가워, <span className="text-indigo-600 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-indigo-100">{userName}</span>야! 오늘도 신나는 탐험을 출발해 볼까?
            </p>
          </div>
        </div>

        {/* 상단 감정 날씨와 탭바 */}
        <div className="flex flex-wrap items-center gap-4">
          {/* 감정 날씨 체크인 표시 */}
          <div className="bg-white/95 rounded-2xl px-4 py-2.5 shadow-md border-2 border-indigo-100 flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-black text-indigo-900 flex items-center gap-1">
              ✨ <span className="hidden sm:inline">오늘의 기분날씨:</span><span className="inline sm:hidden">기분:</span>
            </span>
            <div className="flex items-center gap-1.5">
              {(Object.keys(emotionDetails) as EmotionType[]).map((emo) => {
                const isSelected = currentEmotion === emo;
                return (
                  <button
                    key={emo}
                    type="button"
                    id={`emotion-${emo}`}
                    onClick={() => onSelectEmotion(emo)}
                    title={emotionDetails[emo].label}
                    className={`relative p-1.5 sm:p-2 hover:scale-115 active:scale-95 transition-all rounded-xl text-2xl shadow-xs border flex items-center justify-center ${
                      isSelected
                        ? 'bg-amber-400 border-amber-500 scale-110 shadow-sm ring-3 ring-amber-200'
                        : 'bg-yellow-50 border-yellow-250/50 hover:bg-yellow-105'
                    }`}
                  >
                    <span>{emotionDetails[emo].emoji}</span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full w-4 h-4 text-[9px] font-black flex items-center justify-center border border-white shadow-xs">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {currentEmotion && (
              <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1.5 rounded-xl border border-indigo-100 animate-fadeIn">
                <span className="text-[10px] sm:text-xs font-extrabold text-indigo-950">
                  지금 지호 상태는 <span className="text-indigo-650 font-black">"{emotionDetails[currentEmotion].label}"</span> 상태!
                </span>
              </div>
            )}
          </div>

          {/* 뷰 탭 전환 버튼 */}
          <div className="bg-indigo-900/10 p-1 rounded-2xl flex items-center gap-1">
            <button
              id="kids-tab-map"
              onClick={() => setActiveTab('map')}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                activeTab === 'map'
                  ? 'bg-indigo-600 text-white shadow-md scale-105'
                  : 'text-indigo-950 hover:bg-white/60'
              }`}
            >
              🗺️ 탐험 지도 (미션)
            </button>
            <button
              id="kids-tab-shop"
              onClick={() => setActiveTab('shop')}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                activeTab === 'shop'
                  ? 'bg-amber-500 text-white shadow-md scale-105'
                  : 'text-indigo-950 hover:bg-white/60'
              }`}
            >
              🎁 별 쿠폰 상점
            </button>
          </div>
        </div>
      </header>

      {/* 탐험 콘텐츠 영역 */}
      <main className="max-w-6xl mx-auto px-4 mt-4 relative z-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* 미션 맵 & 쿠폰 상점 메인 */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'map' ? (
              <motion.div
                key="map-view"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                className="space-y-6"
              >
                {/* 1. 상단 상황 맞춤형 사전 학습 카드 (동화) */}
                {urgentEvent && urgentEvent.suggestedContent && (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    id="preset-learning-banner"
                    className="bg-gradient-to-r from-purple-500 via-indigo-500 to-indigo-600 text-white rounded-3xl p-6 shadow-xl border-4 border-white flex flex-col md:flex-row justify-between items-center gap-6"
                  >
                    <div className="space-y-2 flex-1 text-center md:text-left">
                      <div className="inline-flex items-center gap-1.5 bg-yellow-300 text-indigo-950 px-3 py-1 rounded-full text-xs font-black shadow-sm">
                        <Sparkles className="w-3.5 h-3.5 fill-current animate-spin" />
                        <span>내일의 특수 추천 보물 동화</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-yellow-200">
                        {urgentEvent.suggestedContent.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-indigo-50/90 leading-relaxed font-bold">
                        {urgentEvent.suggestedContent.summary}
                      </p>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4">
                        <span className="bg-indigo-700/80 px-3 py-1 rounded-lg text-xs font-semibold">
                          ⏱️ 소요시간: {urgentEvent.suggestedContent.duration}
                        </span>
                        <span className="bg-yellow-400 text-slate-900 px-3 py-1 rounded-lg text-xs font-black">
                          ⭐ 보상별 5개 추가 지급!
                        </span>
                      </div>
                    </div>
                    
                    <button
                      id="view-learning-btn"
                      onClick={() => setShowLearningModal(urgentEvent)}
                      className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-indigo-950 font-black py-4 px-6 rounded-2xl shadow-xl flex items-center gap-2 text-base select-none shrink-0"
                    >
                      <BookOpen className="w-5 h-5 fill-indigo-950" />
                      <span>무료 구경하러 가기! (새창)</span>
                    </button>
                  </motion.div>
                )}

                {/* 2. 나만의 지도: 미션 목록 */}
                <div>
                  <h2 className="text-lg font-black text-indigo-950 mb-3 flex items-center gap-2">
                    🌟 오늘의 모험 임무 (완수하려면 드래그해 놓으세요!)
                  </h2>

                  {/* 미션 드래그 맵 가이드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {missions.map((m) => {
                      const isSuccessAnimating = successAnimationId === m.id;
                      return (
                        <div key={m.id} className="relative">
                          {/* 상태가 Todo인 것만 드래그 가능 */}
                          {m.status === 'todo' ? (
                            <motion.div
                              drag
                              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                              dragElastic={0.9}
                              onDragStart={() => setDraggedId(m.id)}
                              onDragEnd={(event, info) => handleDragEnd(event, info, m.id)}
                              whileDrag={{ scale: 1.08, zIndex: 30 }}
                              className={`p-5 rounded-3xl border-3 ${getMissionColor(m.category)} cursor-grab active:cursor-grabbing shadow-lg select-none transition-all duration-300 bg-white border-2 hover:border-indigo-400`}
                            >
                              <div className="flex items-start gap-4">
                                <span className="text-4xl bg-white p-2 sm:p-3 rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center">
                                  {getMissionEmoji(m.icon)}
                                </span>
                                <div className="space-y-1 pr-6 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                      m.category === 'study' ? 'bg-blue-200 text-blue-900' : 'bg-green-200 text-green-900'
                                    }`}>
                                      {m.category === 'study' ? '📚 공부배움' : '🏡 씩씩생활'}
                                    </span>
                                    <span className="text-xs text-neutral-400 font-bold">난이도: {m.difficulty}</span>
                                  </div>
                                  <h3 className="text-lg font-extrabold text-neutral-900 leading-tight">
                                    {m.title}
                                  </h3>
                                  <p className="text-xs text-neutral-600 font-medium">
                                    {m.description}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="mt-4 flex flex-col sm:flex-row gap-2.5 justify-between sm:items-center bg-black/5 p-2.5 rounded-2xl">
                                <span className="text-xs text-indigo-900 font-extrabold flex items-center gap-1">
                                  👇 드래그해서 아래 보물상자에 넣거나:
                                </span>
                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <button
                                    id={`complete-mission-btn-${m.id}`}
                                    onClick={() => triggerMissionComplete(m.id)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow-sm hover:scale-105 active:scale-95 transition-all"
                                  >
                                    🚀 바로 완료하기
                                  </button>
                                  <span className="bg-yellow-400 text-indigo-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                                    ⭐ {m.points}별
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            // 완료 혹은 승인됨 정적 카드
                            <div className={`p-5 rounded-3xl border-3 bg-neutral-100/80 border-neutral-200 text-neutral-500 shadow-sm relative overflow-hidden h-full flex flex-col justify-between`}>
                              <div className="flex items-start gap-4">
                                <span className="text-4xl bg-neutral-200 p-2 sm:p-3 rounded-2xl flex items-center justify-center grayscale">
                                  {getMissionEmoji(m.icon)}
                                </span>
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] bg-neutral-300 text-neutral-700 px-2 py-0.5 rounded-full font-black">
                                      완료성찰
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-extrabold line-through text-neutral-400 leading-tight">
                                    {m.title}
                                  </h3>
                                  <p className="text-xs font-medium text-neutral-400">
                                    {m.status === 'completed' 
                                      ? '부모님 확인 중이에요! 곧 별이 최종 승인돼요.' 
                                      : '최종 확인 완료! 참 잘했어요! 🎉'}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex justify-between items-center">
                                <div className={`text-xs px-3 py-1 rounded-full font-bold ${
                                  m.status === 'completed' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-green-100 text-green-700'
                                }`}>
                                  {m.status === 'completed' ? '⏳ 검토중(완료됨)' : '✅ 참 잘했어요(참가완료)'}
                                </div>
                                <span className="text-yellow-500 text-sm font-black">
                                  ⭐ {m.points}별 완료
                                </span>
                              </div>

                              {/* 이쁜 도장 데코 */}
                              <div className="absolute right-4 top-2 rotate-12 bg-indigo-500/10 text-indigo-600/30 text-xs px-2 py-1.5 rounded-lg border-2 border-dashed border-indigo-500/20 font-black tracking-widest select-none pointer-events-none">
                                {m.status === 'completed' ? 'DONE' : 'APPROVED'}
                              </div>
                            </div>
                          )}

                          {/* 별 폭발 애니메이션 효과용 오버레이 */}
                          {isSuccessAnimating && (
                            <motion.div
                              initial={{ scale: 0.5, opacity: 0 }}
                              animate={{ scale: 1.1, opacity: 1 }}
                              className="absolute inset-0 bg-yellow-400/90 rounded-3xl flex flex-col items-center justify-center z-20 text-indigo-950 p-6"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              >
                                <Sparkles className="w-12 h-12 text-indigo-950 fill-yellow-200" />
                              </motion.div>
                              <span className="font-extrabold text-xl mt-2 animate-bounce">
                                ⭐ 배송 완료 미션 해결! 별 {m.points}개 획득! ⭐
                              </span>
                            </motion.div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. 화면 하단 드래그 앤 드롭 타겟 존 */}
                <div className="relative">
                  <div className="absolute left-1/2 -top-5 -translate-x-1/2 bg-indigo-900 text-yellow-300 font-extrabold text-xs px-4 py-1.5 rounded-full border border-indigo-700 z-10 shadow-md">
                    보물 완료 구역
                  </div>
                  
                  <div
                    ref={dropZoneRef}
                    id="drop-zone-container"
                    className={`bg-gradient-to-r from-yellow-100 via-amber-100 to-yellow-150 rounded-3xl border-4 border-dashed py-10 px-6 flex flex-col items-center justify-center text-center transition-all ${
                      draggedId 
                        ? 'border-yellow-500 bg-yellow-200/50 scale-102 ring-4 ring-yellow-400/20 shadow-lg' 
                        : 'border-yellow-300 shadow-md hover:border-yellow-400'
                    }`}
                  >
                    <motion.div
                      animate={{
                        scale: draggedId ? [1, 1.12, 1] : 1,
                        rotate: draggedId ? [0, 5, -5, 0] : 0,
                      }}
                      transition={{ repeat: draggedId ? Infinity : 0, duration: 0.8 }}
                      className="text-6xl mb-2"
                    >
                      🎁
                    </motion.div>
                    <h3 className="text-xl font-extrabold text-amber-950">
                      여기로 미션 카드를 드래그해 놓으세요!
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-900 font-bold max-w-sm mt-1 leading-relaxed">
                      완성한 보물 미션을 마우스나 손가락으로 꾹~ 눌러서 여기 상자 안에 쏙 집어넣으면 별 보상을 즉시 획득해요!
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              // 선물 교환 상점 목록
              <motion.div
                key="shop-view"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-3xl p-6 shadow-md border border-amber-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-xl font-black text-amber-950 flex items-center justify-center sm:justify-start gap-1">
                      별빛 도토리 상점 🐿️
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-900/70 font-bold">
                      미션을 완료해서 성실히 모은 금빛 별로, 엄마 아빠가 수락한 진짜 오프라인 소원 쿠폰을 구매해 보세요!
                    </p>
                  </div>
                  <div className="bg-amber-100 text-amber-900 rounded-2xl px-5 py-3 border-2 border-amber-300 font-black text-center shrink-0">
                    <span className="block text-xs">내 별 지갑 잔고:</span>
                    <span className="text-2xl">⭐ {totalPoints}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {coupons.map((c) => {
                    const isPurchasable = totalPoints >= c.requiredPoints && c.status === 'locked';
                    // locked인데 포인트 만족하면 'available' 처리하여 띄움
                    const currentStatus = (c.status === 'locked' && totalPoints >= c.requiredPoints) ? 'available' : c.status;

                    return (
                      <div
                        key={c.id}
                        className={`bg-white rounded-3xl p-5 border-2 shadow-md flex flex-col justify-between transition-all duration-300 ${
                          currentStatus === 'used' 
                            ? 'bg-neutral-50 border-neutral-200 opacity-60' 
                            : currentStatus === 'requested'
                            ? 'border-indigo-300 bg-indigo-50/50'
                            : currentStatus === 'available'
                            ? 'border-amber-300 hover:border-amber-400 ring-2 ring-amber-400/10'
                            : 'border-neutral-200/80 bg-neutral-100/40'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <span className="text-4xl p-2 bg-yellow-50 rounded-2xl shadow-xs shrink-0 flex items-center justify-center">
                            {c.icon === 'Gamepad2' ? '🎮' : c.icon === 'IceCream' ? '🍦' : c.icon === 'Sparkles' ? '🎡' : '🎁'}
                          </span>
                          <div className="space-y-1">
                            <h4 className="text-base sm:text-lg font-black text-neutral-800 leading-tight">
                              {c.title}
                            </h4>
                            <p className="text-xs font-semibold text-neutral-500">
                              엄마 아빠와 다독이며 오프라인에서 실제 수행하는 보상 약속입니다.
                            </p>
                            <div className="inline-block pt-1">
                              <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-extrabold border border-amber-200">
                                필요 별: ⭐ {c.requiredPoints}개
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-dashed border-neutral-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-neutral-400">
                            {currentStatus === 'used' && '사용 완료 🥳'}
                            {currentStatus === 'requested' && '엄마 아빠 수락 대기 중 ⏰'}
                            {currentStatus === 'available' && '지금 바로 신청 가능! 👍'}
                            {currentStatus === 'locked' && '별이 더 필요해요 😭'}
                          </span>

                          {currentStatus === 'available' && (
                            <button
                              id={`buy-coupon-${c.id}`}
                              onClick={() => handleRequestCoupon(c)}
                              className="bg-amber-500 hover:bg-amber-600 font-extrabold text-white text-xs py-2 px-4 rounded-xl shadow-md transition-all active:scale-95"
                            >
                              쿠폰 교환 신청하기!
                            </button>
                          )}

                          {currentStatus === 'requested' && (
                            <button
                              disabled
                              className="bg-indigo-200 text-indigo-700 font-extrabold text-xs py-2 px-4 rounded-xl cursor-not-allowed"
                            >
                              신청 전달됨 ✨
                            </button>
                          )}

                          {currentStatus === 'used' && (
                            <button
                              disabled
                              className="bg-neutral-200 text-neutral-500 font-extrabold text-xs py-2 px-4 rounded-xl cursor-not-allowed"
                            >
                              추억 완료
                            </button>
                          )}

                          {currentStatus === 'locked' && (
                            <button
                              disabled
                              className="bg-neutral-100 text-neutral-400 font-black text-xs py-2 px-4 rounded-xl border border-neutral-200 cursor-not-allowed"
                            >
                              ⭐ 별 {c.requiredPoints - totalPoints}개 부족
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 멍멍이 도우미 오른쪽 정보 패널 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/95 rounded-3xl p-5 shadow-md border-2 border-indigo-200 flex flex-col items-center">
            <h3 className="text-sm font-black text-indigo-950 mb-3 border-b-2 border-indigo-100 pb-1.5 w-full text-center">
              🐾 탐험 수호 멍멍이 가이드
            </h3>
            <CharacterGuide
              currentEmotion={currentEmotion}
              onSelectEmotion={onSelectEmotion}
              nextEvent={urgentEvent || null}
              userName={userName}
              totalPoints={totalPoints}
            />
          </div>

          {/* 오늘의 스케줄 일정 알림 피드 */}
          <div className="bg-white/95 rounded-3xl p-5 shadow-md border-2 border-indigo-100">
            <h3 className="text-xs sm:text-sm font-black text-indigo-950 mb-3 border-b-2 border-indigo-100 pb-1.5 flex justify-between items-center">
              <span>📅 내 보물 스케줄</span>
              <span className="text-[10px] bg-red-150 text-red-700 px-2 py-0.5 rounded-full font-black animate-pulse">오늘 일정</span>
            </h3>

            <div className="space-y-3">
              {events.filter(e => e.date === todayStr).length === 0 ? (
                <p className="text-xs mt-3 text-neutral-400 font-medium text-center py-4">
                  오늘은 약속된 일정이 없어요.<br />나만의 지도를 열심히 완성해봐요!
                </p>
              ) : (
                events.filter(e => e.date === todayStr).map((ev) => (
                  <div key={ev.id} className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-150 flex items-start gap-2.5">
                    <span className="text-xl">
                      {ev.type === 'hospital' ? '🏥' : 
                       ev.type === 'school' ? '🏫' : 
                       ev.type === 'academy_math' ? '🔢' : 
                       ev.type === 'academy_english' ? '🔤' : 
                       ev.type === 'academy_korean' ? '✍️' : 
                       ev.type === 'academy_arts' ? '🎨' : 
                       ev.type === 'academy_music' ? '🎹' : 
                       ev.type === 'academy_sports' ? '🥋' : 
                       ev.type === 'academy_etc' ? '📚' : 
                       ev.type === 'family' ? '👨‍👩‍👧' : '🎈'}
                    </span>
                    <div className="space-y-0.5">
                      <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 leading-tight">
                        {ev.title}
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-bold">
                        🕒 {ev.time} 예정 ({ev.reminderSetting === 'none' ? '알림 없음' : `${ev.reminderSetting} 전 알림`})
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 상황 맞춤형 사전 학습(동화/게임) 모달 */}
      <AnimatePresence>
        {showLearningModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="learning-modal-backdrop"
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              id="learning-modal-card"
              className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border-4 border-indigo-400"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 relative">
                <button
                  id="close-learning-modal"
                  onClick={() => setShowLearningModal(null)}
                  className="absolute right-4 top-4 hover:bg-white/20 p-1.5 rounded-full text-white transition-opacity"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="inline-block bg-yellow-300 text-indigo-950 font-black text-xs px-2.5 py-0.5 rounded-full mb-2">
                  📖 용기 보물 극장
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-yellow-200">
                  {showLearningModal.suggestedContent?.title}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-3">
                  <Star className="w-10 h-10 text-yellow-500 fill-yellow-200 shrink-0" />
                  <div>
                    <h4 className="text-sm font-black text-indigo-950">치과 가기 전 씩씩한 용기 연습!</h4>
                    <p className="text-xs text-neutral-600 leading-relaxed font-semibold mt-1">
                      치료하는 기구들은 이빨을 공격하는 충치 악당들을 처단하는 반짝 레이저 칼과 버블 구름이랍니다. 동생 강아지 코코와 함께 무섭지 않음을 미리 영상으로 탐색해봐요.
                    </p>
                  </div>
                </div>

                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-neutral-900 flex flex-col items-center justify-center text-center text-white relative group">
                  {/* 동화 시뮬레이션 화면 */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/60 via-indigo-900/40 to-transparent z-10" />
                  <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=600")' }} />
                  
                  <div className="relative z-10 p-4 shrink-0 space-y-2">
                    <div className="inline-block bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full uppercase animate-pulse">
                      Live Video Play
                    </div>
                    <h5 className="font-exrabold text-sm sm:text-base text-yellow-200 drop-shadow-sm">
                      [튼튼이 건강나라] 이빨 요정과 해골 악당
                    </h5>
                    <p className="text-[10px] text-white/80 font-medium">영상이 재생되며 용기가 차오릅니다.</p>
                  </div>

                  {/* 재생 버튼 및 타임 */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      alert('동화를 완전하고 재미있게 다 읽었어요! 보너스 별 5개를 획득합니다!');
                      onGainPoints(5);
                      setShowLearningModal(null);
                    }}
                    className="relative z-20 bg-yellow-400 text-indigo-950 rounded-full p-4.5 shadow-xl hover:bg-yellow-300 font-extrabold flex items-center justify-center gap-2 duration-300"
                  >
                    <Play className="w-6 h-6 fill-indigo-950 text-indigo-950" />
                  </motion.button>
                  <span className="relative z-10 text-white/90 text-xs font-semibold mt-2 drop-shadow-xs">영상 시청 완료 시 별 +5 획득</span>
                </div>
              </div>

              <div className="bg-neutral-50 p-4 border-t border-neutral-100 flex justify-end">
                <button
                  id="dismiss-learning"
                  onClick={() => setShowLearningModal(null)}
                  className="bg-neutral-200 hover:bg-neutral-300 font-extrabold text-neutral-800 text-sm py-2 px-6 rounded-xl"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 쿠폰 구매 확인 모달 */}
      <AnimatePresence>
        {showConfirmRedeem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="coupon-confirm-backdrop"
            className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              id="coupon-confirm-card"
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border-4 border-amber-400"
            >
              <div className="bg-amber-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-3xl">
                🎟️
              </div>
              <div>
                <h3 className="text-xl font-black text-indigo-950">쿠폰 교환 신청</h3>
                <p className="text-xs text-neutral-500 font-bold mt-1">별 포인트를 차감하여 신청을 전달할까요?</p>
              </div>

              <div className="bg-yellow-50/70 p-4 rounded-2xl border border-yellow-200">
                <h4 className="font-extrabold text-indigo-900 text-base">{showConfirmRedeem.title}</h4>
                <div className="flex justify-center items-center gap-2 mt-2">
                  <span className="text-xs text-neutral-500">차감할 별:</span>
                  <span className="text-sm font-black text-amber-600">⭐ {showConfirmRedeem.requiredPoints}개</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  id="cancel-redeem"
                  onClick={() => setShowConfirmRedeem(null)}
                  className="flex-1 bg-neutral-150 hover:bg-neutral-200 text-neutral-700 font-extrabold py-3 rounded-2xl border border-neutral-300"
                >
                  아니요, 취소할래요
                </button>
                <button
                  id="confirm-redeem"
                  onClick={confirmRedeem}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-extrabold py-3 rounded-2xl shadow-md transition-all"
                >
                  네, 신청할래요!
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

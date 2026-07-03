/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, UserCheck, HelpCircle, X, ShieldAlert, Sparkles, Heart } from 'lucide-react';
import { Mission, CalendarEvent, RewardCoupon, EmotionType } from './types';
import { 
  initialMissions, 
  initialEvents, 
  initialCoupons, 
  weeklyReport 
} from './data/initialData';
import { KidsMode } from './components/KidsMode';
import { ParentsMode } from './components/ParentsMode';

export default function App() {
  const [currentMode, setCurrentMode] = useState<'kids' | 'parents'>('kids');
  
  // 상태 관리 (localStorage 데이터 보관 처리)
  const [missions, setMissions] = useState<Mission[]>(() => {
    const saved = localStorage.getItem('kidsboard_missions');
    return saved ? JSON.parse(saved) : initialMissions;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('kidsboard_events');
    return saved ? JSON.parse(saved) : initialEvents;
  });

  const [coupons, setCoupons] = useState<RewardCoupon[]>(() => {
    const saved = localStorage.getItem('kidsboard_coupons');
    return saved ? JSON.parse(saved) : initialCoupons;
  });

  const [currentEmotion, setCurrentEmotion] = useState<EmotionType | null>(() => {
    const saved = localStorage.getItem('kidsboard_emotion');
    return saved ? (saved as EmotionType) : null;
  });

  const [totalPoints, setTotalPoints] = useState<number>(() => {
    const saved = localStorage.getItem('kidsboard_points');
    return saved ? Number(saved) : 15; // 기본 별 15개 주고 시작해서 흥미 유발
  });

  // 부모 모드 진입 방지용 간단 퀴즈 모달 상태
  const [showGatekeeper, setShowGatekeeper] = useState(false);
  const [parentQuiz, setParentQuiz] = useState({ q: '', a: 0 });
  const [quizInput, setQuizInput] = useState('');
  const [quizError, setQuizError] = useState(false);

  // 로컬 스토리지 자동 저장 동기화
  useEffect(() => {
    localStorage.setItem('kidsboard_missions', JSON.stringify(missions));
  }, [missions]);

  useEffect(() => {
    localStorage.setItem('kidsboard_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('kidsboard_coupons', JSON.stringify(coupons));
  }, [coupons]);

  useEffect(() => {
    if (currentEmotion) {
      localStorage.setItem('kidsboard_emotion', currentEmotion);
    } else {
      localStorage.removeItem('kidsboard_emotion');
    }
  }, [currentEmotion]);

  useEffect(() => {
    localStorage.setItem('kidsboard_points', totalPoints.toString());
  }, [totalPoints]);

  // 부모 자격 검증용 임의 곱셈 퀴즈 생성
  const generateParentQuiz = () => {
    const n1 = Math.floor(Math.random() * 4) + 6; // 6 ~ 9
    const n2 = Math.floor(Math.random() * 5) + 5; // 5 ~ 9
    setParentQuiz({
      q: `${n1} 곱하기 ${n2} 은 얼마인가요?`,
      a: n1 * n2,
    });
    setQuizInput('');
    setQuizError(false);
    setShowGatekeeper(true);
  };

  const handleVerifyParent = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(quizInput) === parentQuiz.a) {
      setShowGatekeeper(false);
      setCurrentMode('parents');
    } else {
      setQuizError(true);
      // 조금 흔드는 애니메이션 부여하거나 경고 문구 출력
    }
  };

  const handleGainPoints = (gainedPoints: number) => {
    setTotalPoints((prev) => Math.max(0, prev + gainedPoints));
  };

  const handleResetData = () => {
    setMissions(initialMissions);
    setEvents(initialEvents);
    setCoupons(initialCoupons);
    setCurrentEmotion(null);
    setTotalPoints(15);
    localStorage.removeItem('kidsboard_missions');
    localStorage.removeItem('kidsboard_events');
    localStorage.removeItem('kidsboard_coupons');
    localStorage.removeItem('kidsboard_emotion');
    localStorage.removeItem('kidsboard_points');
  };

  return (
    <div id="smart-kids-board-app" className="relative">
      
      {/* 1. 최상단 모드 전환 플로팅 세련 스위치 */}
      <div className="fixed top-24 right-4 z-40 bg-white/90 backdrop-blur-md rounded-2xl p-1.5 shadow-2xl border border-indigo-200 flex flex-col gap-1 items-stretch">
        <span className="text-[9px] font-black text-center text-slate-400 select-none px-1 uppercase leading-none pb-1">이동기기</span>
        <button
          id="mode-switch-kids"
          onClick={() => setCurrentMode('kids')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
            currentMode === 'kids'
              ? 'bg-sky-500 text-white shadow-md'
              : 'text-sky-950 hover:bg-sky-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>아이 화면</span>
        </button>
        <button
          id="mode-switch-parents"
          onClick={() => {
            if (currentMode === 'kids') {
              generateParentQuiz();
            } else {
              setCurrentMode('kids');
            }
          }}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all ${
            currentMode === 'parents'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-indigo-950 hover:bg-indigo-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>부모 화면</span>
        </button>
      </div>

      {/* 2. 대시보드 스위칭 바디 */}
      <AnimatePresence mode="wait">
        {currentMode === 'kids' ? (
          <motion.div
            key="kids"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <KidsMode
              userName="지호"
              missions={missions}
              events={events}
              coupons={coupons}
              currentEmotion={currentEmotion}
              totalPoints={totalPoints}
              onUpdateMissions={setMissions}
              onSelectEmotion={setCurrentEmotion}
              onUpdateCoupons={setCoupons}
              onGainPoints={handleGainPoints}
            />
          </motion.div>
        ) : (
          <motion.div
            key="parents"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
          >
            <ParentsMode
              userName="지호"
              missions={missions}
              events={events}
              coupons={coupons}
              currentEmotion={currentEmotion}
              totalPoints={totalPoints}
              onUpdateMissions={setMissions}
              onUpdateEvents={setEvents}
              onUpdateCoupons={setCoupons}
              onResetData={handleResetData}
              weeklyReportData={weeklyReport}
              onSelectEmotion={setCurrentEmotion}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. 부모 안전 잠금 퀴즈 게이트웨이 모달 */}
      <AnimatePresence>
        {showGatekeeper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="parent-gate-backdrop"
            className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              id="parent-gate-modal"
              className="bg-white rounded-3xl p-6 w-full max-w-sm overflow-hidden shadow-2xl border-4 border-indigo-400"
            >
              <div className="flex justify-between items-center border-b border-neutral-100 pb-3 mb-4">
                <span className="text-sm font-black text-rose-500 flex items-center gap-1">
                  <ShieldAlert className="w-5 h-5" />
                  <span>잠깐! 부모 전용 잠금 장치</span>
                </span>
                <button
                  id="close-gatekeeper"
                  onClick={() => setShowGatekeeper(false)}
                  className="hover:bg-slate-100 p-1.5 rounded-full text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center space-y-4">
                <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-150">
                  <p className="text-xs text-indigo-900 font-bold mb-2">아이가 실수로 부모 설정을 변경하는 것을 방지하기 위해 정답을 적어 입증해 주세요.</p>
                  <span className="text-xl font-extrabold text-indigo-950 block select-none">
                    🧐 {parentQuiz.q}
                  </span>
                </div>

                <form onSubmit={handleVerifyParent} className="space-y-3.5">
                  <input
                    type="number"
                    id="gateQuizAnswer"
                    value={quizInput}
                    onChange={(e) => setQuizInput(e.target.value)}
                    placeholder="숫자 정답 기입"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:bg-white p-3 rounded-2xl outline-none font-bold text-center text-lg shadow-inner text-slate-800"
                    autoFocus
                    required
                  />

                  {quizError && (
                    <span className="text-xs text-red-500 font-extrabold block animate-shake">
                      ⚠️ 앗, 답이 올바르지 않아요. 계산 문제를 다시 한번 풀어보세요!
                    </span>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      id="cancel-gatekeeper-btn"
                      onClick={() => setShowGatekeeper(false)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm border border-slate-300 flex-1"
                    >
                      다음에 갈래요
                    </button>
                    <button
                      type="submit"
                      id="submit-gatekeeper-btn"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 px-4 rounded-2xl text-xs sm:text-sm shadow-md transition-colors flex-1"
                    >
                      부모 모드 입장하기
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

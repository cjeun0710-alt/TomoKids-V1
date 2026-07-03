/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Sparkles, AlertCircle, Play, Check, X, ShieldAlert } from 'lucide-react';
import { CalendarEvent, EmotionType } from '../types';

interface CharacterGuideProps {
  currentEmotion: EmotionType | null;
  onSelectEmotion: (emotion: EmotionType) => void;
  nextEvent: CalendarEvent | null;
  userName: string;
  totalPoints: number;
}

export const CharacterGuide: React.FC<CharacterGuideProps> = ({
  currentEmotion,
  onSelectEmotion,
  nextEvent,
  userName,
  totalPoints,
}) => {
  const [showSpeech, setShowSpeech] = useState(true);
  const [speechText, setSpeechText] = useState('');
  const [characterAction, setCharacterAction] = useState<'idle' | 'happy' | 'jump' | 'talking'>('idle');
  const [showReporterNews, setShowReporterNews] = useState(false);
  const [interviewAnswer, setInterviewAnswer] = useState<string | null>(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);

  // 음성 합성 지원 (Kids Mode에 대한 흥미 유발 기능)
  const speakText = (text: string) => {
    if (isAudioMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.05;
      utterance.pitch = 1.2; // 아이 친화적인 조금 높은 목소리
      window.speechSynthesis.speak(utterance);
    }
  };

  // 캐릭터 기본 가이드 메시지 룰
  useEffect(() => {
    if (!currentEmotion) {
      const msg = `안녕, ${userName}아! 오늘 기분은 어때? 날씨 동물 표정으로 알려줘!`;
      setSpeechText(msg);
      setCharacterAction('talking');
      // 오디오 강제 발화는 사용자 인터랙션 후 가능하므로 첫 렌더 시엔 보수적으로 처리
    } else {
      let msg = '';
      if (nextEvent) {
        msg = `오늘 멋진 일정이 있어! 바로 "${nextEvent.title}"! 준비 끝났으면 멍멍 기자의 뉴스를 클릭해 봐!`;
      } else if (totalPoints >= 40) {
        msg = `별을 정말 많이 모았구나! 벌써 ${totalPoints}개나 되다니, 대단해! 쿠폰으로 바꿔볼까?`;
      } else {
        msg = `반가워, ${userName}! 오늘도 재미있는 탐험 지도를 시작해 볼까? 미션을 끌어다 놓으면 별을 줄게!`;
      }
      setSpeechText(msg);
      setCharacterAction('happy');
    }
  }, [currentEmotion, nextEvent, userName, totalPoints]);

  const triggerNews = () => {
    setShowReporterNews(true);
    setCharacterAction('jump');
    setInterviewAnswer(null);
    const audioMsg = `현장에 나가 있는 멍멍 기자입니다! 우리 ${userName} 어린이, 곧 있을 "${nextEvent?.title || '오늘의 보물 탐험'}" 일정을 위해 지금 씩씩하게 준비하고 있나요? 소감을 인터뷰해 보겠습니다!`;
    setTimeout(() => {
      speakText(audioMsg);
    }, 100);
  };

  const handleInterviewSubmit = (answer: 'yes' | 'no') => {
    if (answer === 'yes') {
      setInterviewAnswer('yes');
      setCharacterAction('happy');
      const response = `우와! 정말 대단해요! 씩씩한 ${userName} 어린이의 완벽한 대답이었습니다! 역시 모범 어린이에요! 감동받은 멍멍 기자가 용기 보너스 별 5개를 드립니다. 치과도, 준비도 문제 없겠어요!`;
      speakText(response);
    } else {
      setInterviewAnswer('no');
      setCharacterAction('talking');
      const response = `아하, 조금 긴장되거나 귀찮을 수 있어요. 하지만 귀여운 충치방지 동화를 보면서 한 걸음 천천히 나아가는 건 어떨까요? 언제든 씩씩하게 일어날 수 있도록 멍멍 기자가 꼭 안아 줄게요! 화이팅!`;
      speakText(response);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      {/* 멍멍 기자 숏폼 뉴스 속보 - 풀 스크린 인터랙티브 오버레이 */}
      <AnimatePresence>
        {showReporterNews && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="reporter-modal-backdrop"
            className="fixed inset-0 bg-neutral-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 50 }}
              id="reporter-card"
              className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border-4 border-yellow-300"
            >
              {/* 방송국 상단 바 */}
              <div className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 px-6 py-3 flex justify-between items-center text-white font-bold animate-pulse">
                <div className="flex items-center gap-2 text-sm sm:text-base">
                  <div className="inline-block w-3 h-3 bg-white rounded-full animate-ping" />
                  <span>KIDS NEWS [속보 & 현장 중계]</span>
                </div>
                <button
                  id="close-news-btn"
                  onClick={() => setShowReporterNews(false)}
                  className="bg-black/30 hover:bg-black/50 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* 카메라 프레임 & 크로마키 연출 */}
              <div className="relative bg-gradient-to-b from-blue-400 to-indigo-600 p-6 flex flex-col items-center text-center">
                {/* 배경 구름 및 무지개 데코 */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-300 via-yellow-100 to-transparent" />
                
                {/* 멍멍 기자 메인 카메듀오 */}
                <div className="relative w-40 h-40 mb-3 bg-white/20 rounded-full border-4 border-yellow-200 flex items-center justify-center overflow-hidden">
                  <motion.svg
                    animate={{
                      y: characterAction === 'jump' ? [0, -25, 0] : characterAction === 'happy' ? [0, -10, 0] : [0, -2, 0],
                      rotate: characterAction === 'happy' ? [0, -5, 5, 0] : [0, -1, 1, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: characterAction === 'jump' ? 0.6 : characterAction === 'happy' ? 1.5 : 3,
                    }}
                    viewBox="0 0 100 100"
                    className="w-32 h-32"
                  >
                    {/* 강야지 얼굴 벡터 */}
                    <ellipse cx="50" cy="55" rx="35" ry="30" fill="#F0B27A" /> {/* 머리 */}
                    <path d="M15,40 Q5,25 15,10 Q25,10 25,40 Z" fill="#D35400" /> {/* 왼쪽 귀 */}
                    <path d="M85,40 Q95,25 85,10 Q75,10 75,40 Z" fill="#D35400" /> {/* 오른쪽 귀 */}
                    <ellipse cx="50" cy="62" rx="20" ry="15" fill="#FADBD8" /> {/* 주둥이 */}
                    
                    {/* 눈 */}
                    <ellipse cx="38" cy="46" rx="5" ry="6" fill="#1C2833" />
                    <ellipse cx="62" cy="46" rx="5" ry="6" fill="#1C2833" />
                    {/* 눈동자 하이라이트 */}
                    <circle cx="36" cy="44" r="2" fill="#FFFFFF" />
                    <circle cx="60" cy="44" r="2" fill="#FFFFFF" />
                    
                    {/* 코 */}
                    <ellipse cx="50" cy="56" rx="6" ry="4" fill="#1C2833" />
                    {/* 귀여운 볼터치 */}
                    <circle cx="28" cy="58" r="4.5" fill="#F1948A" opacity="0.8" />
                    <circle cx="72" cy="58" r="4.5" fill="#F1948A" opacity="0.8" />

                    {/* 발 흔들기 */}
                    <ellipse cx="50" cy="80" rx="10" ry="5" fill="#D35400" />
                  </motion.svg>

                  {/* 마이크 아이콘 장착 */}
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute -bottom-1 right-2 bg-red-600 rounded-full p-2.5 shadow-lg border-2 border-white"
                  >
                    <Volume2 className="w-5 h-5 text-white" />
                  </motion.div>
                </div>

                {/* 하단 방송 라이브 자막 & 마이크 수음 효과 */}
                <div className="bg-black/60 backdrop-blur-sm self-stretch rounded-xl p-4 text-white text-left font-mono border-l-4 border-red-500">
                  <span className="text-yellow-300 font-bold block mb-1">🎤 멍멍 기자 Live 중계</span>
                  <p className="text-sm leading-relaxed">
                    "현장에 나와 있는 멍멍 기자입니다! 우리 {userName} 어린이, 
                    {nextEvent ? (
                      ` 곧 다가오는 [${nextEvent.title}] 일정을 앞두고 있네요!`
                    ) : (
                      ' 오늘도 아주 멋진 하루 미션을 멋지게 소화하고 있네요!'
                    )}
                    지호 어린이, 직접 준비 완료 소식을 현장에서 전해줄 수 있나요? 마이크를 넘깁니다!"
                  </p>
                </div>
              </div>

              {/* 답변 선택 및 피드백 출력 영역 */}
              <div className="bg-yellow-50 p-6 flex flex-col items-center">
                {interviewAnswer === null ? (
                  <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                    <button
                      id="news-yes-btn"
                      onClick={() => handleInterviewSubmit('yes')}
                      className="flex-1 bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-lg transform transition-all hover:-translate-y-1"
                    >
                      <Check className="w-6 h-6 border-2 border-white rounded-full bg-white text-green-500 p-0.5" />
                      <span>네! 완벽하게 준비 완료! 멍!</span>
                    </button>
                    <button
                      id="news-no-btn"
                      onClick={() => handleInterviewSubmit('no')}
                      className="flex-1 bg-orange-400 hover:bg-orange-500 active:scale-95 text-white font-bold py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-lg transform transition-all hover:-translate-y-1"
                    >
                      <AlertCircle className="w-6 h-6" />
                      <span>치과 가기 쪼금 무서워요..</span>
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full text-center p-5 bg-white rounded-2xl border-2 border-yellow-200"
                  >
                    {interviewAnswer === 'yes' ? (
                      <div>
                        <div className="inline-flex p-3 bg-green-100 rounded-full mb-3">
                          <Sparkles className="w-8 h-8 text-green-600 animate-spin" />
                        </div>
                        <h4 className="text-xl font-bold text-green-600 mb-2">멍멍! 엄청나게 씩씩한 대답이에요!</h4>
                        <p className="text-neutral-700 leading-relaxed mb-4 text-sm sm:text-base">
                          지호는 정말 치열하고 씩씩한 용사 같아요! 멍멍 기자가 감동하여 보너스 보상 <span className="font-bold text-yellow-500 text-lg">별 +5</span>를 대시보드에 단독 전송했습니다!
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="inline-flex p-3 bg-orange-100 rounded-full mb-3">
                          <AlertCircle className="w-8 h-8 text-orange-600" />
                        </div>
                        <h4 className="text-xl font-bold text-orange-600 mb-2">괜찮아요, 무서운 건 당연한 마음이에요!</h4>
                        <p className="text-neutral-700 leading-relaxed mb-4 text-sm sm:text-base">
                          치과 가기 전 튼튼이빨 동화와 게임을 보며 무섭지 않도록 훈련해야겠어요. 엄마와 아빠가 꼭 옆에서 지켜줄게요. 부모님 피드백 팁에도 응원 사랑방을 열어두었습니다!
                        </p>
                      </div>
                    )}
                    <button
                      id="news-ok-btn"
                      onClick={() => setShowReporterNews(false)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors"
                    >
                      확인 후 대시보드로 돌아가기
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 어린이 맵 상의 고정 가이드 수호 강아지 (Kids Mode 하단 등에서 인사함) */}
      <div className="flex flex-col items-center">
        {/* 말풍선 */}
        <AnimatePresence>
          {showSpeech && speechText && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15 }}
              id="dog-speech-bubble"
              className="relative max-w-sm bg-white text-neutral-800 text-sm sm:text-base p-4 rounded-2xl shadow-lg border-2 border-yellow-300 font-medium mb-3 text-center"
            >
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-yellow-300 rotate-45 transform" />
              <p>{speechText}</p>
              
              <div className="mt-2 flex items-center justify-center gap-3 border-t border-yellow-100 pt-2">
                <button
                  id="mute-toggle-btn"
                  onClick={() => {
                    const nextMute = !isAudioMuted;
                    setIsAudioMuted(nextMute);
                    if (!nextMute) speakText(speechText);
                  }}
                  className="text-neutral-400 hover:text-indigo-600 transition-colors flex items-center gap-1 text-xs"
                >
                  {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isAudioMuted ? '소리 켜기' : '소리 끄기'}</span>
                </button>
                <button
                  id="speak-again-btn"
                  onClick={() => speakText(speechText)}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-indigo-700" /> 다시 듣기
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 강아지 캐릭터 몸체 */}
        <div className="relative group cursor-pointer" onClick={() => speakText(speechText)}>
          <motion.div
            animate={{
              y: characterAction === 'jump' ? [0, -20, 0] : characterAction === 'happy' ? [0, -6, 0] : [0, -1, 1, 0],
              scale: characterAction === 'jump' ? 1.05 : 1,
            }}
            transition={{
              repeat: Infinity,
              duration: characterAction === 'jump' ? 0.6 : characterAction === 'happy' ? 1.2 : 2.5,
            }}
            className="w-28 h-28 flex items-center justify-center drop-shadow-xl"
          >
            <svg viewBox="0 0 100 100" className="w-24 h-24">
              {/* 강야지 얼굴 벡터 */}
              <ellipse cx="50" cy="55" rx="35" ry="30" fill="#F5CBA7" /> {/* 얼굴 */}
              <path d="M15,40 Q5,25 15,10 Q25,10 25,40 Z" fill="#D35400" /> {/* 왼쪽 대칭 귀 */}
              <path d="M85,40 Q95,25 85,10 Q75,10 75,40 Z" fill="#D35400" /> {/* 오른쪽 대칭 귀 */}
              <ellipse cx="50" cy="62" rx="18" ry="12" fill="#FDEDEC" /> {/* 주둥이 배후 */}

              {/* 눈 */}
              <ellipse cx="38" cy="46" rx="5" ry="6" fill="#2C3E50" />
              <ellipse cx="62" cy="46" rx="5" ry="6" fill="#2C3E50" />
              <circle cx="36" cy="44" r="1.5" fill="#FFFFFF" />
              <circle cx="60" cy="44" r="1.5" fill="#FFFFFF" />

              {/* 볼터치 */}
              <circle cx="26" cy="58" r="4" fill="#F1948A" opacity="0.9" />
              <circle cx="74" cy="58" r="4" fill="#F1948A" opacity="0.9" />

              {/* 코 */}
              <polygon points="46,55 54,55 50,59" fill="#1B2631" />

              {/* 애교 입술 */}
              <path d="M47,62 Q50,65 53,62" stroke="#1B2631" strokeWidth="1.5" fill="none" />
              <path d="M41,62 Q44,65 47,62" stroke="#1B2631" strokeWidth="1.5" fill="none" />
            </svg>
          </motion.div>

          {/* 포인트 가시 성취 뱃지 */}
          <div className="absolute -top-1 -right-2 bg-yellow-400 border-2 border-white rounded-full px-2.5 py-0.5 text-xs font-extrabold text-indigo-900 shadow-md">
            ⭐ {totalPoints}
          </div>

          {/* 멍멍 기자의 핫스팟 속보 버튼 */}
          {nextEvent && (
            <motion.button
              id="reporter-trigger-btn"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              onClick={(e) => {
                e.stopPropagation();
                triggerNews();
              }}
              className="absolute -bottom-2 -left-4 bg-gradient-to-r from-red-500 to-yellow-500 text-white font-extrabold text-[10px] sm:text-xs px-3 py-1.5 rounded-full shadow-lg border-2 border-white flex items-center gap-1"
            >
              <Volume2 className="w-3 h-3 animate-bounce" />
              <span>멍멍기자 속보!</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { IntroScreen } from './components/IntroScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { MainApp } from './components/MainApp';
import { MissionScreen } from './components/MissionScreen';
import { DiaryScreen } from './components/DiaryScreen';
import { PhotoAccuracyScreen } from './components/PhotoAccuracyScreen';
import { RewardScreen } from './components/RewardScreen';
import { LocalCurrencyScreen } from './components/LocalCurrencyScreen';
import { AccountMgmtScreen } from './components/AccountMgmtScreen';
import { NotificationSettingsScreen } from './components/NotificationSettingsScreen';
import { AppInfoScreen } from './components/AppInfoScreen';
import { ContactScreen } from './components/ContactScreen';
import { FOOD_DATA } from "../data/food_data"; 
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { ChevronLeft, Coins } from 'lucide-react';

export type AppScreen = 
  | 'intro' 
  | 'login' 
  | 'signup' 
  | 'main' 
  | 'mission' 
  | 'diary' 
  | 'photocheck' 
  | 'reward' 
  | 'localcurrency'         
  | 'foodrestaurant'                  
  | 'localcurrency-select'  
  | 'accountmgmt' 
  | 'notifications' 
  | 'appinfo' 
  | 'contact';

export type TabType = 'yeohaeng' | 'gati' | 'meohal' | 'gieong';
export type DiaryType = 'diary' | 'fourcut' | null;

export interface MissionInfo {
  id: number;
  title: string;
  reward: number;
  icon: string;
}

export interface RewardHistoryItem {
  id: string;
  date: string;
  mission: string;
  earned: number;
  used: number;
  missionId?: number;
  photoDataUrl?: string | null;
}

const CAPTURED_MISSIONS_KEY = 'momentrip.capturedMissions';
const REWARD_HISTORY_KEY = 'momentrip.rewardHistory';

function readStoredNumberArray(key: string) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as number[] : [];
  } catch {
    return [];
  }
}

function readStoredRewardHistory() {
  try {
    const value = localStorage.getItem(REWARD_HISTORY_KEY);
    return value ? JSON.parse(value) as RewardHistoryItem[] : [];
  } catch {
    return [];
  }
}

function saveCapturedMissions(ids: number[]) {
  localStorage.setItem(CAPTURED_MISSIONS_KEY, JSON.stringify(ids));
}

function saveRewardHistory(history: RewardHistoryItem[]) {
  localStorage.setItem(REWARD_HISTORY_KEY, JSON.stringify(history));
}

function todayLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

// 1. 충청남도 지역화폐 가맹 음식점 화면 컴포넌트 (데이터 파일 바로 연동)
function FoodRestaurantScreen({ onNavigate }: { onNavigate: (s: AppScreen) => void }) {
  const [selectedRegion, setSelectedRegion] = useState<string>('천안시');
  const [visibleCount, setVisibleCount] = useState<number>(30);

  const regions = [
    '천안시', '공주시', '보령시', '아산시', '서산시', 
    '논산시', '계룡시', '당진시', '금산군', '부여군', 
    '서천군', '청양군', '홍성군', '예산군', '태안군'
  ];

  // FOOD_DATA 배열에서 도로명주소나 주소에 선택한 지역이 포함된 항목 필터링
  const filteredRestaurants = FOOD_DATA.filter((t: any) => {
    if (!t) return false;
    const addr = t.도로명주소 || t.소재지도로명주소 || t.주소 || '';
    return addr.includes(selectedRegion);
  });

  const currentList = filteredRestaurants.slice(0, visibleCount);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button onClick={() => onNavigate('reward')} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>지역화폐 가맹 음식점</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>충청남도 지역화폐 사용 가능 업소 안내</p>
        </div>
      </div>

      <div className="px-5 pb-2 flex-shrink-0 overflow-x-auto flex gap-1.5 no-scrollbar">
        {regions.map((reg) => (
          <button
            key={reg}
            onClick={() => {
              setSelectedRegion(reg);
              setVisibleCount(30);
            }}
            className="px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
            style={{
              background: selectedRegion === reg ? '#C97C56' : '#EDE5DB',
              color: selectedRegion === reg ? '#FFFFFF' : '#2A1F1A',
            }}
          >
            {reg}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 pt-2 no-scrollbar">
        <div className="mb-3 flex items-center justify-between">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>{selectedRegion} 가맹점 목록</p>
          <span style={{ fontSize: 11, color: '#9E8B7E' }}>총 {filteredRestaurants.length}곳 중 표시중</span>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: '#EDE5DB', color: '#6B4C38' }}>해당 지역의 등록된 가맹점 정보가 없습니다.</div>
        ) : (
          <div className="flex flex-col gap-3 pb-10">
            {currentList.map((t: any, idx: number) => (
              <div key={idx} className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A' }}>{t.사업장명 || t.업소명}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md" style={{ fontSize: 10, background: '#F5EFE6', color: '#C97C56', fontWeight: 600 }}>
                    {t.업태구분명 || '일반음식점'}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#6B4C38', marginTop: 6 }}>📍 {t.도로명주소 || t.소재지도로명주소 || t.주소}</p>
              </div>
            ))}

            {visibleCount < filteredRestaurants.length && (
              <button
                onClick={() => setVisibleCount(prev => prev + 30)}
                className="w-full py-3 rounded-xl mt-2 font-bold text-sm transition-all active:scale-95"
                style={{ background: '#EDE5DB', color: '#2A1F1A' }}
              >
                더보기 ({visibleCount}/{filteredRestaurants.length})
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 2. 15개 지역 선택 및 지역화폐 변환 컴포넌트
function LocalCurrencySelectScreen({ onNavigate, totalPoints }: { onNavigate: (s: AppScreen) => void, totalPoints: number }) {
  const [selectedRegion, setSelectedRegion] = useState('천안시');
  const [amount, setAmount] = useState('');

  const regions = [
    '천안시', '공주시', '보령시', '아산시', '서산시', 
    '논산시', '계룡시', '당진시', '금산군', '부여군', 
    '서천군', '청양군', '홍성군', '예산군', '태안군'
  ];

  const handleConvert = () => {
    const val = Number(amount);
    if (!val || val <= 0) {
      alert('변환할 올바른 포인트를 입력해주세요.');
      return;
    }
    if (val > totalPoints) {
      alert('보유 포인트가 부족합니다.');
      return;
    }
    alert(`성공적으로 [${selectedRegion} 지역화폐]로 ${val.toLocaleString()}원이 전환되었습니다!`);
    onNavigate('reward');
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button onClick={() => onNavigate('reward')} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>지역화폐 전환</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>충청남도 지역별 화폐 교환</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-5 no-scrollbar">
        <div className="mt-3 mb-2">
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A', marginBottom: 8 }}>1. 전환할 지역 선택 (15개 시·군)</p>
          <div className="grid grid-cols-3 gap-2">
            {regions.map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: selectedRegion === reg ? '#C97C56' : '#EDE5DB',
                  color: selectedRegion === reg ? '#FFFFFF' : '#2A1F1A',
                  border: 'none',
                }}
              >
                {reg}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A', marginBottom: 8 }}>2. 전환할 포인트 입력</p>
          <div className="rounded-2xl p-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 12, color: '#9E8B7E' }}>보유 포인트: {totalPoints.toLocaleString()}P</span>
              <button onClick={() => setAmount(String(totalPoints))} style={{ fontSize: 11, color: '#C97C56', fontWeight: 700, background: 'none', border: 'none' }}>전액 입력</button>
            </div>
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: '#E3D5C6' }}>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent outline-none text-lg font-bold"
                style={{ color: '#2A1F1A' }}
              />
              <span style={{ fontWeight: 700, color: '#C97C56' }}>P</span>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl p-4" style={{ background: '#F5EFE6' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2A1F1A' }}>💡 안내 사항</p>
          <p style={{ fontSize: 11, color: '#6B4C38', marginTop: 4, lineHeight: 1.4 }}>
            선택하신 {selectedRegion} 지역화폐로 즉시 전환되며, 해당 지역 내 가맹점에서 현금처럼 사용할 수 있습니다.
          </p>
        </div>
      </div>

      <div className="px-5 py-5 flex-shrink-0">
        <button
          onClick={handleConvert}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg"
          style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 16, fontWeight: 700, border: 'none' }}
        >
          <Coins size={18} />
          {selectedRegion} 지역화폐로 교환하기
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('intro');
  const [activeTab, setActiveTab] = useState<TabType>('yeohaeng');
  const [diaryType, setDiaryType] = useState<DiaryType>(null);
  const [selectedMission, setSelectedMission] = useState<MissionInfo | null>(null);
  const [capturedMissions, setCapturedMissions] = useState<number[]>(() => readStoredNumberArray(CAPTURED_MISSIONS_KEY));
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryItem[]>(readStoredRewardHistory);

  const totalPoints = rewardHistory.reduce((sum, item) => sum + item.earned - item.used, 0);
  const earnedByMission = rewardHistory.reduce<Record<number, number>>((acc, item) => {
    if (item.missionId && item.earned > 0) acc[item.missionId] = item.earned;
    return acc;
  }, {});

  const handleCaptureMission = (mission: MissionInfo, earned: number, photoDataUrl?: string | null) => {
    setCapturedMissions(prev => {
      if (prev.includes(mission.id)) return prev;
      const next = [...prev, mission.id];
      saveCapturedMissions(next);
      return next;
    });

    setRewardHistory(prev => {
      if (prev.some(item => item.missionId === mission.id && item.earned > 0)) return prev;
      const next = [
        {
          id: `reward-${mission.id}-${Date.now()}`,
          date: todayLabel(),
          mission: mission.title,
          earned,
          used: 0,
          missionId: mission.id,
          photoDataUrl: photoDataUrl ?? null,
        },
        ...prev,
      ];
      saveRewardHistory(next);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      setSelectedMission(null);
      setDiaryType(null);
      setScreen('intro');
    }
  };

  const isIntro = screen === 'intro';

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(145deg, #E8DDD5 0%, #D8CCB8 50%, #C8B89A 100%)',
        fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: '24px 16px',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#C97C56' }}>
            <span style={{ fontSize: 16 }}>✈️</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A', letterSpacing: '-0.02em' }}>
            MomenTrip · 모먼트립
          </span>
        </div>

        <div className="relative flex-shrink-0" style={{ width: 375, height: 812 }}>
          <div
            className="absolute inset-0 rounded-[50px]"
            style={{
              background: 'linear-gradient(175deg, #303030 0%, #1A1A1A 100%)',
              boxShadow: [
                '0 60px 120px rgba(0,0,0,0.5)',
                '0 0 0 1.5px rgba(255,255,255,0.08)',
                'inset 0 1px 0 rgba(255,255,255,0.12)',
              ].join(', '),
            }}
          />

          <div className="absolute rounded-r" style={{ right: -3, top: 200, width: 4, height: 72, background: 'linear-gradient(180deg, #2A2A2A, #222)', borderRadius: '0 4px 4px 0', boxShadow: '2px 0 4px rgba(0,0,0,0.3)' }} />
          {[160, 220, 276].map((top, i) => (
            <div key={i} className="absolute rounded-l" style={{ left: -3, top, width: 4, height: i === 0 ? 36 : 52, background: 'linear-gradient(180deg, #2A2A2A, #222)', borderRadius: '4px 0 0 4px', boxShadow: '-2px 0 4px rgba(0,0,0,0.3)' }} />
          ))}

          <div className="absolute overflow-hidden no-scrollbar" style={{ inset: '10px 6px', borderRadius: 44, background: '#FAF8F5' }}>
            <div className="absolute z-50" style={{ top: 14, left: '50%', transform: 'translateX(-50%)', width: 116, height: 34, background: '#000', borderRadius: 20 }} />

            <div className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between" style={{ height: 54, paddingLeft: 24, paddingRight: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: isIntro ? '#FAF8F5' : '#2A1F1A', fontFamily: '-apple-system, sans-serif' }}>9:41</span>
              <div className="flex items-center gap-1.5" style={{ color: isIntro ? '#FAF8F5' : '#2A1F1A' }}>
                <div className="flex items-end gap-0.5" style={{ height: 12 }}>
                  {[6, 8, 10, 12].map((h, i) => (
                    <div key={i} className="w-1 rounded-sm" style={{ height: h, background: 'currentColor', opacity: i < 3 ? 1 : 0.35 }} />
                  ))}
                </div>
                <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor" opacity="0.9">
                  <path d="M7.5 9.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zm0-3.5a5.5 5.5 0 013.9 1.6l1.3-1.3A7.4 7.4 0 007.5 4 7.4 7.4 0 002.3 6.3l1.3 1.3A5.5 5.5 0 017.5 6zm0-4A9.7 9.7 0 0114.9 5l1.3-1.3A11.6 11.6 0 007.5 0 11.6 11.6 0 00.8 3.7L2.1 5A9.7 9.7 0 017.5 2z"/>
                </svg>
                <div className="flex items-center">
                  <div className="rounded" style={{ width: 23, height: 12, border: '1.5px solid currentColor', padding: '1.5px', position: 'relative' }}>
                    <div className="h-full rounded-sm" style={{ width: '75%', background: 'currentColor' }} />
                  </div>
                  <div style={{ width: 2, height: 5, background: 'currentColor', opacity: 0.5, marginLeft: 1, borderRadius: 1 }} />
                </div>
              </div>
            </div>

            <div className="absolute inset-0" style={{ paddingTop: 54 }}>
              {screen === 'intro' && <IntroScreen onNavigate={setScreen} />}
              {screen === 'login' && <LoginScreen onNavigate={setScreen} />}
              {screen === 'signup' && <SignUpScreen onNavigate={setScreen} />}
              {screen === 'main' && (
                <MainApp
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onNavigate={setScreen}
                  totalPoints={totalPoints}
                  onLogout={handleLogout}
                />
              )}
              {screen === 'mission' && (
                <MissionScreen
                  onNavigate={setScreen}
                  setDiaryType={setDiaryType}
                  setSelectedMission={setSelectedMission}
                  captured={capturedMissions}
                  earnedByMission={earnedByMission}
                />
              )}
              {screen === 'diary' && (
                <DiaryScreen
                  diaryType={diaryType}
                  setDiaryType={setDiaryType}
                  onNavigate={setScreen}
                />
              )}
              {screen === 'photocheck' && (
                <PhotoAccuracyScreen
                  mission={selectedMission}
                  onBack={() => setScreen('mission')}
                  onConfirm={(earned, photoDataUrl) => {
                    if (selectedMission) handleCaptureMission(selectedMission, earned, photoDataUrl);
                    setScreen('mission');
                  }}
                />
              )}
              {screen === 'reward' && (
                <RewardScreen
                  onBack={() => setScreen('main')}
                  onLocalCurrency={() => setScreen('localcurrency-select')} 
                  onOpenMarketGuide={() => setScreen('foodrestaurant')} 
                  totalPoints={totalPoints}
                  history={rewardHistory}
                  onNavigate={setScreen}
                />
              )}
              {screen === 'foodrestaurant' && (
                <FoodRestaurantScreen onNavigate={setScreen} />
              )}
              {screen === 'localcurrency' && (
                <LocalCurrencyScreen onNavigate={setScreen} />
              )}
              {screen === 'localcurrency-select' && (
                <LocalCurrencySelectScreen onNavigate={setScreen} totalPoints={totalPoints} />
              )}
              {screen === 'accountmgmt' && (
                <AccountMgmtScreen onBack={() => setScreen('main')} />
              )}
              {screen === 'notifications' && (
                <NotificationSettingsScreen onBack={() => setScreen('main')} />
              )}
              {screen === 'appinfo' && (
                <AppInfoScreen onBack={() => setScreen('main')} />
              )}
              {screen === 'contact' && (
                <ContactScreen onBack={() => setScreen('main')} />
              )}
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full" style={{ width: 120, height: 5, background: 'rgba(42,31,26,0.25)' }} />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-center" style={{ maxWidth: 400 }}>
          {([
            ['intro', '홈'],
            ['login', '로그인'],
            ['signup', '회원가입'],
            ['main', '메인'],
            ['mission', '미션'],
            ['photocheck', '사진확인'],
            ['diary', '기록'],
            ['reward', '포인트'],
            ['foodrestaurant', '가맹점'],
            ['localcurrency', '관광다양성'],
            ['localcurrency-select', '화폐전환'],
            ['accountmgmt', '계정관리'],
            ['notifications', '알림'],
            ['appinfo', '앱정보'],
            ['contact', '문의'],
          ] as [AppScreen, string][]).map(([s, label]) => (
            <button
              key={s}
              onClick={() => setScreen(s)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all active:scale-95"
              style={{
                background: screen === s ? '#C97C56' : 'rgba(42,31,26,0.15)',
                color: screen === s ? '#FFFFFF' : '#2A1F1A',
                fontSize: 11,
                fontFamily: "'Noto Sans KR', sans-serif",
                fontWeight: screen === s ? 700 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
import { supabaseRequested } from '../lib/supabase';
import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { IntroScreen } from './components/IntroScreen';
import type { MissionStatus, RewardSummary, RewardTransaction, TripRoom } from './types';

const LoginScreen = lazy(() => import('./components/LoginScreen').then((module) => ({ default: module.LoginScreen })));
const SignUpScreen = lazy(() => import('./components/SignUpScreen').then((module) => ({ default: module.SignUpScreen })));
const MainApp = lazy(() => import('./components/MainApp').then((module) => ({ default: module.MainApp })));
const MissionScreen = lazy(() => import('./components/MissionScreen').then((module) => ({ default: module.MissionScreen })));
const DiaryScreen = lazy(() => import('./components/DiaryScreen').then((module) => ({ default: module.DiaryScreen })));
const PhotoAccuracyScreen = lazy(() => import('./components/PhotoAccuracyScreen').then((module) => ({ default: module.PhotoAccuracyScreen })));
const RewardScreen = lazy(() => import('./components/RewardScreen').then((module) => ({ default: module.RewardScreen })));
const LocalCurrencyScreen = lazy(() => import('./components/LocalCurrencyScreen').then((module) => ({ default: module.LocalCurrencyScreen })));
const FoodRestaurantScreen = lazy(() => import('./components/FoodRestaurantScreen').then((module) => ({ default: module.FoodRestaurantScreen })));
const TourDiversityScreen = lazy(() => import('./components/TourDiversityScreen').then((module) => ({ default: module.TourDiversityScreen })));
const LocalCurrencyExchangeScreen = lazy(() => import('./components/LocalCurrencyExchangeScreen').then((module) => ({ default: module.LocalCurrencyExchangeScreen })));
const AccountMgmtScreen = lazy(() => import('./components/AccountMgmtScreen').then((module) => ({ default: module.AccountMgmtScreen })));
const NotificationSettingsScreen = lazy(() => import('./components/NotificationSettingsScreen').then((module) => ({ default: module.NotificationSettingsScreen })));
const AppInfoScreen = lazy(() => import('./components/AppInfoScreen').then((module) => ({ default: module.AppInfoScreen })));
const ContactScreen = lazy(() => import('./components/ContactScreen').then((module) => ({ default: module.ContactScreen })));

export type AppScreen = 'intro' | 'login' | 'signup' | 'main' | 'mission' | 'diary' | 'photocheck' | 'reward' | 'localcurrency' | 'foodrestaurant' | 'tourdiversity' | 'localcurrencyexchange' | 'accountmgmt' | 'notifications' | 'appinfo' | 'contact';
export type TabType = 'yeohaeng' | 'gati' | 'meohal' | 'gieong';
export type DiaryType = 'scrapbook' | 'fourcut' | null;

export interface MissionInfo {
  id: number;
  title: string;
  reward: number;
  icon: string;
  desc?: string;
}

export interface RewardHistoryItem {
  id: string;
  date: string;
  mission: string;
  earned: number;
  used: number;
  missionId?: number;
  roomId?: string | null;
  photoDataUrl?: string | null;
}

const CAPTURED_MISSIONS_KEY = 'momentrip.capturedMissions';
const REWARD_HISTORY_KEY = 'momentrip.rewardHistory';
const ACTIVE_TRIP_KEY = 'momentrip.activeTrip';

async function loadApi() {
  return (await import('./lib/api')).api;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function LoadingScreen() {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#FAF8F5' }}>
      <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
        <div
          className="w-8 h-8 rounded-full animate-spin"
          style={{ border: '3px solid #EDE5DB', borderTopColor: '#C97C56' }}
        />
        <span style={{ color: '#8B6148', fontSize: 13 }}>화면을 준비하고 있어요</span>
      </div>
    </div>
  );
}

function tripScopeId(roomId?: string | null) {
  return roomId || 'default';
}

function capturedMissionsKey(roomId?: string | null) {
  return `${CAPTURED_MISSIONS_KEY}.${tripScopeId(roomId)}`;
}

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

function readActiveTrip() {
  try {
    const value = localStorage.getItem(ACTIVE_TRIP_KEY);
    return value ? JSON.parse(value) as TripRoom : null;
  } catch {
    return null;
  }
}

function saveActiveTrip(room: TripRoom | null) {
  if (!room) {
    localStorage.removeItem(ACTIVE_TRIP_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(room));
}

function readCapturedMissions(roomId?: string | null) {
  const scopedKey = capturedMissionsKey(roomId);
  const scopedValue = localStorage.getItem(scopedKey);
  if (scopedValue !== null) return readStoredNumberArray(scopedKey);

  return roomId ? [] : readStoredNumberArray(CAPTURED_MISSIONS_KEY);
}

function saveCapturedMissions(ids: number[], roomId?: string | null) {
  localStorage.setItem(capturedMissionsKey(roomId), JSON.stringify(ids));
  if (!roomId) localStorage.setItem(CAPTURED_MISSIONS_KEY, JSON.stringify(ids));
}

function saveRewardHistory(history: RewardHistoryItem[]) {
  localStorage.setItem(REWARD_HISTORY_KEY, JSON.stringify(history));
}

function missionStatusesToCaptured(missions: MissionStatus[]) {
  return missions.filter((mission) => mission.completed).map((mission) => mission.id);
}

function rewardTransactionToHistory(item: RewardTransaction): RewardHistoryItem {
  const amount = Number(item.amount || 0);
  return {
    id: item.id,
    date: item.createdAt ? item.createdAt.slice(0, 10).replaceAll('-', '.') : todayLabel(),
    mission: item.title || item.desc || '포인트 거래',
    earned: amount > 0 ? amount : 0,
    used: amount < 0 ? Math.abs(amount) : 0,
    missionId: item.missionId ?? undefined,
    roomId: item.roomId ?? null,
  };
}

function rewardSummaryToHistory(summary: RewardSummary) {
  return summary.transactions
    .filter((item) => item.category === 'points')
    .map(rewardTransactionToHistory);
}

function todayLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

export default function App() {
  const initialActiveTrip = readActiveTrip();
  const [screen, setScreen] = useState<AppScreen>('intro');
  const [activeTab, setActiveTab] = useState<TabType>('yeohaeng');
  const [diaryType, setDiaryType] = useState<DiaryType>(null);
  const [selectedMission, setSelectedMission] = useState<MissionInfo | null>(null);
  const [activeTrip, setActiveTrip] = useState<TripRoom | null>(initialActiveTrip);
  const [capturedMissions, setCapturedMissions] = useState<number[]>(() => readCapturedMissions(initialActiveTrip?.id));
  const [rewardHistory, setRewardHistory] = useState<RewardHistoryItem[]>(readStoredRewardHistory);

  const totalPoints = rewardHistory.reduce((sum, item) => sum + item.earned - item.used, 0);
  const earnedByMission = rewardHistory.reduce<Record<number, number>>((acc, item) => {
    if (item.missionId && item.earned > 0 && (item.roomId ?? null) === (activeTrip?.id ?? null)) acc[item.missionId] = item.earned;
    return acc;
  }, {});

  const applyRemoteState = useCallback((missions: MissionStatus[], rewards: RewardSummary, roomId = activeTrip?.id ?? null) => {
    const nextCaptured = missionStatusesToCaptured(missions);
    const nextHistory = rewardSummaryToHistory(rewards);

    setCapturedMissions(nextCaptured);
    setRewardHistory(nextHistory);
    saveCapturedMissions(nextCaptured, roomId);
    saveRewardHistory(nextHistory);
  }, [activeTrip?.id]);

  const refreshRemoteState = useCallback(async () => {
    try {
      const api = await loadApi();
      const user = await api.me();
      if (!user) return;
      const [missions, rewards] = await Promise.all([api.missions(activeTrip?.id), api.rewards()]);
      applyRemoteState(missions, rewards, activeTrip?.id ?? null);
    } catch (error) {
      console.warn('서버 상태 동기화 실패:', error);
    }
  }, [activeTrip?.id, applyRemoteState]);

  useEffect(() => {
    if (['main', 'mission', 'reward', 'localcurrency', 'foodrestaurant', 'tourdiversity', 'localcurrencyexchange'].includes(screen)) {
      void refreshRemoteState();
    }
  }, [refreshRemoteState, screen]);

  const saveMissionLocally = (mission: MissionInfo, earned: number, photoDataUrl?: string | null) => {
    setCapturedMissions(prev => {
      if (prev.includes(mission.id)) return prev;
      const next = [...prev, mission.id];
      saveCapturedMissions(next, activeTrip?.id);
      return next;
    });

    setRewardHistory(prev => {
      if (prev.some(item => item.missionId === mission.id && item.earned > 0 && (item.roomId ?? null) === (activeTrip?.id ?? null))) return prev;
      const next = [
        {
          id: `reward-${mission.id}-${Date.now()}`,
          date: todayLabel(),
          mission: mission.title,
          earned,
          used: 0,
          missionId: mission.id,
          roomId: activeTrip?.id ?? null,
          photoDataUrl: photoDataUrl ?? null,
        },
        ...prev,
      ];
      saveRewardHistory(next);
      return next;
    });
  };

  const handleCaptureMission = async (mission: MissionInfo, earned: number, photoDataUrl?: string | null) => {
    try {
      const api = await loadApi();
      const photo = photoDataUrl
        ? await api.uploadPhoto({
            dataUrl: photoDataUrl,
            label: mission.title,
            date: todayIsoDate(),
            source: activeTrip?.id ? `mission:${activeTrip.id}:${mission.id}` : `mission:${mission.id}`,
            roomId: activeTrip?.id ?? null,
          })
        : null;
      const result = await api.completeMission(mission.id, photo?.id, earned, activeTrip?.id, mission.title);
      applyRemoteState(result.missions, result.rewards, activeTrip?.id ?? null);
      return;
    } catch (error) {
      if (supabaseRequested) throw error;
      console.warn('미션 서버 저장 실패, 로컬 저장으로 대체:', error);
      saveMissionLocally(mission, earned, photoDataUrl);
    }
  };

  const saveLocalCurrencyConversionLocally = (amount: number, regionName: string, currency: string) => {
    setRewardHistory(prev => {
      const currentPoints = prev.reduce((sum, item) => sum + item.earned - item.used, 0);
      if (amount <= 0 || amount > currentPoints) return prev;

      const next = [
        {
          id: `currency-${Date.now()}`,
          date: todayLabel(),
          mission: `${regionName} ${currency} 전환`,
          earned: 0,
          used: amount,
        },
        ...prev,
      ];
      saveRewardHistory(next);
      return next;
    });
  };

  const handleLocalCurrencyConversion = async (amount: number, regionName: string, currency: string) => {
    try {
      const api = await loadApi();
      const result = await api.convertLocalCurrency({ amount, regionName, currency });
      setRewardHistory(rewardSummaryToHistory(result.rewards));
      saveRewardHistory(rewardSummaryToHistory(result.rewards));
    } catch (error) {
      if (supabaseRequested) throw error;
      console.warn('지역화폐 전환 서버 저장 실패, 로컬 저장으로 대체:', error);
      saveLocalCurrencyConversionLocally(amount, regionName, currency);
    }
  };

  const handleLogout = async () => {
    try {
      const api = await loadApi();
      await api.logout();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    } finally {
      setCapturedMissions([]);
      setRewardHistory([]);
      setActiveTrip(null);
      saveActiveTrip(null);
      saveCapturedMissions([], null);
      saveRewardHistory([]);
      setSelectedMission(null);
      setDiaryType(null);
      setScreen('intro');
    }
  };

  const handleTripStarted = useCallback((room: TripRoom) => {
    setActiveTrip(room);
    saveActiveTrip(room);
    setCapturedMissions(readCapturedMissions(room.id));
    setSelectedMission(null);
    setDiaryType(null);
  }, []);

  const renderScreen = () => {
    if (screen === 'intro') return <IntroScreen onNavigate={setScreen} />;
    if (screen === 'login') return <LoginScreen onNavigate={setScreen} />;
    if (screen === 'signup') return <SignUpScreen onNavigate={setScreen} />;
    if (screen === 'main') {
      return (
        <MainApp
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNavigate={setScreen}
          totalPoints={totalPoints}
          onLogout={handleLogout}
          activeTrip={activeTrip}
          onTripStarted={handleTripStarted}
        />
      );
    }
    if (screen === 'mission') {
      return (
        <MissionScreen
          onNavigate={setScreen}
          setDiaryType={setDiaryType}
          setSelectedMission={setSelectedMission}
          captured={capturedMissions}
          earnedByMission={earnedByMission}
          activeTrip={activeTrip}
        />
      );
    }
    if (screen === 'diary') {
      return (
        <DiaryScreen
          diaryType={diaryType}
          setDiaryType={setDiaryType}
          onNavigate={setScreen}
          activeTrip={activeTrip}
        />
      );
    }
    if (screen === 'photocheck') {
      return (
        <PhotoAccuracyScreen
          mission={selectedMission}
          onBack={() => setScreen('mission')}
          onConfirm={async (earned, photoDataUrl) => {
            if (selectedMission) await handleCaptureMission(selectedMission, earned, photoDataUrl);
            setScreen('mission');
          }}
        />
      );
    }
    if (screen === 'reward') {
      return (
        <RewardScreen
          onBack={() => setScreen('main')}
          onLocalCurrency={() => setScreen('localcurrencyexchange')}
          onOpenMarketGuide={() => setScreen('foodrestaurant')}
          onOpenTourDiversity={() => setScreen('tourdiversity')}
          totalPoints={totalPoints}
          history={rewardHistory}
        />
      );
    }
    if (screen === 'localcurrency') {
      return <LocalCurrencyScreen onBack={() => setScreen('reward')} totalPoints={totalPoints} />;
    }
    if (screen === 'foodrestaurant') return <FoodRestaurantScreen onBack={() => setScreen('reward')} />;
    if (screen === 'tourdiversity') return <TourDiversityScreen onBack={() => setScreen('reward')} />;
    if (screen === 'localcurrencyexchange') {
      return (
        <LocalCurrencyExchangeScreen
          onBack={() => setScreen('reward')}
          totalPoints={totalPoints}
          onConvert={handleLocalCurrencyConversion}
        />
      );
    }
    if (screen === 'accountmgmt') return <AccountMgmtScreen onBack={() => setScreen('main')} />;
    if (screen === 'notifications') return <NotificationSettingsScreen onBack={() => setScreen('main')} />;
    if (screen === 'appinfo') return <AppInfoScreen onBack={() => setScreen('main')} />;
    return <ContactScreen onBack={() => setScreen('main')} />;
  };

  return (
    <div
      className="w-screen overflow-hidden flex justify-center"
      style={{
        height: '100dvh',
        background: '#EDE5DB',
        fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        className="w-full h-full overflow-hidden"
        style={{
          maxWidth: 430,
          background: '#FAF8F5',
          boxShadow: '0 0 0 1px rgba(42,31,26,0.06)',
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <Suspense fallback={<LoadingScreen />}>
          {renderScreen()}
        </Suspense>
      </div>
    </div>
  );
}

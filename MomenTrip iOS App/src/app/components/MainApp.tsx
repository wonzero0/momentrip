import { useState } from 'react';
import { Check, Copy, Settings, User } from 'lucide-react';
import { AppScreen, TabType } from '../App';
import { YeohaengTab } from './YeohaengTab';
import { GatiTab } from './GatiTab';
import { MeohalTab } from './MeohalTab';
import { GieongTab } from './GieongTab';
import { copyText } from '../lib/clipboard';
import type { TripRoom } from '../types';

interface Props {
  activeTab: TabType;
  setActiveTab: (t: TabType) => void;
  onNavigate: (s: AppScreen) => void;
  totalPoints: number;
  onLogout: () => void;
  activeTrip: TripRoom | null;
  onTripStarted: (room: TripRoom) => void;
}

const TAB_ITEMS: { id: TabType; label: string; emoji: string }[] = [
  { id: 'yeohaeng', label: '여행가유', emoji: '✈️' },
  { id: 'gati', label: '같이가유', emoji: '👫' },
  { id: 'meohal', label: '뭐할까유', emoji: '🎯' },
  { id: 'gieong', label: '기억나유', emoji: '📸' },
];

const SETTINGS_ITEMS = [
  { key: 'accountmgmt', label: '계정 관리', desc: '프로필 및 계정 설정', emoji: '👤', danger: false },
  { key: 'logout', label: '로그아웃', desc: '앱에서 로그아웃', emoji: '🚪', danger: true },
  { key: 'contact', label: '문의하기', desc: '불편사항 및 문의', emoji: '📞', danger: false },
  { key: 'notification', label: '알림 설정', desc: '푸시 알림 관리', emoji: '🔔', danger: false },
  { key: 'appinfo', label: '앱 정보', desc: '버전 1.0.0 · 모먼트립', emoji: 'ℹ️', danger: false },
] as const;

const ACCOUNT_PROFILE_KEY = 'momentrip.accountProfile';

function readAccountProfile() {
  try {
    const value = localStorage.getItem(ACCOUNT_PROFILE_KEY);
    return value
      ? { displayName: '여행자님', userCode: '#1618', photoDataUrl: null, ...JSON.parse(value) } as { displayName: string; userCode: string; photoDataUrl: string | null }
      : { displayName: '여행자님', userCode: '#1618', photoDataUrl: null };
  } catch {
    return { displayName: '여행자님', userCode: '#1618', photoDataUrl: null };
  }
}

export function MainApp({ activeTab, setActiveTab, onNavigate, totalPoints, onLogout, activeTrip, onTripStarted }: Props) {
  const [profile] = useState(readAccountProfile);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopy = async () => {
    try {
      await copyText(profile.userCode);
      setCopyError(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 2000);
    }
  };

  const handleSettingsItem = (key: string) => {
    setShowSettings(false);
    if (key === 'logout') {
      onLogout();
      return;
    }
    if (key === 'accountmgmt') onNavigate('accountmgmt');
    if (key === 'notification') onNavigate('notifications');
    if (key === 'appinfo') onNavigate('appinfo');
    if (key === 'contact') onNavigate('contact');
  };

  const onHome = () => setActiveTab('yeohaeng');

  return (
    <div
      className="w-full h-full flex flex-col relative"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-5 relative"
        style={{
          height: 56,
          background: '#FAF8F5',
          borderBottom: '1px solid rgba(42,31,26,0.06)',
          zIndex: 20,
        }}
      >
{/* Left: profile + point */}
<div className="flex items-center gap-2">

  {/* Profile button */}
  <button
    onClick={() => {
      setShowProfile(!showProfile);
      setShowSettings(false);
    }}
    className="w-10 h-10 rounded-full flex items-center justify-center active:opacity-70 transition-opacity relative"
    style={{ background: '#EDE5DB' }}
  >
    <User size={18} color="#2A1F1A" />

    <div
      className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
      style={{
        background: '#C97C56',
        borderColor: '#FAF8F5',
      }}
    />
  </button>

  {/* Point */}
  <button
    onClick={() => onNavigate('reward')}
    className="flex items-center gap-1 px-3 py-1 rounded-full active:scale-95 transition-all"
    style={{
      background: '#F5EFE6',
      border: '1px solid rgba(201,124,86,0.3)',
    }}
  >
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: '#C97C56',
      }}
    >
      {totalPoints.toLocaleString()}P
    </span>
  </button>

</div>

{/* Center: title */}
<button
  onClick={() => {
    setShowProfile(false);
    setShowSettings(false);
  }}
  className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10 active:opacity-70"
>
  <span
    style={{
      fontSize: 16,
      fontWeight: 800,
      color: '#2A1F1A',
      letterSpacing: '-0.02em',
      whiteSpace: 'nowrap',
    }}
  >
    모먼트립
  </span>

  <div
    className="w-5 h-0.5 rounded-full mt-0.5"
    style={{ background: '#C97C56' }}
  />
</button>

        {/* Right: reward bubble + settings */}
        <div className="flex items-center gap-2">
          {/* Settings button */}
          <button
            onClick={() => { setShowSettings(!showSettings); setShowProfile(false); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full active:scale-95 transition-all"
            style={{ background: '#EDE5DB' }}
          >
            <Settings size={18} color="#2A1F1A" />
          </button>
        </div>

        {/* ── Profile bubble ── */}
        {showProfile && (
          <div
            className="absolute top-14 left-4 rounded-2xl p-4 z-50"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 12px 40px rgba(42,31,26,0.18)',
              width: 220,
              border: '1px solid rgba(201,124,86,0.12)',
            }}
          >
            <div
              className="absolute -top-2 left-5 w-4 h-4 rotate-45"
              style={{ background: '#FFFFFF', borderTop: '1px solid rgba(201,124,86,0.12)', borderLeft: '1px solid rgba(201,124,86,0.12)' }}
            />
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #C97C56, #D4A070)' }}
              >
                {profile.photoDataUrl ? (
                  <img src={profile.photoDataUrl} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span style={{ color: '#FFF', fontSize: 18, fontWeight: 700 }}>{profile.displayName[0] || '여'}</span>
                )}
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>{profile.displayName}</p>
                <p style={{ fontSize: 11, color: '#9E8B7E' }}>모먼트립 여행자</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#FAF8F5' }}>
              <div>
                <p style={{ fontSize: 10, color: '#9E8B7E', marginBottom: 2 }}>사용자 코드</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A' }}>
                  {profile.displayName} <span style={{ color: '#C97C56' }}>{profile.userCode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleCopy()}
                aria-label="사용자 코드 복사"
                className="w-8 h-8 rounded-xl flex items-center justify-center active:scale-90 transition-all"
                style={{ background: copied ? '#C97C56' : copyError ? '#FDE2E2' : '#EDE5DB' }}
              >
                {copied ? <Check size={14} color="#FFF" /> : <Copy size={14} color="#2A1F1A" />}
              </button>
            </div>
            {copyError && (
              <p role="alert" className="mt-2" style={{ fontSize: 10, color: '#B42318' }}>
                복사할 수 없습니다. 코드를 길게 눌러 선택해주세요.
              </p>
            )}
          </div>
        )}

        {/* ── Settings panel ── */}
        {showSettings && (
          <div
            className="absolute top-14 right-4 rounded-2xl overflow-hidden z-50"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 12px 40px rgba(42,31,26,0.18)',
              width: 240,
              border: '1px solid rgba(201,124,86,0.12)',
            }}
          >
            <div
              className="absolute -top-2 right-5 w-4 h-4 rotate-45"
              style={{ background: '#FFFFFF', borderTop: '1px solid rgba(201,124,86,0.12)', borderLeft: '1px solid rgba(201,124,86,0.12)' }}
            />
            <div className="p-4 border-b" style={{ borderColor: 'rgba(42,31,26,0.06)' }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2A1F1A' }}>설정</p>
            </div>
            {SETTINGS_ITEMS.map((item, i) => (
              <button
                key={item.key}
                onClick={() => handleSettingsItem(item.key)}
                className="w-full flex items-center gap-3 px-4 py-3 active:opacity-70 transition-opacity text-left"
                style={{ borderBottom: i < SETTINGS_ITEMS.length - 1 ? '1px solid rgba(42,31,26,0.04)' : 'none' }}
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                  style={{ background: item.danger ? '#FFF0F0' : '#F5EFE6' }}
                >
                  {item.emoji}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: item.danger ? '#d4183d' : '#2A1F1A' }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: 10, color: '#9E8B7E' }}>{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Backdrop */}
      {(showProfile || showSettings) && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => { setShowProfile(false); setShowSettings(false); }}
        />
      )}

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'yeohaeng' && <YeohaengTab onNavigate={onNavigate} onHome={onHome} activeTrip={activeTrip} onTripStarted={onTripStarted} />}
        {activeTab === 'gati' && <GatiTab onNavigate={onNavigate} onHome={onHome} activeTrip={activeTrip} onTripStarted={onTripStarted} />}
        {activeTab === 'meohal' && <MeohalTab onHome={onHome} />}
        {activeTab === 'gieong' && <GieongTab onHome={onHome} />}
      </div>

      {/* ── Bottom nav ── */}
      <div
        className="flex-shrink-0"
        style={{ background: '#FFFFFF', borderTop: '1px solid rgba(42,31,26,0.06)', paddingBottom: 8 }}
      >
        <div className="flex items-center">
          {TAB_ITEMS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center py-3 gap-1 active:opacity-70 transition-all"
              >
                <div
                  className="flex items-center justify-center rounded-xl transition-all"
                  style={{ width: 40, height: 28, background: isActive ? '#F5EFE6' : 'transparent' }}
                >
                  <span style={{ fontSize: isActive ? 18 : 16 }}>{tab.emoji}</span>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#C97C56' : '#9E8B7E',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {tab.label}
                </span>
                {isActive && (
                  <div className="w-1 h-1 rounded-full" style={{ background: '#C97C56', marginTop: -2 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

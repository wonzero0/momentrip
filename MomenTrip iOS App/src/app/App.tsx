import { useState } from 'react';
import { IntroScreen } from './components/IntroScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignUpScreen } from './components/SignUpScreen';
import { MainApp } from './components/MainApp';
import { MissionScreen } from './components/MissionScreen';
import { DiaryScreen } from './components/DiaryScreen';

export type AppScreen = 'intro' | 'login' | 'signup' | 'main' | 'mission' | 'diary';
export type TabType = 'yeohaeng' | 'gati' | 'meohal' | 'gieong';
export type DiaryType = 'diary' | 'fourcut' | null;

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('intro');
  const [activeTab, setActiveTab] = useState<TabType>('yeohaeng');
  const [diaryType, setDiaryType] = useState<DiaryType>(null);

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
      {/* App label above phone */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#C97C56' }}>
            <span style={{ fontSize: 16 }}>✈️</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A', letterSpacing: '-0.02em' }}>
            MomenTrip · 모먼트립
          </span>
        </div>

        {/* Phone shell */}
        <div
          className="relative flex-shrink-0"
          style={{
            width: 375,
            height: 812,
          }}
        >
          {/* Phone outer case */}
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

          {/* Side button (right) */}
          <div
            className="absolute rounded-r"
            style={{
              right: -3,
              top: 200,
              width: 4,
              height: 72,
              background: 'linear-gradient(180deg, #2A2A2A, #222)',
              borderRadius: '0 4px 4px 0',
              boxShadow: '2px 0 4px rgba(0,0,0,0.3)',
            }}
          />

          {/* Volume buttons (left) */}
          {[160, 220, 276].map((top, i) => (
            <div
              key={i}
              className="absolute rounded-l"
              style={{
                left: -3,
                top,
                width: 4,
                height: i === 0 ? 36 : 52,
                background: 'linear-gradient(180deg, #2A2A2A, #222)',
                borderRadius: '4px 0 0 4px',
                boxShadow: '-2px 0 4px rgba(0,0,0,0.3)',
              }}
            />
          ))}

          {/* Screen bezel */}
          <div
            className="absolute overflow-hidden"
            style={{
              inset: '10px 6px',
              borderRadius: 44,
              background: '#FAF8F5',
            }}
          >
            {/* Dynamic Island */}
            <div
              className="absolute z-50"
              style={{
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 116,
                height: 34,
                background: '#000',
                borderRadius: 20,
              }}
            />

            {/* Status bar */}
            <div
              className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between"
              style={{ height: 54, paddingLeft: 24, paddingRight: 24 }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: isIntro ? '#FAF8F5' : '#2A1F1A',
                  fontFamily: '-apple-system, sans-serif',
                }}
              >
                9:41
              </span>
              <div
                className="flex items-center gap-1.5"
                style={{ color: isIntro ? '#FAF8F5' : '#2A1F1A' }}
              >
                {/* Signal bars */}
                <div className="flex items-end gap-0.5" style={{ height: 12 }}>
                  {[6, 8, 10, 12].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-sm"
                      style={{
                        height: h,
                        background: 'currentColor',
                        opacity: i < 3 ? 1 : 0.35,
                      }}
                    />
                  ))}
                </div>
                {/* WiFi */}
                <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor" opacity="0.9">
                  <path d="M7.5 9.5a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4zm0-3.5a5.5 5.5 0 013.9 1.6l1.3-1.3A7.4 7.4 0 007.5 4 7.4 7.4 0 002.3 6.3l1.3 1.3A5.5 5.5 0 017.5 6zm0-4A9.7 9.7 0 0114.9 5l1.3-1.3A11.6 11.6 0 007.5 0 11.6 11.6 0 00.8 3.7L2.1 5A9.7 9.7 0 017.5 2z"/>
                </svg>
                {/* Battery */}
                <div className="flex items-center">
                  <div
                    className="rounded"
                    style={{ width: 23, height: 12, border: '1.5px solid currentColor', padding: '1.5px', position: 'relative' }}
                  >
                    <div
                      className="h-full rounded-sm"
                      style={{ width: '75%', background: 'currentColor' }}
                    />
                  </div>
                  <div
                    style={{ width: 2, height: 5, background: 'currentColor', opacity: 0.5, marginLeft: 1, borderRadius: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Screen content area */}
            <div className="absolute inset-0" style={{ paddingTop: 54 }}>
              {screen === 'intro' && <IntroScreen onNavigate={setScreen} />}
              {screen === 'login' && <LoginScreen onNavigate={setScreen} />}
              {screen === 'signup' && <SignUpScreen onNavigate={setScreen} />}
              {screen === 'main' && (
                <MainApp
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  onNavigate={setScreen}
                />
              )}
              {screen === 'mission' && (
                <MissionScreen onNavigate={setScreen} setDiaryType={setDiaryType} />
              )}
              {screen === 'diary' && (
                <DiaryScreen
                  diaryType={diaryType}
                  setDiaryType={setDiaryType}
                  onNavigate={setScreen}
                />
              )}
            </div>

            {/* Home indicator */}
            <div
              className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full"
              style={{ width: 120, height: 5, background: 'rgba(42,31,26,0.25)' }}
            />
          </div>
        </div>

        {/* Screen label below phone */}
        <div className="flex gap-2 flex-wrap justify-center" style={{ maxWidth: 400 }}>
          {([
            ['intro', '홈'],
            ['login', '로그인'],
            ['signup', '회원가입'],
            ['main', '메인'],
            ['mission', '미션'],
            ['diary', '기록'],
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

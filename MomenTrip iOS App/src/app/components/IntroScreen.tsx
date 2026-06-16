import { AppScreen } from '../App';

interface Props {
  onNavigate: (s: AppScreen) => void;
}

export function IntroScreen({ onNavigate }: Props) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #FAF3EC 0%, #F2E0CC 40%, #E8C4A0 80%, #D4956A 100%)',
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute rounded-full opacity-20"
        style={{ width: 320, height: 320, top: -80, right: -80, background: '#C97C56' }}
      />
      <div
        className="absolute rounded-full opacity-10"
        style={{ width: 200, height: 200, bottom: 60, left: -60, background: '#8B5E3C' }}
      />
      <div
        className="absolute rounded-full opacity-15"
        style={{ width: 140, height: 140, top: 200, left: 20, background: '#C97C56' }}
      />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center mb-16">
        <div
          className="text-center leading-none"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 80,
            fontWeight: 800,
            color: '#2A1F1A',
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          <div>모먼</div>
          <div>트립</div>
        </div>
        <p
          className="mt-4 tracking-widest"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 11,
            fontWeight: 400,
            color: '#6B4C38',
            letterSpacing: '0.2em',
          }}
        >
          MOMENTRIP
        </p>
        <div className="mt-2 w-8 h-0.5 rounded-full" style={{ background: '#C97C56' }} />
        <p
          className="mt-3"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 13,
            fontWeight: 400,
            color: '#8B6148',
          }}
        >
          당신의 여행을 기억하다
        </p>
      </div>

      {/* Buttons */}
      <div className="relative z-10 flex flex-col gap-3 w-64">
        <button
          onClick={() => onNavigate('login')}
          className="w-full py-4 rounded-2xl transition-all active:scale-95"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            background: '#2A1F1A',
            color: '#FAF8F5',
            border: 'none',
            boxShadow: '0 8px 24px rgba(42,31,26,0.25)',
          }}
        >
          로그인
        </button>
        <button
          onClick={() => onNavigate('signup')}
          className="w-full py-4 rounded-2xl transition-all active:scale-95"
          style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            background: 'transparent',
            color: '#2A1F1A',
            border: '1.5px solid rgba(42,31,26,0.3)',
          }}
        >
          회원가입
        </button>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-12 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="rounded-full"
            style={{
              width: i === 0 ? 20 : 6,
              height: 6,
              background: i === 0 ? '#C97C56' : 'rgba(42,31,26,0.2)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

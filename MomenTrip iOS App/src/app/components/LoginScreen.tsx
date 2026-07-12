import { useState } from 'react';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { AppScreen } from '../App';
import { auth } from '../../firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { idToAuthEmail, isValidLoginId } from '../lib/authId';

interface Props {
  onNavigate: (s: AppScreen) => void;
}

export function LoginScreen({ onNavigate }: Props) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);

  // 실제 Firebase 로그인 처리 함수
  const handleLogin = async () => {
    if (!id.trim() || !pw) {
      alert("아이디와 비밀번호를 모두 입력해 주세요.");
      return;
    }

    if (!isValidLoginId(id)) {
      alert("아이디는 3자 이상 입력해 주세요.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, idToAuthEmail(id), pw);
      console.log("🎉 로그인 성공! 유저 정보:", userCredential.user);
      
      alert("성공적으로 로그인되었습니다!");
      onNavigate('main'); // 로그인 성공 시 메인 화면으로 이동
    } catch (error: any) {
      console.error("로그인 에러 발생:", error.code);
      
      // 로그인 예외 처리 리스트
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        alert("아이디 또는 비밀번호가 일치하지 않습니다.");
      } else if (error.code === 'auth/invalid-email') {
        alert("아이디에 사용할 수 없는 문자가 포함되어 있습니다.");
      } else {
        alert("로그인 중 오류가 발생했습니다: " + error.message);
      }
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pt-4 pb-2">
        <button
          onClick={() => onNavigate('intro')}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60 transition-opacity"
          style={{ background: '#EDE5DB' }}
        >
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-7 pt-6">
        <div className="mb-10">
          <h1
            style={{ fontSize: 28, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.2 }}
          >
            로그인
          </h1>
          <p style={{ fontSize: 14, color: '#9E8B7E', marginTop: 6 }}>
            모먼트립에 오신 것을 환영해요 🌿
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* ID */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9E8B7E', letterSpacing: '0.05em' }}>
              아이디
            </label>
            <div
              className="flex items-center mt-2 rounded-2xl px-4"
              style={{ height: 54, background: '#F0EAE2' }}
            >
              <input
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 15, color: '#2A1F1A' }}
                placeholder="아이디를 입력하세요"
                value={id}
                onChange={e => setId(e.target.value)} // 🌟 입력 먹통 해결 핵심 코드
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9E8B7E', letterSpacing: '0.05em' }}>
              비밀번호
            </label>
            <div
              className="flex items-center mt-2 rounded-2xl px-4"
              style={{ height: 54, background: '#F0EAE2' }}
            >
              <input
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 15, color: '#2A1F1A' }}
                placeholder="비밀번호를 입력하세요"
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={e => setPw(e.target.value)} // 🌟 입력 먹통 해결 핵심 코드
              />
              <button onClick={() => setShowPw(!showPw)} className="active:opacity-60">
                {showPw ? <EyeOff size={18} color="#9E8B7E" /> : <Eye size={18} color="#9E8B7E" />}
              </button>
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#C97C56', textAlign: 'right', marginTop: -8 }}>
            비밀번호를 잊으셨나요?
          </p>
        </div>

        {/* 확인 버튼 클릭 시 handleLogin 실행 */}
        <button
          onClick={handleLogin}
          className="mt-8 w-full py-4 rounded-2xl transition-all active:scale-95"
          style={{
            fontSize: 16,
            fontWeight: 600,
            background: '#C97C56',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 8px 24px rgba(201,124,86,0.35)',
          }}
        >
          확인
        </button>

        <div className="flex items-center justify-center gap-2 mt-6">
          <span style={{ fontSize: 13, color: '#9E8B7E' }}>계정이 없으신가요?</span>
          <button
            onClick={() => onNavigate('signup')}
            style={{ fontSize: 13, fontWeight: 600, color: '#C97C56' }}
          >
            회원가입
          </button>
        </div>
      </div>

      {/* Decorative bottom illustration */}
      <div
        className="mx-6 mb-8 rounded-3xl overflow-hidden relative"
        style={{ height: 140 }}
      >
        <img
          src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=300&fit=crop&auto=format"
          alt="travel landscape"
          className="w-full h-full object-cover"
          style={{ filter: 'brightness(0.9) saturate(0.9)' }}
        />
        <div
          className="absolute inset-0 rounded-3xl"
          style={{ background: 'linear-gradient(to top, rgba(42,31,26,0.3), transparent)' }}
        />
      </div>
    </div>
  );
}

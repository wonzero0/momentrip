import { useState } from 'react';
import { ChevronLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { AppScreen } from '../App';
import { auth } from '../../firebase'; 
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { idToAuthEmail, isValidLoginId } from '../lib/authId';

interface Props {
  onNavigate: (s: AppScreen) => void;
}

export function SignUpScreen({ onNavigate }: Props) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPwC, setShowPwC] = useState(false);
  const [idChecked, setIdChecked] = useState(false);

  const handleCheckDuplicate = async () => {
    if (!isValidLoginId(id)) {
      alert("아이디는 3자 이상 입력해 주세요.");
      return;
    }

    try {
      const methods = await fetchSignInMethodsForEmail(auth, idToAuthEmail(id));
      if (methods.length > 0) {
        setIdChecked(false);
        alert("이미 사용 중인 아이디입니다.");
        return;
      }
      setIdChecked(true);
    } catch (error: any) {
      console.error("아이디 중복확인 에러:", error.code);
      alert("아이디 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  // Firebase 실제 회원가입 처리 함수 추가
  const handleSignUp = async () => {
    // 1. 유효성 검사 (입력 폼 체크)
    if (!id.trim() || !pw || !pwConfirm) {
      alert("모든 필드를 입력해 주세요.");
      return;
    }

    if (!isValidLoginId(id)) {
      alert("아이디는 3자 이상 입력해 주세요.");
      return;
    }

    if (!idChecked) {
      alert("아이디 중복확인을 진행해 주세요.");
      return;
    }

    if (pw !== pwConfirm) {
      alert("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, idToAuthEmail(id), pw);
      console.log("🎉 회원가입 성공 유저:", userCredential.user);
      
      alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
      onNavigate('login'); // 가입 성공 후 로그인 화면으로 전환
    } catch (error: any) {
      console.error("회원가입 에러 발생:", error.code);
      
      // Firebase 주요 에러 한글 예외 처리
      if (error.code === 'auth/email-already-in-use') {
        alert("이미 사용 중인 아이디입니다.");
      } else if (error.code === 'auth/invalid-email') {
        alert("아이디에 사용할 수 없는 문자가 포함되어 있습니다.");
      } else if (error.code === 'auth/weak-password') {
        alert("비밀번호가 지나치게 취약합니다. (6자리 이상 입력)");
      } else {
        alert("회원가입 중 오류가 발생했습니다: " + error.message);
      }
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col overflow-y-auto"
      style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* Header */}
      <div className="flex items-center px-5 pt-4 pb-2 flex-shrink-0">
        <button
          onClick={() => onNavigate('intro')}
          className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60 transition-opacity"
          style={{ background: '#EDE5DB' }}
        >
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
      </div>

      <div className="flex flex-col px-7 pt-4 pb-10">
        <div className="mb-8">
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#2A1F1A', lineHeight: 1.2 }}>
            회원가입
          </h1>
          <p style={{ fontSize: 14, color: '#9E8B7E', marginTop: 6 }}>
            여행의 기억을 남겨보세요 ✈️
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* ID */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9E8B7E', letterSpacing: '0.05em' }}>
              아이디
            </label>
            <div className="flex gap-2 mt-2">
              <div
                className="flex items-center rounded-2xl px-3"
                style={{ height: 54, background: '#F0EAE2', flex: '1 1 0', minWidth: 0 }}
              >
                <input
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: 15, color: '#2A1F1A', minWidth: 0 }}
                  placeholder="아이디"
                  value={id}
                  onChange={e => { setId(e.target.value); setIdChecked(false); }}
                />
                {idChecked && <CheckCircle2 size={18} color="#C97C56" />}
              </div>
              <button
                onClick={handleCheckDuplicate}
                className="rounded-2xl active:scale-95 transition-all flex-shrink-0"
                style={{
                  height: 54,
                  width: 82,
                  fontSize: 12,
                  fontWeight: 600,
                  background: idChecked ? '#EDE5DB' : '#2A1F1A',
                  color: idChecked ? '#9E8B7E' : '#FAF8F5',
                  whiteSpace: 'nowrap',
                }}
              >
                {idChecked ? '확인됨' : '중복확인'}
              </button>
            </div>
            {idChecked && (
              <p style={{ fontSize: 12, color: '#C97C56', marginTop: 6 }}>
                사용 가능한 아이디예요!
              </p>
            )}
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
                onChange={e => setPw(e.target.value)}
              />
              <button onClick={() => setShowPw(!showPw)} className="active:opacity-60">
                {showPw ? <EyeOff size={18} color="#9E8B7E" /> : <Eye size={18} color="#9E8B7E" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#9E8B7E', letterSpacing: '0.05em' }}>
              비밀번호 확인
            </label>
            <div
              className="flex items-center mt-2 rounded-2xl px-4"
              style={{ height: 54, background: '#F0EAE2' }}
            >
              <input
                className="flex-1 bg-transparent outline-none"
                style={{ fontSize: 15, color: '#2A1F1A' }}
                placeholder="비밀번호를 다시 입력하세요"
                type={showPwC ? 'text' : 'password'}
                value={pwConfirm}
                onChange={e => setPwConfirm(e.target.value)}
              />
              <button onClick={() => setShowPwC(!showPwC)} className="active:opacity-60">
                {showPwC ? <EyeOff size={18} color="#9E8B7E" /> : <Eye size={18} color="#9E8B7E" />}
              </button>
            </div>
            {pwConfirm && pw && (
              <p style={{ fontSize: 12, marginTop: 6, color: pw === pwConfirm ? '#C97C56' : '#d4183d' }}>
                {pw === pwConfirm ? '비밀번호가 일치해요!' : '비밀번호가 일치하지 않아요.'}
              </p>
            )}
          </div>
        </div>

        {/* 🌟 기존 목업 전환 방식에서 handleSignUp 함수 호출로 변경 */}
        <button
          onClick={handleSignUp}
          className="mt-10 w-full py-4 rounded-2xl transition-all active:scale-95"
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
          <span style={{ fontSize: 13, color: '#9E8B7E' }}>이미 계정이 있으신가요?</span>
          <button
            onClick={() => onNavigate('login')}
            style={{ fontSize: 13, fontWeight: 600, color: '#C97C56' }}
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

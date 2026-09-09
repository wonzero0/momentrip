import { type ChangeEvent, useRef, useState } from 'react';
import { Camera, Check, ChevronLeft, ChevronRight, Database, Eye, EyeOff, ShieldCheck, Upload, User } from 'lucide-react';
import { api } from '../lib/api';
import { copyText } from '../lib/clipboard';

interface Props {
  onBack: () => void;
}

interface AccountProfile {
  displayName: string;
  userCode: string;
  photoDataUrl: string | null;
}

type Section = 'menu' | 'profile' | 'password' | 'photo' | 'data';

const PROFILE_KEY = 'momentrip.accountProfile';
const TOKEN_KEY = 'momentrip_token';

const DEFAULT_PROFILE: AccountProfile = {
  displayName: '여행자님',
  userCode: '#0000',
  photoDataUrl: null,
};

function readProfile() {
  try {
    const value = localStorage.getItem(PROFILE_KEY);
    return value ? { ...DEFAULT_PROFILE, ...JSON.parse(value) } as AccountProfile : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

function saveProfile(profile: AccountProfile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function readableAuthId() {
  try {
    const session = JSON.parse(localStorage.getItem(TOKEN_KEY) || '{}');
    const user = session.user || {};
    return user.username ? `${user.username} · ${user.email || '서버 계정'}` : '로그인 정보 없음';
  } catch {
    return '로그인 정보 없음';
  }
}

export function AccountMgmtScreen({ onBack }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [section, setSection] = useState<Section>('menu');
  const [profile, setProfile] = useState<AccountProfile>(readProfile);
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [userCode, setUserCode] = useState(profile.userCode);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(profile.photoDataUrl);
  const [status, setStatus] = useState('');

  const persistProfile = async (next: AccountProfile) => {
    const user = await api.updateProfile({
      displayName: next.displayName,
      code: next.userCode,
      photoDataUrl: next.photoDataUrl,
    });
    const savedProfile = {
      ...next,
      displayName: user.displayName || next.displayName,
      userCode: user.code || next.userCode,
    };
    saveProfile(savedProfile);
    setProfile(savedProfile);
    setDisplayName(savedProfile.displayName);
    setUserCode(savedProfile.userCode);
    setPreviewPhoto(savedProfile.photoDataUrl);
  };

  const saveProfileInfo = async () => {
    if (!displayName.trim()) {
      alert('이름을 입력해 주세요.');
      return;
    }
    if (displayName.trim().length > 30) {
      alert('이름은 30자 이하로 입력해 주세요.');
      return;
    }

    const normalizedCode = userCode.trim().startsWith('#') ? userCode.trim() : `#${userCode.trim()}`;
    if (!/^#[0-9]{4}$/.test(normalizedCode)) {
      alert('사용자 코드는 #을 제외한 숫자 4자리로 입력해 주세요.');
      return;
    }
    try {
      await persistProfile({ ...profile, displayName: displayName.trim(), userCode: normalizedCode });
      setStatus('프로필 정보가 저장되었습니다.');
      window.setTimeout(() => { setStatus(''); setSection('menu'); }, 1200);
    } catch (error) {
      alert(error instanceof Error ? error.message : '프로필 저장에 실패했습니다.');
    }
  };

  const savePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      alert('비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (newPw.length < 6 || newPw.length > 72) {
      alert('새 비밀번호는 6~72자로 입력해 주세요.');
      return;
    }
    if (newPw !== confirmPw) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      await api.updatePassword({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setStatus('비밀번호가 변경되었습니다.');
      window.setTimeout(() => { setStatus(''); setSection('menu'); }, 1200);
    } catch (error) {
      alert(error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.');
    }
  };

  const handlePhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreviewPhoto(reader.result);
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const savePhoto = async () => {
    if (!previewPhoto) {
      alert('사진을 먼저 선택해 주세요.');
      return;
    }

    try {
      await persistProfile({ ...profile, photoDataUrl: previewPhoto });
      setStatus('프로필 사진이 저장되었습니다.');
      window.setTimeout(() => { setStatus(''); setSection('menu'); }, 1200);
    } catch (error) {
      alert(error instanceof Error ? error.message : '프로필 사진 저장에 실패했습니다.');
    }
  };

  const exportData = async () => {
    const data = Object.keys(localStorage)
      .filter(key => key.startsWith('momentrip.'))
      .reduce<Record<string, string | null>>((acc, key) => {
        acc[key] = localStorage.getItem(key);
        return acc;
      }, {});

    try {
      await copyText(JSON.stringify(data, null, 2));
      setStatus('로컬 계정 데이터가 클립보드에 복사되었습니다.');
    } catch {
      setStatus('클립보드에 복사하지 못했습니다.');
    }
    window.setTimeout(() => setStatus(''), 1500);
  };

  const resetProfile = async () => {
    if (!window.confirm('프로필 이름, 사용자 코드, 프로필 사진을 초기화할까요?')) return;
    try {
      const resetProfile = { ...DEFAULT_PROFILE, userCode: profile.userCode };
      await persistProfile(resetProfile);
      setStatus('프로필이 초기화되었습니다.');
      window.setTimeout(() => { setStatus(''); setSection('menu'); }, 1200);
    } catch (error) {
      alert(error instanceof Error ? error.message : '프로필 초기화에 실패했습니다.');
    }
  };

  const Header = ({ title, backToMenu = true }: { title: string; backToMenu?: boolean }) => (
    <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
      <button
        onClick={() => backToMenu ? setSection('menu') : onBack()}
        className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60"
        style={{ background: '#EDE5DB' }}
      >
        <ChevronLeft size={20} color="#2A1F1A" />
      </button>
      <div className="flex-1">
        <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>{title}</p>
        <p style={{ fontSize: 11, color: '#9E8B7E' }}>{status || readableAuthId()}</p>
      </div>
    </div>
  );

  if (section === 'profile') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <Header title="프로필 정보" />
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-5">
          <div className="rounded-3xl p-5 mb-5 flex items-center gap-4" style={{ background: '#FFFFFF', boxShadow: '0 4px 16px rgba(42,31,26,0.08)' }}>
            <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C97C56, #D4A070)' }}>
              {profile.photoDataUrl ? <img src={profile.photoDataUrl} alt="profile" className="w-full h-full object-cover" /> : <span style={{ color: '#FFF', fontSize: 26, fontWeight: 700 }}>{profile.displayName[0] || '여'}</span>}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A' }}>{profile.displayName}</p>
              <p style={{ fontSize: 12, color: '#C97C56', fontWeight: 700, marginTop: 2 }}>{profile.userCode}</p>
              <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>{readableAuthId()}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#9E8B7E' }}>표시 이름</label>
              <input
                maxLength={30}
                value={displayName}
                onChange={event => setDisplayName(event.target.value)}
                className="w-full mt-2 rounded-2xl px-4 outline-none"
                style={{ height: 54, background: '#F0EAE2', color: '#2A1F1A', fontSize: 15 }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#9E8B7E' }}>사용자 코드</label>
              <input
                inputMode="numeric"
                maxLength={5}
                value={userCode}
                onChange={event => setUserCode(event.target.value)}
                className="w-full mt-2 rounded-2xl px-4 outline-none"
                style={{ height: 54, background: '#F0EAE2', color: '#2A1F1A', fontSize: 15 }}
              />
            </div>
          </div>

          <button
            onClick={saveProfileInfo}
            className="w-full mt-6 py-4 rounded-2xl active:scale-95 transition-all"
            style={{ background: '#C97C56', color: '#FFFFFF', fontSize: 15, fontWeight: 700, border: 'none', boxShadow: '0 8px 24px rgba(201,124,86,0.3)' }}
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  if (section === 'password') {
    const pwMatch = Boolean(newPw && confirmPw && newPw === confirmPw);
    const fields = [
      { label: '현재 비밀번호', value: currentPw, set: setCurrentPw, show: showCurrent, toggle: () => setShowCurrent(value => !value) },
      { label: '새 비밀번호', value: newPw, set: setNewPw, show: showNew, toggle: () => setShowNew(value => !value) },
      { label: '새 비밀번호 확인', value: confirmPw, set: setConfirmPw, show: showNew, toggle: () => setShowNew(value => !value) },
    ];

    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <Header title="비밀번호 변경" />
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-5">
          <div className="rounded-2xl p-4 mb-4" style={{ background: '#F5EFE6', border: '1.5px solid rgba(201,124,86,0.18)' }}>
            <p style={{ fontSize: 12, color: '#6B5040', lineHeight: 1.5 }}>
              현재 비밀번호로 본인 확인 후 서버 계정 비밀번호를 변경합니다.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {fields.map(field => (
              <div key={field.label}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#9E8B7E' }}>{field.label}</label>
                <div className="flex items-center mt-2 rounded-2xl px-4" style={{ height: 54, background: '#F0EAE2' }}>
                  <input
                    className="flex-1 bg-transparent outline-none"
                    style={{ fontSize: 15, color: '#2A1F1A' }}
                    type={field.show ? 'text' : 'password'}
                    value={field.value}
                    onChange={event => field.set(event.target.value)}
                  />
                  <button onClick={field.toggle} className="active:opacity-60">
                    {field.show ? <EyeOff size={18} color="#9E8B7E" /> : <Eye size={18} color="#9E8B7E" />}
                  </button>
                </div>
              </div>
            ))}
            {confirmPw && (
              <p style={{ fontSize: 12, color: pwMatch ? '#C97C56' : '#d4183d', marginTop: -6 }}>
                {pwMatch ? '새 비밀번호가 일치합니다.' : '새 비밀번호가 일치하지 않습니다.'}
              </p>
            )}
          </div>

          <button
            onClick={savePassword}
            className="w-full mt-6 py-4 rounded-2xl active:scale-95 transition-all"
            style={{ background: pwMatch ? '#C97C56' : '#EDE5DB', color: pwMatch ? '#FFFFFF' : '#9E8B7E', fontSize: 15, fontWeight: 700, border: 'none', boxShadow: pwMatch ? '0 8px 24px rgba(201,124,86,0.3)' : 'none' }}
          >
            비밀번호 변경
          </button>
        </div>
      </div>
    );
  }

  if (section === 'photo') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <Header title="프로필 사진" />
        <div className="flex-1 flex flex-col items-center px-5 pt-5 pb-5">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelected} style={{ display: 'none' }} />
          <div className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center mb-7" style={{ background: 'linear-gradient(135deg, #C97C56, #D4A070)', boxShadow: '0 8px 24px rgba(42,31,26,0.16)' }}>
            {previewPhoto ? <img src={previewPhoto} alt="profile preview" className="w-full h-full object-cover" /> : <Camera size={42} color="#FFFFFF" />}
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-3xl flex flex-col items-center justify-center gap-3 active:scale-98 transition-all mb-4"
            style={{ height: 160, background: previewPhoto ? '#E8F5EE' : '#F0EAE2', border: `2px dashed ${previewPhoto ? 'rgba(42,139,74,0.4)' : 'rgba(201,124,86,0.4)'}` }}
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#FFFFFF' }}>
              {previewPhoto ? <Check size={22} color="#2A8B4A" /> : <Upload size={22} color="#C97C56" />}
            </div>
            <div className="text-center">
              <p style={{ fontSize: 14, fontWeight: 700, color: previewPhoto ? '#2A8B4A' : '#2A1F1A' }}>
                {previewPhoto ? '사진 선택 완료' : '사진 선택'}
              </p>
              <p style={{ fontSize: 12, color: '#9E8B7E', marginTop: 2 }}>기기에서 이미지를 선택합니다.</p>
            </div>
          </button>

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="py-4 px-5 rounded-2xl active:scale-95 transition-all"
              style={{ background: '#EDE5DB', color: '#2A1F1A', fontSize: 14, fontWeight: 700, border: 'none' }}
            >
              제거
            </button>
            <button
              onClick={savePhoto}
              className="flex-1 py-4 rounded-2xl active:scale-95 transition-all"
              style={{ background: previewPhoto ? '#C97C56' : '#EDE5DB', color: previewPhoto ? '#FFFFFF' : '#9E8B7E', fontSize: 15, fontWeight: 700, border: 'none', boxShadow: previewPhoto ? '0 8px 24px rgba(201,124,86,0.3)' : 'none' }}
            >
              저장
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'data') {
    return (
      <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
        <Header title="계정 데이터" />
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-5">
          <div className="rounded-3xl p-5 mb-4" style={{ background: '#FFFFFF', boxShadow: '0 4px 16px rgba(42,31,26,0.08)' }}>
            <div className="flex items-start gap-3">
              <Database size={20} color="#C97C56" className="mt-0.5" />
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A' }}>로컬 저장 데이터</p>
                <p style={{ fontSize: 12, color: '#9E8B7E', lineHeight: 1.5, marginTop: 4 }}>
                  프로필, 알림 설정, 문의, 미션, 포인트, 추천 일정 데이터는 현재 이 기기의 브라우저 저장소에 보관됩니다.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={exportData}
            className="w-full py-4 rounded-2xl active:scale-95 transition-all mb-3"
            style={{ background: '#2A1F1A', color: '#FAF8F5', fontSize: 15, fontWeight: 700, border: 'none' }}
          >
            로컬 데이터 복사
          </button>
          <button
            onClick={resetProfile}
            className="w-full py-4 rounded-2xl active:scale-95 transition-all"
            style={{ background: '#FFF0F0', color: '#d4183d', fontSize: 15, fontWeight: 700, border: 'none' }}
          >
            프로필 초기화
          </button>
        </div>
      </div>
    );
  }

  const items = [
    { id: 'profile', label: '프로필 정보', desc: '이름과 사용자 코드를 변경해요', icon: User },
    { id: 'password', label: '비밀번호 변경', desc: '현재 비밀번호 확인 후 변경해요', icon: ShieldCheck },
    { id: 'photo', label: '프로필 사진', desc: '기기에서 사진을 선택해 저장해요', icon: Camera },
    { id: 'data', label: '계정 데이터', desc: '로컬 저장 데이터를 확인하고 관리해요', icon: Database },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <Header title="계정 관리" backToMenu={false} />

      <div className="px-5 mb-5 flex-shrink-0">
        <div className="rounded-3xl p-5 flex items-center gap-4" style={{ background: '#FFFFFF', boxShadow: '0 4px 16px rgba(42,31,26,0.08)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #C97C56, #D4A070)' }}>
            {profile.photoDataUrl ? <img src={profile.photoDataUrl} alt="profile" className="w-full h-full object-cover" /> : <span style={{ color: '#FFF', fontSize: 26, fontWeight: 700 }}>{profile.displayName[0] || '여'}</span>}
          </div>
          <div className="min-w-0">
            <p style={{ fontSize: 16, fontWeight: 700, color: '#2A1F1A' }}>{profile.displayName}</p>
            <p style={{ fontSize: 12, color: '#C97C56', fontWeight: 700, marginTop: 2 }}>{profile.userCode}</p>
            <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>{readableAuthId()}</p>
          </div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-3">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className="w-full flex items-center gap-4 rounded-2xl p-4 text-left active:opacity-80 transition-opacity"
              style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#F5EFE6' }}>
                <Icon size={19} color="#C97C56" />
              </div>
              <div className="flex-1">
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>{item.label}</p>
                <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>{item.desc}</p>
              </div>
              <ChevronRight size={16} color="#9E8B7E" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

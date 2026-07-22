import { useState } from 'react';
import { Bell, BellRing, ChevronLeft, Clock, Gift, MapPinned, Moon } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface NotificationSettings {
  push: boolean;
  missions: boolean;
  plans: boolean;
  rewards: boolean;
  quietHours: boolean;
  reminderTime: string;
}

const STORAGE_KEY = 'momentrip.notificationSettings';

const DEFAULT_SETTINGS: NotificationSettings = {
  push: true,
  missions: true,
  plans: true,
  rewards: true,
  quietHours: false,
  reminderTime: '09:00',
};

function readSettings() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value ? { ...DEFAULT_SETTINGS, ...JSON.parse(value) } as NotificationSettings : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function permissionLabel() {
  if (!('Notification' in window)) return '지원 안 함';
  if (Notification.permission === 'granted') return '허용됨';
  if (Notification.permission === 'denied') return '차단됨';
  return '요청 전';
}

export function NotificationSettingsScreen({ onBack }: Props) {
  const [settings, setSettings] = useState<NotificationSettings>(readSettings);
  const [permission, setPermission] = useState(permissionLabel);
  const [saved, setSaved] = useState(false);

  const update = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('이 브라우저는 알림을 지원하지 않습니다.');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(permissionLabel());
    if (result === 'granted') {
      update('push', true);
      new Notification('MomenTrip 알림', { body: '여행 미션과 일정 알림을 받을 수 있어요.' });
    }
  };

  const rows = [
    { key: 'missions', title: '미션 알림', desc: '여행지 근처에서 수행 가능한 미션을 알려줘요', icon: BellRing },
    { key: 'plans', title: '일정 알림', desc: '저장한 여행 일정 시작 전에 알려줘요', icon: MapPinned },
    { key: 'rewards', title: '적립금 알림', desc: '포인트 적립과 지역화폐 전환 내역을 알려줘요', icon: Gift },
    { key: 'quietHours', title: '방해 금지 시간', desc: '밤 시간에는 알림을 조용히 보관해요', icon: Moon },
  ] as const;

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAF8F5', fontFamily: "'Noto Sans KR', sans-serif" }}>
      <div className="px-5 pt-4 pb-3 flex-shrink-0 flex items-center gap-3">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-xl active:opacity-60" style={{ background: '#EDE5DB' }}>
          <ChevronLeft size={20} color="#2A1F1A" />
        </button>
        <div className="flex-1">
          <p style={{ fontSize: 18, fontWeight: 700, color: '#2A1F1A' }}>알림 설정</p>
          <p style={{ fontSize: 11, color: '#9E8B7E' }}>{saved ? '저장됨' : '여행 알림을 관리해요'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5">
        <div className="rounded-3xl p-5 mb-4" style={{ background: '#FFFFFF', boxShadow: '0 4px 16px rgba(42,31,26,0.08)' }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: '#F5EFE6' }}>
              <Bell size={22} color="#C97C56" />
            </div>
            <div className="flex-1">
              <p style={{ fontSize: 15, fontWeight: 700, color: '#2A1F1A' }}>푸시 알림</p>
              <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2 }}>브라우저 권한: {permission}</p>
            </div>
            <button
              onClick={() => update('push', !settings.push)}
              className="rounded-full p-1 transition-all"
              style={{ width: 48, height: 28, background: settings.push ? '#C97C56' : '#EDE5DB' }}
            >
              <span
                className="block rounded-full transition-all"
                style={{
                  width: 20,
                  height: 20,
                  background: '#FFFFFF',
                  transform: settings.push ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>
          <button
            onClick={requestPermission}
            className="w-full mt-4 py-3 rounded-2xl active:scale-95 transition-all"
            style={{ background: '#2A1F1A', color: '#FAF8F5', fontSize: 13, fontWeight: 700, border: 'none' }}
          >
            브라우저 알림 권한 요청
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {rows.map(row => {
            const Icon = row.icon;
            const checked = Boolean(settings[row.key]);
            return (
              <div key={row.key} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#F5EFE6' }}>
                  <Icon size={18} color="#C97C56" />
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>{row.title}</p>
                  <p style={{ fontSize: 11, color: '#9E8B7E', marginTop: 2, lineHeight: 1.4 }}>{row.desc}</p>
                </div>
                <button
                  onClick={() => update(row.key, !checked)}
                  className="rounded-full p-1 transition-all flex-shrink-0"
                  style={{ width: 44, height: 26, background: checked ? '#C97C56' : '#EDE5DB' }}
                >
                  <span
                    className="block rounded-full transition-all"
                    style={{ width: 18, height: 18, background: '#FFFFFF', transform: checked ? 'translateX(18px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl p-4 mt-4" style={{ background: '#FFFFFF', boxShadow: '0 2px 10px rgba(42,31,26,0.06)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} color="#C97C56" />
            <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1F1A' }}>일정 알림 시간</p>
          </div>
          <input
            type="time"
            value={settings.reminderTime}
            onChange={event => update('reminderTime', event.target.value)}
            className="w-full rounded-2xl px-4 outline-none"
            style={{ height: 50, background: '#F0EAE2', color: '#2A1F1A', fontSize: 16 }}
          />
        </div>
      </div>
    </div>
  );
}

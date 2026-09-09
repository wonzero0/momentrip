import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MomenTrip 화면 오류:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        className="w-screen flex items-center justify-center px-6"
        style={{ minHeight: '100dvh', background: '#FAF3EC', fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <section className="w-full max-w-sm rounded-3xl p-7 text-center" style={{ background: '#FFFFFF' }}>
          <div className="text-4xl mb-4" aria-hidden="true">🌿</div>
          <h1 style={{ color: '#2A1F1A', fontSize: 22, fontWeight: 800 }}>화면을 다시 준비할게요</h1>
          <p className="mt-2 mb-6" style={{ color: '#8B6148', fontSize: 14, lineHeight: 1.6 }}>
            일시적인 오류가 발생했습니다. 저장된 여행 기록은 그대로 유지됩니다.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-2xl py-4 active:scale-95 transition-transform"
            style={{ background: '#2A1F1A', color: '#FFFFFF', fontSize: 15, fontWeight: 700 }}
          >
            다시 불러오기
          </button>
        </section>
      </main>
    );
  }
}

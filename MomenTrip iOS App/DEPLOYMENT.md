# GitHub / Vercel 배포 절차

Supabase migration·RLS·Auth 설정과 실제 사진 업로드는 사용자 확인 기준 완료 상태입니다.
아래 명령은 사용자가 실행하는 안내입니다. 이번 점검에서는 Git 초기화, 커밋, GitHub 생성/push, Vercel 배포를 실행하지 않았습니다.

## 배포 전

- Node.js 24.x, npm과 `package-lock.json`을 사용합니다.
- `.env.local`의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`만 production 앱 설정에 사용됩니다.
- production build는 두 값이 없거나 HTTPS URL이 아니면 실패합니다. 기존 Node/Firebase 환경값은 production 번들에서 제외됩니다.
- 번들 검사에서 실제 기존 Node/Firebase 환경값과 server-only secret 패턴이 없음을 확인했습니다. Supabase SDK 자체의 localhost 기본 상수는 포함되지만 실제 클라이언트에는 설정한 HTTPS Supabase URL이 전달됩니다.
- 기존 개발/롤백 어댑터와 Node 서버는 보존했습니다. 과거 백엔드로 빌드하려면 Supabase 환경변수를 비우고 명시적으로 `--mode legacy`를 사용해야 합니다. 기본 `npm run build`와 iOS 준비 명령은 현재 Supabase를 사용합니다.
- `capacitor.config.json`, iOS 소스, Info.plist, Swift Package 파일을 유지했습니다. 생성된 iOS public/config와 Xcode 사용자 설정은 Git 제외됩니다. 새 checkout의 iOS 파일 동기화는 `npm run cap:sync:ios`를 사용합니다.
- `public/`은 현재 없으며 만들 필요 없습니다. 정적 폰트는 `src/assets/`에서 번들링됩니다.

## Git / GitHub

아래 초기 생성 예시는 독립적인 새 repository용입니다. 현재 repository에는 이미 이력이 있으므로 다시 init하거나 origin을 변경하지 않습니다. 현재 반영 브랜치는 `review/vercel-supabase`이며 앱은 `MomenTrip iOS App/` 아래에 있습니다. 기존 `jeongwon` 대상 PR로 검토하세요.

```sh
git init
git add .
git status --short
git diff --cached --name-only
```

이 시점에서 `.env.example`을 제외한 `.env*`, `server/data/`, `server/uploads/`, `supabase/.temp/`, migration journal, 인증키/인증서, `node_modules/`, `dist/`, 캐시, Xcode 개인 설정이 목록에 없어야 합니다. 예기치 않은 민감 파일이 있으면 커밋하지 말고 `git rm --cached -- <FILE>`로 staging에서만 제거하고 제외 규칙을 수정하세요. 파일 내용 전체를 공개 로그에 출력하지 마세요.

포함할 파일: package/lockfile, src, vite/vercel 설정, supabase migrations/문서, .env.example, scripts, Capacitor 설정과 iOS 소스/프로젝트/공유 Package.resolved.

```sh
git commit -m "Prepare MomenTrip for Vercel and Supabase deployment"
git branch -M main
```

GitHub에서 빈 repository를 생성합니다. 처음에는 Private을 권장하며 README/.gitignore/license 자동 생성은 선택하지 않습니다. 실제 repository URL을 아래 placeholder에 대체합니다.

```sh
git remote add origin <REPOSITORY_URL>
git push -u origin main
```

인증은 GitHub의 정상 로그인/SSH/credential manager를 사용합니다. URL에 토큰을 넣지 마세요.

## Vercel

GitHub repository Import 후 다음 설정을 사용합니다.

| 항목 | 값 |
| --- | --- |
| Framework Preset | Vite |
| Root Directory | MomenTrip iOS App |
| Build Command | npm run build |
| Output Directory | dist |
| Install Command | npm ci |
| Node.js | 24.x |

환경변수는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` 두 개만 등록합니다.
Production과 Preview에 설정하고, Development는 `vercel dev`/환경변수 내려받기를 사용할 경우 설정합니다. 일반 `npm run dev`는 로컬 `.env.local`을 사용합니다.
Preview에 같은 Supabase 프로젝트를 연결하면 테스트가 운영 데이터에 반영될 수 있으므로 별도 테스트 프로젝트를 우선 사용합니다. 없다면 테스트 계정으로만 검증하세요.
변수 변경 후에는 다시 배포해야 합니다. `SUPABASE_SECRET_KEY`, service role key, DB password, Direct Connection String, CLI Access token은 frontend에 등록하지 않습니다.

`vercel.json`의 fallback은 UI 경로를 index.html로 보내고 `/api`, `/uploads`, `/assets`는 제외합니다.
현재 앱은 React Router/history 경로 대신 내부 화면 상태를 사용하므로 임의 경로로 접근해도 특정 화면을 복원하는 deep link 기능은 없습니다.

## Supabase Auth URL

현재 앱은 `signUp/signInWithPassword`와 세션 갱신을 사용하며 OAuth, magic link, 이메일 비밀번호 재설정 링크를 사용하지 않습니다. 따라서 Redirect URLs 추가는 현재 로그인·사진 기능의 필수 조건이 아닙니다.
배포 후 Site URL은 실제 production HTTPS 주소로 맞추는 것을 권장합니다. 향후 이메일 링크/OAuth를 구현할 때는 정확한 callback URL을 Redirect URLs에 등록하고 callback 처리도 구현해야 합니다. 필요 없는 전체 도메인 wildcard는 추가하지 않습니다.

## 배포 후

- 실제 vercel.app에서 첫 로딩, 새로고침, 직접 URL 진입 확인.
- 회원가입, 로그인, 로그아웃, 재로그인 확인.
- 여행방 생성, 데이터 저장, 새로고침 후 데이터 유지 확인.
- 사진 업로드·조회 및 로그아웃/재로그인 후 조회 확인.
- 모바일 Safari/Chrome, 브라우저 Console 및 Network 오류 확인. localhost API 요청이 없어야 합니다.
- Supabase Dashboard의 Authentication Users, Table Editor, Storage에서 해당 테스트 기록 확인.
- 다른 사용자 계정에서 개인 기록/사진이 노출되지 않는지 확인.

기존 Node 서버·원본 데이터·iOS 프로젝트는 이번 배포 점검에서 삭제하지 않습니다.

공식 참고: [Vercel 환경변수](https://vercel.com/docs/environment-variables), [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

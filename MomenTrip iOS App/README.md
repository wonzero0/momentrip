# MomenTrip

React 18 + TypeScript + Vite 6 웹 SPA와 Capacitor iOS 앱입니다. 기존 UI를 유지하면서 Supabase Auth/Database/private Storage를 연결했습니다.

## 웹 개발

Node.js 24.x와 npm을 사용합니다. `.env.example`의 두 변수를 `.env.local`에 직접 설정하세요. 기존 파일은 덮어쓰지 마세요.

```sh
npm install
npm run dev
```

Supabase SQL·Auth 설정 및 기존 데이터 이전 절차는 [supabase/README.md](supabase/README.md)를 따릅니다. Supabase 환경변수 설정 시 기존 Node/Firebase 경로보다 우선합니다.

## Vercel

GitHub repository를 Import하고 Root Directory를 `MomenTrip iOS App`으로 설정합니다. Vite preset, `npm ci`, `npm run build`, 출력 `dist`는 `vercel.json`에 지정되어 있습니다. Vercel Production/Preview에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 등록한 뒤 배포하세요. 새 경로에는 상시 Node 서버가 필요 없습니다. 먼저 Supabase migration과 Auth 설정이 완료되어야 합니다.

## iOS 및 기존 서버

```sh
npm run cap:sync:ios
npm run cap:open:ios
```

Capacitor 설정은 유지했습니다. 기존 Node API와 Firebase 어댑터는 롤백용으로 보존했습니다. Supabase 변수가 없으면 기존 `VITE_API_BASE_URL`/Firebase 선택 동작을 유지합니다. 기존 로컬 실행은 `npm run dev:full`, 서버 실행은 `npm run server`입니다. 이전 장치 안내는 [IOS_DEVICE_TEST.md](IOS_DEVICE_TEST.md)에 있습니다.

## 검증 및 비밀정보

`npm run typecheck`, `npm run build`, `npm run test:supabase`, `npm run test:server`로 검증합니다.
`.env.local`, server 데이터·사진, migration journal, 인증키는 Git 제외합니다. `.env.example`에는 빈 변수만 둡니다. `VITE_*`는 브라우저 번들에 공개됩니다. DB 연결 문자열·비밀번호·secret/service-role key를 넣으면 안 됩니다. 빌드 설정에서 주요 secret 형식을 검사하고 발견 시 값 출력 없이 차단합니다.

GitHub 초기 업로드와 Vercel 최종 설정·배포 후 점검은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요. 기본 production build에는 Supabase 브라우저용 두 환경변수가 필요합니다.

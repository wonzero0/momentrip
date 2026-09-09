# MomenTrip Supabase 전환

## 기존 백엔드 분석

- Entry point: `server/index.mjs`, Node `http.createServer`, 기본 포트 4174. Express 없음.
- 저장소: `server/data/db.json`, 백업 `server/data/db.backup-before-clean.json`, 파일 `server/uploads/`.
- `ensureDb/readDb/writeDb/withDb`: 디렉토리 생성, JSON 전체 읽기, 임시 파일 rename, 프로세스 내 쓰기 큐. Vercel의 수평 확장·일시 파일 시스템과 맞지 않음.
- 현재 DB는 비어 있음. 백업에는 사용자 5, 방 2, 사진 8, 미션 완료 8, 보상 26, 다이어리 2, 네컷 1, 공유 1. 세션 5개는 이전하지 않음.
- 사진: JSON POST는 `dataUrl`, multipart POST는 파일과 data URL 양쪽 저장. `photoForClient`는 data URL을 반환하며 서버 절대경로는 제외. 기존 조회는 본인 사진만, 삭제 API는 없음. 오류 시 생성 파일 정리만 있음.
- 인증: PBKDF2-SHA512 비밀번호, 랜덤 세션 토큰, JSON 사용자 레코드. Supabase Auth의 비밀번호 저장 방식과 호환되지 않음.
- 서버의 외부 private API, 결제, webhook, 관리자 endpoint, 외부 API secret 사용은 발견되지 않음. 지역화폐 전환은 실제 결제가 아닌 포인트 차감 기록.
- `src/app/lib/api.ts`: 기존 Node REST 및 Firebase Auth/Firestore 어댑터. Firebase 사진 저장은 메타데이터만 구현되어 있었음.
- 프론트 외부 호출: Firebase REST/SDK, HTTPS 이미지·폰트. 신규 Supabase 경로에서는 Firebase를 초기화하지 않음.
- `VITE_API_BASE_URL`: 기존 `api.ts`, `firebase.ts`에서 선택에 사용. localhost는 기존 개발 스크립트/Node 기본 origin/문서에 유지. Supabase 설정이 하나라도 있으면 Supabase가 우선하며, 일부만 설정하면 명시적 오류로 종료.
- Capacitor는 같은 Vite 번들과 API 어댑터를 사용. 네이티브 사진 Blob을 기존 `uploadPhotoFile` 계약으로 넘김. Capacitor 설정 변경 없음.

| 분류 | 기존 route | 대체 구현 |
| --- | --- | --- |
| C | POST `/api/auth/signup`, `/login`, `/logout`; PUT `/api/me/password` | Supabase Auth, DB 가입 트리거, 현재 비밀번호 재인증 |
| A/C | GET `/api/auth/check-username`, GET/PUT `/api/me`·`/api/me/profile` | 제한된 중복 확인 RPC, 본인 profiles 조회·수정 |
| A/D | GET `/api/friends` | 인증 사용자에게 이름·코드 등 최소 정보 20개만 반환하는 RPC |
| A/D | GET/POST `/api/rooms`, POST `/api/rooms/join`, GET `/api/rooms/:id` | rooms/room_members + 구성원 RLS + 방 생성/가입 RPC |
| A/D | GET `/api/missions`, POST `/api/missions/:id/complete` | mission_completions + 보상 상한·소유권·중복 방지 RPC |
| A/D | GET `/api/rewards`, POST `/api/rewards/convert` | reward_transactions + 사용자 행 잠금·잔액 검증 RPC |
| A/B | GET/POST `/api/photos` | photos 메타데이터, private Storage upload/download |
| A/B | GET/POST `/api/diaries`, PUT `/api/diaries/:id` | diaries + 소유 사진 검증, 합성 이미지 Storage |
| A/B | GET/POST `/api/fourcuts` | four_cuts + 서로 다른 본인 사진 4장 검증, 합성 이미지 Storage |
| A | POST `/api/share`, GET/POST `/api/inquiries` | 본인 소유 shares/inquiries |
| E | `/health`, listen, JSON read/write, multipart 파일 저장, 기존 세션 발급 | 신규 경로에서 불필요. 롤백·기존 iOS 빌드용으로 원본 서버 보존 |

앱 API 계약과 camelCase TypeScript 타입을 유지하고 어댑터에서 snake_case DB 필드를 변환합니다.
기존 `user_…`, `photo_…` ID는 text PK로 보존하고 `profiles.auth_id`를 Auth UUID와 연결합니다.
`room_members`는 실제 사용자 FK를 가지며 백업의 사용자 계정 없는 멤버 2개는 `rooms.legacy_members` 표시 기록으로 보존합니다. 접근 권한은 부여하지 않습니다.

## Supabase에서 실행할 작업

1. SQL Editor에서 `migrations/202609090001_momentrip.sql`을 **한 번** 실행합니다. 트랜잭션으로 테이블, 제약, RLS, RPC, Auth 트리거, private bucket을 함께 생성합니다. 기존 테이블은 drop하지 않습니다. 동일 이름이 이미 있으면 먼저 충돌을 검토하세요.
2. Storage의 `momentrip-photos` bucket이 **private**, 16MB 제한인지 확인합니다. SQL에 bucket 생성이 포함되어 별도 수동 생성은 필요 없습니다.
3. Authentication에서 Email provider를 활성화하고 **Confirm email을 해제**합니다. 기존 UI는 이메일 입력 없이 아이디/비밀번호로 가입하므로 내부 SHA-256 이메일 별칭을 사용합니다. 이 주소는 메일을 수신하지 않습니다. 이메일 인증·이메일 비밀번호 복구가 필요하면 실제 이메일 수집 흐름을 추가해야 합니다. 비밀번호는 6~72자이며 Supabase 비밀번호 정책도 이에 맞춰야 합니다.
4. `.env.local`과 Vercel Production/Preview에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`를 등록한 뒤 다시 빌드합니다. 제공된 브라우저용 두 값은 `.env.local`에 설정했으며 다른 기존 값은 보존했습니다.
5. 새 웹 origin에서는 기존 Node 세션을 이전하지 않으므로 다시 로그인합니다. 새 계정으로 가입·로그인·방 초대·사진·다이어리·미션·차감을 실제 프로젝트에서 확인한 뒤 전환합니다.
6. iOS는 같은 환경변수로 `npm run cap:sync:ios` 후 재빌드합니다. 기존 iOS 앱과 서버는 삭제하지 않았습니다.

## 기존 데이터 이전

기본 실행은 네트워크를 사용하지 않는 dry run입니다. `db.json`은 현재 비어 있으므로 백업을 복원하려는 경우에만 명시적으로 선택합니다.

```sh
npm run migrate:supabase
npm run migrate:supabase -- --source server/data/db.backup-before-clean.json
```

실제 이전은 SQL 적용 후 로컬 서버를 중지하고 새 서비스도 쓰기가 없는 상태에서 실행합니다.
서버 전용 환경변수 `SUPABASE_URL`, `SUPABASE_SECRET_KEY`를 셸 또는 Git 제외된 별도 env 파일로 설정합니다. 이 값을 Vercel 프론트엔드 환경변수나 `VITE_*`에 넣지 마세요.

```sh
npm run migrate:supabase -- --source server/data/db.backup-before-clean.json --apply
```

- `--uploads`로 원본 업로드 디렉토리를 지정할 수 있습니다. 절대 uploadPath는 따라가지 않고 선택한 디렉토리의 basename만 읽습니다. JSON data URL이 있으면 원본으로 우선 사용합니다.
- 사용자·관계·이미지를 먼저 검사하고 Auth 계정 → profiles → 방/구성원 → Storage → 나머지 테이블 순서로 이전합니다.
- JSON/사진 파일을 수정·삭제하지 않습니다. 참조되지 않는 기존 파일도 원래 위치에 남깁니다.
- 기존 세션, passwordHash, passwordSalt는 이전하지 않습니다. 각 사용자에 무작위 초기 비밀번호를 발급하며 `server/data/supabase-migration.json`에 계정 매핑과 함께 **0600 권한**으로 저장합니다. 콘솔에 출력하지 않습니다. 이 파일을 비공개로 보관하고 본인 확인 후 개별 전달하세요. 로그인 후 비밀번호 변경이 필요합니다.
- `--journal`로 다른 경로를 사용할 경우에도 반드시 Git 제외된 비공개 위치를 사용하세요. 기본 위치와 `supabase-migration*.json`은 Git 제외됩니다.
- Auth 사용자 metadata만으로 기존 계정과 연결하지 않습니다. 관리자만 설정 가능한 app_metadata의 원본 ID·원본 해시를 검증해 기존 계정 탈취를 방지합니다.
- API/Storage 전체를 하나의 트랜잭션으로 묶을 수 없으므로 부분 완료될 수 있습니다. 같은 원본·프로젝트·journal로 재실행하면 기존 레코드를 덮어쓰지 않고 계속합니다. 기존 객체는 내용 일치를 확인합니다. journal은 삭제하지 마세요.
- 현재 원본 백업의 dry run은 통과했습니다. 실제 클라우드 데이터 이전은 실행하지 않았습니다.

Direct Connection String/DB password는 SQL Editor 방식에는 필요 없습니다. CLI로 migration을 실행하는 경우에만 로컬 server-only 환경에 보관합니다.

## 권한과 운영 한계

- 모든 앱 테이블에 RLS 적용. 익명 테이블 SELECT 없음. 중복확인 boolean만 익명 RPC로 공개합니다.
- profiles는 본인 조회 및 허용 필드 수정만 가능. 친구 검색은 인증된 계정에 최소 공개 프로필 정보만 반환합니다. Auth UUID·이메일은 검색에 포함하지 않습니다.
- rooms/room_members는 구성원만 조회. 생성·가입은 DB 함수만 가능. 기존의 친구 선택 초대 동작을 유지합니다.
- 보상과 미션 완료는 직접 INSERT/UPDATE/DELETE 불가. security definer 함수는 빈 search_path, 명시적 schema, auth.uid 검사와 제한된 EXECUTE 권한을 사용합니다.
- 금액 변경은 같은 사용자 행을 잠그며, 보상 상한·중복 지급 방지·잔액 확인을 DB에서 처리합니다. 사진 점수 자체는 기존 UI의 모의 점수이며 실제 AI 검증·실제 화폐 지급 기능은 아닙니다.
- 사진·다이어리·네컷·공유·문의는 본인 CRUD만 허용합니다. 사진 관계는 DB trigger/FK로 검증하며 다른 사람의 사진을 붙일 수 없습니다.
- Storage 경로 첫 폴더는 앱 사용자 ID이며 본인만 upload/read/delete 가능. update는 허용하지 않고 교체 시 새 객체를 생성합니다. DB에서 참조 중인 객체는 삭제할 수 없습니다. 사진 삭제는 먼저 DB 메타데이터 삭제, 이후 Storage 삭제 순서입니다. 기존 UI에 없던 삭제 화면은 추가하지 않았습니다.
- Storage 다운로드 후 data URL로 변환하여 기존 canvas/내보내기를 유지합니다. 공개 URL이나 만료되는 signed URL을 DB에 저장하지 않습니다. 업로드 실패 시 새 객체를 정리하며 네트워크 장애로 남은 미참조 객체는 관리자가 정리할 수 있습니다.
- Supabase 모드에서는 보상 요청 실패를 로컬 성공으로 처리하지 않습니다.
- 서버-only API key/private 외부 API/webhook이 생기면 Edge Function 등 서버 환경에 추가해야 합니다. 현재 서버에서는 이러한 기능이 발견되지 않았습니다.

공식 기준: [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Storage 정책](https://supabase.com/docs/guides/storage/security/access-control), [Database 함수](https://supabase.com/docs/guides/database/functions), [API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 검증

```sh
npm install
npm run typecheck
npm run build
npm run test:supabase
npm run test:server
```

`test:supabase`는 PGlite PostgreSQL 엔진에서 실제 migration을 실행합니다. Auth/Storage 플랫폼 테이블은 최소 스키마로 재현하고 RLS·RPC·트리거를 검증합니다. 실제 Supabase Auth HTTP/Storage 전송, 네트워크 동시성, 실기기 동작을 대신하지 않습니다. 클라우드 자격증명 없이 실제 프로젝트를 변경하지 않습니다.


## 과거 연결 점검 기록 (2026-09-09, 최초 연결 시점)

이하 미적용/인증 미완료 기록은 최초 연결 시점의 이력입니다. 이후 사용자 확인에 따라 migration·RLS·Auth 설정과 로컬 실제 사진 업로드가 완료되었습니다. 현재 배포 절차는 [DEPLOYMENT.md](../DEPLOYMENT.md)를 따릅니다.

- 로컬 브라우저 환경변수 설정 및 Supabase SDK 초기화 성공.
- Auth settings와 Storage API: HTTP 200. Email provider와 signup 활성화, email confirmation 켜짐.
- 앱 테이블 10개: PGRST205, `check_username` 함수: PGRST202. API는 응답하지만 앱 schema가 미적용 상태.
- 익명 Storage bucket 목록은 비어 있으며 이것만으로 private bucket 존재나 policy를 판별할 수 없음.
- `supabase/config.toml` 생성 완료. 기존 migration 보존, seed 비활성화. 이 파일의 Auth 설정은 로컬 개발용이며 Dashboard 설정을 자동 변경하지 않음.
- CLI 원격 link는 Access token 미제공으로 중단. 실제 DB password/server-only key도 제공되지 않아 원격 migration은 실행하지 않음.
- 회원가입·로그인·DB 쓰기·Storage 업로드는 schema 및 Auth 설정 완료 후 테스트해야 함. 이번 점검에서 원격 테스트 계정이나 기존 백업 데이터를 생성하지 않음.

CLI는 `npx supabase`로 사용할 수 있습니다. 사용자 터미널에서 로그인 후 진행하세요. Access token과 DB password는 채팅/소스 코드 대신 CLI 로그인·보안 입력을 사용합니다.

```sh
npx supabase login
npx supabase link --project-ref xuivmmsnjwkkcdlfvysr
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
npm run check:supabase
```

`db push` 전에 원격 기존 테이블과 migration history를 확인합니다. 원본 migration은 단독 재실행용이 아니며 CLI history로 중복 적용을 방지합니다. Dashboard SQL Editor로 이미 실행했다면 그대로 다시 push하지 말고 history를 먼저 정합화하세요. `db reset`은 사용하지 않습니다.

`verify.sql`은 적용 후 SQL Editor에서 테이블/RLS, 함수, trigger, bucket/policy를 확인하는 **읽기 전용** 쿼리입니다.
`npm run check:supabase`는 읽기 전용 API 점검이며 키·토큰·사용자 데이터를 출력하지 않습니다. Exit 0은 API 및 기본 준비 조건 통과, 1은 연결 실패, 2는 연결되지만 schema/Auth 설정 보완 필요입니다. 실제 RLS/trigger 검증은 별도로 수행해야 합니다.

Vercel frontend에는 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`만 등록합니다. `SUPABASE_SECRET_KEY`, service role key, DB password, Direct Connection String, CLI Access token은 등록하지 않습니다.

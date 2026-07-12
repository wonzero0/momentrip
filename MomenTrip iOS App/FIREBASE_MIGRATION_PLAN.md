# MomenTrip Firebase 전환 계획

작성일: 2026-06-22

Firebase 프로젝트:
- Project ID: `momentrip-db349`
- Project Number: `541633044909`
- 현재 요금제: Spark로 가정

참고한 공식 문서:
- Firebase pricing plans: https://firebase.google.com/docs/projects/billing/firebase-pricing-plans
- Firebase pricing: https://firebase.google.com/pricing
- Cloud Storage for Firebase billing changes: https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024

## 1. 현재 구조

- 프론트엔드: React + Vite, `src/app/App.tsx` 중심의 단일 페이지 앱
- iOS 패키징: Capacitor, `capacitor.config.json`의 `webDir`은 `dist`
- 백엔드: 로컬 Node HTTP 서버 `server/index.mjs`
- API 주소: `.env.local`의 `VITE_API_BASE_URL`
- 데이터 저장: 로컬 JSON 파일 `server/data/db.json`
- 사진 저장: 로컬 파일 폴더 `server/uploads`, 일부 요청은 `dataUrl`도 DB에 저장
- 인증: 자체 username/password + 서버 세션 토큰
- 현재 DB key: `users`, `sessions`, `rooms`, `photos`, `missionCompletions`, `diaries`, `rewardTransactions`, `fourCuts`, `shares`

## 2. 현재 API 목록

| method | path | 기능 | request | response | db key | 파일 업로드 | Firebase 대체 방향 |
|---|---|---|---|---|---|---|---|
| GET | `/health` | 서버 상태 확인 | 없음 | `{ ok, service, time }` | 없음 | 없음 | Firebase SDK 직접 연결 구조에서는 불필요. Hosting 상태 확인으로 대체 |
| GET | `/api/auth/check-username` | 아이디 중복확인 | query `username` | `{ available }` | `users` | 없음 | Firestore `usernames/{username}` 문서 존재 여부 조회 |
| POST | `/api/auth/signup` | 회원가입, 세션 생성, 가입 보상 지급 | `{ username, password, displayName }` | `{ token, user }` | `users`, `sessions`, `rewardTransactions` | 없음 | 권장: Firebase Auth Email/Password + Firestore `users`, `usernames`, `rewardTransactions` 생성 |
| POST | `/api/auth/login` | 로그인, 세션 생성 | `{ username, password }` | `{ token, user }` | `users`, `sessions` | 없음 | Firebase Auth로 전환. username 로그인 유지 시 `usernames/{username}` -> email 매핑 후 로그인 |
| POST | `/api/auth/logout` | 로그아웃, 세션 삭제 | Authorization token | `{ ok }` | `sessions` | 없음 | Firebase Auth `signOut()` |
| GET | `/api/me` | 현재 사용자 조회 | Authorization token | `{ user }` | `sessions`, `users` | 없음 | Firebase Auth `currentUser` + Firestore `users/{uid}` |
| GET | `/api/friends` | 친구 목록 조회 | optional query `query` | `{ friends }` | 현재 서버 상수 `FRIENDS` | 없음 | Firestore `users/{uid}/friends` 또는 `friendships` 컬렉션 |
| GET | `/api/rooms` | 내 방 목록 조회 | Authorization token | `{ rooms }` | `rooms` | 없음 | Firestore `rooms` where `memberIds` contains `uid` 또는 `ownerId == uid` |
| POST | `/api/rooms` | 방 만들기, 여행 계획 저장 | `{ name?, memberIds, planText? }` | `{ room }` | `rooms` | 없음 | Firestore `rooms/{roomId}` 생성 |
| GET | `/api/rooms/:id` | 방 상세 조회 | path room id | `{ room }` | `rooms` | 없음 | Firestore `rooms/{roomId}` read, security rules로 멤버만 허용 |
| GET | `/api/missions` | 미션 목록 + 완료 상태 | Authorization token | `{ missions }` | `missionCompletions` + 서버 상수 `MISSIONS` | 없음 | 미션 템플릿은 클라이언트 상수 또는 Firestore `missionTemplates`, 완료는 `missionCompletions` |
| POST | `/api/missions/:id/complete` | 미션 완료 및 리워드 적립 | `{ photoId? }` | `{ missions, rewards }` | `missionCompletions`, `rewardTransactions` | 없음 | Firestore batch/transaction으로 completion과 reward transaction 생성 |
| GET | `/api/rewards` | 리워드 잔액/내역 조회 | Authorization token | `{ balances, transactions }` | `rewardTransactions` | 없음 | Firestore `rewardTransactions` query 후 클라이언트 합산 또는 `users/{uid}.balances` 유지 |
| GET | `/api/photos` | 사진 목록 조회 | optional query `month` | `{ photos }` | `photos` | 없음 | Firestore `photos` query. 이미지 원본은 Spark에서는 주의 필요 |
| POST | `/api/photos` | 사진 업로드/저장 | JSON `{ dataUrl, label, date, source }` 또는 multipart file | `{ photo }` | `photos`, `server/uploads` | 있음 | Spark 기준: 이미지 파일 저장은 보류. 메타데이터만 Firestore, 실제 이미지 저장은 로컬/Blaze/외부 스토리지 |
| GET | `/api/diaries` | 다이어리 목록 조회 | optional query `date` | `{ diaries }` | `diaries` | 없음 | Firestore `diaries` query by `uid`, `date` |
| POST | `/api/diaries` | 다이어리 생성 | `{ date?, title?, text, photoIds? }` | `{ diary }` | `diaries` | 없음 | Firestore `diaries/{id}` create |
| PUT | `/api/diaries/:id` | 다이어리 수정 | `{ title?, text?, photoIds? }` | `{ diary }` | `diaries` | 없음 | Firestore `diaries/{id}` update |
| GET | `/api/fourcuts` | 네컷 목록 조회 | Authorization token | `{ fourCuts }` | `fourCuts` | 없음 | Firestore `fourCuts` query |
| POST | `/api/fourcuts` | 네컷 저장 | `{ photoIds, filter, imageDataUrl? }` | `{ fourCut }` | `fourCuts` | imageDataUrl 가능 | Spark 기준 imageDataUrl 저장은 비추천. 메타데이터만 저장 |
| POST | `/api/share` | 공유 기록 저장 | `{ kind, targetId?, channel? }` | `{ share, message }` | `shares` | 없음 | Firestore `shares/{id}` create |

## 3. Firebase Spark 요금제에서 가능한 것

| 기능 | 가능 여부 | 구현 방법 |
|---|---:|---|
| React 정적 웹 배포 | 가능 | Firebase Hosting에 `dist` 배포 |
| iOS Capacitor 앱에서 Firebase 연결 | 가능 | Firebase Web SDK 또는 iOS 네이티브 SDK 사용. 현재 구조는 Web SDK가 가장 작게 바뀜 |
| Firestore 데이터 저장 | 가능 | Spark no-cost quota 안에서 `users`, `rooms`, `diaries` 등 저장 |
| Realtime Database 데이터 저장 | 가능 | 단순 실시간 동기화가 필요하면 대안 가능 |
| Firebase Auth Email/Password | 가능 | 기존 username을 email alias로 매핑하거나 실제 email 기반으로 전환 |
| 기존 `api.ts` 함수 이름 유지 | 가능 | 내부 구현만 Firebase SDK adapter로 교체 |
| 로컬 서버 유지 병행 | 가능 | 사진 업로드나 실험 기능은 당분간 로컬 서버 유지 |
| Cloud Functions 없이 기본 CRUD | 가능 | 클라이언트가 Firebase SDK로 직접 Firestore/Auth 호출 |

## 4. Blaze가 필요할 수 있는 것

| 기능 | 이유 | 대안 |
|---|---|---|
| Node 서버를 그대로 Cloud Functions로 배포 | Firebase 문서상 Cloud Functions 접근은 Blaze plan 항목 | Spark에서는 서버 API를 Functions로 옮기지 않고 Firebase SDK 직접 호출 구조 사용 |
| Express/Node API 라우팅 유지 | 서버 실행 환경이 필요하며 Firebase Functions/App Hosting 등 유료 접근 가능성 | API 레이어를 클라이언트 adapter로 전환 |
| Cloud Storage for Firebase 사진 업로드 | 2026년 기준 Cloud Storage for Firebase는 Blaze 필요. Spark면 402/403 가능 | 사진 업로드는 로컬 유지, 또는 외부 무료 이미지 호스팅 검토, 또는 Blaze 전환 후 예산 알림 설정 |
| 서버에서 비밀번호 hash/session 직접 관리 | 서버 런타임 필요 | Firebase Auth로 전환 |
| 리워드 적립을 서버에서 강제 검증 | 클라이언트 직접 쓰기만으로는 악용 방지가 약함. 서버 검증은 Functions가 적합 | MVP에서는 보안 규칙 + 제한적 클라이언트 쓰기. 운영 전 Blaze/서버 검증 필요 |
| 이미지 리사이즈/네컷 합성 서버 처리 | 서버 처리 또는 Functions 필요 | 클라이언트 canvas 합성 후 메타데이터 저장. 원본 저장은 보류 |

## 5. 추천 아키텍처

### Spark 기준 MVP 구조

```text
iPhone Capacitor 앱 / React 앱
  -> Firebase Web SDK
  -> Firebase Authentication
  -> Cloud Firestore
  -> Firebase Hosting(웹 배포용, 선택)

사진 원본 저장:
  Spark 단계에서는 로컬 서버 또는 보류
  Blaze 전환 후 Cloud Storage for Firebase 검토
```

### 데이터 모델 초안

| Firestore path | 용도 | 주요 필드 |
|---|---|---|
| `users/{uid}` | 사용자 프로필 | `uid`, `username`, `displayName`, `email`, `code`, `createdAt`, `balances` |
| `usernames/{username}` | username 중복확인/매핑 | `uid`, `emailAlias`, `createdAt` |
| `rooms/{roomId}` | 여행 방/계획 | `ownerId`, `memberIds`, `name`, `inviteCode`, `planText`, `createdAt` |
| `missionCompletions/{id}` | 미션 완료 | `userId`, `missionId`, `photoId`, `completedAt` |
| `rewardTransactions/{id}` | 리워드 거래 | `userId`, `category`, `amount`, `title`, `desc`, `createdAt` |
| `photos/{photoId}` | 사진 메타데이터 | `userId`, `label`, `date`, `source`, `storagePath?`, `dataUrl?`, `createdAt` |
| `diaries/{diaryId}` | 다이어리 | `userId`, `date`, `title`, `text`, `photoIds`, `createdAt`, `updatedAt` |
| `fourCuts/{fourCutId}` | 네컷 저장 흐름 | `userId`, `photoIds`, `filter`, `imageDataUrl?`, `createdAt` |
| `shares/{shareId}` | 공유 기록 | `userId`, `kind`, `targetId`, `channel`, `createdAt` |
| `friendships/{id}` | 친구 관계 | `userIds`, `status`, `createdAt`, `acceptedAt` |

### Auth 선택지

1. Firebase Auth Email/Password + username alias
   - 추천.
   - 사용자는 앱에서 username/password를 입력.
   - 내부적으로 `username@momentrip.local` 또는 `usernames/{username}.emailAlias`를 사용.
   - 장점: 서버 없이 로그인/세션 관리 가능.

2. 기존 자체 username/password를 Firestore에 저장
   - 비추천.
   - 클라이언트에 비밀번호 검증 로직을 둘 수 없고, 안전한 hash/session 처리는 서버가 필요.
   - 서버 없이 구현하면 보안 수준이 낮음.

## 6. 내가 제공해야 할 Firebase 정보

필수:
- Firebase Project ID: `momentrip-db349` 제공됨
- Firebase Project Number: `541633044909` 제공됨
- Firebase Web App config 전체
  - `apiKey`
  - `authDomain`
  - `projectId`
  - `storageBucket`
  - `messagingSenderId`
  - `appId`
- 사용할 데이터베이스
  - 추천: Cloud Firestore
  - 대안: Realtime Database
- Authentication 사용 여부
  - 추천: Firebase Auth Email/Password
  - 확인 필요: 기존 username UI 유지 여부
- Hosting 배포 여부
  - iOS 앱만 Firebase DB와 연결할지
  - React 웹앱도 Firebase Hosting에 올릴지

선택:
- Firebase Hosting site URL
- Firestore Database location
- Realtime Database URL
- Cloud Storage bucket 사용 가능 여부
- App nickname
- iOS 네이티브 Firebase SDK까지 쓸 계획이면 `GoogleService-Info.plist`

## 7. 구현 순서

1. 기존 데이터/서버 백업 유지
   - `server/data/db.backup-before-clean.json` 유지
   - `server/index.mjs` 삭제 금지

2. Firebase Web App 생성 및 config 확보
   - Firebase Console -> Project settings -> General -> Your apps -> Web app
   - Web SDK config 복사

3. Firebase SDK 설치
   - `npm install firebase`
   - 비용 발생 없음

4. 환경 변수 추가
   - 예: `.env.local`
   - `VITE_FIREBASE_API_KEY=...`
   - `VITE_FIREBASE_AUTH_DOMAIN=...`
   - `VITE_FIREBASE_PROJECT_ID=momentrip-db349`
   - `VITE_FIREBASE_STORAGE_BUCKET=...`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID=541633044909`
   - `VITE_FIREBASE_APP_ID=...`

5. Firebase adapter 추가
   - 새 파일 예: `src/app/lib/firebaseClient.ts`
   - 새 파일 예: `src/app/lib/firebaseApi.ts`
   - 기존 `api.ts` 함수 이름을 최대한 유지

6. 인증 전환
   - `signup`, `login`, `logout`, `me`, `checkUsername`부터 전환
   - `usernames/{username}` 문서로 중복확인
   - 가입 시 Firestore batch로 `users`, `usernames`, 가입 보상 transaction 생성

7. Firestore 데이터 전환
   - rooms
   - missions/missionCompletions
   - rewardTransactions
   - diaries
   - fourCuts
   - shares

8. 사진 기능 처리
   - Spark 유지 시: 사진 원본 업로드는 기존 로컬 서버 유지 또는 일시 보류
   - Blaze 전환 시: Cloud Storage for Firebase + Firestore metadata 구조로 전환

9. 보안 규칙 작성
   - 사용자는 자기 문서와 자기 데이터만 읽고 쓰도록 제한
   - `usernames`는 create-only에 가깝게 제한
   - 리워드 금액은 운영 전 서버 검증 또는 엄격한 rules 필요

10. iOS 재빌드
   - `npm run build`
   - `npx cap sync ios`
   - Xcode에서 다시 Run

## 8. 기능별 Spark 전환 판단

| 현재 기능 | 현재 구현 | Spark에서 가능한 대안 | Blaze 필요 여부 | 추천 방향 |
|---|---|---|---|---|
| 정적 React 앱 배포 | Vite `dist` | Firebase Hosting | 불필요 | 가능하면 웹 확인용으로 Hosting 사용 |
| iOS 앱 실행 | Capacitor local bundle | Firebase SDK 직접 통신 | 불필요 | 유지 |
| 자체 Node API 서버 | `server/index.mjs` | 클라이언트 SDK 직접 호출 | Functions로 옮기려면 Blaze | Spark에서는 서버 제거보다 adapter 전환 |
| `db.json` 저장 | 로컬 JSON | Firestore | 불필요 | Firestore 추천 |
| 회원가입/로그인 | 자체 hash/session | Firebase Auth | 불필요 | Auth 전환 추천 |
| 아이디 중복확인 | `/api/auth/check-username` | `usernames/{username}` read | 불필요 | Firestore 문서 방식 |
| 방 만들기 | `rooms` 배열 | Firestore `rooms` | 불필요 | 가능 |
| 미션 완료 | completion + reward write | Firestore batch | 운영 검증은 Blaze/서버 권장 | MVP 가능, 운영 전 보강 |
| 리워드 지갑 | transaction 합산 | Firestore query/합산 | 운영 검증은 Blaze/서버 권장 | MVP 가능, 악용 방지 필요 |
| 여행 사진 업로드 | local upload + dataUrl | Spark에서는 원본 저장 보류 | Cloud Storage는 Blaze 필요 | 로컬 유지 또는 Blaze 전환 후 구현 |
| 캘린더 표시 | photos query | Firestore photos metadata | 원본 이미지 저장은 Blaze 가능성 | metadata는 Spark 가능 |
| 다이어리 저장 | `diaries` 배열 | Firestore `diaries` | 불필요 | 가능 |
| 네컷사진 저장 | photoIds/filter/imageDataUrl | Firestore metadata | 이미지 저장은 Blaze 가능성 | metadata만 Spark |
| 공유 기록 | `shares` 배열 | Firestore `shares` | 불필요 | 가능 |

## 9. 주의사항

- Firebase Web App config는 클라이언트에 포함되는 공개 설정이다. 비밀키처럼 숨기는 값이 아니지만, 보안 규칙이 핵심이다.
- Spark에서 Cloud Functions를 쓰는 방식으로 현재 Node API를 그대로 배포하는 것은 추천하지 않는다. Cloud Functions 접근은 Blaze 플랜 영역이다.
- Spark에서 Cloud Storage for Firebase는 현재 제한이 크다. 공식 문서 기준 Spark 프로젝트는 Cloud Storage bucket 접근이 402/403으로 실패할 수 있다.
- Firestore에 사진 base64를 저장하는 것은 비추천이다. 문서 크기/읽기 비용/성능 문제가 생긴다.
- 리워드 적립은 금전성/보상성 데이터이므로 클라이언트 단독 쓰기 구조는 운영 전에 반드시 서버 검증 또는 매우 엄격한 rules가 필요하다.
- 기존 로컬 서버와 Firebase adapter를 동시에 둘 수 있도록 전환한다. 한 번에 `server/index.mjs`를 삭제하지 않는다.
- `.env.local` 변경 후 iOS 앱에는 반드시 `npm run build && npx cap sync ios` 후 Xcode Run이 필요하다.

## 10. 결론

Spark 기준으로 가장 현실적인 1차 목표는 `Cloud Functions 없이` Firebase Auth + Firestore로 데이터 저장을 옮기는 것이다. 사진 원본 업로드는 Spark에서 Cloud Storage를 사용할 수 없거나 실패할 가능성이 높으므로 로컬 서버 유지, 기능 보류, 또는 Blaze 전환 후 구현 중 하나를 선택해야 한다.

현재 주어진 정보는 Project ID와 Project Number뿐이다. 실제 구현을 시작하려면 Firebase Web App config 전체와 Authentication/Firestore 선택이 추가로 필요하다.

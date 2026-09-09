# MomenTrip 배포 전 정리 보고서

## 제거한 더미 데이터
- 파일: `server/data/db.json`
- 제거 내용: 개발 중 생성된 사용자 5건, 세션 5건, 방 2건, 사진 8건, 미션 완료 8건, 다이어리 2건, 리워드 거래 26건, 네컷 1건, 공유 1건을 초기화.
- 파일: `server/index.mjs`
- 제거 내용: 정적 가짜 친구 6명 제거, 가입 보상 문구에서 테스트 표현 제거, 서버 로그의 test 표현 정리.
- 파일: `src/app/components/YeohaengTab.tsx`
- 제거 내용: 하드코딩 추천 여행지 3건, 외부 샘플 이미지, 고정 평점 표시 제거.
- 파일: `src/app/components/GieongTab.tsx`
- 제거 내용: 캘린더 샘플 사진 8건, 샘플 사진 라벨 제거.
- 파일: `src/app/components/DiaryScreen.tsx`
- 제거 내용: 네컷사진 샘플 이미지 4건 제거.

## 초기화한 DB
- 백업 파일: `server/data/db.backup-before-clean.json`
- 초기화 후 각 key 상태:
  - `users`: 0
  - `sessions`: 0
  - `rooms`: 0
  - `photos`: 0
  - `missionCompletions`: 0
  - `diaries`: 0
  - `rewardTransactions`: 0
  - `fourCuts`: 0
  - `shares`: 0

## 정리한 업로드 파일
- 삭제 전 개수: 7개
- 삭제 후 개수: 0개
- 유지 파일: `server/uploads/.gitkeep`

## 수정한 UI
- 추천 여행지: 더미 카드 대신 “아직 추천 여행지가 없습니다” empty state 표시.
- 기억나유 캘린더: 샘플 사진 대신 실제 업로드 사진만 날짜에 표시.
- 네컷사진: 샘플 이미지 대신 4개 빈 슬롯 표시, 사진 4장 선택 전 공유 비활성화.
- 같이가유 친구 목록: 가짜 친구 대신 empty state 표시, 혼자 방 만들기 유지.
- 설정 메뉴: 로그아웃 외 항목은 데이터 변경 없이 “준비 중” 안내 표시.
- 회원가입: 중복확인 버튼이 실제 서버 DB를 조회하도록 변경.

## 유지한 기능
- 회원가입
- 로그인
- 로그아웃
- 친구 목록
- 방 만들기
- 여행 계획 저장
- 미션 사진 업로드
- 미션 완료 시 리워드 적립
- 여행 사진 업로드
- 캘린더 표시
- 다이어리 저장
- 네컷사진 저장 흐름
- 공유 기록 저장
- 리워드 지갑 화면

## 남은 위험 요소
- 로컬 네트워크 API: `.env.local`의 `VITE_API_BASE_URL`은 Mac의 Bonjour 호스트명을 사용하므로 운영 배포 전 HTTPS API 도메인으로 교체 필요.
- HTTP 허용 설정: iPhone 실기기 로컬 테스트용 HTTP 연결이며 App Store 배포 전 HTTPS 필요.
- 실제 DB 미적용: 현재 `server/data/db.json` 기반 로컬 JSON 저장소이므로 운영용 DB로 교체 필요.
- 파일 스토리지 미적용: 업로드 파일이 로컬 `server/uploads`에 저장되므로 운영용 스토리지/백업/삭제 정책 필요.
- npm audit 취약점: 배포 전 `npm audit` 확인 및 필요한 패키지 업데이트 필요.
- App Store 전 HTTPS 필요: API 서버 도메인, TLS 인증서, 개인정보처리방침 URL 필요.
- iOS 권한 문구 점검: Camera/Photo Library 권한 문구와 실제 사용 흐름 검수 필요.

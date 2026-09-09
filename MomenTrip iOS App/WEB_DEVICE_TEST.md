# MomenTrip 웹 테스트 절차

현재 웹은 iOS 앱과 같은 React 화면, 같은 로컬 API 서버를 사용합니다.

## 1. 서버 확인

서버는 `http://choejeong-won-ui-noteubug-2.local:4174`에서 실행되어야 합니다.

```bash
curl http://choejeong-won-ui-noteubug-2.local:4174/health
```

응답 예:

```json
{"ok":true,"service":"momentrip-api"}
```

## 2. 웹 실행

웹 앱과 API를 한 번에 수동 실행하려면 다음 명령을 사용합니다.

```bash
npm run dev:full
```

현재 Mac에는 웹 개발 서버가 LaunchAgent로도 등록되어 있습니다.

상태 확인:

```bash
launchctl print gui/$(id -u)/com.momentrip.web | grep state
```

수동 실행이 필요하면 아래 명령을 사용합니다.

```bash
cd "/Users/jungoari/Desktop/MomenTrip iOS App"
npm run web:dev
```

브라우저 접속:

```txt
http://localhost:5173
```

같은 Wi-Fi의 다른 기기에서 접속:

```txt
http://choejeong-won-ui-noteubug-2.local:5173
```

LaunchAgent 웹 서버를 끄려면:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.momentrip.web.plist
```

## 3. 웹에서 가능한 기능

- 회원가입, 로그인, 로그아웃
- 아이디 중복확인
- 여행 계획 저장 및 방 생성
- 같이가유 친구 검색, 초대코드 입장
- 미션 사진 업로드 및 포인트 적립
- 미션 사진 4장 기반 1080 × 1920 스크랩북 다이어리 PNG 생성/저장/다운로드
- 기억나유 사진 업로드/캘린더
- 다이어리 저장/공유 기록
- 포인트 지역화폐 전환 기록
- 계정관리, 문의하기, 추천 화면

## 4. 웹과 iOS의 차이

- iOS 앱의 카메라 호출은 웹에서 파일 선택 또는 브라우저 카메라 입력으로 동작합니다.
- 웹 공유는 브라우저가 `navigator.share`를 지원하면 공유 시트를 열고, 아니면 클립보드 또는 복사 안내로 대체됩니다.
- LAN 주소에서 클립보드 권한은 브라우저 정책에 따라 제한될 수 있습니다.
- 운영 배포 웹에서는 HTTP 로컬 서버가 아니라 HTTPS API 도메인이 필요합니다.

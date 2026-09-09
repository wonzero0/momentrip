# MomenTrip Xcode/iOS 테스트 절차

현재 앱은 로컬 Node API 서버와 Capacitor iOS 앱을 연결해 테스트하도록 설정되어 있습니다. IP가 바뀌어도 다시 설정할 필요가 없도록 Mac의 Bonjour 호스트명을 사용합니다.

## 1. 현재 API 주소

`.env.local`:

```txt
VITE_API_BASE_URL=http://choejeong-won-ui-noteubug-2.local:4174
```

Mac의 로컬 호스트명이 바뀐 경우에만 아래 명령으로 새 이름을 확인한 뒤 `.env.local`을 수정하고 다시 동기화합니다.

```bash
scutil --get LocalHostName
npm run cap:sync:ios
```

## 2. 서버 실행

```bash
cd "/Users/jungoari/Desktop/MomenTrip iOS App"
npm run server
```

성공 시 아래처럼 표시됩니다.

```txt
MomenTrip API server listening on http://0.0.0.0:4174
Stable iPhone API URL: http://choejeong-won-ui-noteubug-2.local:4174
iPhone API URL: http://<Mac의 현재 Wi-Fi IP>:4174
Data file: .../server/data/db.json
Upload dir: .../server/uploads
```

헬스체크:

```bash
curl http://choejeong-won-ui-noteubug-2.local:4174/health
```

## 3. iOS 빌드 준비

```bash
cd "/Users/jungoari/Desktop/MomenTrip iOS App"
npm run cap:sync:ios
npm run cap:open:ios
```

## 4. Xcode 설정

1. `ios/App/App.xcodeproj`가 열리면 실행 타깃을 iPhone Simulator 또는 연결한 iPhone으로 선택합니다.
2. 실기기 테스트 시 Mac과 iPhone이 같은 Wi-Fi에 있어야 합니다.
3. `Signing & Capabilities`에서 본인 Apple Developer Team을 선택합니다.
4. Run을 눌러 앱을 설치합니다.

## 5. 앱 테스트 순서

1. 회원가입: 새 아이디와 비밀번호를 입력하고 중복확인 후 가입합니다.
2. 로그인: 기존 계정으로 로그인합니다.
3. 여행가유: 계획을 입력하고 확인하면 서버에 여행방이 생성됩니다.
4. 같이가유: 생성된 방 목록과 초대코드를 확인합니다.
5. 미션: 카메라 버튼을 누르고 사진을 선택/촬영한 뒤 보상 버튼을 누릅니다.
6. 포인트: 적립 내역을 확인하고 지역화폐 전환을 실행합니다.
7. 기억나유: 오른쪽 위 카메라 버튼으로 사진을 추가하고 캘린더에 표시되는지 확인합니다.
8. 다이어리: 미션 사진 4장을 업로드한 뒤 `완료`를 누르면 프리미엄 스크랩북 PNG를 생성/저장/다운로드합니다.
9. 문의하기: 문의를 등록하고 최근 문의에 표시되는지 확인합니다.
10. 계정관리: 프로필 이름/코드 저장, 비밀번호 변경을 테스트합니다.

## 6. 두 기기 초대코드 테스트

조건:

- 두 iPhone 또는 iPhone Simulator가 같은 `VITE_API_BASE_URL` 서버를 바라봐야 합니다.
- 두 계정은 서로 다른 아이디로 로그인해야 합니다.
- Mac과 실기기는 같은 Wi-Fi에 있어야 합니다.

절차:

1. 기기 A에서 회원가입/로그인 후 `같이가유`에서 방을 생성합니다.
2. 기기 A의 `같이가유` 화면에서 초대코드를 확인합니다.
3. 기기 B에서 다른 계정으로 회원가입/로그인합니다.
4. 기기 B의 `같이가유`에서 `방 참여하기`를 누르고 기기 A의 초대코드를 입력합니다.
5. 기기 B 방 목록에 같은 여행방이 나타나는지 확인합니다.
6. 기기 A에서 화면을 다시 진입하거나 앱을 재실행해 멤버 수가 증가했는지 확인합니다.

현재 가능한 범위:

- 초대코드 수동 입력 입장은 실제 서버 데이터로 동작합니다.
- 초대 링크 텍스트 복사는 가능하지만 링크 클릭 자동 입장은 아직 유니버설 링크/딥링크 설정 전입니다.

## 7. 서버 반영 확인

DB 요약:

```bash
node -e "const db=require('./server/data/db.json'); console.log({ users: db.users.length, rooms: db.rooms.length, photos: db.photos.length, missions: db.missionCompletions.length, rewards: db.rewardTransactions.length, diaries: db.diaries.length, inquiries: db.inquiries?.length || 0 })"
```

업로드 파일:

```bash
find server/uploads -maxdepth 1 -type f
```

성공 기준:

- 앱에서 회원가입/로그인이 된다.
- 미션 사진 업로드 후 `server/uploads`에 이미지가 생성된다.
- `server/data/db.json`에 사진, 미션 완료, 리워드 거래가 증가한다.
- 포인트 전환 후 포인트 잔액이 차감된다.
- 기억나유 캘린더에 업로드 사진이 표시된다.
- 미션 사진 4장으로 1080 × 1920 스크랩북 다이어리 PNG가 생성되고 다운로드된다.

## 8. 중복확인 연결 오류 해결

아이디 중복확인에서 서버 연결 실패 메시지가 나오면 아래를 확인합니다.

1. Mac에서 서버가 켜져 있는지 확인합니다.

```bash
cd "/Users/jungoari/Desktop/MomenTrip iOS App"
npm run server
```

2. iPhone Safari에서 아래 주소가 열리는지 확인합니다.

```txt
http://choejeong-won-ui-noteubug-2.local:4174/health
```

3. Mac의 로컬 호스트명이 바뀌었으면 `.env.local`의 `VITE_API_BASE_URL`을 새 이름으로 바꾼 뒤 다시 동기화합니다.

```bash
scutil --get LocalHostName
npm run cap:sync:ios
```

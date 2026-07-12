# MomenTrip iPhone Device Test

이번 문서는 App Store/TestFlight 배포가 아니라, 같은 Wi-Fi에서 Mac 로컬 서버와 실제 iPhone 앱을 연결해 사진 업로드를 검증하기 위한 절차입니다.

## 1. Mac과 iPhone 네트워크

Mac과 iPhone을 같은 Wi-Fi에 연결합니다.

Mac Wi-Fi IP 확인:

```bash
ipconfig getifaddr en0
```

현재 설정된 API 주소:

```txt
VITE_API_BASE_URL=http://192.168.0.70:4174
```

IP가 바뀌면 [.env.local](</Users/jungoari/Desktop/MomenTrip iOS App/.env.local>)에서 값을 바꾼 뒤 다시 `npm run cap:sync:ios`를 실행합니다.

## 2. 백엔드 실행

터미널 1:

```bash
cd "/Users/jungoari/Desktop/MomenTrip iOS App"
npm run server
```

서버 콘솔에서 다음 정보가 보여야 합니다.

```txt
iPhone test API URL: http://<Mac-IP>:4174
Data file: .../server/data/db.json
Upload dir: .../server/uploads
```

## 3. iOS 빌드 준비

터미널 2:

```bash
cd "/Users/jungoari/Desktop/MomenTrip iOS App"
npm run cap:sync:ios
npm run cap:open:ios
```

또는 한 번에:

```bash
npm run ios:prepare
```

## 4. Xcode에서 할 일

1. 실제 iPhone을 Mac에 연결합니다.
2. Xcode 상단 실행 대상에서 연결한 iPhone을 선택합니다.
3. `App` 타깃의 `Signing & Capabilities`에서 본인 Apple Developer Team을 선택합니다.
4. Bundle Identifier가 `com.jungoari.momentrip`인지 확인합니다.
5. iPhone에서 개발자 신뢰 설정이 필요하면 허용합니다.
6. Xcode의 Run 버튼으로 앱을 설치합니다.

## 5. iPhone 앱에서 테스트

1. MomenTrip 앱을 실행합니다.
2. 회원가입 또는 로그인합니다.
3. 메인에서 여행 계획을 만들거나 하단 테스트 버튼으로 `미션` 화면에 진입합니다.
4. 미션의 카메라 버튼을 누릅니다.
5. 권한 요청이 나오면 카메라/사진 보관함 접근을 허용합니다.
6. 사진 촬영 또는 선택을 완료합니다.
7. 미션 완료 상태와 리워드 적립 상태를 확인합니다.

## 6. Mac에서 성공 확인

서버 콘솔에 다음 형태의 로그가 찍혀야 합니다.

```txt
[photo-upload] {
  userId: "...",
  label: "...",
  source: "mission-native",
  filename: "...jpg",
  uploadPath: ".../server/uploads/....jpg",
  dbFile: ".../server/data/db.json"
}
```

업로드 파일 확인:

```bash
find server/uploads -type f -maxdepth 1
```

DB 반영 확인:

```bash
node -e "const db=require('./server/data/db.json'); console.log({ photos: db.photos.length, missionCompletions: db.missionCompletions.length, rewards: db.rewardTransactions.length })"
```

성공 기준:

- 실제 iPhone 홈 화면에서 MomenTrip 앱이 실행된다.
- 앱에서 로그인할 수 있다.
- 미션 사진 선택 또는 촬영이 가능하다.
- 업로드 요청이 Mac 서버에 도달한다.
- `server/uploads`에 이미지 파일이 생성된다.
- `server/data/db.json`의 `photos` 또는 `missionCompletions` 수가 증가한다.
- 앱 화면에서 미션 완료 상태를 확인할 수 있다.

## 주의사항

- 이번 설정은 로컬 Wi-Fi 테스트용입니다.
- `capacitor.config.json`과 `Info.plist`에 개발용 HTTP 허용 설정이 들어 있습니다.
- App Store 배포 전에는 HTTPS API 서버로 전환하고 ATS 설정을 보수적으로 되돌려야 합니다.
- iPhone 앱에서는 `localhost`가 Mac이 아니라 iPhone 자신을 의미합니다. 반드시 Mac의 Wi-Fi IP를 사용해야 합니다.

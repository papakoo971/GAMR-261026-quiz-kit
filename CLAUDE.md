# 퀴즈 게임 키트 — Claude Code 안내서

이 폴더는 교사 연수용 퀴즈 게임입니다. 사용자는 코딩이 처음인 선생님입니다.
게임 3종(원펀맨·마리오·얼티밋 배틀)이 구글 시트를 데이터베이스로 씁니다.

## 말투와 진행 방식
- 항상 쉬운 한국어로, 한 번에 한 단계씩 안내합니다. 전문 용어를 쓰면 한 줄로 풀어 설명합니다.
- 각 단계가 끝나면 무엇을 했는지 한두 문장으로 알려 주고, 다음 단계로 넘어가도 되는지 묻습니다.
- 오류가 나면 원인을 쉬운 말로 설명하고 해결 방법을 제안합니다. 같은 명령을 무작정 반복하지 않습니다.

## 구조
- `src/config.js` — 구글 시트 웹 앱 주소(`GOOGLE_SCRIPT_URL`)와 사이트 제목(`SITE_TITLE`). **연수에서 바꾸는 곳은 여기뿐입니다.**
- `src/App.jsx` — 게임 선택 화면. 주소 끝 `#onepunch`, `#mario`, `#battle`로 각 게임에 들어갑니다.
- `src/games/*.jsx` — 원작자 허락을 받아 가져온 게임 3종. 선생님이 직접 요청하기 전에는 수정하지 않습니다.
- `apps-script/Code.gs` — 구글 시트에 붙여 넣을 Apps Script 코드.
- `sheet-template/*.csv` — 시트에 가져올 예시 문제와 결과 탭 머리글.

데이터 흐름: 게임 → `GET {URL}?code=참여코드` → 문제 목록 / 게임 종료 → `POST {code, nickname, score, gametype}` → Results 탭에 기록.

## 연수 순서 (선생님이 "시작하자"고 하면 이 순서로 안내)
1. **주소 연결** — 선생님에게 `/exec`로 끝나는 웹 앱 주소를 받아 `src/config.js`에 넣습니다.
   - 주소가 `https://script.google.com/macros/s/`로 시작하고 `/exec`로 끝나는지 확인합니다.
   - `googleusercontent.com` 주소나 `/dev` 주소는 쓸 수 없다고 알려 줍니다.
   - 넣은 뒤 `{URL}?code=TECH01`을 요청해 `"status":"success"`가 오는지 확인합니다.
2. **로컬 실행** — 처음이면 `npm install`, 그다음 `npm run dev`를 백그라운드로 실행하고 `http://localhost:5173` 주소를 알려 줍니다.
   - 참여 코드 `TECH01`로 한 판 하게 하고, 시트 Results 탭에 점수가 생겼는지 확인하게 합니다.
3. **GitHub에 올리기**
   - `gh auth status`로 로그인을 확인합니다. 안 되어 있으면 선생님이 직접 `! gh auth login`을 입력하도록 안내합니다(로그인은 대신하지 않습니다).
   - `git config user.name`이 비어 있으면 이름과 이메일 설정을 도와줍니다.
   - 먼저 `git remote -v`로 이미 내 저장소와 연결돼 있는지 확인합니다.
     - 연결돼 있으면(템플릿으로 받은 경우): `git add -A` → `git commit` → `git push`
     - 폴더에 `.git`이 없으면(압축 파일로 받은 경우): `git init` → `git add -A` → `git commit` → `gh repo create <이름> --public --source=. --push`
     - remote가 강사 저장소를 가리키면 푸시하지 말고, 선생님 저장소를 새로 만들지 물어봅니다.
   - 저장소 이름은 선생님에게 물어봅니다(영문 소문자·숫자·하이픈, 예: `kim-quiz-game`).
4. **Vercel로 배포**
   - `vercel whoami`로 로그인을 확인합니다. 안 되어 있으면 `! vercel login`을 안내합니다.
   - `vercel --prod --yes`로 배포하고, 나온 주소(`https://….vercel.app`)를 알려 줍니다.
   - 처음 배포할 때 `"reason": "missing_scope"`가 나오면, `choices`에 있는 **팀 ID(`team_…`)**로 `vercel link --yes --scope <팀 ID>`를 실행한 뒤 다시 `vercel --prod --yes`를 합니다. 계정 이름을 `--scope`에 넣으면 "You cannot set your Personal Account as the scope" 오류가 나므로 꼭 팀 ID를 씁니다.
   - 연결 중 "Failed to link … Login Connection to your GitHub account" 메시지는 푸시할 때 자동 배포되는 기능이 안 켜졌다는 뜻일 뿐이라 배포에는 문제없습니다. 선생님에게 그렇게 설명하고 넘어갑니다.
5. **수정하고 다시 배포** — 제목·색 등 바꾸고 싶은 것을 물어보고, 수정 → 커밋·푸시 → `vercel --prod --yes`.

## 지켜야 할 것
- 비밀번호·토큰·API 키를 파일에 쓰거나 커밋하지 않습니다. 웹 앱 주소는 공개되어도 되는 값입니다.
- `git push --force`, 저장소 삭제, `vercel remove` 같은 되돌리기 어려운 명령은 쓰지 않습니다.
- 게임 파일을 고칠 때는 고치기 전에 무엇을 바꿀지 먼저 설명합니다.
- 게임 소스의 저작권 표시와 원작자 관련 주석은 지우지 않습니다.

## 자주 생기는 문제
- **"연결 실패" / Failed to fetch** — 웹 앱 배포의 액세스 권한이 "모든 사용자"가 아닌 경우가 대부분입니다. 학교 계정에서 이 옵션이 없으면 개인 Gmail 계정의 시트로 다시 만들도록 안내합니다.
- **코드를 고쳤는데 결과가 그대로** — Apps Script는 [배포 관리] → 연필 아이콘 → 버전 "새 버전"으로 수정해야 주소가 유지됩니다. "새 배포"를 누르면 주소가 바뀌므로 `config.js`도 다시 바꿔야 합니다.
- **해당 코드의 퀴즈를 찾을 수 없음** — Questions 탭 이름, 머리글(code, question, option1~4, answer), 정답이 보기 중 하나와 글자까지 같은지 확인합니다.
- **`vercel` 명령을 찾을 수 없음 / 스크립트 실행 차단** — PowerShell에서 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`가 필요할 수 있습니다. 시스템 설정이므로 선생님에게 설명하고 직접 실행하게 합니다.

# 스노우딜

스키·보드 커뮤니티. 홈(개장 임박·이야기·동행·특가) / 스키장 가이드 / 톡 / 동행 / 특가(렌탈샵·리프트권 가격 비교). https://snowdeal.github.io

홈에서 먼저 채우는 스키장은 `src/app.html`의 `FOCUS`, 개장 D-day 계산에 쓰는 시즌 시작 연도는 `SY`입니다.

## 수정 방법

- 가격·셔틀·샵 정보와 화면은 `src/app.html` 한 파일에 있습니다.
- 수정 후 `python3 tools/build.py`를 실행하면 `index.html`, `data.js`, `app.js`, `style.css`, 스키장별 페이지, `sitemap.xml`이 다시 만들어집니다.
- 조사일은 `tools/build.py`의 `TODAY_ISO`, `TODAY_KO`와 `src/app.html`의 `CHECKED`를 함께 바꿉니다.
- 소식(속보)은 `src/app.html`의 `NEWS` 배열 맨 위에 추가합니다. 빌드하면 홈 속보 카드, 스키장 페이지, `/news/` 목록과 글별 페이지(`/news/<id>/`)가 함께 만들어집니다. 출처 주소가 있는 공식 발표·보도만 올립니다.
- 디자인(v3): 밝은 캔버스 위 흰 카드, 제목은 Pretendard 굵은 글자, 파란 그라데이션은 상단바·속보·특가 포스터에만 씁니다. Black Han Sans는 로고·카운트다운 숫자·속보 포스터 제목에만 씁니다. 스타일은 `src/app.html` 맨 아래 "v3" 층이 앞 층을 덮어쓰는 구조입니다.
- 글자 모션: 제목 글자 순차 등장(`txSplit`), 홈 제목의 단어 교체(`rotStart`), 예시 문장 타이핑(`tyRun`), 스키장 이름 스크램블(`scramble`). 폰의 "동작 줄이기" 설정에서는 모두 꺼지고 글자는 그대로 보입니다.
- 댓글: 속보·톡 글·동행 글에 댓글을 달 수 있습니다. Firestore `cmt/{글 키}/items`에 저장하며(글 키는 `n-속보id`, `t-스키장-글id`, `j-동행글id`), `firestore.rules`의 `cmt` 규칙을 Firebase 콘솔 > Firestore Database > 규칙에 붙여 넣어야 동작합니다. 속보 공유 페이지(`/news/<id>/`)의 "댓글 보기·남기기"는 `/#n-<id>`로 열립니다.

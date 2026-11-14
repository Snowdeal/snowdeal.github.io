# 스노우딜

스키·보드 커뮤니티. 홈(개장 임박·이야기·동행·특가) / 스키장 가이드 / 톡 / 동행 / 특가(렌탈샵·리프트권 가격 비교). https://snowdeal.github.io

홈에서 먼저 채우는 스키장은 `src/app.html`의 `FOCUS`, 개장 D-day 계산에 쓰는 시즌 시작 연도는 `SY`입니다.

## 수정 방법

- 가격·셔틀·샵 정보와 화면은 `src/app.html` 한 파일에 있습니다.
- 수정 후 `python3 tools/build.py`를 실행하면 `index.html`, `data.js`, `app.js`, `style.css`, 스키장별 페이지, `sitemap.xml`이 다시 만들어집니다.
- 조사일은 `tools/build.py`의 `TODAY_ISO`, `TODAY_KO`와 `src/app.html`의 `CHECKED`를 함께 바꿉니다.
- 소식(속보)은 `src/app.html`의 `NEWS` 배열 맨 위에 추가합니다. 빌드하면 홈 속보 카드, 스키장 페이지, `/news/` 목록과 글별 페이지(`/news/<id>/`)가 함께 만들어집니다. 출처 주소가 있는 공식 발표·보도만 올립니다.

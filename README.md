# 스노우딜

전국 스키장 렌탈샵·리프트권 가격 비교 사이트. https://snowdeal.github.io

## 수정 방법

- 가격·셔틀·샵 정보와 화면은 `src/app.html` 한 파일에 있습니다.
- 수정 후 `python3 tools/build.py`를 실행하면 `index.html`, `data.js`, `app.js`, `style.css`, 스키장별 페이지, `sitemap.xml`이 다시 만들어집니다.
- 조사일은 `tools/build.py`의 `TODAY_ISO`, `TODAY_KO`와 `src/app.html`의 `CHECKED`를 함께 바꿉니다.

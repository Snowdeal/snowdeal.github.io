#!/usr/bin/env python3
"""스노우딜 사이트 빌드: src/app.html + data.js -> index.html, 스키장별 정적 페이지, sitemap."""
import json, re, subprocess, pathlib, html
ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://snowdeal.github.io"
TODAY_ISO, TODAY_KO = "2026-11-10", "2026년 11월 10일"
src = (ROOT / "src/app.html").read_text(encoding="utf-8").split("\n")
style = "\n".join(src[src.index("<style>") + 1: src.index("</style>")])
body = "\n".join(src[src.index('<div class="app">'): src.index("<script>")])
js = src[src.index("<script>") + 1: src.index("</script>")]
cut = next(i for i, l in enumerate(js) if l.startswith("const $="))
data_js, app_js = "\n".join(js[:cut]), "\n".join(js[cut:])
(ROOT / "data.js").write_text(data_js + "\n", encoding="utf-8")
(ROOT / "app.js").write_text(app_js + "\n", encoding="utf-8")
(ROOT / "style.css").write_text(
    "body{margin:0}img{max-width:100%}[hidden]{display:none!important}\n" + style + "\n", encoding="utf-8")
D = json.loads(subprocess.check_output(["node", "-e",
    data_js + ";console.log(JSON.stringify({RESORTS,DATA,SHUTTLE,DIR,OFFICIAL,SLUG}))"]))

def head(title, desc, path):
    e = html.escape
    return f'''<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
<link rel="canonical" href="{BASE}{path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="스노우딜">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{BASE}{path}">
<meta property="og:image" content="{BASE}/og.png">
<meta name="naver-site-verification" content="d333804e6ecbe52e15f939a35f0522378cf165fb">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#1f97ec">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon-192.png">
<link rel="apple-touch-icon" href="/icon-192.png">
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap">
<link rel="stylesheet" href="/style.css">
</head>
<body>
'''
NAVER_WA = "2f20872af9da4a"  # 네이버 애널리틱스 발급 ID
ANALYTICS = f'''<script src="https://wcs.pstatic.net/wcslog.js"></script>
<script>if(!wcs_add) var wcs_add={{}};wcs_add["wa"]="{NAVER_WA}";if(window.wcs){{wcs_do();}}</script>
'''
fin = lambda h: h.replace("</body>", ANALYTICS + "</body>")
won = lambda n: f"{n:,}원"
SC = {"lift": "리프트권만", "gear": "리프트 + 장비 렌탈", "wear": "리프트 + 장비 + 의류"}

# 메인
names = ", ".join(r[0] for r in D["RESORTS"][:6])
idx = head("스노우딜 | 전국 스키장 렌탈샵·리프트권 가격 비교",
           f"{names} 등 전국 스키장의 렌탈샵 패키지와 리프트권 가격을 인원·요일·이용시간 조건으로 비교합니다. {TODAY_KO} 조사.", "/")
links = "".join(f'<a href="/{D["SLUG"][n]}/">{n} 렌탈샵 가격</a> ' for n, _ in D["RESORTS"])
idx += body + f'\n<noscript><div class="gut"><h1>전국 스키장 렌탈샵·리프트권 가격 비교</h1><p>{links}</p></div></noscript>\n'
idx += f'<nav class="gut seo-links" aria-label="스키장별 가격">{links}</nav>\n<script src="/data.js"></script>\n<script src="/app.js"></script>\n</body>\n</html>\n'
(ROOT / "index.html").write_text(fin(idx), encoding="utf-8")

# 스키장별
urls = ["/"]
for n, _ in D["RESORTS"]:
    slug = D["SLUG"][n]; rows = [d for d in D["DATA"] if d["resort"] == n]
    shops = sorted({d["shop"] for d in rows if not d.get("off")})
    low = min((d for d in rows if d["scope"] == "gear"), key=lambda d: d["wd"], default=None)
    title = f"{n} 렌탈샵 가격 비교 26/27 시즌 | 스노우딜"
    if rows:
        desc = f"{n} 스키장 렌탈샵 {len(shops)}곳의 리프트권·장비 렌탈 패키지 가격표." + (
            f" 리프트+장비 주중 최저 {won(low['wd'])}{'~' if low.get('from') else ''}." if low else "") + f" {TODAY_KO} 확인."
    else:
        desc = f"{n} 스키장 렌탈샵·리프트권 가격을 조사하고 있습니다. 확인된 렌탈샵 정보와 셔틀 안내."
    h = head(title, desc, f"/{slug}/")
    h += f'<div class="app page"><div class="bar gut"><a class="logo" href="/"><img src="/icon-192.png" alt="" width="32" height="32">스노우딜</a></div>\n<main class="gut">\n'
    h += f'<h1>{n} 렌탈샵 가격 비교</h1>\n<p class="lead">{html.escape(desc)}</p>\n'
    h += f'<p><a class="btn" href="/#q-{slug}-p2-wd-gear-hany-car">내 인원·요일로 최저가 계산하기</a></p>\n'
    for sc, label in SC.items():
        rs = sorted((d for d in rows if d["scope"] == sc), key=lambda d: (d["h"], d["wd"]))
        if not rs: continue
        h += f'<h2>{n} {label} 가격</h2>\n<div class="tw"><table><tr><th>렌탈샵</th><th>이용</th><th>주중</th><th>주말</th><th>기준</th></tr>\n'
        for d in rs:
            t = "~" if d.get("from") else ""
            se = {"26/27": "26/27", "25/26": "25/26 가격", "?": "시즌 미표기"}[d["season"]]
            if d.get("eb"): se += " · 얼리버드"
            nm = f'<a href="{html.escape(d["url"])}" rel="noopener nofollow" target="_blank">{html.escape(d["shop"])}</a>'
            h += f'<tr><td>{nm}</td><td>{str(d["h"])+"시간" if d["h"] else "미표기"}</td><td>{won(d["wd"])}{t}</td><td>{won(d["we"])}{t}</td><td>{se}</td></tr>\n'
        h += '</table></div>\n'
        notes = sorted({f'{d["shop"]}: {d["note"]}' for d in rs if d.get("note")})
        if notes: h += '<ul class="notes">' + "".join(f"<li>{html.escape(x)}</li>" for x in notes) + "</ul>\n"
    if not rows:
        h += f'<p class="pending">{n} 스키장은 렌탈샵들이 가격표를 숫자로 공개하지 않아 아직 조사 중입니다. 가격표를 알고 계시면 제보해 주세요.</p>\n'
    o = next((o for o in D["OFFICIAL"] if o["r"] == n), None)
    if o:
        h += f'<h2>{n} 리프트권 정상가</h2>\n<p class="lead">{html.escape(o["s"])}</p>\n<div class="tw"><table><tr><th>권종</th><th>주중</th><th>주말</th></tr>\n'
        h += "".join(f"<tr><td>{r[0]}</td><td>{won(r[1])}</td><td>{won(r[2])}</td></tr>\n" for r in o["rows"]) + "</table></div>\n"
    s = D["SHUTTLE"].get(n)
    if s:
        h += f'<h2>{n} 서울 출발 셔틀버스</h2>\n<p>' + (f'왕복 {won(s["rt"])} (편도 {won(s["ow"])}). ' if s.get("rt") else "요금 미확인. ")
        h += (f'탑승: {html.escape(s["from"])}. ' if s.get("from") else "") + html.escape(s["st"]) + f'. <a href="{html.escape(s["url"])}" rel="noopener nofollow" target="_blank">출처</a></p>\n'
    dr = D["DIR"].get(n) or []
    if dr:
        h += f'<h2>가격표를 확인하지 못한 {n} 렌탈샵</h2>\n<ul class="notes">' + "".join(
            f'<li><a href="{html.escape(x[2])}" rel="noopener nofollow" target="_blank">{html.escape(x[0])}</a>: {html.escape(x[1])}</li>' for x in dr) + "</ul>\n"
    others = " ".join(f'<a href="/{D["SLUG"][m]}/">{m}</a>' for m, _ in D["RESORTS"] if m != n)
    h += f'<h2>다른 스키장 가격</h2>\n<p class="seo-links">{others}</p>\n'
    h += f'<p class="note">{TODAY_KO} 조사 기준입니다. 각 렌탈샵·리조트 홈페이지와 보도자료에 공개된 가격을 옮겼으며, "~"는 최저 시작가입니다. 예약 전 해당 샵에 반드시 확인하세요. 가격 제보와 렌탈샵 등록 문의는 <a href="https://open.kakao.com/o/sglgUtWi" rel="noopener" target="_blank">카카오톡 오픈채팅</a>이나 이메일(<a href="mailto:apap1685@gmail.com">apap1685@gmail.com</a>)로 보내 주세요.</p>\n</main></div>\n</body>\n</html>\n'
    (ROOT / slug).mkdir(exist_ok=True); (ROOT / slug / "index.html").write_text(fin(h), encoding="utf-8")
    urls.append(f"/{slug}/")

(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
    f"<url><loc>{BASE}{u}</loc><lastmod>{TODAY_ISO}</lastmod></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n", encoding="utf-8")
(ROOT / "manifest.webmanifest").write_text(json.dumps({
    "name": "스노우딜", "short_name": "스노우딜", "description": "전국 스키장 렌탈샵·리프트권 가격 비교",
    "start_url": "/", "scope": "/", "display": "standalone", "background_color": "#1287e0", "theme_color": "#1f97ec", "lang": "ko",
    "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}]}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("built", len(urls), "pages")

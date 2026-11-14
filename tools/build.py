#!/usr/bin/env python3
"""스노우딜 사이트 빌드: src/app.html + data.js -> index.html, 스키장별 정적 페이지, sitemap."""
import json, re, subprocess, pathlib, html
ROOT = pathlib.Path(__file__).resolve().parent.parent
BASE = "https://snowdeal.github.io"
TODAY_ISO, TODAY_KO = "2026-11-12", "2026년 11월 12일"
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
    data_js + ";console.log(JSON.stringify({RESORTS,DATA,SHUTTLE,DIR,OFFICIAL,SLUG,OPEN,GUIDE,REGION,NEWS}))"]))

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

BAR = '<div class="app page"><div class="bar gut"><a class="logo" href="/" aria-label="스노우딜 홈"><span class="wm">SN<svg viewBox="-12 -12 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M0-10V10M-8.66-5L8.66 5M-8.66 5L8.66-5" stroke-width="3"/><path d="M-3.2-8.2L0-5.4 3.2-8.2M-3.2 8.2L0 5.4 3.2 8.2M-8.7-1.3L-6.3-3.3-9.3-4.9M8.7 1.3L6.3 3.3 9.3 4.9M-8.7 1.3L-6.3 3.3-9.3 4.9M8.7-1.3L6.3-3.3 9.3-4.9" stroke-width="2.1"/></svg>W<em>DEAL</em></span></a></div>\n<main class="gut">\n'
nw_title = lambda x: x["h"].replace("*", "").replace("\n", " ")
def nw_date(d):
    y, m, dd = d.split("-"); return f"{int(m)}월 {int(dd)}일"
NEWS = sorted(D["NEWS"], key=lambda x: x["d"], reverse=True)

# 메인
names = ", ".join(r[0] for r in D["RESORTS"][:6])
idx = head("스노우딜 | 스키·보드 커뮤니티 · 스키장 정보 · 동행 · 최저가",
           f"{names} 등 전국 스키장의 개장 소식과 다녀온 사람들의 이야기, 같이 갈 사람 구하기, 슬로프·셔틀·주차 가이드, 렌탈샵·리프트권 최저가를 한곳에 모았습니다. {TODAY_KO} 확인.", "/")
links = "".join(f'<a href="/{D["SLUG"][n]}/">{n} 스키장 정보·가격</a> ' for n, _ in D["RESORTS"])
links += '<a href="/news/">스키장 소식</a> '
idx += body + f'\n<noscript><div class="gut"><h1>전국 스키장 정보와 렌탈샵·리프트권 최저가</h1><p>{links}</p></div></noscript>\n'
idx += f'<nav class="gut seo-links" aria-label="스키장별 정보">{links}</nav>\n<script src="/data.js"></script>\n<script src="/app.js"></script>\n</body>\n</html>\n'
(ROOT / "index.html").write_text(fin(idx), encoding="utf-8")

# 스키장별
urls = ["/"]
for n, _ in D["RESORTS"]:
    slug = D["SLUG"][n]; rows = [d for d in D["DATA"] if d["resort"] == n]
    shops = sorted({d["shop"] for d in rows if not d.get("off")})
    low = min((d for d in rows if d["scope"] == "gear"), key=lambda d: d["wd"], default=None)
    g = D["GUIDE"].get(n); reg = D["REGION"][n]
    title = f"{n} 스키장 정보·렌탈샵 가격 26/27 시즌 | 스노우딜"
    if rows:
        desc = (f"{n} 스키장 슬로프·운영 시간·가는 법 가이드와 " if g else f"{n} 스키장 ") + f"렌탈샵 {len(shops)}곳의 리프트권·장비 렌탈 패키지 가격표." + (
            f" 리프트+장비 주중 최저 {won(low['wd'])}{'~' if low.get('from') else ''}." if low else "") + f" {TODAY_KO} 확인."
    else:
        desc = f"{n} 스키장 26/27 시즌 개장 일정과 렌탈샵·리프트권 요금 안내. 요금은 공개되는 대로 업데이트합니다."
    h = head(title, desc, f"/{slug}/")
    h += BAR
    h += f'<h1>{n} 스키장 정보와 렌탈샵 가격</h1>\n<p class="lead">{reg}{" · " + g["from"] if g and g["from"] else ""}. {html.escape(desc)}</p>\n'
    h += f'<p><a class="btn" href="/#q-{slug}-p2-wd-gear-hany-car">내 인원·요일로 최저가 계산하기</a> <a class="btn" href="/#g-{slug}">{n} 가이드·톡 보기</a></p>\n'
    rn = [x for x in NEWS if x["r"] == n]
    if rn:
        h += f'<h2>{n} 최근 소식</h2>\n<ul class="notes">' + "".join(
            f'<li><a href="/news/{x["id"]}/">{html.escape(nw_title(x))}</a> ({nw_date(x["d"])}): {html.escape(x["s"])}</li>' for x in rn) + "</ul>\n"
    if g:
        h += '<div class="facts">' + "".join(f"<div><span>{html.escape(a)}</span><b>{html.escape(b)}</b></div>" for a, b in g["facts"]) + "</div>\n"
        for x in g["secs"]:
            h += f'<div class="gsec"><h2>{n} {html.escape(x["t"])}</h2>\n'
            if x.get("tb"):
                h += '<div class="tw"><table><tr>' + "".join(f"<th>{c}</th>" for c in x["tb"]["h"]) + "</tr>" + "".join(
                    "<tr>" + "".join(f"<td>{html.escape(c)}</td>" for c in r) + "</tr>" for r in x["tb"]["r"]) + "</table></div>\n"
            if x.get("li"):
                h += "<ul>" + "".join(f"<li>{html.escape(c)}</li>" for c in x["li"]) + "</ul>\n"
            h += "</div>\n"
        h += f'<p class="gsrc">{html.escape(g["base"])}. 출처: ' + ", ".join(
            f'<a href="{html.escape(u)}" rel="noopener nofollow" target="_blank">{html.escape(t)}</a>' for t, u in g["src"]) + ". 운영 내용은 시즌마다 바뀌니 방문 전 리조트 공지를 확인하세요.</p>\n"
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
        h += f'<p class="pending">{n} 스키장과 렌탈샵의 26/27 시즌 요금은 아직 공개 전입니다. 공개되는 대로 이 페이지에 바로 올립니다.</p>\n'
    op = D["OPEN"].get(n) or {}
    h += f'<h2>{n} 26/27 개장 일정</h2>\n<p>' + (f'{op["d"]} ({op["src"]}). ' if op.get("d") else "26/27 개장일은 아직 발표되지 않았습니다. ") + (f'지난 시즌에는 {op["last"]}에 개장했습니다. ' if op.get("last") else "") + "개장일은 기온과 제설 상황에 따라 바뀔 수 있습니다.</p>\n"
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
    h += f'<h2>다른 스키장</h2>\n<p class="seo-links">{others}</p>\n'
    h += f'<p class="note">{TODAY_KO} 조사 기준입니다. 각 렌탈샵·리조트 홈페이지와 보도자료에 공개된 가격을 옮겼으며, "~"는 최저 시작가입니다. 예약 전 해당 샵에 반드시 확인하세요. 가격 제보와 렌탈샵 등록 문의는 <a href="https://open.kakao.com/o/sglgUtWi" rel="noopener" target="_blank">카카오톡 오픈채팅</a>이나 이메일(<a href="mailto:apap1685@gmail.com">apap1685@gmail.com</a>)로 보내 주세요.</p>\n</main></div>\n</body>\n</html>\n'
    (ROOT / slug).mkdir(exist_ok=True); (ROOT / slug / "index.html").write_text(fin(h), encoding="utf-8")
    urls.append(f"/{slug}/")

# 소식(속보): 목록과 글별 페이지. 카톡·커뮤니티에 붙여넣을 수 있는 주소가 된다
nh = head("스키장 소식 모음 | 스노우딜", "스키장 개장일, 리프트권 요금, 운영 시간 변경, 특가와 셔틀 소식을 리조트 발표와 보도 기준으로 짧게 정리합니다.", "/news/")
nh += BAR + '<h1>스키장 소식</h1>\n<p class="lead">리조트 공식 발표와 보도를 짧게 요약합니다. 바뀔 수 있으니 방문 전 공식 안내를 확인하세요.</p>\n'
for x in NEWS:
    nh += f'<div class="gsec"><h2><a href="/news/{x["id"]}/">{html.escape(nw_title(x))}</a></h2>\n<p>{html.escape(x["s"])}</p>\n<p class="gsrc">{x["k"]} · {x["r"]} · {nw_date(x["d"])} 확인</p></div>\n'
nh += '<p><a class="btn" href="/">스노우딜 홈</a></p>\n</main></div>\n</body>\n</html>\n'
(ROOT / "news").mkdir(exist_ok=True); (ROOT / "news" / "index.html").write_text(fin(nh), encoding="utf-8")
urls.append("/news/")
for x in NEWS:
    t = nw_title(x); rs = D["SLUG"][x["r"]]
    h = head(f"{t} | 스노우딜 소식", x["s"], f'/news/{x["id"]}/') + BAR
    h += f'<p class="gsrc" style="margin-top:18px">{x["k"]} · {x["r"]} · {nw_date(x["d"])} 확인</p>\n<h1>{html.escape(t)}</h1>\n<p class="lead">{html.escape(x["s"])}</p>\n'
    h += '<ul class="nwl">' + "".join(f"<li>{html.escape(c)}</li>" for c in x["li"]) + "</ul>\n"
    h += f'<p class="gsrc">출처: <a href="{html.escape(x["src"][1])}" rel="noopener nofollow" target="_blank">{html.escape(x["src"][0])}</a>. 리조트 발표와 보도를 요약한 글입니다. 바뀔 수 있으니 방문 전 공식 안내를 확인하세요.</p>\n'
    h += f'<p><a class="btn" href="/#g-{rs}">{x["r"]} 가이드·톡 보기</a> <a class="btn" href="/{rs}/">{x["r"]} 요금표</a> <a class="btn" href="/">스노우딜 홈</a></p>\n'
    more = [y for y in NEWS if y["id"] != x["id"]]
    if more:
        h += '<h2>다른 소식</h2>\n<ul class="notes">' + "".join(f'<li><a href="/news/{y["id"]}/">{html.escape(nw_title(y))}</a> ({y["r"]}, {nw_date(y["d"])})</li>' for y in more) + "</ul>\n"
    h += '</main></div>\n</body>\n</html>\n'
    (ROOT / "news" / x["id"]).mkdir(parents=True, exist_ok=True); (ROOT / "news" / x["id"] / "index.html").write_text(fin(h), encoding="utf-8")
    urls.append(f'/news/{x["id"]}/')

(ROOT / "sitemap.xml").write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(
    f"<url><loc>{BASE}{u}</loc><lastmod>{TODAY_ISO}</lastmod></url>\n" for u in urls) + "</urlset>\n", encoding="utf-8")
(ROOT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n", encoding="utf-8")
(ROOT / "manifest.webmanifest").write_text(json.dumps({
    "name": "스노우딜", "short_name": "스노우딜", "description": "전국 스키장 정보·렌탈샵 리프트권 최저가·동행",
    "start_url": "/", "scope": "/", "display": "standalone", "background_color": "#1287e0", "theme_color": "#1f97ec", "lang": "ko",
    "icons": [{"src": "/icon-192.png", "sizes": "192x192", "type": "image/png"},
              {"src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"}]}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print("built", len(urls), "pages")

#!/usr/bin/env python3
"""Extract the original content of sbbz-weimar.de into structured JSON.

Usage:
  python3 tools/extract.py fetch  <raw_dir>              # download all pages (polite, 0.25 s delay)
  python3 tools/extract.py build  <raw_dir> content/     # raw HTML -> content/pages.json + content/home.json

Nothing is rewritten editorially: the script only removes CMS layout wrappers and
maps known REDAXO modules (accordion, gallery, team box, teaser, termin) onto
semantic markup used by the new design system.
"""
import json, os, re, sys, time, warnings
from urllib.parse import urljoin, urlparse, parse_qs, quote

from bs4 import BeautifulSoup, Comment, NavigableString, MarkupResemblesLocatorWarning
warnings.filterwarnings("ignore", category=MarkupResemblesLocatorWarning)

ORIGIN = "https://sbbz-weimar.de"
ALLOWED = {
    "p", "h2", "h3", "h4", "h5", "ul", "ol", "li", "a", "strong", "em", "b", "i", "br", "hr",
    "table", "thead", "tbody", "tr", "th", "td", "caption", "colgroup", "col", "img", "figure",
    "figcaption", "video", "source", "details", "summary", "div", "section", "article", "time",
    "span", "blockquote", "sup", "sub", "button", "nav",
}
KEEP_ATTR = {"href", "src", "alt", "title", "colspan", "rowspan", "controls", "poster", "type",
             "datetime", "class", "data-mail", "data-type", "data-filter", "aria-pressed",
             "loading", "width", "height", "target", "rel", "aria-label", "data-pswp"}
MY_CLASSES = {"news-card", "news-grid", "event", "event--link", "event__date", "event__title",
              "event__text", "event__icon", "gallery", "gallery__item", "person", "person-grid",
              "inline-img", "inline-img--right", "inline-img--left", "course-filter", "course-grid",
              "course-card", "filter-bar", "filter-btn", "js-mail", "doc-link", "contact-form-slot",
              "col-2", "lead-box", "video-frame", "accordion", "events", "news-card__date",
              "news-card__body", "news-card__img", "external", "accordion__body", "col", "col-2--even"}


def rot13(s):
    out = []
    for ch in s:
        if "a" <= ch <= "z":
            out.append(chr((ord(ch) - 97 + 13) % 26 + 97))
        elif "A" <= ch <= "Z":
            out.append(chr((ord(ch) - 65 + 13) % 26 + 65))
        else:
            out.append(ch)
    return "".join(out)


def page_file(raw_dir, path):
    return os.path.join(raw_dir, (path.strip("/").replace("/", "__") or "index") + ".html")


def abs_media(src):
    """Media stays on the original server (prototype); return absolute URL."""
    if not src:
        return src
    src = src.strip()
    if src.startswith("index.php"):
        src = "/" + src
    if src.startswith("//"):
        return "https:" + src
    if src.startswith("/"):
        return ORIGIN + src
    return src


def media_file(src):
    q = parse_qs(urlparse(src).query)
    if "rex_media_file" in q:
        return q["rex_media_file"][0]
    return src.rsplit("/", 1)[-1]


def is_media_href(path):
    return bool(re.search(r"\.(pdf|docx?|xlsx?|pptx?|zip|mp4|jpe?g|png|webp|gif)(\?|$)", path, re.I)) \
        or path.startswith("/media/") or "rex_media_file" in path


def fix_href(href, cur):
    href = (href or "").strip()
    if not href or href.startswith(("#", "tel:", "mailto:")):
        return href
    m = re.match(r"javascript:decryptUnicorn\((.*)\)", href)
    if m:
        return "mail:" + m.group(1)
    if href.startswith("javascript:"):
        return ""
    u = urljoin(ORIGIN + cur, href)
    p = urlparse(u)
    if p.netloc in ("sbbz-weimar.de", "www.sbbz-weimar.de"):
        path = p.path + (("?" + p.query) if p.query else "")
        if is_media_href(path):
            return ORIGIN + path
        return path + (("#" + p.fragment) if p.fragment else "")
    return u


def decode_mail(code):
    return rot13(code).replace("|", "@")


def clean(node, cur, soup):
    """Generic sanitising after module mapping."""
    for c in node.find_all(string=lambda t: isinstance(t, Comment)):
        c.extract()
    for el in list(node.find_all(True)):
        if el.parent is None:
            continue
        if el.name in ("script", "style", "noscript", "input", "textarea", "select", "label",
                       "form", "fieldset", "legend", "colgroup", "col", "wbr"):
            el.decompose()
            continue
        if el.name == "h1":
            el.name = "h2"
        if el.name == "h6":
            el.name = "h5"
        if el.name not in ALLOWED:
            el.unwrap()
            continue
        cls = [c for c in el.get("class", []) if c in MY_CLASSES]
        attrs = {}
        for k, v in el.attrs.items():
            if k in KEEP_ATTR and k != "class":
                attrs[k] = v
        if cls:
            attrs["class"] = cls
        el.attrs = attrs
        if el.name == "a":
            href = fix_href(el.get("href"), cur)
            if href.startswith("mail:"):
                code = href[5:]
                el.attrs = {"href": "#", "class": ["js-mail"], "data-mail": code}
                el.clear()
                addr = decode_mail(code)
                el.append(addr.replace("@", " [at] "))
            elif not href:
                el.unwrap()
                continue
            else:
                el["href"] = href
                if href.startswith("http") and not href.startswith(ORIGIN):
                    el["rel"] = "noopener noreferrer"
                    el["target"] = "_blank"
                    el["class"] = list(set(el.get("class", []) + ["external"]))
                if href.startswith(ORIGIN) and re.search(r"\.pdf", href, re.I):
                    el["class"] = list(set(el.get("class", []) + ["doc-link"]))
        if el.name in ("img", "source"):
            if el.get("src"):
                el["src"] = abs_media(el["src"])
            if el.name == "img":
                el["loading"] = "lazy"
                if "alt" not in el.attrs:
                    el["alt"] = ""
        if el.name == "video" and el.get("poster"):
            el["poster"] = abs_media(el["poster"])
        if el.name in ("div", "span", "section"):
            if not el.get("class"):
                el.unwrap()
                continue
    # remove empty paragraphs / headings
    for el in node.find_all(["p", "h2", "h3", "h4", "h5", "strong", "li"]):
        if not el.get_text(strip=True) and not el.find(["img", "video", "br"]):
            el.decompose()
    return node


def text_of(el):
    return re.sub(r"[ \t ]+", " ", el.get_text(" ", strip=True)) if el else ""


def map_modules(g, cur, soup):
    data = {}
    # remove known noise
    for sel in ["#breadcrumb", ".simple-translate-button", ".simple-translate-panel",
                "#schulform", ".partner-logos"]:
        for e in g.select(sel):
            e.decompose()
    h = g.select_one(".headline.h1")
    if h:
        data["h1"] = text_of(h)
        h.decompose()

    # contact form -> slot rendered by the template (same fields as yform)
    for f in g.find_all("form"):
        if "rex-yform" in (f.get("action") or "") or f.get("id", "").startswith("formular"):
            slot = soup.new_tag("div", attrs={"class": ["contact-form-slot"]})
            # keep the original form intro (required hint) out; template supplies labels
            wrapper = f
            while wrapper.parent is not None and wrapper.parent != g and wrapper.parent.name == "div" \
                    and "rex-yform" in " ".join(wrapper.parent.get("class", [])):
                wrapper = wrapper.parent
            wrapper.replace_with(slot)
            data["hasContactForm"] = True

    # course filter (Berufliche/Schulische Bildung)
    berufe = g.find(id="berufe")
    if berufe:
        buttons = [(b.get("data-value"), text_of(b)) for b in berufe.select(".filter-group button")]
        cards = []
        for fig in berufe.select(".js-shuffle figure"):
            a = fig.find("a")
            img = fig.find("img")
            cards.append({
                "href": fix_href(a.get("href"), cur),
                "title": text_of(fig.find("figcaption")),
                "type": fig.get("data-schulform"),
                "img": abs_media(img.get("src")) if img else None,
            })
        h2 = berufe.select_one(".headline h2")
        data["courseFilter"] = {"heading": text_of(h2), "filters": buttons, "cards": cards}
        slot = soup.new_tag("div", attrs={"class": ["course-filter"]})
        berufe.replace_with(slot)

    # Aktivitäten teaser -> news cards (collected separately too)
    teasers = []
    for t in g.select(".aktivitaeten-teaser"):
        a = t.find("a")
        img = t.find("img")
        teasers.append({
            "date": text_of(t.select_one(".aktivitaeten-teaser-datum")),
            "href": fix_href(a.get("href"), cur) if a else None,
            "title": text_of(t.find("h3")),
            "text": text_of(t.select_one(".aktivitaeten-teaser-text p")),
            "img": abs_media(img.get("src")) if img else None,
            "alt": img.get("alt", "") if img else "",
        })
    if teasers:
        data["news"] = teasers
        lists = g.select(".aktivitaeten-liste")
        first = True
        for l in lists:
            if first:
                l.replace_with(soup.new_tag("div", attrs={"class": ["news-grid"]}))
                first = False
            else:
                l.decompose()
        for t in g.select(".aktivitaeten-teaser"):
            t.decompose()

    # Termine
    events = []
    for t in g.select(".termin"):
        a = t.find("a")
        tm = t.find("time")
        img = t.select_one(".termin-icon img")
        icon = [c for c in (t.select_one(".termin-icon") or {}).get("class", []) if c != "termin-icon"] if t.select_one(".termin-icon") else []
        text_el = t.select_one(".termin-text")
        if text_el:
            for m in text_el.select(".termin-more"):
                m.decompose()
        events.append({
            "href": fix_href(a.get("href"), cur) if a else None,
            "date": text_of(tm),
            "datetime": tm.get("data-time", "").replace(".", "-") if tm else None,
            "title": text_of(t.select_one(".termin-headline")),
            "html": str(clean(BeautifulSoup(text_el.decode_contents(), "html.parser"), cur, soup)) if text_el else "",
            "icon": icon[0] if icon else None,
            "img": abs_media(img.get("src")) if img else None,
        })
    if events:
        data["events"] = events
        ts = g.select(".termin")
        ts[0].replace_with(soup.new_tag("div", attrs={"class": ["events"]}))
        for t in ts[1:]:
            t.decompose()

    # accordions -> details/summary
    for acc in g.select(".accordion_toggler_1"):
        h3 = acc.find("h3")
        content = acc.select_one(".accordion_content")
        d = soup.new_tag("details", attrs={"class": ["accordion"]})
        s = soup.new_tag("summary")
        s.string = text_of(h3)
        d.append(s)
        if content:
            inner = soup.new_tag("div")
            for c in list(content.contents):
                inner.append(c.extract())
            inner.attrs = {"class": ["lead-box"]}
            d.append(inner)
        acc.replace_with(d)
    for acc in g.select(".accordion"):
        if acc.name == "div":
            acc.unwrap()

    # galleries
    for gal in g.select(".galerie, .macy-container"):
        if gal.parent is None:
            continue
        box = soup.new_tag("div", attrs={"class": ["gallery"]})
        for fig in gal.find_all("figure"):
            a = fig.find("a")
            img = fig.find("img")
            if not img:
                continue
            full = fix_href(a.get("href"), cur) if a else abs_media(img.get("src"))
            link = soup.new_tag("a", attrs={"href": full, "class": "gallery__item"})
            if a and a.get("data-pswp-width"):
                link["data-pswp"] = f'{a.get("data-pswp-width")}x{a.get("data-pswp-height")}'
            alt = img.get("alt") or ""
            i = soup.new_tag("img", attrs={"src": abs_media(img.get("src")), "alt": alt, "loading": "lazy"})
            link.append(i)
            cap = fig.find("figcaption")
            if cap and text_of(cap):
                fc = soup.new_tag("span")
                fc.string = text_of(cap)
            box.append(link)
        gal.replace_with(box)

    # team boxes -> person cards
    for box in g.select(".team-bildbox"):
        box.attrs = {"class": ["person-grid"]}
    for b in g.select(".bildBox"):
        b.attrs = {"class": ["person"]}

    # inline content images
    for b in g.select("div.bild"):
        cls = b.get("class", [])
        side = "inline-img--right" if "floatRight" in cls else ("inline-img--left" if "floatLeft" in cls else "")
        b.name = "figure"
        b.attrs = {"class": ["inline-img"] + ([side] if side else [])}
    for f in g.select("figure.bild"):
        f.name = "figure"
        f.attrs = {"class": ["inline-img"]}

    # two-column text modules
    for c in g.select(".text-2spalten"):
        c.attrs = {"class": ["col-2", "col-2--even"]}
    for c in g.select(".spalten"):
        c.attrs = {"class": ["col-2"]}
    for c in g.select(".text-spalte-1, .text-spalte-2, .spalte-1, .spalte-2"):
        c.attrs = {"class": ["col"]}
    for c in g.select(".berufe-abschnitt"):
        if c.name == "div":
            c.attrs = {"class": ["lead-box"]}

    # video
    for v in g.find_all("video"):
        v.attrs.pop("style", None)
        if v.parent and v.parent.name == "div":
            v.parent.attrs = {"class": ["video-frame"]}
    return data


def supporters_of(soup):
    out = []
    for fig in soup.select(".partner-logos .partner-logo"):
        a = fig.find("a")
        img = fig.find("img")
        out.append({"name": img.get("alt", ""), "href": a.get("href") if a else None,
                    "img": abs_media(img.get("src"))})
    return out


def seals_of(soup):
    out = []
    for fig in soup.select(".sidebar .pics figure, .sb_inner .pics figure"):
        a = fig.find("a")
        img = fig.find("img")
        if img:
            out.append({"name": img.get("alt") or media_file(img.get("src")), "href": a.get("href") if a else None,
                        "img": abs_media(img.get("src"))})
    return out


def breadcrumb_of(soup, cur):
    out = []
    for li in soup.select("#breadcrumb li"):
        a = li.find("a")
        out.append({"label": text_of(li), "href": fix_href(a.get("href"), cur) if a else None})
    return out


def header_image(soup):
    img = soup.select_one(".headerbild img")
    if not img:
        return None
    return {"src": abs_media(img.get("src")), "alt": img.get("alt", ""),
            "srcset": ", ".join(abs_media(p.strip().split(" ")[0]) + " " + p.strip().split(" ")[1]
                                for p in img.get("srcset", "").split(",") if p.strip())}


def build(raw_dir, out_dir, crawl_json):
    crawl = json.load(open(crawl_json))["pages"]
    pages = {}
    for path in sorted(crawl):
        fn = page_file(raw_dir, path)
        html = open(fn, encoding="utf-8").read()
        soup = BeautifulSoup(html, "html.parser")
        title = text_of(soup.title).replace(" | SBBZ Weimar", "")
        g = soup.select_one(".grid-column-1")
        rec = {"path": path, "title": title, "lang": "en" if path.startswith("/en") else "de",
               "breadcrumb": breadcrumb_of(soup, path), "headerImage": header_image(soup),
               "supporters": supporters_of(soup), "seals": seals_of(soup)}
        sup_h = soup.select_one(".partner-logos h2")
        rec["supportersHeading"] = text_of(sup_h)
        if g is None:  # home pages are handled by build_home
            rec["html"] = ""
            rec["text"] = ""
            pages[path] = rec
            continue
        data = map_modules(g, path, soup)
        clean(g, path, soup)
        body = g.decode_contents().strip()
        body = re.sub(r"\n\s*\n+", "\n", body)
        # Klartext-Adressen der Form "name_at_domain" (Original: <span class=unicorn>) -> verschleierte Mail-Links
        body = re.sub(r"(?<![\w.@\"-])([\w.+-]+)_at_([\w-]+(?:\.[\w-]+)+)",
                      lambda m: f'<a href="#" class="js-mail" data-mail="{rot13(m.group(1))}|{rot13(m.group(2))}">{m.group(1)} [at] {m.group(2)}</a>', body)
        rec.update(data)
        rec["h1"] = data.get("h1") or title
        rec["html"] = body
        rec["text"] = re.sub(r"\s+", " ", BeautifulSoup(body, "html.parser").get_text(" ", strip=True))
        pages[path] = rec
    os.makedirs(out_dir, exist_ok=True)
    json.dump(pages, open(os.path.join(out_dir, "pages.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    build_home(raw_dir, out_dir, pages)
    print(f"{len(pages)} pages written")


def build_home(raw_dir, out_dir, pages):
    soup = BeautifulSoup(open(page_file(raw_dir, "/"), encoding="utf-8").read(), "html.parser")
    h1 = soup.find("h1")
    lines = [s.strip() for s in h1.stripped_strings] if h1 else []
    slides = []
    for img in soup.select("#header-slider img"):
        slides.append({"src": abs_media(img.get("src")), "alt": img.get("alt", ""),
                       "srcset": ", ".join(abs_media(p.strip().split(" ")[0]) + " " + p.strip().split(" ")[1]
                                           for p in img.get("srcset", "").split(",") if p.strip())})
    quick = []
    for t in soup.select("#startteaser .startteaser"):
        a = t.find("a")
        quick.append({"title": text_of(t.find("h3")), "href": fix_href(a.get("href"), "/") if a else None,
                      "icon": re.search(r"url\(([^)]+)\)", t.select_one(".startteaser-icon").get("style", "")).group(1)})
    v = soup.find("video")
    video = {"src": abs_media(v.find("source").get("src")), "poster": abs_media(v.get("poster")),
             "fallback": "Ihr Browser kann dieses Video nicht wiedergeben. Vorschaubild Video über Ausbildungsangebote am SBBZ Weimar"} if v else None
    vlinks = []
    for a in soup.select(".video-bildlink-container a"):
        img = a.find("img")
        vlinks.append({"href": fix_href(a.get("href"), "/"), "title": text_of(a) or a.get("title"),
                       "img": abs_media(img.get("src")) if img else None, "alt": img.get("alt", "") if img else ""})
    home = {
        "claim": lines,
        "slides": slides,
        "quickLinks": quick,
        "video": video,
        "videoLinks": vlinks,
        "videoHeading": text_of(soup.select_one(".video-bildlink-container h2")),
        "supporters": supporters_of(soup),
        "supportersHeading": text_of(soup.select_one(".partner-logos h2")),
        "seals": seals_of(soup),
    }
    json.dump(home, open(os.path.join(out_dir, "home.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def fetch(raw_dir, crawl_json):
    import requests
    crawl = json.load(open(crawl_json))["pages"]
    s = requests.Session()
    s.headers["User-Agent"] = "Mozilla/5.0 (sbbz-redesign-extract)"
    os.makedirs(raw_dir, exist_ok=True)
    for path in crawl:
        r = s.get(ORIGIN + path, timeout=30)
        open(page_file(raw_dir, path), "w", encoding="utf-8").write(r.text)
        time.sleep(0.25)


if __name__ == "__main__":
    cmd = sys.argv[1]
    here = os.path.dirname(os.path.abspath(__file__))
    crawl_json = os.path.join(here, "..", "content", "crawl.json")
    if cmd == "fetch":
        fetch(sys.argv[2], crawl_json)
    elif cmd == "build":
        build(sys.argv[2], sys.argv[3], crawl_json)

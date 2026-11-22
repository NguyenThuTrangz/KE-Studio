"""Đóng gói KE Studio thành 1 file: dist/KE-Studio.html (logo nhúng sẵn, mở được trên mọi máy, không cần cài).
Chạy: py build.py   (chỉ dùng thư viện có sẵn của Python)"""
import base64
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / "dist"


def main():
    logo = "data:image/png;base64," + base64.b64encode((ROOT / "assets" / "logo-k-embroidery.png").read_bytes()).decode()
    icon = "data:image/png;base64," + base64.b64encode((ROOT / "assets" / "icon.png").read_bytes()).decode()
    html = (ROOT / "src" / "index.html").read_text(encoding="utf-8")
    js = (ROOT / "src" / "studio.js").read_text(encoding="utf-8")
    gen = (ROOT / "src" / "gen.js").read_text(encoding="utf-8")
    for m in ("/*__LOGO__*/", "/*__ICON__*/", "/*__STUDIO__*/"):
        assert m in html, m
    assert "</script" not in (js + gen).lower(), "mã không được chứa thẻ </script>"
    html = html.replace("/*__STUDIO__*/", js).replace("/*__GEN__*/", gen).replace("/*__LOGO__*/", logo).replace("/*__ICON__*/", icon)
    DIST.mkdir(exist_ok=True)
    out = DIST / "KE-Studio.html"
    out.write_text(html, encoding="utf-8", newline="\n")
    # bản cho GitHub Pages: link web mở thẳng app
    (ROOT / "index.html").write_text(html, encoding="utf-8", newline="\n")
    print(out.name, "+ index.html", round(out.stat().st_size / 1024), "KB")


if __name__ == "__main__":
    main()

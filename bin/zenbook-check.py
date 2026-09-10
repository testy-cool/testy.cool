# Runs inside browser-harness on the zenbook. Do not run this on its own.
# bin/zenbook-check ships it, along with paths.txt, and pipes it in.
#
# For every path, in light and dark: the smallest text on the page, anything
# under 12px, whether the page scrolls sideways at 400px, and a screenshot.
# The page line reads document.title from the live tab, which a browser
# extension can decorate. Check the built <title> on disk, not this.
# browser-harness injects ensure_real_tab, cdp, goto_url and js into globals.
# pyright: reportUndefinedVariable=false
# ruff: noqa: F821
import base64
import os
import time

DIR = os.environ.get("ZC_DIR", "/tmp/zenbook-check")
PORT = os.environ.get("ZC_PORT", "8771")
SHOTS = DIR + "/shots"
os.makedirs(SHOTS, exist_ok=True)

with open(DIR + "/paths.txt") as handle:
    PATHS = [line.strip() for line in handle if line.strip()]

# Elements holding their own text, so a wrapper does not report its child's size.
MEASURE = """(() => {
  const texty = [...document.querySelectorAll('body *')].filter((el) => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    return [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  });
  let min = 999;
  let minText = '';
  const small = [];
  for (const el of texty) {
    const size = parseFloat(getComputedStyle(el).fontSize);
    const text = el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 44);
    if (size < min) { min = size; minText = text; }
    if (size < 12) small.push(size + 'px ' + el.tagName.toLowerCase() + ' ' + text);
  }
  return {
    min: min,
    minText: minText,
    small: [...new Set(small)].slice(0, 8),
    root: getComputedStyle(document.documentElement).fontSize,
    dark: document.documentElement.classList.contains('dark'),
    title: document.title,
  };
})()"""

NARROW = """(() => {
  const d = document.documentElement;
  const over = [...document.querySelectorAll('body *')]
    .filter((el) => el.getBoundingClientRect().right > d.clientWidth + 1)
    .slice(0, 5)
    .map((el) => {
      const cls = (el.className || '').toString().split(' ').filter(Boolean)[0];
      return el.tagName.toLowerCase() + (cls ? '.' + cls : '');
    });
  return { scroll: d.scrollWidth, client: d.clientWidth, over: [...new Set(over)] };
})()"""

# Reuse the tab that is already open. Closing the last one quits Chrome, and a
# tab that is not frontmost silently ignores input.
ensure_real_tab()
cdp("Page.bringToFront")

failures = 0

for path in PATHS:
    slug = path.strip("/").replace("/", "-").replace(".html", "") or "home"
    for theme in ("light", "dark"):
        # Emulation is per attached target and does not survive a new tab, so it
        # is set here rather than once at the top.
        cdp(
            "Emulation.setEmulatedMedia",
            features=[{"name": "prefers-color-scheme", "value": theme}],
        )
        goto_url("http://127.0.0.1:%s%s?zc=%s" % (PORT, path, theme))
        time.sleep(2.5)
        measured = js(MEASURE)

        cdp(
            "Emulation.setDeviceMetricsOverride",
            width=400,
            height=800,
            deviceScaleFactor=1,
            mobile=True,
        )
        time.sleep(0.8)
        narrow = js(NARROW)

        cdp(
            "Emulation.setDeviceMetricsOverride",
            width=1265,
            height=900,
            deviceScaleFactor=1,
            mobile=False,
        )
        time.sleep(0.8)
        shot = cdp("Page.captureScreenshot", format="png", captureBeyondViewport=True)
        with open("%s/%s-%s.png" % (SHOTS, slug, theme), "wb") as out:
            out.write(base64.b64decode(shot["data"]))
        cdp("Emulation.clearDeviceMetricsOverride")

        applied = "dark" if measured["dark"] else "light"
        if applied != theme:
            failures += 1
        print("%s  %s" % (path, theme))
        print("  page               %s" % measured["title"])
        print("  theme applied      %s%s" % (applied, "" if applied == theme else "  MISMATCH"))
        print("  smallest text      %spx  %s" % (measured["min"], measured["minText"]))
        if measured["small"]:
            failures += 1
            print("  under 12px         %s" % "; ".join(measured["small"]))
        else:
            print("  under 12px         none")
        print("  root size          %s" % measured["root"])
        if narrow["scroll"] <= narrow["client"] + 1:
            print("  at 400px wide      fits, no sideways scroll")
        else:
            failures += 1
            print(
                "  at 400px wide      SCROLLS %s into %s, widest: %s"
                % (narrow["scroll"], narrow["client"], ", ".join(narrow["over"]) or "unknown")
            )
        print("")

print("problems: %d" % failures)

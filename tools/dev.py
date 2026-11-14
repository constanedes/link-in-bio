#!/usr/bin/env python3
"""Tiny dev server with live reload. Stdlib only, no dependencies.

Usage: python3 tools/dev.py [port]
Serves the repo root at http://localhost:<port>/ and auto-reloads the
browser when any served file changes (the page polls /__reload for a
mtime fingerprint; no SSE, no websockets, nothing to break).
"""

import http.server
import pathlib
import subprocess
import sys
import threading
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE = ROOT / "public"
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
WATCHED = ("*.html", "*.css", "*.js")
POLL_SECONDS = 1.0


def compute_fingerprint():
    parts = []
    for pattern in WATCHED:
        for path in sorted(SITE.rglob(pattern)):
            if path.is_file() and "__pycache__" not in str(path):
                parts.append(f"{path}:{path.stat().st_mtime_ns}")
    return ";".join(parts)


def watcher():
    previous = compute_fingerprint()
    while True:
        time.sleep(POLL_SECONDS)
        current = compute_fingerprint()
        if current != previous:
            previous = current
            print("  change detected (reload on next poll)")


RELOAD_JS = b"""<script>
(() => {
  let fp = null;
  const check = () => fetch("/__reload")
    .then(r => r.text())
    .then(current => {
      if (fp !== null && current !== fp) location.reload();
      fp = current;
    });
  check();
  setInterval(check, 1000);
  console.log("[dev] live reload active");
})();
</script>"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(SITE), **kwargs)

    def end_headers(self):
        # Never cache in dev
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/__reload":
            body = compute_fingerprint().encode()
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path in ("/", "/index.html"):
            index = SITE / "index.html"
            if index.is_file():
                html = index.read_bytes()
                if b"/__reload" not in html:
                    html = html.replace(b"</body>", RELOAD_JS + b"</body>")
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(html)))
                self.end_headers()
                self.wfile.write(html)
                return
        super().do_GET()

    def send_error(self, code, message=None, explain=None):
        # Serve our styled 404 page instead of the default error page
        if code == 404 and (SITE / "404.html").is_file():
            body = (SITE / "404.html").read_bytes()
            self.send_response(404)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().send_error(code, message, explain)

    def log_message(self, fmt, *args):  # quieter logs
        sys.stderr.write("  %s\n" % (fmt % args))


def main():
    # Regenerate the vCard (build artifact) so "Save contact" works in dev too
    try:
        subprocess.run(["node", "tools/vcf.mjs"], check=True, cwd=ROOT)
    except (OSError, subprocess.CalledProcessError) as err:
        print(f"[dev] vcf generation skipped ({err})")
    threading.Thread(target=watcher, daemon=True).start()
    url = f"http://localhost:{PORT}/"
    print(f"  link-in-bio dev server → {url}  (Ctrl+C to stop)")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    try:
        server.serve_forever(poll_interval=0.1)
    except KeyboardInterrupt:
        print("\n  bye")


if __name__ == "__main__":
    main()

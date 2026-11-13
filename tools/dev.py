#!/usr/bin/env python3
"""Tiny dev server with live reload. Stdlib only, no dependencies.

Usage: python3 tools/dev.py [port]
Serves the repo root at http://localhost:<port>/ and auto-reloads the
browser when any served file changes (via Server-Sent Events).
"""

import asyncio
import functools
import http.server
import pathlib
import sys
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

WATCHED = ("*.html", "*.css", "*.js")
SNAPSHOT = {p: p.stat().st_mtime for pattern in WATCHED for p in ROOT.rglob(pattern)}
CLIENTS: set[asyncio.Queue[None]] = set()

RELOAD_JS = b"""<script>
new EventSource("/__reload").onmessage = () => location.reload();
console.log("[dev] live reload active");
</script>"""


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # Never cache in dev
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path == "/__reload":
            asyncio.ensure_future(self.serve_events())
            return
        if self.path in ("/", "/index.html"):
            body = self.read_index()
            if body is not None:
                self.serve_bytes(body, "text/html")
                return
        super().do_GET()

    def read_index(self):
        index = ROOT / "index.html"
        if not index.is_file():
            return None
        html = index.read_bytes()
        if b"/__reload" not in html:
            html = html.replace(b"</body>", RELOAD_JS + b"</body>")
        return html

    def serve_bytes(self, body, ctype):
        self.send_response(200)
        self.send_header("Content-Type", f"{ctype}; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    async def serve_events(self):
        queue: asyncio.Queue[None] = asyncio.Queue()
        CLIENTS.add(queue)
        try:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            while True:
                await queue.get()
                self.wfile.write(b"data: reload\n\n")
                await self.drain()
        except (ConnectionError, asyncio.CancelledError):
            pass
        finally:
            CLIENTS.discard(queue)

    async def drain(self):
        # SimpleHTTPRequestHandler writes synchronously; push bytes off the loop
        await asyncio.get_running_loop().run_in_executor(None, self.wfile.flush)

    def log_message(self, fmt, *args):  # quieter logs
        sys.stderr.write("  %s\n" % (fmt % args))


async def watcher():
    global SNAPSHOT
    while True:
        await asyncio.sleep(0.5)
        current = {p: p.stat().st_mtime for pattern in WATCHED for p in ROOT.rglob(pattern) if p.is_file()}
        if current != SNAPSHOT:
            SNAPSHOT = current
            print("  change detected, reloading clients…")
            for q in list(CLIENTS):
                q.put_nowait(None)


class Server:
    # Bridge asyncio + the classic socketserver loop
    def __init__(self):
        self.httpd = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
        self.httpd.timeout = 0.2

    async def run(self):
        loop = asyncio.get_running_loop()
        serve_forever = functools.partial(self.httpd.serve_forever, poll_interval=0.1)
        await asyncio.gather(loop.run_in_executor(None, serve_forever), watcher())


def main():
    url = f"http://localhost:{PORT}/"
    print(f"  link-in-bio dev server → {url}  (Ctrl+C to stop)")
    try:
        asyncio.run(Server().run())
    except KeyboardInterrupt:
        print("\n  bye")


if __name__ == "__main__":
    main()

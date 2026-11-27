"""Serve this static release locally with the headers threaded Wasm needs.
Python 3: python run-local.py. No internet binding and no upload endpoint.
"""
from argparse import ArgumentParser
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import webbrowser

ROOT = Path(__file__).resolve().parent
class IsolatedHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".wasm": "application/wasm", ".mjs": "text/javascript"}
    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy","same-origin")
        self.send_header("Cross-Origin-Embedder-Policy","require-corp")
        self.send_header("Cross-Origin-Resource-Policy","same-origin")
        self.send_header("Referrer-Policy","no-referrer")
        self.send_header("X-Content-Type-Options","nosniff")
        super().end_headers()

if __name__ == "__main__":
    p=ArgumentParser(description=__doc__)
    p.add_argument("--port",type=int,default=8093)
    p.add_argument("--no-open",action="store_true")
    args=p.parse_args()
    dist=ROOT/"dist"
    if not (dist/"game/index.html").is_file() or not (dist/"game/opengothic.wasm").is_file():
        p.error("This release has no web runtime. Obtain the binary distribution or populate dist/game.")
    with ThreadingHTTPServer(("127.0.0.1",args.port), partial(IsolatedHandler,directory=str(dist))) as server:
        url=f"http://127.0.0.1:{server.server_port}/"
        print(url,flush=True)
        if not args.no_open:webbrowser.open(url)
        server.serve_forever()

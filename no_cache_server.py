#!/usr/bin/env python3
"""带 no-cache header 的本地 HTTP server
确保浏览器每次都从 server 拿最新版本,不会被缓存卡住。
"""
import http.server
import socketserver
import sys
import os

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8766


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 强制不缓存,浏览器每次访问都必须从 server 拿最新版本
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # 根路径自动返回 闪卡记忆.html,保留 query string
        from urllib.parse import urlparse, urlunparse
        parsed = urlparse(self.path)
        if parsed.path == '/' or parsed.path == '':
            new_path = '/闪卡记忆.html'
            if parsed.query:
                new_path += '?' + parsed.query
            self.path = new_path
        return super().do_GET()

    def log_message(self, format, *args):
        # 简化日志,只打印请求路径
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
        print(f"Serving on http://localhost:{PORT}/ with no-cache headers")
        print(f"Working directory: {os.getcwd()}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nStopping server...")
            httpd.shutdown()


if __name__ == "__main__":
    main()

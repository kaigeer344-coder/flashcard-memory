import base64
from io import BytesIO
from PIL import Image

png_path = '/Users/adminmima0000/Desktop/trae比赛项目/trae/assets/home/Cici_IP_transparent.png'
png_out = '/Users/adminmima0000/Desktop/trae比赛项目/trae/assets/characters/cici-mascot.png'
png2x_out = '/Users/adminmima0000/Desktop/trae比赛项目/trae/assets/characters/cici-mascot@2x.png'
svg_out = '/Users/adminmima0000/Desktop/trae比赛项目/trae/assets/characters/cici-mascot.svg'

img = Image.open(png_path).convert('RGBA')

# 获取 alpha 通道
alpha = img.split()[-1]

# 使用阈值裁剪，忽略几乎透明的像素
threshold = 10
alpha_binary = alpha.point(lambda p: 255 if p > threshold else 0)
bbox = alpha_binary.getbbox()
if not bbox:
    raise ValueError('图片完全透明')

left, top, right, bottom = bbox
width = right - left
height = bottom - top

# 裁剪高清版本
cropped = img.crop(bbox)
cropped.save(png2x_out, 'PNG')
print(f'高清 PNG 尺寸: {width}x{height}, 保存到 {png2x_out}')

# 生成 Web 优化版本（最大宽度 600px，保持透明）
max_web_width = 600
if width > max_web_width:
    ratio = max_web_width / width
    web_size = (max_web_width, int(height * ratio))
    web_img = cropped.resize(web_size, Image.LANCZOS)
else:
    web_img = cropped

web_img.save(png_out, 'PNG')
print(f'Web PNG 尺寸: {web_img.width}x{web_img.height}, 保存到 {png_out}')

# 生成新的 SVG，viewBox 匹配裁剪后尺寸，使用 Web 优化 PNG 字节
png_buffer = BytesIO()
web_img.save(png_buffer, format='PNG')
png_bytes = png_buffer.getvalue()
png_b64 = base64.b64encode(png_bytes).decode()

svg_new = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{web_img.width}" height="{web_img.height}" viewBox="0 0 {web_img.width} {web_img.height}">
  <title>Cici IP Mascot</title>
  <image width="{web_img.width}" height="{web_img.height}" href="data:image/png;base64,{png_b64}"/>
</svg>'''

with open(svg_out, 'w', encoding='utf-8') as f:
    f.write(svg_new)
print(f'裁剪后 SVG 保存到 {svg_out}')

#!/usr/bin/env python3
"""
基于 PNG 图标生成圆角图标并应用到 Tauri 项目
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw
import math

def create_rounded_rectangle_mask(size, radius):
    """创建圆角矩形蒙版"""
    width, height = size
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    
    # 绘制圆角矩形
    draw.rounded_rectangle([(0, 0), (width, height)], radius=radius, fill=255)
    
    return mask

def add_rounded_corners(image, radius=None):
    """为图片添加圆角"""
    if radius is None:
        # 默认圆角半径为图片宽度的 20%
        radius = int(min(image.size) * 0.2)
    
    # 创建圆角蒙版
    # mask 中：圆角区域为 0（透明），中间区域为 255（不透明）
    mask = create_rounded_rectangle_mask(image.size, radius)
    
    # 转换为 RGBA 模式（如果还没有）
    if image.mode != 'RGBA':
        image = image.convert('RGBA')
    
    # 获取原图的 alpha 通道（如果存在）
    if image.mode == 'RGBA':
        original_alpha = image.split()[3]
    else:
        original_alpha = Image.new('L', image.size, 255)
    
    # 将圆角蒙版与原图的 alpha 通道合并
    # 使用 multiply：mask 中为 0 的地方（圆角区域）会变成透明
    from PIL import ImageChops
    final_alpha = ImageChops.multiply(original_alpha, mask)
    image.putalpha(final_alpha)
    
    return image

def generate_rounded_png_icon(png_path, output_path, size=1024, radius_percent=20, scale=1.0):
    """从 PNG 生成带圆角的 PNG 图标
    
    Args:
        png_path: 输入 PNG 文件路径
        output_path: 输出 PNG 文件路径
        size: 输出图标的目标尺寸（正方形）
        radius_percent: 圆角半径占图标尺寸的百分比
        scale: 中心图片的缩放比例 (0.0-1.0)，1.0 表示填满整个图标区域
    """
    img = Image.open(png_path)
    
    # 如果图片不是正方形，先裁剪为正方形（居中裁剪）
    width, height = img.size
    if width != height:
        size_original = min(width, height)
        left = (width - size_original) // 2
        top = (height - size_original) // 2
        img = img.crop((left, top, left + size_original, top + size_original))
        print(f"  图片已裁剪为正方形: {size_original}x{size_original}")
    
    # 计算缩放后的图标尺寸
    icon_size = int(size * scale)
    
    # 调整图标到缩放后的尺寸
    if img.size[0] != icon_size:
        img = img.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        print(f"  图标已调整尺寸: {icon_size}x{icon_size} (缩放比例: {scale*100:.1f}%)")
    
    # 如果缩放比例小于 1.0，需要将图标居中放置在目标尺寸的画布上
    if scale < 1.0:
        # 创建目标尺寸的透明画布
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        # 计算居中位置
        offset_x = (size - icon_size) // 2
        offset_y = (size - icon_size) // 2
        # 将图标粘贴到画布中心
        canvas.paste(img, (offset_x, offset_y), img if img.mode == 'RGBA' else None)
        img = canvas
        print(f"  图标已居中放置在 {size}x{size} 画布上")
    
    # 计算圆角半径（基于目标尺寸）
    radius = int(size * radius_percent / 100)
    
    # 添加圆角
    rounded_img = add_rounded_corners(img, radius)
    
    # 保存 PNG
    rounded_img.save(output_path, 'PNG', optimize=True)
    
    print(f"✓ 已生成圆角 PNG 图标: {output_path} (尺寸: {size}x{size}, 圆角: {radius}px, 图标缩放: {scale*100:.1f}%)")
    return output_path

def generate_icon_sizes(png_path, output_dir, sizes, radius_percent=20):
    """生成不同尺寸的圆角图标"""
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 读取原始图片
    original_img = Image.open(png_path)
    
    generated_files = []
    
    for size in sizes:
        # 调整尺寸
        resized = original_img.resize((size, size), Image.Resampling.LANCZOS)
        
        # 添加圆角
        radius = int(size * radius_percent / 100)
        rounded = add_rounded_corners(resized, radius)
        
        # 保存
        output_path = output_dir / f"{size}x{size}.png"
        rounded.save(output_path, 'PNG', optimize=True)
        generated_files.append(output_path)
        print(f"✓ 已生成 {size}x{size} 图标: {output_path}")
    
    return generated_files

def main(radius=20, scale=1.0):
    # 获取脚本所在目录
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent
    
    # 输入文件
    input_png = script_dir / "new_icon.png"
    
    if not input_png.exists():
        print(f"❌ 错误: 找不到输入文件 {input_png}")
        sys.exit(1)
    
    # 输出路径
    desktop_dir = project_root / "apps" / "desktop"
    png_output = desktop_dir / "app-icon.png"
    
    print("=" * 60)
    print("开始生成圆角图标...")
    print("=" * 60)
    print(f"输入文件: {input_png}")
    print(f"输出 PNG: {png_output}")
    print(f"圆角半径: {radius}%")
    print(f"图标缩放: {scale*100:.1f}%")
    print()
    
    # 生成 PNG 图标（用于 Tauri）
    try:
        generate_rounded_png_icon(input_png, png_output, size=1024, radius_percent=radius, scale=scale)
        print()
        print("=" * 60)
        print("✓ 图标生成完成！")
        print("=" * 60)
        print()
        print("下一步操作:")
        print(f"  1. 运行以下命令生成所有图标格式:")
        print(f"     cd {desktop_dir}")
        print(f"     npx tauri icon app-icon.png -o src-tauri/icons")
        print()
        print("  或者运行:")
        print(f"     python3 {script_dir}/generate_rounded_icon.py --apply")
        print()
    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="生成圆角图标")
    parser.add_argument("--radius", type=int, default=20, help="圆角半径百分比 (默认: 20)")
    parser.add_argument("--scale", type=float, default=1.0, help="中心图片的缩放比例 (0.0-1.0, 默认: 1.0，1.0 表示填满整个图标区域)")
    parser.add_argument("--apply", action="store_true", help="自动应用图标（生成 PNG 并运行 tauri icon）")
    
    args = parser.parse_args()
    
    if args.apply:
        # 执行完整流程
        script_dir = Path(__file__).parent
        project_root = script_dir.parent.parent
        input_png = script_dir / "new_icon.png"
        desktop_dir = project_root / "apps" / "desktop"
        png_output = desktop_dir / "app-icon.png"
        
        print("生成圆角 PNG 图标...")
        generate_rounded_png_icon(input_png, png_output, size=1024, radius_percent=args.radius, scale=args.scale)
        
        print("\n运行 Tauri icon 命令...")
        import subprocess
        result = subprocess.run(
            ["npx", "tauri", "icon", "app-icon.png", "-o", "src-tauri/icons"],
            cwd=desktop_dir,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(result.stdout)
            print("\n✓ 图标已成功应用到项目！")
        else:
            print("❌ Tauri icon 命令执行失败:")
            print(result.stderr)
            sys.exit(1)
    else:
        main(radius=args.radius, scale=args.scale)

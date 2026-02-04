#!/usr/bin/env python3
"""
图像处理脚本：抠图并旋转图标
"""

from PIL import Image
import os

def process_icon(input_path, output_path, rotation_angle=45):
    """
    处理图标：保持透明背景，顺时针旋转指定角度
    
    Args:
        input_path: 输入图像路径
        output_path: 输出图像路径
        rotation_angle: 旋转角度（度），正数为顺时针
    """
    try:
        # 打开图像
        print(f"正在读取图像: {input_path}")
        img = Image.open(input_path)
        
        # 确保图像有 alpha 通道（透明度）
        if img.mode != 'RGBA':
            print("转换图像为 RGBA 模式")
            img = img.convert('RGBA')
        
        print(f"原始图像尺寸: {img.size}")
        print(f"原始图像模式: {img.mode}")
        
        # 顺时针旋转（PIL 的 rotate 是逆时针，所以用负角度）
        print(f"顺时针旋转 {rotation_angle} 度...")
        rotated_img = img.rotate(-rotation_angle, expand=True, resample=Image.BICUBIC)
        
        print(f"旋转后图像尺寸: {rotated_img.size}")
        
        # 保存结果
        print(f"保存图像到: {output_path}")
        rotated_img.save(output_path, 'PNG')
        
        print("✓ 处理完成！")
        
        return rotated_img
        
    except Exception as e:
        print(f"✗ 错误: {e}")
        raise

def main():
    # 获取当前脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # 输入输出路径
    input_path = os.path.join(script_dir, "new_icon.png")
    output_path = os.path.join(script_dir, "new_icon_rotated.png")
    
    # 处理图像
    print("=" * 50)
    print("图标旋转处理")
    print("=" * 50)
    
    if not os.path.exists(input_path):
        print(f"✗ 错误: 找不到输入文件 {input_path}")
        return
    
    process_icon(input_path, output_path, rotation_angle=45)
    
    print("=" * 50)
    print(f"输出文件: {output_path}")
    print("=" * 50)

if __name__ == "__main__":
    main()

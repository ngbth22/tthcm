import os

def clean_file(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    cleaned_lines = []
    for line in lines:
        # Loại bỏ những dòng chỉ chứa duy nhất A, B, C, hoặc D (bỏ qua khoảng trắng/xuống dòng)
        if line.strip() in ['A', 'B', 'C', 'D']:
            continue
        cleaned_lines.append(line)
        
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)

if __name__ == '__main__':
    # Chạy script cho file raw.txt, xuất ra file raw_cleaned.txt
    clean_file('raw.txt', 'raw_cleaned.txt')
    print("Done! Cleaned file saved to raw_cleaned.txt")

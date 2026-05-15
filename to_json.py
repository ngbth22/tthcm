import json
import re

def convert_to_json(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Split by "Câu  " (with spaces)
    # The file has "Câu  1  ID: ...", "Câu  2  ID: ..."
    blocks = re.split(r'\n(?=Câu\s+\d+)', '\n' + content)
    blocks = [b.strip() for b in blocks if b.strip()]

    questions = []
    
    for block in blocks:
        lines = [line.strip() for line in block.split('\n') if line.strip()]
        
        # Parse ID
        # "Câu  1  ID: 500774430"
        first_line = lines[0]
        q_id = ""
        id_match = re.search(r'ID:\s*(\d+)', first_line)
        if id_match:
            q_id = id_match.group(1)
            
        # Parse question text
        question_text = ""
        options = {'A': '', 'B': '', 'C': '', 'D': ''}
        correct_answer = ""
        
        current_state = 'question'
        
        for line in lines[1:]:
            if line.startswith('Đáp án đúng:'):
                correct_answer = line.split(':')[1].strip()
                current_state = 'done'
            elif line == 'A.' or line.startswith('A. '):
                current_state = 'A'
                if len(line) > 2: options['A'] += line[2:].strip() + "\n"
            elif line == 'B.' or line.startswith('B. '):
                current_state = 'B'
                if len(line) > 2: options['B'] += line[2:].strip() + "\n"
            elif line == 'C.' or line.startswith('C. '):
                current_state = 'C'
                if len(line) > 2: options['C'] += line[2:].strip() + "\n"
            elif line == 'D.' or line.startswith('D. '):
                current_state = 'D'
                if len(line) > 2: options['D'] += line[2:].strip() + "\n"
            elif line.startswith('[<') and '>]' in line and not line.endswith(']:') and 'Chương' in line:
                # ignore metadata lines like "[<0101003505_Chương II>] , , Tư tưởng Hồ Chí Minh_Chương_II"
                continue
            else:
                if current_state == 'question':
                    # remove [<TB>]: or [<DE>]: prefixes
                    cleaned_line = re.sub(r'^\[<[A-Z]+>\]:\s*', '', line)
                    question_text += cleaned_line + "\n"
                elif current_state in ['A', 'B', 'C', 'D']:
                    options[current_state] += line + "\n"
                    
        # clean up options and question
        question_text = question_text.strip()
        for k in options:
            options[k] = options[k].strip()
            
        questions.append({
            'id': q_id,
            'question': question_text,
            'options': options,
            'correct_answer': correct_answer
        })
        
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=4)
        
    print(f"Converted {len(questions)} questions to {output_file}")

if __name__ == '__main__':
    convert_to_json('raw_cleaned.txt', 'quiz.json')

// DOM Elements
const questionNumberEl = document.getElementById('question-number');
const questionIdEl = document.getElementById('question-id');
const questionTextEl = document.getElementById('question-text');
const optionsListEl = document.getElementById('options-list');
const feedbackEl = document.getElementById('feedback');
const nextBtn = document.getElementById('next-btn');
const restartBtn = document.getElementById('restart-btn');
const progressEl = document.getElementById('progress');
const scoreEl = document.getElementById('score');
const modeRadios = document.getElementsByName('mode');
const saveBtn = document.getElementById('save-btn');

// State
let currentIndex = 0;
let score = 0;
let isAnswered = false;
let currentMode = 'normal'; // 'normal', 'hard', 'wrong', 'saved', 'cram'
let activeQuizData = []; // To store filtered questions

// LocalStorage Keys
const WRONG_QS_KEY = 'tthcm_wrong_questions';
const SAVED_QS_KEY = 'tthcm_saved_questions';
const FAIL_COUNTS_KEY = 'tthcm_fail_counts';

// Load from LocalStorage
let wrongQuestions = JSON.parse(localStorage.getItem(WRONG_QS_KEY)) || [];
let savedQuestions = JSON.parse(localStorage.getItem(SAVED_QS_KEY)) || [];
let failCounts = JSON.parse(localStorage.getItem(FAIL_COUNTS_KEY)) || {};

function initQuiz() {
    currentIndex = 0;
    score = 0;
    scoreEl.textContent = score;
    
    // Get current mode
    for (const radio of modeRadios) {
        if (radio.checked) {
            currentMode = radio.value;
        }
    }
    
    updateActiveQuizData();
    
    if (activeQuizData.length === 0) {
        alert('Không có câu hỏi nào trong chế độ này!');
        // Fallback to normal mode
        document.querySelector('input[value="normal"]').checked = true;
        currentMode = 'normal';
        updateActiveQuizData();
    }
    
    progressEl.textContent = `${currentIndex + 1}/${activeQuizData.length}`;
    showQuestion();
}

function updateActiveQuizData() {
    if (currentMode === 'wrong') {
        activeQuizData = quizData.filter(q => wrongQuestions.includes(q.id));
    } else if (currentMode === 'saved') {
        activeQuizData = quizData.filter(q => savedQuestions.includes(q.id));
    } else {
        activeQuizData = quizData; // normal, hard, cram uses all data
    }
}

// Add event listeners to radios
for (const radio of modeRadios) {
    radio.addEventListener('change', (e) => {
        currentMode = e.target.value;
        initQuiz(); // Re-init when mode changes
    });
}

function showQuestion() {
    isAnswered = false;
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    nextBtn.style.display = 'none';
    
    if (activeQuizData.length === 0) {
        questionTextEl.textContent = "Không có câu hỏi nào!";
        optionsListEl.innerHTML = '';
        return;
    }
    
    const q = activeQuizData[currentIndex];
    
    questionNumberEl.textContent = `Câu ${currentIndex + 1}`;
    questionIdEl.textContent = `ID: ${q.id}`;
    questionTextEl.textContent = q.question;
    
    progressEl.textContent = `${currentIndex + 1}/${activeQuizData.length}`;
    
    // Update Save button state
    if (savedQuestions.includes(q.id)) {
        saveBtn.classList.add('active');
        saveBtn.textContent = '⭐ Đã Lưu';
    } else {
        saveBtn.classList.remove('active');
        saveBtn.textContent = '⭐ Lưu';
    }
    
    optionsListEl.innerHTML = '';
    
    const options = q.options;
    const isCramMode = currentMode === 'cram';
    
    for (const key in options) {
        if (options[key]) {
            const optionItem = document.createElement('div');
            optionItem.className = 'option-item';
            optionItem.dataset.key = key;
            
            const prefix = document.createElement('span');
            prefix.className = 'option-prefix';
            prefix.textContent = key;
            
            const text = document.createElement('span');
            text.className = 'option-text';
            text.textContent = options[key];
            
            optionItem.appendChild(prefix);
            optionItem.appendChild(text);
            
            if (isCramMode) {
                // Tự động highlight đáp án đúng trong chế độ Cấp tốc
                if (key === q.correct_answer) {
                    optionItem.classList.add('correct');
                } else {
                    optionItem.classList.add('disabled');
                }
            } else {
                optionItem.addEventListener('click', () => selectOption(optionItem, key));
            }
            
            optionsListEl.appendChild(optionItem);
        }
    }
    
    if (isCramMode) {
        isAnswered = true;
        nextBtn.style.display = 'block';
        feedbackEl.textContent = 'Chế độ Cấp tốc: Đã hiển thị sẵn đáp án đúng.';
        feedbackEl.classList.add('correct');
    }
}

function selectOption(selectedItem, selectedKey) {
    if (isAnswered) return;
    
    isAnswered = true;
    const q = activeQuizData[currentIndex];
    const correctKey = q.correct_answer;
    
    // Disable all options
    const options = optionsListEl.querySelectorAll('.option-item');
    options.forEach(opt => opt.classList.add('disabled'));
    
    if (selectedKey === correctKey) {
        selectedItem.classList.remove('disabled');
        selectedItem.classList.add('correct');
        feedbackEl.textContent = 'Chính xác!';
        feedbackEl.classList.add('correct');
        score += 10;
        scoreEl.textContent = score;
        
        // Xóa đếm số lần sai khi làm đúng
        if (failCounts[q.id]) {
            delete failCounts[q.id];
            localStorage.setItem(FAIL_COUNTS_KEY, JSON.stringify(failCounts));
        }
        
        nextBtn.style.display = 'block';
    } else {
        selectedItem.classList.remove('disabled');
        selectedItem.classList.add('incorrect');
        feedbackEl.textContent = `Sai rồi! Đáp án đúng là: ${correctKey}`;
        feedbackEl.classList.add('incorrect');
        
        // Show correct answer as well
        options.forEach(opt => {
            if (opt.dataset.key === correctKey) {
                opt.classList.remove('disabled');
                opt.classList.add('correct');
            }
        });
        
        // Save to wrong questions if not already in there
        if (!wrongQuestions.includes(q.id)) {
            wrongQuestions.push(q.id);
            localStorage.setItem(WRONG_QS_KEY, JSON.stringify(wrongQuestions));
        }
        
        if (currentMode === 'hard') {
            const prevIndex = currentIndex;
            currentIndex = Math.max(0, currentIndex - 3);
            feedbackEl.textContent += ` | Vòng Lặp: Sai, lùi 3 câu!`;
        }
        
        nextBtn.style.display = 'block';
    }
}

function goToNextQuestion() {
    if (currentMode === 'normal' || currentMode === 'wrong' || currentMode === 'saved' || currentMode === 'cram') {
        currentIndex++;
    } else if (currentMode === 'hard') {
        const isCorrect = feedbackEl.classList.contains('correct');
        if (isCorrect) {
            currentIndex++;
        }
    }
    
    if (currentIndex >= activeQuizData.length) {
        alert(`Chúc mừng! Bạn đã hoàn thành bài trắc nghiệm. Tổng điểm: ${score}`);
        currentIndex = 0;
        score = 0;
        scoreEl.textContent = score;
    }
    
    showQuestion();
}

nextBtn.addEventListener('click', goToNextQuestion);

// Thêm sự kiện nhấn phím ` hoặc ~
document.addEventListener('keydown', (e) => {
    // Chỉ cho qua câu khi đã trả lời xong
    if (e.code === 'Backquote' && isAnswered) {
        goToNextQuestion();
    }
});

// Event listener cho nút Lưu
saveBtn.addEventListener('click', () => {
    const q = activeQuizData[currentIndex];
    if (!q) return;
    
    if (savedQuestions.includes(q.id)) {
        // Remove
        savedQuestions = savedQuestions.filter(id => id !== q.id);
        saveBtn.classList.remove('active');
        saveBtn.textContent = '⭐ Lưu';
    } else {
        // Add
        savedQuestions.push(q.id);
        saveBtn.classList.add('active');
        saveBtn.textContent = '⭐ Đã Lưu';
    }
    localStorage.setItem(SAVED_QS_KEY, JSON.stringify(savedQuestions));
});

restartBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn làm lại từ đầu không?')) {
        initQuiz();
    }
});

// Start Quiz
initQuiz();

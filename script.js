// Elemen-elemen DOM
const settingsPanel = document.querySelector('.settings-panel');
const gameArea = document.querySelector('.game-area');
const resultsArea = document.querySelector('.results');
const pauseDialog = document.getElementById('pause-dialog');

const minRangeInput = document.getElementById('min-range');
const maxRangeInput = document.getElementById('max-range');
const questionCountInput = document.getElementById('question-count');

const skip1Checkbox = document.getElementById('skip-1');
const skip10Checkbox = document.getElementById('skip-10');
const skip11Checkbox = document.getElementById('skip-11');
const skipCustomCheckbox = document.getElementById('skip-custom');
const customSkipInput = document.getElementById('custom-skip');

// Timer options
const timerFastOption = document.getElementById('timer-fast');
const timerMediumOption = document.getElementById('timer-medium');
const timerSlowOption = document.getElementById('timer-slow');
const timerOffOption = document.getElementById('timer-off');

const startGameButton = document.getElementById('start-game');
const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer-input');
const submitAnswerButton = document.getElementById('submit-answer');
const feedbackElement = document.getElementById('feedback');
const timerProgressElement = document.getElementById('timer-progress');

const scoreElement = document.getElementById('score');
const currentQuestionElement = document.getElementById('current-question');
const totalQuestionsElement = document.getElementById('total-questions');

const finalScoreElement = document.getElementById('final-score');
const correctCountElement = document.getElementById('correct-count');
const wrongCountElement = document.getElementById('wrong-count');
const wrongQuestionsListElement = document.getElementById('wrong-questions-list');

const playAgainButton = document.getElementById('play-again');
const backToSettingsButton = document.getElementById('back-to-settings');
const pauseGameButton = document.getElementById('pause-game');
const continueGameButton = document.getElementById('continue-game');
const exitGameButton = document.getElementById('exit-game');

// Variabel game
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let correctAnswers = 0;
let wrongAnswers = 0;
let wrongQuestionsList = [];
let timerInterval;
let timeLeft = 100; // Persentase waktu tersisa
let timerDuration = 10000; // 10 detik default
let isPaused = false; // Status jeda permainan

// Event listeners
skipCustomCheckbox.addEventListener('change', function() {
    customSkipInput.disabled = !this.checked;
});

startGameButton.addEventListener('click', startGame);
submitAnswerButton.addEventListener('click', checkAnswer);

// Kalkulator keypad event listeners
const calculatorButtons = document.querySelectorAll('.calc-btn');
calculatorButtons.forEach(button => {
    button.addEventListener('click', function() {
        // Jika permainan dijeda, jangan izinkan input
        if (isPaused) return;
        
        const value = this.getAttribute('data-value');
        const action = this.getAttribute('data-action');
        
        if (value) {
            // Tambahkan angka ke input
            answerInput.value += value;
        } else if (action === 'clear') {
            // Hapus semua input
            answerInput.value = '';
        } else if (action === 'backspace') {
            // Hapus karakter terakhir
            answerInput.value = answerInput.value.slice(0, -1);
        }
    });
});

playAgainButton.addEventListener('click', function() {
    resultsArea.style.display = 'none';
    startGame();
});

backToSettingsButton.addEventListener('click', function() {
    resultsArea.style.display = 'none';
    settingsPanel.style.display = 'block';
});

// Event listeners untuk tombol pause, continue, dan exit
pauseGameButton.addEventListener('click', pauseGame);
continueGameButton.addEventListener('click', continueGame);
exitGameButton.addEventListener('click', exitGame);

// Fungsi untuk memulai game
function startGame() {
    // Validasi input
    let minRange = parseInt(minRangeInput.value);
    let maxRange = parseInt(maxRangeInput.value);
    
    if (minRange > maxRange) {
        alert('Nilai minimum harus lebih kecil dari nilai maksimum!');
        return;
    }
    
    if (minRange < 1) minRange = 1;
    if (maxRange > 30) maxRange = 30;
    
    minRangeInput.value = minRange;
    maxRangeInput.value = maxRange;
    
    // Siapkan variabel game
    currentQuestionIndex = 0;
    score = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    wrongQuestionsList = [];
    isPaused = false;
    pauseDialog.style.display = 'none';
    
    // Buat daftar angka yang dilewati
    const skipNumbers = [];
    if (skip1Checkbox.checked) skipNumbers.push(1);
    if (skip10Checkbox.checked) skipNumbers.push(10);
    if (skip11Checkbox.checked) skipNumbers.push(11);
    if (skipCustomCheckbox.checked) {
        const customSkip = parseInt(customSkipInput.value);
        if (customSkip >= 1 && customSkip <= 30) {
            skipNumbers.push(customSkip);
        }
    }
    
    // Buat soal-soal
    generateQuestions(minRange, maxRange, skipNumbers);
    
    // Update UI
    scoreElement.textContent = score;
    currentQuestionElement.textContent = 1;
    totalQuestionsElement.textContent = questions.length;
    
    // Tampilkan area game dan sembunyikan area lain
    settingsPanel.style.display = 'none';
    resultsArea.style.display = 'none';
    gameArea.style.display = 'block';
    
    // Tampilkan soal pertama
    showQuestion();
}

// Fungsi untuk membuat soal-soal
function generateQuestions(minRange, maxRange, skipNumbers) {
    questions = [];
    const questionCount = parseInt(questionCountInput.value);
    const possibleQuestions = [];
    
    // Buat semua kemungkinan soal
    for (let i = minRange; i <= maxRange; i++) {
        if (skipNumbers.includes(i)) continue;
        
        for (let j = minRange; j <= maxRange; j++) {
            if (skipNumbers.includes(j)) continue;
            possibleQuestions.push({
                num1: i,
                num2: j,
                answer: i * j
            });
        }
    }
    
    // Jika soal yang tersedia kurang dari yang diminta
    if (possibleQuestions.length < questionCount) {
        alert(`Hanya tersedia ${possibleQuestions.length} soal dengan pengaturan saat ini.`);
        
        // Acak semua soal yang tersedia
        shuffleArray(possibleQuestions);
        questions = possibleQuestions;
        return;
    }
    
    // Jika jumlah soal yang diminta lebih banyak dari soal yang tersedia,
    // kita perlu membuat beberapa siklus
    if (questionCount > possibleQuestions.length) {
        // Buat salinan array soal untuk setiap siklus yang diperlukan
        let remainingCount = questionCount;
        let allQuestions = [];
        
        while (remainingCount > 0) {
            // Buat salinan baru dan acak untuk setiap siklus
            let cycleCopy = [...possibleQuestions];
            shuffleArray(cycleCopy);
            
            // Ambil sebanyak yang diperlukan untuk siklus ini
            const cycleCount = Math.min(remainingCount, cycleCopy.length);
            allQuestions = allQuestions.concat(cycleCopy.slice(0, cycleCount));
            remainingCount -= cycleCount;
        }
        
        questions = allQuestions;
    } else {
        // Jika jumlah soal yang diminta kurang dari atau sama dengan soal yang tersedia,
        // cukup acak dan ambil sejumlah soal yang diminta
        shuffleArray(possibleQuestions);
        questions = possibleQuestions.slice(0, questionCount);
    }
}

// Fungsi untuk mengacak array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Fungsi untuk menampilkan soal
function showQuestion() {
    if (currentQuestionIndex >= questions.length) {
        endGame();
        return;
    }
    
    const question = questions[currentQuestionIndex];
    questionElement.textContent = `${question.num1} × ${question.num2} = ?`;
    answerInput.value = '';
    feedbackElement.textContent = '';
    feedbackElement.className = 'feedback';
    
    // Reset dan mulai timer
    clearInterval(timerInterval);
    timeLeft = 100;
    timerProgressElement.style.width = '100%';
    
    // Sesuaikan durasi timer berdasarkan tingkat kesulitan soal dan opsi timer yang dipilih
    const difficulty = question.num1 * question.num2;
    
    // Tentukan durasi timer berdasarkan opsi yang dipilih
    if (timerOffOption.checked) {
        // Timer non-aktif, tidak perlu memulai timer
        timerProgressElement.style.display = 'none';
        document.querySelector('.timer-label').style.display = 'none';
    } else {
        timerProgressElement.style.display = 'block';
        document.querySelector('.timer-label').style.display = 'block';
        
        // Sesuaikan durasi berdasarkan opsi kecepatan
        if (timerFastOption.checked) {
            // Mode cepat: 3-8 detik
            timerDuration = 3000 + Math.min(difficulty * 50, 5000);
        } else if (timerMediumOption.checked) {
            // Mode sedang: 5-15 detik (default)
            timerDuration = 5000 + Math.min(difficulty * 100, 10000);
        } else if (timerSlowOption.checked) {
            // Mode lambat: 10-25 detik
            timerDuration = 10000 + Math.min(difficulty * 150, 15000);
        }
        
        timerInterval = setInterval(updateTimer, 100);
    }
    
    // Fokus ke input jawaban
    answerInput.focus();
}

// Fungsi untuk memperbarui timer
function updateTimer() {
    // Jika timer non-aktif atau permainan dijeda, tidak perlu memperbarui
    if (timerOffOption.checked || isPaused) return;
    
    timeLeft -= 1;
    timerProgressElement.style.width = `${timeLeft}%`;
    
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleWrongAnswer('Waktu habis!');
    }
}

// Fungsi untuk menjeda permainan
function pauseGame() {
    if (!isPaused) {
        isPaused = true;
        pauseDialog.style.display = 'flex';
        // Jika timer aktif, jeda timer
        if (!timerOffOption.checked) {
            clearInterval(timerInterval);
        }
    }
}

// Fungsi untuk melanjutkan permainan
function continueGame() {
    if (isPaused) {
        isPaused = false;
        pauseDialog.style.display = 'none';
        // Jika timer aktif, lanjutkan timer
        if (!timerOffOption.checked) {
            timerInterval = setInterval(updateTimer, 100);
        }
    }
}

// Fungsi untuk keluar dari permainan
function exitGame() {
    // Konfirmasi sekali lagi
    if (confirm('Apakah Anda yakin ingin keluar dari permainan? Progres Anda akan hilang.')) {
        // Reset status permainan
        isPaused = false;
        pauseDialog.style.display = 'none';
        clearInterval(timerInterval);
        
        // Sembunyikan area permainan dan tampilkan menu pengaturan
        gameArea.style.display = 'none';
        settingsPanel.style.display = 'block';
        
        // Pastikan area hasil juga disembunyikan jika sebelumnya ditampilkan
        resultsArea.style.display = 'none';
    }
}

// Fungsi untuk memeriksa jawaban
function checkAnswer() {
    // Jika permainan dijeda atau sudah selesai, jangan periksa jawaban
    if (isPaused || currentQuestionIndex >= questions.length) return;
    
    const userAnswer = parseInt(answerInput.value);
    if (isNaN(userAnswer) || answerInput.value.trim() === '') {
        feedbackElement.textContent = 'Masukkan jawaban yang valid!';
        feedbackElement.className = 'feedback wrong';
        return;
    }
    
    clearInterval(timerInterval);
    
    const question = questions[currentQuestionIndex];
    const correctAnswer = question.answer;
    
    if (userAnswer === correctAnswer) {
        handleCorrectAnswer();
    } else {
        handleWrongAnswer(`Jawaban yang benar adalah ${correctAnswer}`);
    }
}

// Fungsi untuk menangani jawaban benar
function handleCorrectAnswer() {
    // Hitung skor berdasarkan waktu tersisa
    const timeBonus = Math.floor(timeLeft / 10); // 0-10 poin bonus waktu
    const questionPoints = 10 + timeBonus;
    score += questionPoints;
    correctAnswers++;
    
    // Update UI
    scoreElement.textContent = score;
    feedbackElement.textContent = `Benar! +${questionPoints} poin`;
    feedbackElement.className = 'feedback correct';
    questionElement.classList.add('pulse');
    
    setTimeout(() => {
        questionElement.classList.remove('pulse');
        currentQuestionIndex++;
        currentQuestionElement.textContent = currentQuestionIndex + 1;
        showQuestion();
    }, 1500);
}

// Fungsi untuk menangani jawaban salah
function handleWrongAnswer(message) {
    const question = questions[currentQuestionIndex];
    wrongAnswers++;
    
    // Tambahkan ke daftar soal yang salah
    wrongQuestionsList.push({
        question: `${question.num1} × ${question.num2} = ${question.answer}`,
        userAnswer: answerInput.value || 'Tidak dijawab'
    });
    
    // Update UI
    feedbackElement.textContent = message;
    feedbackElement.className = 'feedback wrong';
    
    setTimeout(() => {
        currentQuestionIndex++;
        currentQuestionElement.textContent = currentQuestionIndex + 1;
        showQuestion();
    }, 2000);
}

// Fungsi untuk mengakhiri game
function endGame() {
    clearInterval(timerInterval);
    gameArea.style.display = 'none';
    resultsArea.style.display = 'block';
    
    // Update hasil
    finalScoreElement.textContent = score;
    correctCountElement.textContent = correctAnswers;
    wrongCountElement.textContent = wrongAnswers;
    
    // Tampilkan soal yang salah
    wrongQuestionsListElement.innerHTML = '';
    wrongQuestionsList.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.question} (Jawaban Anda: ${item.userAnswer})`;
        wrongQuestionsListElement.appendChild(li);
    });
    
    // Tampilkan pesan motivasi berdasarkan skor
    let motivationMessage = '';
    const totalPossibleScore = questions.length * 20; // Maksimal 20 poin per soal
    const percentage = (score / totalPossibleScore) * 100;
    
    if (percentage >= 90) {
        motivationMessage = 'Hebat sekali! Kamu sangat pandai berhitung!';
    } else if (percentage >= 70) {
        motivationMessage = 'Bagus! Kamu sudah menguasai perkalian dengan baik!';
    } else if (percentage >= 50) {
        motivationMessage = 'Lumayan! Teruslah berlatih perkalian!';
    } else {
        motivationMessage = 'Jangan menyerah! Teruslah berlatih perkalian setiap hari!';
    }
    
    // Tambahkan pesan motivasi
    const motivationElement = document.createElement('div');
    motivationElement.textContent = motivationMessage;
    motivationElement.style.fontSize = '1.2rem';
    motivationElement.style.fontWeight = 'bold';
    motivationElement.style.color = '#4b7bec';
    motivationElement.style.margin = '20px 0';
    
    wrongQuestionsListElement.parentNode.insertBefore(motivationElement, wrongQuestionsListElement.nextSibling);
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.log('Service Worker registration failed:', error);
      });
  });
}

// ─── CONFIG ───────────────────────────────────────
const API_URL = 'https://budget-tracker-backend-production-16e4.up.railway.app';
const AI_ENDPOINT = 'https://budget-tracker-backend-production-16e4.up.railway.app/api/ai';

// ─── AUTH CHECK ───────────────────────────────────
const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
const projectId = localStorage.getItem('currentProjectId');

if (!token) window.location.href = 'login.html';
if (!projectId) window.location.href = 'dashboard.html';

// ─── ELEMENTS ─────────────────────────────────────
const addBtn = document.getElementById('add-btn');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const transactionList = document.getElementById('transaction-list');
const balanceDisplay = document.getElementById('balance');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');

// ─── GLOBAL STATE ─────────────────────────────────
let allTransactions = [];
let aiState = 'idle';
let confirmedIncome = null;
let chatHistory = [];

// ─── LOAD TRANSACTIONS ────────────────────────────
loadTransactions();

async function loadTransactions() {
    try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}/transactions`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            window.location.href = 'login.html';
            return;
        }

        allTransactions = await res.json();
        renderList(allTransactions);
        renderBalance(allTransactions);
        renderSummary(allTransactions);
        renderChart(allTransactions);

        if (aiState === 'idle') {
            aiState = 'analyzing';
            setTimeout(() => startAIAnalysis(), 800);
        }
    } catch (error) {
        console.error('Error loading transactions:', error);
        transactionList.innerHTML = `
            <li style="text-align:center;color:#aaa;padding:20px;">
                Could not load transactions.
            </li>`;
    }
}

// ─── ADD TRANSACTION ──────────────────────────────
addBtn.addEventListener('click', async function () {
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = typeInput.value;

    if (!description || isNaN(amount) || amount <= 0) {
        alert('Please fill in a valid description and amount!');
        return;
    }

    addBtn.disabled = true;
    addBtn.textContent = 'Adding...';

    try {
        const res = await fetch(`${API_URL}/api/projects/${projectId}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ description, amount, type })
        });

        if (res.ok) {
            descriptionInput.value = '';
            amountInput.value = '';
            await loadTransactions();

            // Reset AI so it re-analyzes with new transaction data
            resetAI();
        } else {
            alert('Failed to add transaction');
        }
    } catch (error) {
        alert('Could not connect to server.');
    } finally {
        addBtn.disabled = false;
        addBtn.textContent = 'Add';
    }
});

// ─── DELETE TRANSACTION ───────────────────────────
transactionList.addEventListener('click', async function (e) {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        try {
            const res = await fetch(`${API_URL}/api/projects/${projectId}/transactions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await loadTransactions();
                // Reset AI after deleting too
                resetAI();
            } else {
                alert('Failed to delete transaction');
            }
        } catch (error) {
            alert('Could not connect to server');
        }
    }
});

// ─── RENDER LIST ──────────────────────────────────
function renderList(transactions) {
    transactionList.innerHTML = '';

    if (transactions.length === 0) {
        transactionList.innerHTML = `
            <li style="text-align:center;color:#aaa;padding:30px;">
                No transactions yet. Add one above! 👆
            </li>`;
        return;
    }

    transactions.forEach(function (t) {
        const li = document.createElement('li');
        li.classList.add(t.type);

        // Format date
        const date = new Date(t.createdAt);
        const dateStr = date.toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        });
        const timeStr = date.toLocaleTimeString('id-ID', {
            hour: '2-digit', minute: '2-digit'
        });

        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-date">${dateStr} · ${timeStr}</div>
            </div>
            <span class="transaction-amount">
                ${t.type === 'income' ? '+' : '-'}Rp ${t.amount.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
            </span>
            <button class="delete-btn" data-id="${t._id}">🗑️</button>
        `;
        transactionList.appendChild(li);
    });
}

// ─── RENDER BALANCE ───────────────────────────────
function renderBalance(transactions) {
    let balance = 0;
    transactions.forEach(t => {
        balance += t.type === 'income' ? t.amount : -t.amount;
    });
    balanceDisplay.textContent = `Rp ${balance.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
    balanceDisplay.style.color = balance >= 0 ? '#fff' : '#ffa0a0';
}

// ─── RENDER INCOME / EXPENSE SUMMARY ─────────────
function renderSummary(transactions) {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    totalIncomeEl.textContent = `Rp ${totalIncome.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
    totalExpenseEl.textContent = `Rp ${totalExpense.toLocaleString('id-ID', { minimumFractionDigits: 0 })}`;
}

// ─── RENDER CHART ─────────────────────────────────
let myChart = null;

function renderChart(transactions) {
    const chartContainer = document.getElementById('chart-container');
    const canvas = document.getElementById('myChart');

    const expenses = transactions.filter(t => t.type === 'expense');

    // Empty state
    if (expenses.length === 0) {
        canvas.style.display = 'none';
        chartContainer.innerHTML = `
            <div class="chart-empty">
                <span>📊</span>
                <p>No expense data yet.</p>
                <p>Add some expenses to see the chart!</p>
            </div>
        `;
        return;
    }

    chartContainer.innerHTML = '';
    canvas.style.display = 'block';

    const categories = {};
    expenses.forEach(t => {
        categories[t.description] = (categories[t.description] || 0) + t.amount;
    });

    const ctx = canvas.getContext('2d');
    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: ['#667eea','#764ba2','#f093fb','#4facfe','#43e97b','#fa709a','#ffecd2','#a18cd1']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

// ═══════════════════════════════════════════════════
//  AI SECTION
// ═══════════════════════════════════════════════════

async function callAI(messages) {
    const res = await fetch(AI_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messages })
    });

    const data = await res.json();
    console.log('AI response:', data);

    if (!res.ok) throw new Error('AI API error: ' + JSON.stringify(data));
    if (!data.choices || !data.choices[0]) throw new Error('Unexpected AI response: ' + JSON.stringify(data));

    return data.choices[0].message.content;
}

function addAIMessage(html) {
    const area = document.getElementById('ai-chat-area');
    const div = document.createElement('div');
    div.className = 'ai-message';
    div.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="ai-bubble">${html}</div>
    `;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

function addUserMessage(text) {
    const area = document.getElementById('ai-chat-area');
    const div = document.createElement('div');
    div.className = 'user-message';
    div.innerHTML = `<div class="user-bubble">${text}</div>`;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

function showTyping() {
    const area = document.getElementById('ai-chat-area');
    const div = document.createElement('div');
    div.className = 'ai-typing';
    div.id = 'typing-indicator';
    div.innerHTML = `
        <div class="ai-avatar">🤖</div>
        <div class="typing-dots"><span></span><span></span><span></span></div>
    `;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

function formatTransactionsForAI(transactions) {
    if (transactions.length === 0) return 'Belum ada transaksi.';
    return transactions.map(t =>
        `- [${t.type.toUpperCase()}] ${t.description}: Rp ${t.amount.toLocaleString('id-ID')}`
    ).join('\n');
}

// ─── RESET AI (called after add/delete transaction) ─
function resetAI() {
    aiState = 'idle';
    confirmedIncome = null;
    chatHistory = [];
    document.getElementById('ai-chat-area').innerHTML = '';
    setInputEnabled(false);

    aiState = 'analyzing';
    setTimeout(() => startAIAnalysis(), 600);
}

// Refresh button
document.getElementById('ai-refresh-btn').addEventListener('click', () => {
    resetAI();
});

// ─── STEP 1: ANALYZE ──────────────────────────────
async function startAIAnalysis() {
    if (allTransactions.length === 0) {
        addAIMessage('Hei! Tambahkan beberapa transaksi dulu ya, baru aku bisa analisis keuangan kamu 😊');
        setInputEnabled(false);
        return;
    }

    showTyping();

    const txList = formatTransactionsForAI(allTransactions);

    const systemPrompt = `Kamu adalah asisten keuangan personal yang cerdas dan ramah.
Kamu bisa memahami bahasa Indonesia dan Inggris dengan baik.
Tugasmu adalah menganalisis transaksi keuangan user dan membantu menilai kesehatan keuangan mereka.
Selalu jawab dalam bahasa yang sama dengan yang digunakan user dalam transaksinya.
Jangan pernah menampilkan angka dalam format scientific notation, selalu gunakan format Rupiah yang benar.`;

    const prompt = `Ini adalah daftar transaksi user:
${txList}

Analisis transaksi ini:
1. Deteksi bahasa yang digunakan (Indonesia/Inggris/campur)
2. Identifikasi mana yang kemungkinan pemasukan (income) bulanan
3. Jika ada yang terlihat seperti pemasukan, sebutkan dan tanyakan konfirmasi apakah itu benar pemasukan bulanan mereka
4. Jika tidak ada pemasukan sama sekali, tanyakan berapa pemasukan bulanan mereka

Jawab dalam 2-3 kalimat singkat, ramah, dan natural. Sebutkan nama transaksi yang kamu identifikasi sebagai pemasukan beserta jumlahnya.`;

    try {
        const reply = await callAI([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]);

        hideTyping();
        addAIMessage(reply);
        aiState = 'confirming_income';
        setInputEnabled(true);

        chatHistory = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
            { role: 'assistant', content: reply }
        ];

    } catch (err) {
        hideTyping();
        addAIMessage('Maaf, tidak bisa terhubung ke AI sekarang. Coba klik 🔄 Refresh Analysis ya.');
        console.error(err);
    }
}

// ─── STEP 2: CONFIRM INCOME ───────────────────────
async function handleIncomeConfirmation(userInput) {
    chatHistory.push({ role: 'user', content: userInput });
    showTyping();

    const txList = formatTransactionsForAI(allTransactions);
    const totalExpense = allTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const confirmPrompt = `User menjawab: "${userInput}"

Daftar transaksi lengkap:
${txList}

Total pengeluaran dari transaksi: Rp ${totalExpense.toLocaleString('id-ID')}

Tugas kamu:
1. Dari jawaban user, tentukan berapa pemasukan bulanan yang sudah dikonfirmasi (dalam angka Rupiah)
2. Jika user sudah mengkonfirmasi pemasukan, balas dengan format KHUSUS ini (WAJIB):
   INCOME_CONFIRMED:[jumlah angka saja tanpa titik/koma]
   Contoh: INCOME_CONFIRMED:5000000
3. Jika user belum jelas atau masih perlu klarifikasi, tanya lagi dengan ramah
4. Jangan tampilkan "INCOME_CONFIRMED" dalam teks chat biasa, hanya di baris pertama jika sudah terkonfirmasi`;

    try {
        const reply = await callAI([...chatHistory.slice(0, 1), { role: 'user', content: confirmPrompt }]);
        hideTyping();

        const match = reply.match(/INCOME_CONFIRMED:(\d+)/);
        if (match) {
            confirmedIncome = parseInt(match[1]);
            const cleanReply = reply.replace(/INCOME_CONFIRMED:\d+\n?/, '').trim();
            if (cleanReply) addAIMessage(cleanReply);
            chatHistory.push({ role: 'assistant', content: reply });
            setTimeout(() => showHealthDashboard(confirmedIncome, totalExpense), 500);
        } else {
            addAIMessage(reply);
            chatHistory.push({ role: 'assistant', content: reply });
        }

    } catch (err) {
        hideTyping();
        addAIMessage('Maaf ada error. Coba lagi ya.');
        console.error(err);
    }
}

// ─── STEP 3: HEALTH DASHBOARD ─────────────────────
function showHealthDashboard(income, expense) {
    const savings = income - expense;
    const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

    let statusClass, statusIcon, statusText;

    if (savingsRate >= 20) {
        statusClass = 'status-healthy';
        statusIcon = '✅';
        statusText = 'SEHAT';
    } else if (savingsRate >= 0) {
        statusClass = 'status-warning';
        statusIcon = '⚠️';
        statusText = 'PERLU PERHATIAN';
    } else {
        statusClass = 'status-danger';
        statusIcon = '🔴';
        statusText = 'DEFISIT';
    }

    const cardHTML = `
        <div class="health-card">
            <h3>📊 Ringkasan Keuangan Kamu</h3>
            <div class="health-row">
                <span class="label">💰 Pemasukan Bulanan</span>
                <span class="value">Rp ${income.toLocaleString('id-ID')}</span>
            </div>
            <div class="health-row">
                <span class="label">💸 Total Pengeluaran</span>
                <span class="value">Rp ${expense.toLocaleString('id-ID')}</span>
            </div>
            <div class="health-row">
                <span class="label">🏦 Sisa / Tabungan</span>
                <span class="value" style="color:${savings >= 0 ? '#2e7d32' : '#c62828'}">
                    Rp ${savings.toLocaleString('id-ID')}
                </span>
            </div>
            <div class="health-row">
                <span class="label">📈 Savings Rate</span>
                <span class="value">${savingsRate}%</span>
            </div>
            <div class="health-status ${statusClass}">
                ${statusIcon} Status Keuangan: ${statusText}
            </div>
        </div>
        <button class="consult-btn" onclick="startChatConsult()">
            💬 Minta Saran AI
        </button>
    `;

    addAIMessage(cardHTML);
    aiState = 'done';
    setInputEnabled(false);
}

// ─── STEP 4: CHATBOT ──────────────────────────────
function startChatConsult() {
    aiState = 'chatting';
    setInputEnabled(true);
    document.getElementById('ai-input').placeholder = 'Tanya AI soal keuangan kamu...';

    const txList = formatTransactionsForAI(allTransactions);
    const totalExpense = allTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    chatHistory = [{
        role: 'system',
        content: `Kamu adalah konsultan keuangan personal yang ramah dan berpengetahuan luas.
Kamu sudah menganalisis keuangan user ini:
- Pemasukan bulanan: Rp ${confirmedIncome.toLocaleString('id-ID')}
- Total pengeluaran: Rp ${totalExpense.toLocaleString('id-ID')}
- Sisa/tabungan: Rp ${(confirmedIncome - totalExpense).toLocaleString('id-ID')}
- Savings rate: ${Math.round(((confirmedIncome - totalExpense) / confirmedIncome) * 100)}%

Detail transaksi:
${txList}

Berikan saran yang spesifik, praktis, dan relevan berdasarkan data ini.
Jawab dalam bahasa yang sama dengan user. Gunakan format Rupiah yang benar.
Jaga jawaban tetap ringkas (max 4-5 kalimat kecuali user minta lebih detail).`
    }];

    addAIMessage('Siap! Tanya apa saja soal keuangan kamu. Misalnya: <i>"Gimana caranya aku bisa nabung lebih banyak?"</i> atau <i>"Pengeluaran mana yang harus dikurangi?"</i> 💪');
}

async function handleChatMessage(userInput) {
    chatHistory.push({ role: 'user', content: userInput });
    showTyping();

    try {
        const reply = await callAI(chatHistory);
        hideTyping();
        addAIMessage(reply);
        chatHistory.push({ role: 'assistant', content: reply });
    } catch (err) {
        hideTyping();
        addAIMessage('Maaf ada error. Coba lagi ya.');
        console.error(err);
    }
}

// ─── INPUT HANDLING ───────────────────────────────
function setInputEnabled(enabled) {
    const input = document.getElementById('ai-input');
    const btn = document.getElementById('ai-send-btn');
    input.disabled = !enabled;
    btn.disabled = !enabled;
}

document.getElementById('ai-send-btn').addEventListener('click', handleAIInput);
document.getElementById('ai-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handleAIInput();
});

async function handleAIInput() {
    const input = document.getElementById('ai-input');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMessage(text);

    if (aiState === 'confirming_income') {
        await handleIncomeConfirmation(text);
    } else if (aiState === 'chatting') {
        await handleChatMessage(text);
    }
}

setInputEnabled(false);
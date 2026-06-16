
const KEY='DailyWalletV3';
let db=JSON.parse(localStorage.getItem(KEY)||'{}');
let deferredPrompt = null;

// Calendar picker state
let calendarCurrentDate = new Date();
let availableDates = [];

// Get today's date in IST (UTC+5:30)
function today(){
  const now = new Date();
  // Convert to IST: add 5.5 hours and adjust for local timezone
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60 * 1000));
  const year = istTime.getUTCFullYear();
  const month = String(istTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istTime.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Display current date in readable format
function displayCurrentDate(){
  const date = today();
  const [year, month, day] = date.split('-');
  const formatted = `${day}-${month}-${year}`;
  const dateEl = document.getElementById('currentDate');
  if(dateEl) dateEl.textContent = `Date: ${formatted}`;
}

function loadTheme() {

    const theme =
        localStorage.getItem("theme");

    if (theme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

        document.getElementById(
            "themeToggle"
        ).innerHTML =
            "☀ Light Mode";
    }
}

function toggleTheme() {

    document.body.classList.toggle(
        "dark-mode"
    );

    const isDark =
        document.body.classList.contains(
            "dark-mode"
        );

    localStorage.setItem(
        "theme",
        isDark ? "dark" : "light"
    );

    document.getElementById(
        "themeToggle"
    ).innerHTML =
        isDark
            ? "☀ Light Mode"
            : "🌙 Dark Mode";
}

function prevDate(d){
 let x = new Date(d + 'T00:00:00Z');
 x.setUTCDate(x.getUTCDate() - 1);
 const year = x.getUTCFullYear();
 const month = String(x.getUTCMonth() + 1).padStart(2, '0');
 const day = String(x.getUTCDate()).padStart(2, '0');
 return `${year}-${month}-${day}`;
}

function dayData(){
 let t=today();
 if(!db[t]){
   let opening=0;
   let p=prevDate(t);
   if(db[p]) opening=remaining(db[p]);
   db[t]={opening,budget:0,tx:[]};
   persist();
 }
 return db[t];
}

function remaining(day){
 let added=0,spent=0;
 day.tx.forEach(x=>{
   if(x.type==='added') added+=x.amount;
   else spent+=x.amount;
 });
 return day.opening + day.budget + added - spent;
}

function persist(){
 localStorage.setItem(KEY,JSON.stringify(db));
 render();
}

function setBudget() {

    const budget =
        Number(
            document.getElementById(
                'budget'
            ).value || 0
        );

    if (budget <= 0) {
        alert('Please enter a valid budget');
        return;
    }

    dayData().budget = budget;

    persist();

    updateBudgetButton();
}

function handleBudgetButton() {

    const btn =
        document.getElementById(
            'budgetBtn'
        );

    const input =
        document.getElementById(
            'budget'
        );

    if (
        btn.textContent ===
        'Edit Budget'
    ) {

        input.readOnly = false;

        input.focus();

        btn.textContent =
            'Save Budget';

        btn.classList.remove(
            'budget-saved'
        );

        return;
    }

    setBudget();
}


function updateBudgetButton() {

    const btn =
        document.getElementById(
            'budgetBtn'
        );

    const input =
        document.getElementById(
            'budget'
        );

    const status =
        document.getElementById(
            'budgetStatus'
        );

    const budget =
        dayData().budget;

    if (budget > 0) {

        status.innerHTML =
            `Budget ₹${budget} ✓`;

        input.value = budget;

        input.readOnly = true;

        btn.textContent =
            'Edit Budget';

        btn.classList.add(
            'budget-saved'
        );

    } else {

        status.innerHTML =
            'No budget set';

        input.readOnly = false;

        btn.textContent =
            'Save Budget';

        btn.classList.remove(
            'budget-saved'
        );
    }
}

function addTx() {

    const tx = {
        id: Date.now(),
        type: document.getElementById('type').value,
        amount: Number(document.getElementById('amount').value || 0),
        note: document.getElementById('note').value || '',
        time: new Date().toLocaleTimeString()
    };

    if (tx.amount <= 0) {
        alert('Enter amount');
        return;
    }

    dayData().tx.push(tx);

    // Clear form
    document.getElementById('amount').value = '';
    document.getElementById('note').value = '';
    document.getElementById('type').value = 'spent';
    // cursor to amount field
    document.getElementById('amount').focus();

    persist();
}

function del(id){
 dayData().tx=dayData().tx.filter(x=>x.id!==id);
 persist();
}

function render(){
 const d=dayData();
 let added=0,spent=0;
 d.tx.forEach(x=>{
   if(x.type==='added') added+=x.amount;
   else spent+=x.amount;
 });

 document.getElementById('opening').textContent=d.opening;
 document.getElementById('budgetVal').textContent=d.budget;
 document.getElementById('budget').value = d.budget || '';
 document.getElementById('added').textContent=added;
 document.getElementById('spent').textContent=spent;
 document.getElementById('remaining').textContent=remaining(d);
 
 displayCurrentDate();

 let txHtml='';
 d.tx.slice().reverse().forEach(x=>{
   txHtml+=`<div class="tx">${x.type.toUpperCase()} ₹${x.amount}<br>${x.note}<br>${x.time}<br><button onclick="del(${x.id})">Delete</button></div>`;
 });
 document.getElementById('tx').innerHTML=txHtml;
 const dashboardTx = document.getElementById('dashboardTx');
 if (dashboardTx) dashboardTx.innerHTML = txHtml;

 let h='';
 Object.keys(db).sort().reverse().forEach(k=>{
   h+=`<div class="hist">${k} | Remaining ₹${remaining(db[k])}</div>`;
 });
 document.getElementById('history').innerHTML=h;
 updateBudgetButton();
}

function voiceHelp(){
  alert('Use voice like:\n\n"add 10"\nor\n"spent 30 tea"');
}

function voiceInput(){
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!SR){alert('Voice not supported');return;}
 const rec=new SR();
 rec.lang='en-IN';
 rec.onresult=(e)=>{
   const txt=e.results[0][0].transcript.toLowerCase().trim();
   const addMatch = txt.match(/(?:\b|^)(?:add|added)\s+(\d+)(?:\b|$)/);
   const spentMatch = txt.match(/(?:\b|^)spent\s+(\d+)(?:\s+(.+))?/);

   if (addMatch) {
     document.getElementById('type').value = 'added';
     document.getElementById('amount').value = addMatch[1];
     document.getElementById('note').value = txt;
     addTx();
     return;
   }

   if (spentMatch) {
     if (!spentMatch[2]) {
       alert('Please use "spent 10 tea" with a note after the amount.');
       return;
     }
     document.getElementById('type').value = 'spent';
     document.getElementById('amount').value = spentMatch[1];
     document.getElementById('note').value = txt;
     addTx();
     return;
   }

   if (txt.includes('spent')) {
     alert('Please use "spent 10 tea" with a note after the amount.');
     return;
   }

   alert('Say: add 10 or spent 30 tea');
 };
 rec.start();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const banner = document.getElementById('installBanner');
  if (banner) banner.style.display = 'flex';
});

const installBtn = document.getElementById('installButton');
const dismissBtn = document.getElementById('dismissInstall');

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;
    const banner = document.getElementById('installBanner');
    if (banner) banner.style.display = 'none';
  });
}

if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    const banner = document.getElementById('installBanner');
    if (banner) banner.style.display = 'none';
  });
}

loadTheme();
render();

// Auto-refresh when date changes (after 12 AM IST)
let lastDate = today();
setInterval(() => {
  const currentDate = today();
  if (currentDate !== lastDate) {
    lastDate = currentDate;
    // Reinitialize database with new date
    db = JSON.parse(localStorage.getItem(KEY)||'{}');
    dayData(); // Initialize today's data with 0 spent
    render();  // Refresh the UI
  }
}, 30000); // Check every 30 seconds

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

function showTab(tab){

    document.getElementById(
        'dashboardTab'
    ).style.display =
        tab === 'dashboard'
        ? 'block'
        : 'none';

    document.getElementById(
        'historyTab'
    ).style.display =
        tab === 'history'
        ? 'block'
        : 'none';

    if(tab === 'history'){
        populateHistoryDates();
    }
}

function populateHistoryDates(){
    availableDates = Object.keys(db).sort();
    
    if(availableDates.length > 0){
        calendarCurrentDate = new Date(availableDates[availableDates.length - 1]);
        selectCalendarDate(availableDates[availableDates.length - 1]);
    }
    
    renderCalendar();
    setupCalendarPicker();
}

function setupCalendarPicker(){
    const input = document.getElementById('historyDate');
    const picker = document.getElementById('calendarPicker');
    
    if(input){
        input.addEventListener('click', (e)=>{
            e.stopPropagation();
            picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
        });
    }
    
    document.addEventListener('click', (e)=>{
        if(!e.target.closest('.calendar-wrapper')){
            picker.style.display = 'none';
        }
    });
}

function renderCalendar(){
    const month = calendarCurrentDate.getMonth();
    const year = calendarCurrentDate.getFullYear();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let html = '';
    let date = new Date(startDate);
    
    for(let i = 0; i < 42; i++){
        const dateStr = formatDateString(date);
        const isCurrentMonth = date.getMonth() === month;
        const hasData = availableDates.includes(dateStr);
        const isSelected = dateStr === document.getElementById('historyDate').value;
        const isToday = dateStr === today();
        
        let classList = 'calendar-day';
        if(!isCurrentMonth) classList += ' other-month';
        if(!hasData) classList += ' disabled';
        if(isSelected) classList += ' selected';
        if(isToday) classList += ' today';
        
        html += `<div class="${classList}" onclick="selectCalendarDate('${dateStr}')">${date.getDate()}</div>`;
        
        date.setDate(date.getDate() + 1);
    }
    
    document.getElementById('calendarDays').innerHTML = html;
}

function formatDateString(date){
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function selectCalendarDate(dateStr){
    const input = document.getElementById('historyDate');
    const picker = document.getElementById('calendarPicker');
    
    if(availableDates.includes(dateStr)){
        const [year, month, day] = dateStr.split('-');
        const formattedDate = `${day}-${month}-${year}`;
        input.value = formattedDate;
        input.setAttribute('data-value', dateStr);
        
        calendarCurrentDate = new Date(dateStr);
        renderCalendar();
        picker.style.display = 'none';
        loadHistory();
    }
}

function prevMonth(){
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth(){
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
    renderCalendar();
}

function loadHistory(){

    const input =
        document.getElementById(
            'historyDate'
        );
    const dateStr = input.getAttribute('data-value');

    const day = db[dateStr];

    if(!day) return;

    let added = 0;
    let spent = 0;

    day.tx.forEach(tx=>{

        if(tx.type==='added')
            added += tx.amount;
        else
            spent += tx.amount;

    });

    let html = `
    <div class="card">

        <p>
            Opening Balance:
            ₹${day.opening}
        </p>

        <p>
            Budget:
            ₹${day.budget}
        </p>

        <p>
            Added:
            ₹${added}
        </p>

        <p>
            Spent:
            ₹${spent}
        </p>

        <h3>
            Remaining:
            ₹${remaining(day)}
        </h3>

    </div>
    `;

    html += '<h3>Transactions</h3>';

    day.tx
       .slice()
       .reverse()
       .forEach(tx=>{

        html += `
        <div class="tx">

            ${tx.type.toUpperCase()}
            ₹${tx.amount}

            <br>

            ${tx.note}

            <br>

            ${tx.time}

        </div>
        `;
    });

    document.getElementById(
        'historyDetails'
    ).innerHTML = html;
}

 

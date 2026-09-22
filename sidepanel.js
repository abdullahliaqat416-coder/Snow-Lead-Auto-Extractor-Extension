let savedDataCache = [];

document.getElementById('btnStart').onclick = () => {
    chrome.storage.local.get(['botState'], (res) => {
        if (res.botState === 'FINISHED' || res.botState === 'ERROR') {
            chrome.storage.local.set({ snowleadData: [], botState: 'INIT' }); 
        }
        chrome.runtime.sendMessage({ action: 'START_BOT' });
    });
};

document.getElementById('btnStop').onclick = () => {
    chrome.runtime.sendMessage({ action: 'STOP_BOT' });
};

document.getElementById('btnClear').onclick = () => {
    if(confirm("Delete all saved profiles?")) {
        chrome.storage.local.set({ snowleadData: [], botState: 'INIT' });
    }
};

// ==========================================
// STRICT 5-COLUMN CSV EXPORT (NO LOGIC CHANGED)
// ==========================================
document.getElementById('btnExport').onclick = () => {
    if (savedDataCache.length === 0) return;
    
    const escape = (str) => `"${(str || '').replace(/"/g, '""')}"`;
    
    const rows = savedDataCache.map(p => [
        escape(p.firstName), 
        escape(p.lastName), 
        escape(p.email), 
        escape(p.linkedinUrl), 
        escape(p.country)
    ].join(','));
    
    const csvContent = '"First Name","Last Name","Email","LinkedIn URL","Country"\r\n' + rows.join('\r\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); 
    a.href = url; a.download = `Snowlead_Pro_Leads_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
};

// LIVE UI LISTENER
chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'uiUpdate') {
        document.getElementById('uiStatus').innerText = request.status;
    }
});

// UI REFRESHER & DYNAMIC COLORS
setInterval(() => {
    chrome.storage.local.get(['snowleadData', 'botState'], (res) => {
        savedDataCache = res.snowleadData || [];
        const state = res.botState || 'INIT';

        document.getElementById('uiCount').innerText = savedDataCache.length;

        const isRunning = state === 'RUNNING';
        
        document.getElementById('btnStart').disabled = isRunning;
        document.getElementById('btnStop').disabled = !isRunning;
        document.getElementById('btnExport').disabled = savedDataCache.length === 0;

        const uiStatus = document.getElementById('uiStatus');
        const uiDot = document.getElementById('uiDot');
        
        if (state === 'FINISHED') {
            uiStatus.innerText = "Search Completed!";
            uiDot.style.background = "#21c17a"; // Green
            uiDot.style.boxShadow = "0 0 8px #21c17a";
        } else if (state === 'PAUSED') {
            uiStatus.innerText = "Bot Paused.";
            uiDot.style.background = "#ffb8b8"; // Light Red/Orange
            uiDot.style.boxShadow = "0 0 8px #ffb8b8";
        } else if (state === 'ERROR') {
            uiDot.style.background = "#ff6b6b"; // Red
            uiDot.style.boxShadow = "0 0 8px #ff6b6b";
        } else {
            // Default running / init state
            uiDot.style.background = "#5759ff"; // Neon Purple/Blue
            uiDot.style.boxShadow = "0 0 8px #5759ff";
        }
    });
}, 800);
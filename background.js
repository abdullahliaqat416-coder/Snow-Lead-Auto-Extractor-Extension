// ============================================================
// SNOWLEAD - BACKGROUND AUTO-PILOT (SLOW INTERNET RESILIENCE)
// ============================================================

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ snowleadData: [], botState: 'INIT' });
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

let isRunning = false;
let activeTabId = null;

const sleep = (ms) => new Promise(res => setTimeout(res, ms));

async function executeDOM(action, payload = null) {
    if (!activeTabId) throw new Error("No active tab.");
    
    let maxRetries = 8; // 8 * 5s = 40 seconds max wait for slow internet
    let lastErrorMsg = "";

    while (maxRetries > 0) {
        try {
            // Re-inject if page is reloading due to slow internet
            try { await chrome.scripting.executeScript({ target: { tabId: activeTabId }, files: ['content.js'] }); } catch (e) {}

            return await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error(`Timeout on ${action}`)), 600000); 
                chrome.tabs.sendMessage(activeTabId, { action, payload }, (res) => {
                    clearTimeout(timer);
                    if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
                    if (!res || !res.success) return reject(new Error(res?.error || "DOM Error"));
                    resolve(res.data);
                });
            });
        } catch (err) {
            lastErrorMsg = err.message;
            // Agar page load ho raha hai (net slow hai) toh connection disconnect ka error aata hai
            if (err.message.toLowerCase().includes("receiving end does not exist") || 
                err.message.toLowerCase().includes("disconnected") || 
                err.message.toLowerCase().includes("closed")) {
                
                chrome.runtime.sendMessage({ action: 'uiUpdate', status: 'Waiting for slow internet to load page...' });
                maxRetries--;
                await sleep(5000); // 5 seconds ruko aur dobara try karo
            } else {
                throw err; // Asli error ho toh crash hone do
            }
        }
    }
    throw new Error(`Internet too slow or page failed to load: ${lastErrorMsg}`);
}

async function runAutoPilot() {
    isRunning = true;
    chrome.storage.local.set({ botState: 'RUNNING' });

    while (isRunning) {
        try {
            // STEP 1: Auto Scroll
            chrome.runtime.sendMessage({ action: 'uiUpdate', status: 'Scrolling page...' });
            await executeDOM('AUTO_SCROLL');
            await sleep(1500);

            if (!isRunning) break;

            // STEP 2: Process Profiles (Cross tab dabayega jab page poora hoga)
            chrome.runtime.sendMessage({ action: 'uiUpdate', status: 'Extracting Real URLs...' });
            const profiles = await executeDOM('PROCESS_PROFILES');

            if (profiles && profiles.length > 0) {
                const storage = await chrome.storage.local.get(['snowleadData']);
                const existing = storage.snowleadData || [];
                
                const uniqueMap = new Map();
                [...existing, ...profiles].forEach(p => uniqueMap.set(p.firstName + p.lastName, p));
                const finalData = Array.from(uniqueMap.values());
                
                await chrome.storage.local.set({ snowleadData: finalData });
            }

            if (!isRunning) break;

            // STEP 3: Click 'Next Arrow'
            chrome.runtime.sendMessage({ action: 'uiUpdate', status: 'Clicking Next Page...' });
            const hasNext = await executeDOM('CLICK_NEXT_PAGE');

            if (hasNext) {
                chrome.runtime.sendMessage({ action: 'uiUpdate', status: 'Loading next page...' });
                await sleep(4000); // Base wait, baki executeDOM ka retry sambhal lega
            } else {
                isRunning = false;
                chrome.storage.local.set({ botState: 'FINISHED' });
                chrome.runtime.sendMessage({ action: 'uiUpdate', status: 'Search Completed!' });
                break;
            }

        } catch (error) {
            console.error("Auto-Pilot Error:", error);
            isRunning = false;
            chrome.storage.local.set({ botState: 'ERROR' });
            chrome.runtime.sendMessage({ action: 'uiUpdate', status: `Error: ${error.message}` });
            break;
        }
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'START_BOT') {
        chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
            if (tabs.length) {
                activeTabId = tabs[0].id;
                runAutoPilot();
                sendResponse({ success: true });
            }
        });
        return true;
    }
    
    if (request.action === 'STOP_BOT') {
        isRunning = false;
        chrome.storage.local.set({ botState: 'PAUSED' });
        sendResponse({ success: true });
        return true;
    }
});
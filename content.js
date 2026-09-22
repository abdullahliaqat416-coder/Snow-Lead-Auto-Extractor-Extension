// ============================================================================
// SNOWLEAD - RECRUITER LITE (CONTINUOUS DRAWER & SLOW NET FIX)
// ============================================================================

(function() {
    'use strict';
    if (window.snowleadContentReady) return;
    window.snowleadContentReady = true;
  
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
    const DOM = {
        clean: (str) => str ? str.replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim() : ''
    };

    class Workflow {
        static async scrollPage() {
            // SLOW INTERNET SAFEGUARD: Wait up to 30 seconds for at least 1 profile to appear
            let waitTime = 0;
            while (waitTime < 30000) {
                const cards = document.querySelectorAll('li.reusable-search__result-container, .search-result__wrapper, [data-test-search-result], li.search-results__result-item');
                if (cards.length > 0) break;
                await sleep(1000);
                waitTime += 1000;
            }

            let lastScrollY = -1, stuckCount = 0;
            for (let step = 0; step < 25; step++) {
                window.scrollBy(0, 600);
                await sleep(800);

                const pagBtn = document.querySelector('button.artdeco-pagination__button--next, a.mini-pagination-next, [aria-label*="Go to next page"]');
                if (pagBtn && pagBtn.getBoundingClientRect().top <= window.innerHeight + 150) break; 
                if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 250) break;

                if (window.scrollY === lastScrollY) {
                    stuckCount++;
                    if (stuckCount >= 3) break; 
                } else { stuckCount = 0; lastScrollY = window.scrollY; }
            }
            await sleep(1000); 
        }

        static async processProfiles() {
            const profiles = [];
            
            const nameLinks = Array.from(document.querySelectorAll('.artdeco-entity-lockup__title a, a[data-anonymize="person-name"], [data-test-row-lockup-title] a, .entity-result__title-text a, a.app-aware-link'));

            const validLinks = nameLinks.filter(el => {
                const txt = DOM.clean(el.textContent);
                return txt && !txt.toLowerCase().includes('linkedin member');
            });

            for (let i = 0; i < validLinks.length; i++) {
                try {
                    const linkEl = validLinks[i];
                    
                    const rawName = DOM.clean(linkEl.textContent);
                    const parts = rawName.split(/\s+/).filter(p => p.length > 0 && !/^\d+$/.test(p));
                    const fName = parts[0] || ''; 
                    const lName = parts.slice(1).join(' ');

                    let cardWrapper = linkEl.closest('li, .search-result__wrapper, [data-test-row-lockup]') || linkEl.parentElement.parentElement;
                    let country = "";
                    if (cardWrapper) {
                        const locEl = cardWrapper.querySelector('.entity-result__secondary-subtitle, .artdeco-entity-lockup__caption, [data-test-row-lockup-location]');
                        if (locEl) {
                            const locParts = DOM.clean(locEl.textContent).split(',');
                            country = DOM.clean(locParts[locParts.length - 1]);
                            if (country.toLowerCase().includes('area')) country = "United States";
                        }
                    }

                    const id = btoa(unescape(encodeURIComponent(rawName))).substring(0, 20);

                    chrome.runtime.sendMessage({ action: 'uiUpdate', status: `Opening: ${fName} (${i+1}/${validLinks.length})` });

                    // Click on the name to open/swap the overlay
                    linkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await sleep(800);
                    linkEl.click();

                    let overlayOpened = false;
                    for(let w = 0; w < 10; w++) {
                        if (document.querySelector('[aria-label="Exit profile view"], [data-test-close-pagination-header-button], .pagination-header__close-control')) {
                            overlayOpened = true;
                            break;
                        }
                        await sleep(500);
                    }

                    let linkedinUrl = "";
                    let email = "";

                    if (overlayOpened) {
                        // Wait for the drawer content to update with the new candidate's data
                        await sleep(2000); 

                        const allLinks = Array.from(document.querySelectorAll('a')).filter(a => a.href && a.href.includes('linkedin.com/in/') && !a.href.includes('/talent/'));
                        if (allLinks.length > 0) linkedinUrl = allLinks[0].href.split('?')[0];
                        
                        // YAHAN SE CROSS (X) KA BUTTON HATA DIYA GAYA HAI
                        // Ab yeh agli profile khol dega isi drawer ke andar!
                    }

                    profiles.push({ id, firstName: fName, lastName: lName, email: email, linkedinUrl, country });

                } catch (e) {
                    console.error("Profile skip ho gayi:", e);
                }
            }

            // LOOP KHATAM HONE KE BAAD (PAGE KE AAKHIR MEIN) CROSS (X) DABAYEGA
            chrome.runtime.sendMessage({ action: 'uiUpdate', status: `Closing profile view...` });
            const crossBtn = document.querySelector('[aria-label="Exit profile view"], [data-test-close-pagination-header-button], .pagination-header__close-control');
            if (crossBtn) {
                crossBtn.click();
            } else {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            }
            await sleep(1500); // Cross dabane ke baad band hone ka intezar karega

            return profiles;
        }

        static clickNextArrow() {
            const btn = document.querySelector('[aria-label*="Go to next page"], button.artdeco-pagination__button--next, a.mini-pagination-next');
            if (!btn || btn.hasAttribute('disabled') || btn.classList.contains('disabled')) return false;
            
            btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => btn.click(), 500); 
            return true;
        }
    }

    chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
        (async () => {
            try {
                if (req.action === 'AUTO_SCROLL') { 
                    await Workflow.scrollPage(); 
                    sendResponse({ success: true }); 
                }
                else if (req.action === 'PROCESS_PROFILES') { 
                    const data = await Workflow.processProfiles();
                    sendResponse({ success: true, data: data }); 
                }
                else if (req.action === 'CLICK_NEXT_PAGE') { 
                    const hasNext = Workflow.clickNextArrow();
                    sendResponse({ success: true, data: hasNext }); 
                }
            } catch (err) { sendResponse({ success: false, error: err.message }); }
        })();
        return true;
    });
})();
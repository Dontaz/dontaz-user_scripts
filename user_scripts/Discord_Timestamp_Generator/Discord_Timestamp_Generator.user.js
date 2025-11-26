// ==UserScript==
// @name        Discord Timestamp Generator
// @namespace   discord-timestamp
// @version     1.2
// @description Creates a popup for generating Discord timestamps with a hotkey
// @author      Dontaz
// @match       *://*/*
// @grant       GM_addStyle
// @updateURL   https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/Discord_Timestamp_Generator/Discord_Timestamp_Generator.user.js
// @downloadURL https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/Discord_Timestamp_Generator/Discord_Timestamp_Generator.user.js
// ==/UserScript==

(function() {
    'use strict';

    let isInitialized = false;

    const cssStyles = `
        #discord-timestamp-overlay {
            position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important;
            background-color: rgba(0, 0, 0, 0.5) !important; z-index: 2147483646 !important;
            display: none; animation: dtg-fadeIn 0.2s ease-out;
            margin: 0 !important; padding: 0 !important;
        }
        #discord-timestamp-popup {
            position: fixed !important; top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;
            background-color: #313338 !important; color: #dbdee1 !important; border-radius: 8px !important; padding: 24px !important;
            z-index: 2147483647 !important; box-shadow: 0 2px 10px 0 rgba(0,0,0,0.2) !important;
            font-family: "gg sans", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
            width: 500px !important; display: none; font-size: 16px !important;
            line-height: 1.5 !important; text-align: left !important; box-sizing: border-box !important;
            animation: dtg-slideIn 0.2s ease-out; border: none !important;
        }
        
        #discord-timestamp-popup * {
            box-sizing: border-box !important;
            font-family: "gg sans", "Helvetica Neue", Helvetica, Arial, sans-serif !important;
            scrollbar-width: thin;
        }

        @keyframes dtg-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dtg-slideIn {
            from { opacity: 0; transform: translate(-50%, -45%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
        }

        #discord-timestamp-popup h2 { 
            margin: 0 0 20px 0 !important; color: #f2f3f5 !important; font-size: 24px !important; 
            display: flex !important; justify-content: space-between !important; line-height: 1.2 !important; 
            border: none !important; padding: 0 !important; background: none !important; font-weight: 700 !important;
        }
        #discord-timestamp-popup .close-x { cursor: pointer !important; color: #b5bac1 !important; transition: color 0.2s !important; font-weight: normal !important; }
        #discord-timestamp-popup .close-x:hover { color: #f2f3f5 !important; }
        
        #discord-timestamp-popup .input-group { margin-bottom: 20px !important; display: block !important; }
        #discord-timestamp-popup label { 
            display: block !important; margin-bottom: 8px !important; font-size: 12px !important; 
            color: #b5bac1 !important; text-transform: uppercase !important; font-weight: 700 !important; 
            line-height: 1.3 !important; padding: 0 !important; letter-spacing: 0.02em !important;
        }
        
        #discord-timestamp-popup .input-wrapper { position: relative !important; display: block !important; height: auto !important; }
        
        #discord-timestamp-popup .now-button {
            position: absolute !important; right: 8px !important; top: 50% !important; transform: translateY(-50%) !important;
            background-color: #5865f2 !important; color: white !important; border: none !important; padding: 4px 12px !important;
            border-radius: 3px !important; font-size: 13px !important; cursor: pointer !important; transition: background-color 0.2s !important;
            line-height: normal !important; height: auto !important; margin: 0 !important; width: auto !important;
            box-shadow: none !important; text-shadow: none !important; min-height: 0 !important;
        }
        #discord-timestamp-popup .now-button:hover { background-color: #4752c4 !important; }
        
        #discord-timestamp-popup input, #discord-timestamp-popup select {
            width: 100% !important; padding: 10px !important; border: 1px solid #1e1f22 !important;
            background-color: #1e1f22 !important; color: #f2f3f5 !important; border-radius: 4px !important;
            font-size: 16px !important; height: 40px !important; min-height: 40px !important; max-height: 40px !important;
            box-sizing: border-box !important; margin: 0 !important; display: block !important;
            line-height: normal !important; -webkit-appearance: none !important; appearance: none !important;
            box-shadow: none !important; text-indent: 0 !important;
        }
        #discord-timestamp-popup input:focus, #discord-timestamp-popup select:focus { outline: none !important; border-color: #5865f2 !important; }
        
        #discord-timestamp-popup #timestamp-preview {
            background-color: #2b2d31 !important; padding: 12px !important; border-radius: 4px !important;
            display: flex !important; justify-content: space-between !important; align-items: center !important;
            font-family: monospace !important; border: 1px solid #1e1f22 !important;
            min-height: 40px !important; margin: 0 !important; line-height: normal !important;
        }
        #discord-timestamp-popup .preview-example { color: #949ba4 !important; font-size: 14px !important; font-family: "gg sans", sans-serif !important; }
        
        #discord-timestamp-popup .buttons { display: flex !important; justify-content: flex-end !important; gap: 12px !important; margin-top: 24px !important; }
        #discord-timestamp-popup button.action-btn {
            padding: 10px 24px !important; border: none !important; border-radius: 3px !important; cursor: pointer !important; 
            font-size: 14px !important; font-weight: 500 !important; transition: background-color 0.2s !important;
            line-height: normal !important; margin: 0 !important; height: auto !important; width: auto !important;
            background-image: none !important; text-shadow: none !important;
        }
        #discord-timestamp-popup .copy-btn { background-color: #5865f2 !important; color: white !important; }
        #discord-timestamp-popup .copy-btn:hover { background-color: #4752c4 !important; }
        #discord-timestamp-popup .close-btn { background-color: transparent !important; color: white !important; }
        #discord-timestamp-popup .close-btn:hover { text-decoration: underline !important; }
        
        #discord-timestamp-popup .success-message {
            position: absolute !important; bottom: 85px !important; left: 50% !important; transform: translateX(-50%) !important;
            background-color: #23a559 !important; color: white !important; padding: 8px 16px !important; border-radius: 4px !important;
            font-size: 14px !important; opacity: 0; pointer-events: none !important; transition: opacity 0.3s !important;
            z-index: 2147483648 !important; width: auto !important; text-align: center !important; line-height: normal !important;
        }
        #discord-timestamp-popup .success-message.show { opacity: 1 !important; }
        
        #discord-timestamp-popup .hotkey-info { 
            text-align: center !important; color: #949ba4 !important; font-size: 12px !important; 
            margin-top: 16px !important; padding-top: 10px !important; border-top: 1px solid #3f4147 !important; 
            line-height: 1.5 !important; display: block !important; width: 100% !important;
        }
    `;

    const popupHTML = `
        <div id="discord-timestamp-overlay"></div>
        <div id="discord-timestamp-popup">
            <h2>Discord Timestamp Generator <span class="close-x">&times;</span></h2>
            
            <div class="input-group">
                <label>Date & Time (Local)</label>
                <div class="input-wrapper">
                    <input type="datetime-local" id="timestamp-date">
                    <button class="now-button" id="set-now">Reset</button>
                </div>
            </div>

            <div class="input-group">
                <label>Format</label>
                <select id="timestamp-format">
                    <option value="R">Relative Time (2 hours ago)</option>
                    <option value="t">Short Time (16:20)</option>
                    <option value="T">Long Time (16:20:30)</option>
                    <option value="d">Short Date (20/04/2023)</option>
                    <option value="D">Long Date (20 April 2023)</option>
                    <option value="f" selected>Short Date/Time (20 April 2023 16:20)</option>
                    <option value="F">Long Date/Time (Thursday, 20 April...)</option>
                </select>
            </div>

            <div class="input-group">
                <label>Preview</label>
                <div id="timestamp-preview">
                    <span id="preview-code" style="color: #5865f2;"></span>
                    <span class="preview-example" id="preview-example"></span>
                </div>
            </div>

            <div class="buttons">
                <button class="action-btn close-btn" id="close-popup">Cancel</button>
                <button class="action-btn copy-btn" id="copy-timestamp">Copy</button>
            </div>
            
            <div class="success-message" id="copy-success">Copied!</div>
            <div class="hotkey-info"><strong>Alt+A</strong> to toggle • <strong>Esc</strong> to close • <strong>Enter</strong> to copy</div>
        </div>
    `;

    function init() {
        if (isInitialized) return;
        
        GM_addStyle(cssStyles);
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        const overlay = document.getElementById('discord-timestamp-overlay');
        const popup = document.getElementById('discord-timestamp-popup');
        const dateInput = document.getElementById('timestamp-date');
        const formatSelect = document.getElementById('timestamp-format');
        const nowBtn = document.getElementById('set-now');
        const copyBtn = document.getElementById('copy-timestamp');
        const closeBtn = document.getElementById('close-popup');
        const closeX = popup.querySelector('.close-x');
        
        dateInput.addEventListener('input', updatePreview);
        formatSelect.addEventListener('change', updatePreview);
        
        nowBtn.addEventListener('click', () => {
            setCurrentDateTime();
            updatePreview();
        });

        copyBtn.addEventListener('click', copyToClipboard);
        
        [closeBtn, closeX, overlay].forEach(el => el.addEventListener('click', hidePopup));
        
        popup.addEventListener('click', e => e.stopPropagation());

        isInitialized = true;
    }

    function setCurrentDateTime() {
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(now - offsetMs)).toISOString().slice(0, 16);
        document.getElementById('timestamp-date').value = localISOTime;
    }

    function getFormatExample(timestamp, format) {
        const date = new Date(timestamp * 1000);
        
        if (format === 'R') {
            const diffSeconds = (timestamp * 1000 - Date.now()) / 1000;
            const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
            
            if (Math.abs(diffSeconds) < 60) return rtf.format(Math.round(diffSeconds), 'second');
            if (Math.abs(diffSeconds) < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
            if (Math.abs(diffSeconds) < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
            return rtf.format(Math.round(diffSeconds / 86400), 'day');
        }

        const options = {
            t: { timeStyle: 'short', hour12: false },
            T: { timeStyle: 'medium', hour12: false },
            d: { dateStyle: 'short' },
            D: { dateStyle: 'long' },
            f: { dateStyle: 'long', timeStyle: 'short', hour12: false },
            F: { dateStyle: 'full', timeStyle: 'short', hour12: false }
        };

        return date.toLocaleString('en-GB', options[format]);
    }

    function updatePreview() {
        const dateInput = document.getElementById('timestamp-date');
        if (!dateInput.value) return;

        const dateObj = new Date(dateInput.value);
        const timestamp = Math.floor(dateObj.getTime() / 1000);
        const format = document.getElementById('timestamp-format').value;
        
        document.getElementById('preview-code').textContent = `<t:${timestamp}:${format}>`;
        document.getElementById('preview-example').textContent = getFormatExample(timestamp, format);
    }

    function showPopup() {
        if (!isInitialized) init();
        
        setCurrentDateTime();
        updatePreview();
        
        document.getElementById('discord-timestamp-overlay').style.display = 'block';
        document.getElementById('discord-timestamp-popup').style.display = 'block';
        document.getElementById('timestamp-date').focus();
    }

    function hidePopup() {
        if (!isInitialized) return;
        document.getElementById('discord-timestamp-overlay').style.display = 'none';
        document.getElementById('discord-timestamp-popup').style.display = 'none';
    }

    function copyToClipboard() {
        const text = document.getElementById('preview-code').textContent;
        
        const success = () => {
            const msg = document.getElementById('copy-success');
            msg.classList.add('show');
            setTimeout(() => {
                msg.classList.remove('show');
                hidePopup();
            }, 1000);
        };

        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(success);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            success();
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.altKey && (e.code === 'KeyA')) {
            e.preventDefault();
            const popup = document.getElementById('discord-timestamp-popup');
            if (popup && popup.style.display === 'block') {
                hidePopup();
            } else {
                showPopup();
            }
        }

        const popup = document.getElementById('discord-timestamp-popup');
        if (popup && popup.style.display === 'block') {
            if (e.key === 'Escape') hidePopup();
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                copyToClipboard();
            }
        }
    });

})();
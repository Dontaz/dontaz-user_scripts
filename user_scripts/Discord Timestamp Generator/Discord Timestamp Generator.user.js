// ==UserScript==
// @name        Discord Timestamp Generator
// @namespace   discord-timestamp
// @version     1
// @description Creates a popup for generating Discord timestamps with a hotkey
// @author      Dontaz
// @match       *://*/*
// @grant       GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    let isInitialized = false;

    const cssStyles = `
        #discord-timestamp-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0, 0, 0, 0.5); z-index: 2147483646;
            display: none; animation: dtg-fadeIn 0.2s ease-out;
        }
        #discord-timestamp-popup {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background-color: #313338; color: #dbdee1; border-radius: 8px; padding: 24px;
            z-index: 2147483647; box-shadow: 0 2px 10px 0 rgba(0,0,0,0.2);
            font-family: "gg sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
            width: 500px; display: none; font-size: 16px;
            animation: dtg-slideIn 0.2s ease-out;
        }
        @keyframes dtg-fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes dtg-slideIn {
            from { opacity: 0; transform: translate(-50%, -45%); }
            to { opacity: 1; transform: translate(-50%, -50%); }
        }
        #discord-timestamp-popup h2 { margin: 0 0 20px; color: #f2f3f5; font-size: 24px; display: flex; justify-content: space-between; }
        #discord-timestamp-popup .close-x { cursor: pointer; color: #b5bac1; transition: color 0.2s; }
        #discord-timestamp-popup .close-x:hover { color: #f2f3f5; }
        #discord-timestamp-popup .input-group { margin-bottom: 20px; }
        #discord-timestamp-popup label { display: block; margin-bottom: 8px; font-size: 12px; color: #b5bac1; text-transform: uppercase; font-weight: 700; }
        #discord-timestamp-popup .input-wrapper { position: relative; }
        #discord-timestamp-popup .now-button {
            position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
            background-color: #5865f2; color: white; border: none; padding: 4px 12px;
            border-radius: 3px; font-size: 13px; cursor: pointer; transition: background-color 0.2s;
        }
        #discord-timestamp-popup .now-button:hover { background-color: #4752c4; }
        #discord-timestamp-popup input, #discord-timestamp-popup select {
            width: 100%; padding: 10px; border: 1px solid #1e1f22;
            background-color: #1e1f22; color: #f2f3f5; border-radius: 4px;
            font-size: 16px; height: 40px; box-sizing: border-box;
        }
        #discord-timestamp-popup input:focus, #discord-timestamp-popup select:focus { outline: none; border-color: #5865f2; }
        #discord-timestamp-popup #timestamp-preview {
            background-color: #2b2d31; padding: 12px; border-radius: 4px;
            display: flex; justify-content: space-between; align-items: center;
            font-family: monospace; border: 1px solid #1e1f22;
        }
        #discord-timestamp-popup .preview-example { color: #949ba4; font-size: 14px; font-family: sans-serif; }
        #discord-timestamp-popup .buttons { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
        #discord-timestamp-popup button.action-btn {
            padding: 10px 24px; border: none; border-radius: 3px; cursor: pointer; font-size: 14px; font-weight: 500; transition: background-color 0.2s;
        }
        #discord-timestamp-popup .copy-btn { background-color: #5865f2; color: white; }
        #discord-timestamp-popup .copy-btn:hover { background-color: #4752c4; }
        #discord-timestamp-popup .close-btn { background-color: transparent; color: white; }
        #discord-timestamp-popup .close-btn:hover { text-decoration: underline; }
        #discord-timestamp-popup .success-message {
            position: absolute; bottom: 85px; left: 50%; transform: translateX(-50%);
            background-color: #23a559; color: white; padding: 8px 16px; border-radius: 4px;
            font-size: 14px; opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }
        #discord-timestamp-popup .success-message.show { opacity: 1; }
        #discord-timestamp-popup .hotkey-info { text-align: center; color: #949ba4; font-size: 12px; margin-top: 16px; padding-top: 10px; border-top: 1px solid #3f4147; }
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
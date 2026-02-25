// ==UserScript==
// @name         MAL x Kodik
// @namespace    MAL x Kodik by dontaz
// @version      2.0
// @description  Userscript that adds a convenient "Watch" button to MyAnimeList anime pages, linking directly to the Kodik player. Seamlessly integrates into the sidebar with a clean, animated design.
// @author       Dontaz
// @match        https://myanimelist.net/anime/*
// @grant        none
// @updateURL    https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/MALxKodik/MALxKodik.user.js
// @downloadURL  https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/MALxKodik/MALxKodik.user.js
// @supportURL	 https://github.com/Dontaz/dontaz-user_scripts
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        .watch-button-container {
            width: 100%;
            margin-top: 8px;
            text-align: center;
        }

        .watch-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            padding: 8px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff !important;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-decoration: none !important;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
            position: relative;
            overflow: hidden;
            line-height: 1;
        }

        .watch-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
            );
            transition: left 0.5s ease;
        }

        .watch-button:hover::before {
            left: 100%;
        }

        .watch-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(102, 126, 234, 0.6);
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            text-decoration: none !important;
        }

        .watch-button:active {
            transform: translateY(0px) scale(0.98);
            box-shadow: 0 2px 6px rgba(102, 126, 234, 0.4);
        }

        .watch-button-icon {
            width: 22px;
            height: 22px;
            fill: #ffffff;
            flex-shrink: 0;
            filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
        }
    `;
    document.head.appendChild(style);

    function getTotalEpisodes() {
        const curEpsSpan = document.querySelector('#curEps');
        if (curEpsSpan) {
            const dataNum = parseInt(curEpsSpan.getAttribute('data-num'), 10);
            if (dataNum > 0) return dataNum;

            const textNum = parseInt(curEpsSpan.textContent.trim(), 10);
            if (textNum > 0) return textNum;
        }

        const episodesSpan = document.querySelector('span.information.studio.author span');
        const sidebarItems = document.querySelectorAll('.leftside .spaceit_pad');
        for (const item of sidebarItems) {
            if (item.textContent.includes('Episodes:')) {
                const num = parseInt(item.textContent.replace(/\D/g, ''), 10);
                if (num > 0) return num;
            }
        }

        return 0;
    }

    function getNextEpisode() {
        const watchedInput = document.querySelector('#myinfo_watchedeps');
        if (!watchedInput) return '';

        const watchedValue = parseInt(watchedInput.value, 10);
        if (isNaN(watchedValue) || watchedValue < 0) return '';

        const totalEps = getTotalEpisodes();
        const nextEpisode = watchedValue + 1;

        if (totalEps > 0 && nextEpisode > totalEps) return '';

        return nextEpisode.toString();
    }

    function buildKodikUrl(animeId) {
        const episode = getNextEpisode();
        return `https://mal-to-kodik.github.io/?anime=${animeId}&translation=&season=&episode=${episode}`;
    }

    function checkAndAddButton() {
        const posterImage = document.querySelector('td.borderClass .leftside img[itemprop="image"], td.borderClass .leftside img.lazyloaded, td.borderClass .leftside a[href*="/anime/"] img');
        if (!posterImage || document.querySelector('.watch-button-container')) return;

        const leftside = document.querySelector('td.borderClass .leftside') || posterImage.closest('.leftside');
        if (!leftside) return;

        const animeId = window.location.pathname.split('/')[2];

        const container = document.createElement('div');
        container.className = 'watch-button-container';

        const watchButton = document.createElement('a');
        watchButton.className = 'watch-button';
        watchButton.href = buildKodikUrl(animeId);
        watchButton.target = '_blank';
        watchButton.rel = 'noopener noreferrer';
        watchButton.innerHTML = `
            <svg class="watch-button-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 5v14l11-7z"/>
            </svg>
            Watch Kodik
        `;

        watchButton.addEventListener('click', function(e) {
            this.href = buildKodikUrl(animeId);
        });

        container.appendChild(watchButton);

        const watchEpisodesBtn = leftside.querySelector('a[href*="watch/"]')?.closest('div');
        if (watchEpisodesBtn) {
            watchEpisodesBtn.parentNode.insertBefore(container, watchEpisodesBtn.nextSibling);
        } else {
            const imgContainer = posterImage.closest('a')?.parentElement || posterImage.parentElement;
            imgContainer.parentNode.insertBefore(container, imgContainer.nextSibling);
        }
    }

    const observer = new MutationObserver(() => {
        if (!document.querySelector('.watch-button-container')) {
            checkAndAddButton();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    checkAndAddButton();

    setTimeout(() => observer.disconnect(), 15000);
})();
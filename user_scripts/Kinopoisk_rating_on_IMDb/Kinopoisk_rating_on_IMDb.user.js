// ==UserScript==
// @name         Kinopoisk rating on IMDb
// @namespace    kinopoisk-rating-on-imdb
// @version      1.0
// @description  Shows the Kinopoisk rating on IMDB pages
// @author       Dontaz
// @match        https://www.imdb.com/title/tt*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      kinopoiskapiunofficial.tech
// @homepageURL  https://dontaz.github.io/other/code-generator-kinopoisk-imdb-rating/generator.html
// @supportURL	 https://github.com/Dontaz/dontaz-user_scripts
// ==/UserScript==

(function() {
    'use strict';
    GM_addStyle(`
        .kinopoisk-rating-container { display: inline-flex; align-items: center; margin-left: 20px; background: #ff6600; color: white; padding: 5px 12px; border-radius: 4px; font-size: 1.2em; font-weight: bold; }
        .kinopoisk-rating-container.loading { background: #999; }
        .kinopoisk-rating-container.error { background: #d32f2f; font-size: 0.9em; }
        .kinopoisk-logo { width: 20px; height: 20px; margin-right: 8px; filter: brightness(0) invert(1); }
    `);
    function getImdbId() {
        const match = window.location.pathname.match(/\/title\/(tt\d+)/);
        return match ? match[1] : null;
    }
    function getMovieTitle() {
        const titleElement = document.querySelector('[data-testid="hero-title-block__title"]') || document.querySelector('h1') || document.querySelector('.title_wrapper h1');
        if (titleElement) return titleElement.textContent.trim();
        return null;
    }
    function getMovieYear() {
        const yearElement = document.querySelector('[data-testid="hero-title-block__metadata"] a') || document.querySelector('.TitleBlockMetaData__ListItemText-sc-12ein40-2') || document.querySelector('.title_wrapper h1 span.year') || document.querySelector('span.release-year');
        if (yearElement) {
            const yearMatch = yearElement.textContent.match(/\d{4}/);
            return yearMatch ? yearMatch[0] : null;
        }
        return null;
    }
    function createRatingElement() {
        const container = document.createElement('div');
        container.className = 'kinopoisk-rating-container loading';
        container.innerHTML = '<svg class="kinopoisk-logo" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-2-13l6 5-6 5V7z"/></svg><span>...</span>';
        return container;
    }
    async function searchKinopoisk(title, year, imdbId) {
        const API_KEY = 'KEY_PLACEHOLDER';
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://kinopoiskapiunofficial.tech/api/v2.2/films?imdbId=${imdbId}`,
                headers: { 'X-API-KEY': API_KEY, 'Content-Type': 'application/json' },
                onload: function(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data.items && data.items.length > 0) {
                            const film = data.items[0];
                            resolve({ rating: film.ratingKinopoisk, filmId: film.kinopoiskId });
                        } else {
                            searchByTitle(title, year, API_KEY, resolve, reject);
                        }
                    } catch (e) { reject(e); }
                },
                onerror: reject
            });
        });
    }
    function searchByTitle(title, year, apiKey, resolve, reject) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: `https://kinopoiskapiunofficial.tech/api/v2.1/films/search-by-keyword?keyword=${encodeURIComponent(title)}`,
            headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.films && data.films.length > 0) {
                        let bestMatch = data.films[0];
                        if (year) {
                            for (const film of data.films) {
                                if (film.year === year) { bestMatch = film; break; }
                            }
                        }
                        resolve({ rating: bestMatch.rating, filmId: bestMatch.filmId });
                    } else { reject(new Error('NotFound')); }
                } catch (e) { reject(e); }
            },
            onerror: reject
        });
    }
    function insertRating(ratingElement, kinopoiskData) {
        const rating = kinopoiskData.rating;
        if (rating && rating !== 'null') {
            ratingElement.className = 'kinopoisk-rating-container';
            ratingElement.querySelector('span').textContent = rating;
            if (kinopoiskData.filmId) {
                ratingElement.style.cursor = 'pointer';
                ratingElement.title = 'Kinopoisk';
                ratingElement.onclick = () => { window.open(`https://www.kinopoisk.ru/film/${kinopoiskData.filmId}/`, '_blank'); };
            }
        } else {
            ratingElement.className = 'kinopoisk-rating-container error';
            ratingElement.querySelector('span').textContent = '-';
        }
    }
    let currentImdbId = null;
    async function main() {
        const imdbId = getImdbId();
        if (!imdbId) return;
        if (currentImdbId === imdbId && document.querySelector('.kinopoisk-rating-container')) return;
        if (currentImdbId !== imdbId) {
            const oldRating = document.querySelector('.kinopoisk-rating-container');
            if (oldRating) oldRating.remove();
            currentImdbId = imdbId;
        }
        const title = getMovieTitle();
        const year = getMovieYear();
        if (!title) return;
        const ratingContainer = document.querySelector('[data-testid="hero-rating-bar__aggregate-rating"]') || document.querySelector('.AggregateRatingButton__ContentWrap-sc-1ll29m0-0') || document.querySelector('.ratings_wrapper') || document.querySelector('.imdbRating');
        if (!ratingContainer) return;
        const ratingElement = createRatingElement();
        ratingContainer.parentElement.appendChild(ratingElement);
        try {
            const kinopoiskData = await searchKinopoisk(title, year, imdbId);
            insertRating(ratingElement, kinopoiskData);
        } catch (error) {
            ratingElement.className = 'kinopoisk-rating-container error';
            ratingElement.querySelector('span').textContent = 'Err';
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(main, 500));
    } else {
        setTimeout(main, 1000);
    }
    let observerTimeout;
    const observer = new MutationObserver((mutations) => {
        clearTimeout(observerTimeout);
        observerTimeout = setTimeout(() => {
            const hasRating = document.querySelector('.kinopoisk-rating-container');
            const currentImdbId = getImdbId();
            if (!hasRating && currentImdbId) { main(); }
        }, 500);
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();
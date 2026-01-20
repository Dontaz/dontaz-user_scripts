// ==UserScript==
// @name         Kinopoisk & IMDb Search + Cross-Site Links
// @namespace    Kinopoisk-IMDb-Search.dontaz
// @version      1.1
// @description  Adds a manual search popup and cross-site search buttons for the current title
// @author       Dontaz
// @match        *://*/*
// @match        *://*.kinopoisk.ru/film/*
// @match        *://*.kinopoisk.ru/series/*
// @match        *://*.imdb.com/title/*
// @exclude      *://hd.kinopoisk.ru/film/*
// @exclude      *://hd.kinopoisk.ru/series/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @updateURL    https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/Kinopoisk_IMDb_Search/Kinopoisk_IMDb_Search.user.js
// @downloadURL  https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/Kinopoisk_IMDb_Search/Kinopoisk_IMDb_Search.user.js
// @supportURL	 https://github.com/Dontaz/dontaz-user_scripts
// ==/UserScript==

(function() {
    'use strict';

    let isPopupCreated = false;

    GM_addStyle(`
        #movie-search-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(3px);
            z-index: 2147483647;
            display: none;
            justify-content: center;
            align-items: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        #movie-search-container {
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            padding: 24px;
            width: 400px;
            max-width: 90%;
            position: relative;
            animation: ms-fadeIn 0.2s ease-out;
        }
        @keyframes ms-fadeIn {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
        }
        #movie-search-container h2 {
            margin: 0 0 20px 0;
            font-size: 20px;
            color: #1a1a1a;
            font-weight: 600;
            text-align: center;
        }
        #movie-search-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        #movie-search-input {
            padding: 12px 16px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            outline: none;
            transition: border-color 0.2s;
            width: 100%;
            box-sizing: border-box;
        }
        #movie-search-input:focus {
            border-color: #ff6600;
        }
        .search-buttons {
            display: flex;
            gap: 10px;
        }
        .search-btn {
            padding: 12px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            flex: 1;
            transition: transform 0.1s, filter 0.2s;
        }
        .search-btn:hover {
            filter: brightness(1.1);
        }
        .search-btn:active {
            transform: scale(0.98);
        }
        #kinopoisk-btn {
            background-color: #ff6600;
            color: white;
        }
        #imdb-btn {
            background-color: #f5c518;
            color: #121212;
        }
        #close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            cursor: pointer;
            font-size: 24px;
            color: #999;
            line-height: 1;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s, color 0.2s;
        }
        #close-btn:hover {
            background-color: #f0f0f0;
            color: #333;
        }
        .cross-site-link {
            position: fixed;
            top: 200px;
            right: 20px;
            z-index: 2147483646;
            background-color: #fff;
            border-radius: 50px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            padding: 10px 20px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .cross-site-link:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }
        .to-kinopoisk {
            background-color: #ff6600;
            color: white;
            border: 1px solid #ff6600;
        }
        .to-imdb {
            background-color: #f5c518;
            color: black;
            border: 1px solid #f5c518;
        }
    `);

    function createPopup() {
        if (isPopupCreated) return;

        const overlay = document.createElement('div');
        overlay.id = 'movie-search-overlay';
        overlay.innerHTML = `
            <div id="movie-search-container">
                <button id="close-btn" title="Закрыть">&times;</button>
                <h2>Поиск фильма</h2>
                <form id="movie-search-form">
                    <input type="text" id="movie-search-input" placeholder="Название фильма или сериала" required autocomplete="off">
                    <div class="search-buttons">
                        <button type="button" id="kinopoisk-btn" class="search-btn">Кинопоиск</button>
                        <button type="button" id="imdb-btn" class="search-btn">IMDb</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('close-btn').addEventListener('click', closeSearchPopup);

        document.getElementById('movie-search-overlay').addEventListener('click', function(e) {
            if (e.target === this) closeSearchPopup();
        });

        document.getElementById('kinopoisk-btn').addEventListener('click', function() {
            const movieTitle = document.getElementById('movie-search-input').value.trim();
            if (movieTitle) {
                searchKinopoisk(movieTitle);
                closeSearchPopup();
            }
        });

        document.getElementById('imdb-btn').addEventListener('click', function() {
            const movieTitle = document.getElementById('movie-search-input').value.trim();
            if (movieTitle) {
                searchIMDb(movieTitle);
                closeSearchPopup();
            }
        });

        document.getElementById('movie-search-form').addEventListener('submit', function(e) {
            e.preventDefault();
            const movieTitle = document.getElementById('movie-search-input').value.trim();
            if (movieTitle) {
                searchKinopoisk(movieTitle);
                closeSearchPopup();
            }
        });

        isPopupCreated = true;
    }

    function openSearchPopup() {
        createPopup();
        const overlay = document.getElementById('movie-search-overlay');
        overlay.style.display = 'flex';
        setTimeout(() => {
            document.getElementById('movie-search-input').focus();
        }, 50);
    }

    function closeSearchPopup() {
        const overlay = document.getElementById('movie-search-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    function searchKinopoisk(movieTitle) {
        const encodedTitle = encodeURIComponent(movieTitle);
        window.open(`https://www.kinopoisk.ru/index.php?kp_query=${encodedTitle}`, '_blank');
    }

    function searchIMDb(movieTitle) {
        const encodedTitle = encodeURIComponent(movieTitle);
        window.open(`https://www.imdb.com/find/?q=${encodedTitle}`, '_blank');
    }

    function getMovieIdFromUrl(url, site) {
        if (site === 'imdb') {
            const match = url.match(/\/title\/(tt\d+)/);
            return match ? match[1] : null;
        } else if (site === 'kinopoisk') {
            const match = url.match(/\/film\/(\d+)/);
            return match ? match[1] : null;
        }
        return null;
    }

    function getSeriesIdFromUrl(url, site) {
        if (site === 'imdb') {
            const match = url.match(/\/title\/(tt\d+)/);
            return match ? match[1] : null;
        } else if (site === 'kinopoisk') {
            const match = url.match(/\/series\/(\d+)/);
            return match ? match[1] : null;
        }
        return null;
    }

    function searchKinopoiskByImdbId(imdbId) {
        const title = document.querySelector('h1[data-testid="hero__pageTitle"]')?.textContent ||
                      document.querySelector('.title_wrapper h1')?.textContent ||
                      document.querySelector('.TitleHeader__TitleText')?.textContent ||
                      '';

        let year = '';

        const releaseInfoLink = document.querySelector('a[href*="/releaseinfo/"]');
        if (releaseInfoLink) {
            const yearMatch = releaseInfoLink.textContent.trim().match(/^(19\d{2}|20\d{2})$/);
            if (yearMatch) {
                year = yearMatch[1];
            }
        }

        if (!year) {
            const yearLink = document.querySelector('[data-testid="hero-title-block__metadata"] a[href*="/releaseinfo"]');
            if (yearLink) {
                const yearMatch = yearLink.textContent.trim().match(/^(19\d{2}|20\d{2})$/);
                if (yearMatch) {
                    year = yearMatch[1];
                }
            }
        }

        if (!year) {
            const allLinks = document.querySelectorAll('[data-testid="hero-title-block__metadata"] a, .ipc-inline-list a');
            for (const link of allLinks) {
                const linkText = link.textContent.trim();
                const yearMatch = linkText.match(/^(19\d{2}|20\d{2})$/);
                if (yearMatch) {
                    year = yearMatch[1];
                    break;
                }
            }
        }

        if (!year) {
            const metadataList = document.querySelector('[data-testid="hero-title-block__metadata"]');
            if (metadataList) {
                const allText = metadataList.textContent;
                const yearMatch = allText.match(/\b(19\d{2}|20\d{2})\b/);
                if (yearMatch) {
                    year = yearMatch[1];
                }
            }
        }

        if (!year) {
            const pageTitle = document.title;
            const titleMatch = pageTitle.match(/\((\d{4})\)/);
            if (titleMatch) {
                year = titleMatch[1];
            }
        }

        if (!year) {
            const jsonLd = document.querySelector('script[type="application/ld+json"]');
            if (jsonLd) {
                try {
                    const data = JSON.parse(jsonLd.textContent);
                    if (data.datePublished) {
                        const yearMatch = data.datePublished.match(/^(\d{4})/);
                        if (yearMatch) {
                            year = yearMatch[1];
                        }
                    }
                } catch (e) {}
            }
        }

        if (!year) {
            const oldYearElement = document.querySelector('.title_wrapper h1 #titleYear a');
            if (oldYearElement) {
                const yearMatch = oldYearElement.textContent.match(/\d{4}/);
                if (yearMatch) {
                    year = yearMatch[0];
                }
            }
        }

        let searchQuery = title.trim();
        if (year) {
            searchQuery += ' ' + year;
        }

        searchKinopoisk(searchQuery);
    }

    function searchImdbByKinopoiskId(kinopoiskId) {
        let originalTitle = '';

        const subtitleElement = document.querySelector('[class*="styles_title"] [class*="styles_originalTitle"]') ||
                                document.querySelector('[class*="styles_originalTitle"]');

        if (subtitleElement) {
            originalTitle = subtitleElement.textContent.trim();
        }

        if (!originalTitle) {
            const metaTitleOg = document.querySelector('meta[property="og:title"]');
            if (metaTitleOg) {
                const content = metaTitleOg.getAttribute('content');
                const match = content.match(/\((.*?)\)/);
                if (match) {
                    originalTitle = match[1].trim();
                }
            }
        }

        if (!originalTitle) {
            const infoSections = document.querySelectorAll('[class*="styles_row"]');
            for (const section of infoSections) {
                const label = section.querySelector('[class*="styles_title"]');
                if (label && label.textContent.includes('Оригинальное название')) {
                    const value = section.querySelector('[class*="styles_value"]');
                    if (value) {
                        originalTitle = value.textContent.trim();
                        break;
                    }
                }
            }
        }

        if (!originalTitle) {
            const infoTable = document.querySelector('#infoTable');
            if (infoTable) {
                const rows = infoTable.querySelectorAll('tr');
                for (let i = 0; i < rows.length; i++) {
                    const row = rows[i];
                    const label = row.querySelector('td:first-child');
                    if (label && label.textContent.includes('оригинальное название')) {
                        const valueCell = row.querySelector('td:last-child');
                        if (valueCell) {
                            originalTitle = valueCell.textContent.trim();
                            break;
                        }
                    }
                }
            }
        }

        if (!originalTitle) {
            const russianTitle = document.querySelector('h1[class*="styles_title"]')?.textContent ||
                               document.querySelector('h1.styles_title__65yuh')?.textContent ||
                               document.querySelector('h1.moviename-big')?.textContent ||
                               document.querySelector('h1[itemprop="name"]')?.textContent ||
                               '';
            originalTitle = russianTitle.trim();
        }

        originalTitle = originalTitle.replace(/\s*\(\d{4}\).*$/, '').trim();
        originalTitle = originalTitle.replace(/\s*\d+\+\s*$/, '').trim();

        let year = '';

        const yearLink = document.querySelector('a[href*="/movies/year--"]');
        if (yearLink) {
            const yearMatch = yearLink.textContent.trim().match(/^(19\d{2}|20\d{2})$/);
            if (yearMatch) {
                year = yearMatch[1];
            } else {
                const hrefMatch = yearLink.href.match(/year--(\d{4})/);
                if (hrefMatch) {
                    year = hrefMatch[1];
                }
            }
        }

        if (!year) {
            const titleWithYear = document.querySelector('h1[class*="styles_title"]')?.textContent ||
                                  document.querySelector('[class*="styles_title"]')?.textContent;
            if (titleWithYear) {
                const yearMatch = titleWithYear.match(/\((\d{4})\)/);
                if (yearMatch) {
                    year = yearMatch[1];
                }
            }
        }

        if (!year) {
            const infoSections = document.querySelectorAll('[class*="styles_row"]');
            for (const section of infoSections) {
                const label = section.querySelector('[class*="styles_title"]');
                const labelText = label?.textContent.trim() || '';

                if (label && (labelText === 'Год' || labelText.includes('Год производства')) &&
                    !labelText.includes('Премьера')) {

                    const value = section.querySelector('[class*="styles_value"]');
                    if (value) {
                        const yearMatch = value.textContent.match(/\b(19\d{2}|20\d{2})\b/);
                        if (yearMatch) {
                            year = yearMatch[1];
                            break;
                        }
                    }
                }
            }
        }

        if (!year) {
            const yearElements = document.querySelectorAll('[class*="styles_year"]');
            for (const elem of yearElements) {
                const yearMatch = elem.textContent.match(/\b(19\d{2}|20\d{2})\b/);
                if (yearMatch) {
                    year = yearMatch[1];
                    break;
                }
            }
        }

        if (!year) {
            const infoTable = document.querySelector('#infoTable');
            if (infoTable) {
                const rows = infoTable.querySelectorAll('tr');
                for (const row of rows) {
                    const label = row.querySelector('td:first-child');
                    const labelText = label?.textContent.toLowerCase() || '';

                    if (label && labelText.includes('год') && !labelText.includes('премьер')) {
                        const valueCell = row.querySelector('td:last-child');
                        if (valueCell) {
                            const yearMatch = valueCell.textContent.match(/\b(19\d{2}|20\d{2})\b/);
                            if (yearMatch) {
                                year = yearMatch[1];
                                break;
                            }
                        }
                    }
                }
            }
        }

        let searchQuery = originalTitle;
        if (year) {
            searchQuery += ' ' + year;
        }

        searchIMDb(searchQuery);
    }

    GM_registerMenuCommand('Поиск фильма на Кинопоиске/IMDb', openSearchPopup);

    document.addEventListener('keydown', function(e) {
        if (e.altKey && (e.key === 's' || e.key === 'ы')) {
            e.preventDefault();
            openSearchPopup();
        }
        if (e.key === 'Escape') {
            closeSearchPopup();
        }
    });

    function addCrossSiteButtons() {
        const currentUrl = window.location.href;

        if (currentUrl.includes('kinopoisk.ru/film/')) {
            const kinopoiskId = getMovieIdFromUrl(currentUrl, 'kinopoisk');
            if (kinopoiskId) {
                const toImdbButton = document.createElement('a');
                toImdbButton.className = 'cross-site-link to-imdb';
                toImdbButton.innerHTML = '<span>Найти на IMDb</span>';
                toImdbButton.href = 'javascript:void(0)';
                toImdbButton.addEventListener('click', function() {
                    searchImdbByKinopoiskId(kinopoiskId);
                });
                document.body.appendChild(toImdbButton);
            }
        }

        if (currentUrl.includes('kinopoisk.ru/series/')) {
            const kinopoiskId = getSeriesIdFromUrl(currentUrl, 'kinopoisk');
            if (kinopoiskId) {
                const toImdbButton = document.createElement('a');
                toImdbButton.className = 'cross-site-link to-imdb';
                toImdbButton.innerHTML = '<span>Найти на IMDb</span>';
                toImdbButton.href = 'javascript:void(0)';
                toImdbButton.addEventListener('click', function() {
                    searchImdbByKinopoiskId(kinopoiskId);
                });
                document.body.appendChild(toImdbButton);
            }
        }

        else if (currentUrl.includes('imdb.com/title/')) {
            const imdbId = getMovieIdFromUrl(currentUrl, 'imdb');
            if (imdbId) {
                const toKinopoiskButton = document.createElement('a');
                toKinopoiskButton.className = 'cross-site-link to-kinopoisk';
                toKinopoiskButton.innerHTML = '<span>Найти на Кинопоиске</span>';
                toKinopoiskButton.href = 'javascript:void(0)';
                toKinopoiskButton.addEventListener('click', function() {
                    searchKinopoiskByImdbId(imdbId);
                });
                document.body.appendChild(toKinopoiskButton);
            }
        }
    }

    addCrossSiteButtons();
})();
// ==UserScript==
// @name         SteamDB & PCGamingWiki for Steam
// @namespace    SteamDB-PCGamingWiki-for-Steam.dontaz
// @version      1.3
// @description  Добавляет на страницу Steam кнопки SteamDB и PCGamingWiki, а также реальный онлайн и точный рейтинг от SteamDB. Работает даже на заблокированных по региону страницах.
// @author       Dontaz
// @match        https://store.steampowered.com/app/*
// @match        https://store.steampowered.com/*
// @grant        GM_xmlhttpRequest
// @connect      api.steampowered.com
// @connect      store.steampowered.com
// @run-at       document-idle
// @updateURL    https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/SteamDB_PCGamingWiki_for_Steam/SteamDB_PCGamingWiki_for_Steam.user.js
// @downloadURL  https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/SteamDB_PCGamingWiki_for_Steam/SteamDB_PCGamingWiki_for_Steam.user.js
// @supportURL   https://github.com/Dontaz/dontaz-user_scripts
// ==/UserScript==

(function() {
    'use strict';

    function initScript() {
        const match = window.location.href.match(/\/app\/(\d+)/);
        if (!match) return;
        const appId = match[1];

        if (document.getElementById('steamdb-pcgw-injected')) return;

        const marker = document.createElement('div');
        marker.id = 'steamdb-pcgw-injected';
        marker.style.display = 'none';
        document.body.appendChild(marker);

        let container = document.querySelector('.apphub_OtherSiteInfo');
        let isRegionLocked = false;

        if (!container) {
            isRegionLocked = true;

            let appName = `App ${appId}`;

            const wrapper = document.createElement('div');
            wrapper.id = 'steamdb-pcgw-region-locked-wrapper';
            wrapper.style.cssText = `
                max-width: 940px;
                margin: 24px auto;
                padding: 24px 28px;
                background: linear-gradient(145deg, #1b2838 0%, #1a2332 50%, #192028 100%);
                border: 1px solid rgba(103, 193, 245, 0.15);
                border-radius: 6px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03);
            `;

            const headerRow = document.createElement('div');
            headerRow.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 18px;
                padding-bottom: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            `;

            const titleEl = document.createElement('div');
            titleEl.id = 'steamdb-pcgw-title';
            titleEl.style.cssText = `
                font-size: 24px;
                font-weight: 300;
                color: #ffffff;
                font-family: "Motiva Sans", sans-serif;
                letter-spacing: 0.5px;
                text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            `;
            titleEl.innerText = appName;

            const badge = document.createElement('div');
            badge.style.cssText = `
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 4px 12px;
                background: rgba(207, 106, 50, 0.15);
                border: 1px solid rgba(207, 106, 50, 0.35);
                border-radius: 3px;
                font-size: 11px;
                color: #cf6a32;
                font-family: "Motiva Sans", sans-serif;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.8px;
            `;
            badge.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cf6a32" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Region Locked
            `;

            headerRow.appendChild(titleEl);
            headerRow.appendChild(badge);

            const mediaRow = document.createElement('div');
            mediaRow.style.cssText = `
                display: flex;
                gap: 16px;
                margin-bottom: 18px;
            `;

            const headerImg = document.createElement('div');
            headerImg.style.cssText = `
                flex-shrink: 0;
                width: 292px;
                border-radius: 4px;
                overflow: hidden;
                border: 1px solid rgba(255, 255, 255, 0.06);
                background: rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
                gap: 0;
            `;

            const coverImg = document.createElement('img');
            coverImg.src = `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`;
            coverImg.style.cssText = `
                width: 100%;
                display: block;
                border-radius: 3px;
            `;
            coverImg.onerror = function() {
                headerImg.style.display = 'none';
                mediaRow.style.display = 'none';
            };

            const descEl = document.createElement('div');
            descEl.id = 'steamdb-pcgw-desc';
            descEl.style.cssText = `
                padding: 10px 12px;
                font-size: 12px;
                color: #8f98a0;
                font-family: "Motiva Sans", sans-serif;
                line-height: 1.5;
                background: rgba(0, 0, 0, 0.15);
            `;
            descEl.innerText = '';

            headerImg.appendChild(coverImg);
            headerImg.appendChild(descEl);

            const screenshotsContainer = document.createElement('div');
            screenshotsContainer.style.cssText = `
                flex: 1;
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: 1fr 1fr;
                gap: 6px;
                border-radius: 4px;
                overflow: hidden;
                min-height: 200px;
            `;

            mediaRow.appendChild(headerImg);
            mediaRow.appendChild(screenshotsContainer);

            const lightbox = document.createElement('div');
            lightbox.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 100000;
                justify-content: center;
                align-items: center;
                cursor: zoom-out;
            `;
            lightbox.addEventListener('click', () => {
                lightbox.style.display = 'none';
            });

            const lightboxImg = document.createElement('img');
            lightboxImg.style.cssText = `
                max-width: 90%;
                max-height: 90%;
                border-radius: 4px;
                box-shadow: 0 0 40px rgba(0, 0, 0, 0.8);
            `;
            lightbox.appendChild(lightboxImg);
            document.body.appendChild(lightbox);

            const statsRow = document.createElement('div');
            statsRow.style.cssText = `
                display: flex;
                gap: 16px;
                margin-bottom: 18px;
            `;

            const onlineStat = document.createElement('div');
            onlineStat.style.cssText = `
                flex: 1;
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 4px;
                padding: 14px 18px;
                text-align: center;
            `;
            onlineStat.innerHTML = `
                <div style="font-size: 11px; color: #556772; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: 'Motiva Sans', sans-serif;">Current Players</div>
                <div id="s_online" style="font-size: 22px; color: #66c0f4; font-weight: bold; font-family: 'Motiva Sans', sans-serif;">...</div>
            `;

            const ratingStat = document.createElement('div');
            ratingStat.style.cssText = `
                flex: 1;
                background: rgba(0, 0, 0, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 4px;
                padding: 14px 18px;
                text-align: center;
            `;
            ratingStat.innerHTML = `
                <div style="font-size: 11px; color: #556772; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; font-family: 'Motiva Sans', sans-serif;">SteamDB Rating</div>
                <div id="s_rating" style="font-size: 22px; color: #a3d200; font-weight: bold; font-family: 'Motiva Sans', sans-serif;">...</div>
            `;

            statsRow.appendChild(onlineStat);
            statsRow.appendChild(ratingStat);

            container = document.createElement('div');
            container.style.cssText = `
                display: flex;
                gap: 10px;
            `;

            wrapper.appendChild(headerRow);
            wrapper.appendChild(mediaRow);
            wrapper.appendChild(statsRow);
            wrapper.appendChild(container);

            const errorBox = document.getElementById('error_box');
            if (errorBox) {
                errorBox.parentElement.insertBefore(wrapper, errorBox.nextSibling);
            } else {
                const header = document.getElementById('global_header');
                if (header) {
                    header.parentElement.insertBefore(wrapper, header.nextSibling);
                } else {
                    document.body.prepend(wrapper);
                }
            }

            const ytBtn = document.createElement('a');
            ytBtn.id = 'steamdb-pcgw-yt-btn';
            ytBtn.target = '_blank';
            ytBtn.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(appName + ' trailer')}`;
            ytBtn.style.cssText = `
                flex: 1;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
                padding: 0 20px;
                height: 36px;
                text-decoration: none;
                background: linear-gradient(135deg, #3a1a1a 0%, #2a0e0e 100%);
                color: #ff4444;
                border: 1px solid rgba(255, 68, 68, 0.3);
                border-radius: 3px;
                cursor: pointer;
                font-family: "Motiva Sans", sans-serif;
                font-size: 14px;
                font-weight: bold;
                letter-spacing: 0.3px;
                transition: all 0.25s ease;
            `;
            ytBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff4444">
                    <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.5 12 3.5 12 3.5s-7.6 0-9.5.6c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.6 9.5.6 9.5.6s7.6 0 9.5-.6c1-.3 1.7-1.1 2-2.1.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.5 15.6V8.4l6.3 3.6-6.3 3.6z"/>
                </svg>
                <span style="font-size: 14px; display: block;">YouTube Trailer</span>
            `;
            ytBtn.addEventListener('mouseenter', () => {
                ytBtn.style.background = 'linear-gradient(135deg, #4d2626 0%, #3a1818 100%)';
                ytBtn.style.color = '#ffffff';
                ytBtn.style.borderColor = 'rgba(255, 68, 68, 0.6)';
                ytBtn.style.boxShadow = '0 0 12px rgba(255, 68, 68, 0.15)';
                ytBtn.querySelector('svg').style.fill = '#ffffff';
            });
            ytBtn.addEventListener('mouseleave', () => {
                ytBtn.style.background = 'linear-gradient(135deg, #3a1a1a 0%, #2a0e0e 100%)';
                ytBtn.style.color = '#ff4444';
                ytBtn.style.borderColor = 'rgba(255, 68, 68, 0.3)';
                ytBtn.style.boxShadow = 'none';
                ytBtn.querySelector('svg').style.fill = '#ff4444';
            });

            GM_xmlhttpRequest({
                method: "GET",
                url: `https://store.steampowered.com/api/appdetails?appids=${appId}`,
                headers: { "Accept-Language": "en" },
                onload: (res) => {
                    try {
                        const data = JSON.parse(res.responseText);
                        if (data[appId] && data[appId].success && data[appId].data) {
                            const appData = data[appId].data;
                            appName = appData.name;
                            titleEl.innerText = appName;
                            ytBtn.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(appName + ' trailer')}`;

                            if (appData.short_description) {
                                descEl.innerText = appData.short_description;
                            } else {
                                descEl.style.display = 'none';
                            }

                            const screenshots = appData.screenshots || [];
                            const maxScreenshots = Math.min(screenshots.length, 4);

                            if (maxScreenshots === 0) {
                                screenshotsContainer.style.display = 'none';
                            }

                            for (let i = 0; i < maxScreenshots; i++) {
                                const thumb = document.createElement('div');
                                thumb.style.cssText = `
                                    overflow: hidden;
                                    border-radius: 3px;
                                    border: 1px solid rgba(255, 255, 255, 0.06);
                                    cursor: pointer;
                                    position: relative;
                                    background: rgba(0, 0, 0, 0.3);
                                `;

                                const img = document.createElement('img');
                                img.src = screenshots[i].path_thumbnail;
                                img.style.cssText = `
                                    width: 100%;
                                    height: 100%;
                                    object-fit: cover;
                                    display: block;
                                    transition: transform 0.3s ease, filter 0.3s ease;
                                `;

                                const overlay = document.createElement('div');
                                overlay.style.cssText = `
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    width: 100%;
                                    height: 100%;
                                    background: rgba(0, 0, 0, 0);
                                    transition: background 0.3s ease;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                `;

                                const zoomIcon = document.createElement('div');
                                zoomIcon.innerHTML = `
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0; transition: opacity 0.3s ease;">
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                                    </svg>
                                `;
                                overlay.appendChild(zoomIcon);

                                thumb.addEventListener('mouseenter', () => {
                                    img.style.transform = 'scale(1.05)';
                                    overlay.style.background = 'rgba(0, 0, 0, 0.3)';
                                    zoomIcon.querySelector('svg').style.opacity = '1';
                                });
                                thumb.addEventListener('mouseleave', () => {
                                    img.style.transform = 'scale(1)';
                                    overlay.style.background = 'rgba(0, 0, 0, 0)';
                                    zoomIcon.querySelector('svg').style.opacity = '0';
                                });

                                const fullUrl = screenshots[i].path_full;
                                thumb.addEventListener('click', () => {
                                    lightboxImg.src = fullUrl;
                                    lightbox.style.display = 'flex';
                                });

                                thumb.appendChild(img);
                                thumb.appendChild(overlay);
                                screenshotsContainer.appendChild(thumb);
                            }
                        } else {
                            fetchAppNameFallback(appId, titleEl);
                            mediaRow.style.display = 'none';
                        }
                    } catch(e) {
                        fetchAppNameFallback(appId, titleEl);
                        mediaRow.style.display = 'none';
                    }
                },
                onerror: () => {
                    fetchAppNameFallback(appId, titleEl);
                    mediaRow.style.display = 'none';
                }
            });

            function createLockedBtn(text, url) {
                const btn = document.createElement('a');
                btn.href = url;
                btn.target = '_self';
                btn.style.cssText = `
                    flex: 1;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0 20px;
                    height: 36px;
                    text-decoration: none;
                    background: linear-gradient(135deg, #1a3a4a 0%, #0e2a3a 100%);
                    color: #67c1f5;
                    border: 1px solid rgba(103, 193, 245, 0.3);
                    border-radius: 3px;
                    cursor: pointer;
                    font-family: "Motiva Sans", sans-serif;
                    font-size: 14px;
                    font-weight: bold;
                    letter-spacing: 0.3px;
                    transition: all 0.25s ease;
                `;
                btn.innerHTML = `<span style="font-size: 14px; display: block;">${text}</span>`;
                btn.addEventListener('mouseenter', () => {
                    btn.style.background = 'linear-gradient(135deg, #264d63 0%, #1c4459 100%)';
                    btn.style.color = '#ffffff';
                    btn.style.borderColor = 'rgba(103, 193, 245, 0.6)';
                    btn.style.boxShadow = '0 0 12px rgba(103, 193, 245, 0.15)';
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.background = 'linear-gradient(135deg, #1a3a4a 0%, #0e2a3a 100%)';
                    btn.style.color = '#67c1f5';
                    btn.style.borderColor = 'rgba(103, 193, 245, 0.3)';
                    btn.style.boxShadow = 'none';
                });
                return btn;
            }

            container.appendChild(createLockedBtn('SteamDB', `https://steamdb.info/app/${appId}/`));
            container.appendChild(createLockedBtn('PCGamingWiki', `https://www.pcgamingwiki.com/api/appid.php?appid=${appId}`));
            container.appendChild(createLockedBtn('Steam Store', `https://store.steampowered.com/app/${appId}/`));
            container.appendChild(ytBtn);

        } else {

            container.style.cssText = `
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                flex-wrap: nowrap !important;
                float: right !important;
            `;

            const statsWrapper = document.createElement('div');
            statsWrapper.style.cssText = `
                display: flex;
                gap: 15px;
                background: rgba(0, 0, 0, 0.25);
                padding: 5px 12px;
                border-radius: 4px;
                font-size: 14px;
                color: #acb2b8;
                border: 1px solid rgba(255,255,255,0.1);
                white-space: nowrap;
            `;
            statsWrapper.innerHTML = `
                <div>Online: <span id="s_online" style="color:#66c0f4; font-weight:bold;">...</span></div>
                <div>Rating: <span id="s_rating" style="color:#a3d200; font-weight:bold;">...</span></div>
            `;

            function createNormalBtn(text, url) {
                const btn = document.createElement('a');
                btn.className = 'btnv6_blue_hoverfade btn_medium';
                btn.href = url;
                btn.target = '_self';
                btn.style.cssText = `
                    white-space: nowrap;
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                    height: 30px;
                    text-transform: none;
                `;
                btn.innerHTML = `<span style="font-size: 14px; text-transform: none; display: block;">${text}</span>`;
                return btn;
            }

            container.prepend(createNormalBtn('PCGamingWiki', `https://www.pcgamingwiki.com/api/appid.php?appid=${appId}`));
            container.prepend(createNormalBtn('SteamDB', `https://steamdb.info/app/${appId}/`));
            container.prepend(statsWrapper);
        }

        GM_xmlhttpRequest({
            method: "GET",
            url: `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`,
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    const count = data.response.player_count;
                    const el = document.getElementById('s_online');
                    if (el) el.innerText = (count !== undefined && count !== null) ? count.toLocaleString() : '?';
                } catch(e) {
                    const el = document.getElementById('s_online');
                    if (el) el.innerText = '?';
                }
            },
            onerror: () => {
                const el = document.getElementById('s_online');
                if (el) el.innerText = '?';
            }
        });

        GM_xmlhttpRequest({
            method: "GET",
            url: `https://store.steampowered.com/appreviews/${appId}?json=1&purchase_type=all&language=all`,
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    const summary = data.query_summary;
                    const pos = summary.total_positive;
                    const total = summary.total_reviews;
                    const el = document.getElementById('s_rating');
                    if (el) {
                        if (total > 0) {
                            const ratio = pos / total;
                            const rating = ratio - (ratio - 0.5) * Math.pow(2, -Math.log10(total + 1));
                            el.innerText = (rating * 100).toFixed(2) + '%';
                        } else {
                            el.innerText = 'N/A';
                        }
                    }
                } catch(e) {
                    const el = document.getElementById('s_rating');
                    if (el) el.innerText = '?';
                }
            },
            onerror: () => {
                const el = document.getElementById('s_rating');
                if (el) el.innerText = '?';
            }
        });
    }

    function fetchAppNameFallback(appId, titleEl) {
        GM_xmlhttpRequest({
            method: "GET",
            url: `https://store.steampowered.com/api/appdetails?appids=${appId}`,
            anonymous: true,
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data[appId] && data[appId].success && data[appId].data) {
                        titleEl.innerText = data[appId].data.name;
                    }
                } catch(e) {}
            }
        });
    }

    initScript();

    let lastUrl = location.href;
    const observer = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            setTimeout(initScript, 1500);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();
// ==UserScript==
// @name         SteamDB & PCGamingWiki for Steam
// @namespace    SteamDB-PCGamingWiki-for-Steam.dontaz
// @version      1.0
// @description  Добавляет на страницу Steam кнопки SteamDB и PCGamingWiki, а также реальный онлайн и точный рейтинг от SteamDB.
// @author       Dontaz
// @match        https://store.steampowered.com/app/*
// @grant        GM_xmlhttpRequest
// @connect      api.steampowered.com
// @connect      store.steampowered.com
// @updateURL    https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/SteamDB_PCGamingWiki_for_Steam/SteamDB_PCGamingWiki_for_Steam.user.js
// @downloadURL  https://github.com/Dontaz/dontaz-user_scripts/raw/refs/heads/main/user_scripts/SteamDB_PCGamingWiki_for_Steam/SteamDB_PCGamingWiki_for_Steam.user.js
// @supportURL	 https://github.com/Dontaz/dontaz-user_scripts
// ==/UserScript==

(function() {
    'use strict';

    const match = window.location.href.match(/\/app\/(\d+)/);
    if (!match) return;
    const appId = match[1];

    const container = document.querySelector('.apphub_OtherSiteInfo');
    if (!container) return;

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
        <div title="Данные обновляются в реальном времени">Online: <span id="s_online" style="color:#66c0f4; font-weight:bold;">...</span></div>
        <div title="Расчет по алгоритму SteamDB">Rating: <span id="s_rating" style="color:#a3d200; font-weight:bold;">...</span></div>
    `;

    function createInlineBtn(text, url) {
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

    const btnSteamDB = createInlineBtn('SteamDB', `https://steamdb.info/app/${appId}/`);
    const btnPCWiki = createInlineBtn('PCGamingWiki', `https://www.pcgamingwiki.com/api/appid.php?appid=${appId}`);

    container.prepend(btnPCWiki);
    container.prepend(btnSteamDB);
    container.prepend(statsWrapper);

    GM_xmlhttpRequest({
        method: "GET",
        url: `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${appId}`,
        onload: (res) => {
            try {
                const data = JSON.parse(res.responseText);
                const count = data.response.player_count || 0;
                document.getElementById('s_online').innerText = count.toLocaleString();
            } catch(e) { document.getElementById('s_online').innerText = '?'; }
        }
    });

    fetch(`https://store.steampowered.com/appreviews/${appId}?json=1&purchase_type=all&language=all`)
        .then(res => res.json())
        .then(data => {
            const summary = data.query_summary;
            const pos = summary.total_positive;
            const total = summary.total_reviews;

            if (total > 0) {
                const ratio = pos / total;
                const rating = ratio - (ratio - 0.5) * Math.pow(2, -Math.log10(total + 1));

                document.getElementById('s_rating').innerText = (rating * 100).toFixed(2) + '%';
            } else {
                document.getElementById('s_rating').innerText = 'Нет отзывов';
            }
        });

})();
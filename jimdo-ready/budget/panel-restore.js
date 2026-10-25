/* DCPP: restore the existing demo panels before DOMContentLoaded.
   Main business content and project case descriptions remain ordinary HTML. */
(function () {
    'use strict';
    var loader = document.currentScript;
    var dataNode = document.getElementById('dcpp-panel-data');
    try {
        if (!dataNode) throw new Error('Panel data is missing');
        var raw = dataNode.textContent || '';
        // Jimdo may surround data blocks with its customary CDATA comments.
        raw = raw.replace(/^\s*\/\*\s*<!\[CDATA\[\s*\*\//, '')
                 .replace(/\/\*\s*\]\]>\s*\*\/\s*$/, '');
        var panels = JSON.parse(raw);
        if (!Array.isArray(panels)) throw new Error('Invalid panel data');
        var prepared = panels.map(function (panel) {
            var slot = document.querySelector('[data-dcpp-panel="' + panel.id + '"]');
            if (!slot || !/^dcpp-microsite-[a-z0-9]+$/.test(panel.id)) {
                throw new Error('Invalid panel target');
            }
            var template = document.createElement('template');
            template.innerHTML = panel.html;
            if (!template.content.firstElementChild ||
                template.content.firstElementChild.id !== panel.id) {
                throw new Error('Panel root does not match');
            }
            return { slot: slot, content: template.content };
        });
        prepared.forEach(function (item) {
            item.slot.parentNode.replaceChild(item.content, item.slot);
        });
        dataNode.parentNode.removeChild(dataNode);
        if (loader && loader.parentNode) loader.parentNode.removeChild(loader);
    } catch (error) {
        // A malformed installation must still provide a readable business page.
        if (window.console) console.error('DCPP panel restoration failed:', error);
        var path = window.location.pathname.replace(/\/+$/, '') || '/';
        var hash = window.location.hash || '';
        var publishing = /(?:^|[?&])projekt=digital-publishing(?:&|$)/.test(window.location.search);
        if (path === '/' && (publishing || /^#(?:3x3homefit|sunnyxxl|familienkreis|heymalle|releasebuddy|bottroperdoener|bratwurstmitmir|Kochheld|larosabottrop|lr-|olympiabottrop|oly-|digitalpublishing)/i.test(hash))) {
            window.location.replace('/#dcpp-projects');
        }
    }
})();

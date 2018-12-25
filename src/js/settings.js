(function() {
    'use strict';

    const defaultSettings = {
        count: 5,
        sources: ['newest', 'shownew']
    };

    function loadCurrentSettings() {
        chrome.storage.sync.get(defaultSettings, function(settings) {
            const itemCountNode = document.getElementById('item-count');
            if (itemCountNode)
                itemCountNode.value = settings.count;

            defaultSettings.sources.forEach(function(source) {
                const itemNode = document.getElementById('items-' + source);
                if (itemNode)
                    itemNode.checked = settings.sources.indexOf(source) > -1;
            });
        });
    };

    function setupEventHandlers() {
        const itemCountNode = document.getElementById('item-count');
        if (itemCountNode) {
            itemCountNode.addEventListener('change', function(ev) {
                chrome.storage.sync.set({
                    count: (ev.currentTarget || ev.target).value || defaultSettings.count
                });
            });
        }

        defaultSettings.sources.forEach(function(source) {
            const node = document.getElementById('items-' + source);
            if (node) {
                node.addEventListener('change', function(ev) {
                    chrome.storage.sync.get(defaultSettings, function(settings) {
                        let sources = settings.sources || [];
                        const sourceIndex = settings.sources.indexOf(source);
                        const isChecked = (ev.currentTarget || ev.target).checked;

                        if (isChecked && sourceIndex === -1)
                            sources.push(source);
                        else if (!isChecked && sourceIndex > -1)
                            sources.splice(sourceIndex, 1);

                        chrome.storage.sync.set({
                            sources: sources
                        });
                    });
                });
            }
        });
    };

    document.addEventListener("DOMContentLoaded", function(event) {
        loadCurrentSettings();
        setupEventHandlers();
    });
})();

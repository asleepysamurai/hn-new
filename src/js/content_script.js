'use strict';

/**
 * HN Frontpage New content script
 */
(async function() {
    if (window.location.pathname !== '/' && window.location.pathname !== '/news')
        return;

    const sourceToUrl = {
        newest: 'https://news.ycombinator.com/newest',
        shownew: 'https://news.ycombinator.com/shownew'
    };

    const defaultSettings = {
        count: 5,
        sources: ['shownew']
    };

    const MAX_SET_COUNT_PER_SOURCE = 30;

    async function getItems(rank, initUrl, itemCount) {
        let nextUrl = initUrl;
        let items = [];
        let pickedItems = [];

        do {
            const res = await fetch(nextUrl);
            const html = await res.text();

            const container = document.createElement('div');
            container.innerHTML = html;

            let filteredItems = [];
            [].slice.call(container.querySelectorAll('.athing'))
                .forEach(item => {
                    if (!(item && item.id))
                        return;

                    const preText = (((((item.children || [])[2] || {}).childNodes || [])[0] || {}).data);
                    if (!preText) {
                        filteredItems.push(item);
                    };
                });

            items = items.concat(filteredItems);
            nextUrl = (container.querySelector('.morelink') || {}).href;
        } while (nextUrl && items.length < MAX_SET_COUNT_PER_SOURCE);

        itemCount = (itemCount < 0 ?
            0 :
            (itemCount > 10 ?
                10 :
                itemCount));

        while (itemCount--) {
            const randomIndex = Math.floor(Math.random() * (items.length));
            if (items[randomIndex]) {
                const pickedItem = items.splice(randomIndex, 1)[0];
                pickedItems.push(pickedItem);

                const rankNode = pickedItem.querySelector('.rank');
                if (rankNode)
                    rankNode.innerText = 'New';

                if (pickedItem.nextElementSibling) {
                    pickedItems.push(pickedItem.nextElementSibling);
                    if (pickedItem.nextElementSibling.nextElementSibling) {
                        pickedItems.push(pickedItem.nextElementSibling.nextElementSibling);
                    }
                }
            }
        }

        return pickedItems;
    };

    chrome.storage.sync.get(defaultSettings, async ({ count, sources }) => {
        if (!sources.length)
            return;

        let itemCountPerSource = Math.round(count / sources.length);
        let getItemActions = [];

        if (sources.indexOf('shownew') > -1) {
            getItemActions.push(getItems('ShowHN', sourceToUrl['shownew'], itemCountPerSource));
            count = count - itemCountPerSource;
        }

        if (sources.indexOf('newest') > -1) {
            getItemActions.push(await getItems('New', sourceToUrl['newest'], count));
        }

        const insertItems = (await Promise.all(getItemActions)).reduce((a, b) => a.concat(b), []);
        const firstItemNode = document.querySelector('tr.athing');
        if (!firstItemNode)
            return;

        insertItems.forEach(item => {
            firstItemNode.parentNode.insertBefore(item, firstItemNode);
        });

        document.querySelector('tr').scrollIntoView({
            block: 'start',
            inline: 'center',
            behavior: 'smooth'
        });
    });
})();

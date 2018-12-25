##### The Problem
With the growth of HN in recent years, there are a huge number of posts being submitted every day. However, there's not been a corresponding rise in the number of people looking at /newest and /shownew, and as a consequence a lot of good posts, esp. 'Show HNs' disappear in the crowd.

As it so happened, I had a few free hours this Christmas, so I decided to tackle this. Here's my shot at it.

##### A Possible Solution
This extension picks 5 (or however many you want) random items from /newest and /shownew (or any one - weighted towards picking younger posts), and appends them to the top of the frontpage (and it's next pages). This way, you get exposed to a small dose of the newest posts, and your upvote might contribute towards getting that post to the actual front page, so more people can know about it.

The extension, by default picks 5 random posts from the top 30 undead posts in /shownew, and appends them to the top of the frontpage. You can fiddle with the extension settings to get it to pick from both /shownew and /newest, and also the total number of items you want to pick.

This is what it looks like:

![Screenshot](https://i.imgur.com/ylDORUr.png)

##### Caveats
1. Since the extension has to make multiple network requests to actually fetch the information required, there will be a small time delta between you loading the page and the new posts being added. If in the meanwhile, you scroll down the list, you will be brought back to the top of the page, when the new posts have been added. Some might find this behaviour a bit annoying. There will be a setting in future to not scroll the new items into view.

2. The extension only lists items that have not been flagged or deaded. This means that, if there are many dead posts (as is often the case with /newest), and you have showdead enabled in your HN settings, then a larger number of network requests will have to be made before new items can be added. So for better performance, please turn off showdead in your HN settings.

#### Download

The extension is available for both Google Chrome, and Mozilla Firefox (thanks to WebExtensions magic!). You can get them from:
- [Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/hn-showhn-items-in-frontpage/) (works on Firefox for Android also)
- [Google Chrome](https://chrome.google.com/webstore/detail/random-new-items-in-hacke/kcllahhmlhhmljeppnpdggmjilchdojk)

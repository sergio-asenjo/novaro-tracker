# NovaRO Tracker

This is a simple scraper + discord bot that tracked item prices from NovaRO's market.
It was made in less than an hour, so it's not polished at all.

It follows the basic principle of scraping the market page and comparing the prices with the previous ones, which are stored in a MongoDB database.
If the price changed, it sends a private message to the user that tracked the item.
Since it was for personal use, MongoDB Atlas with a free tier was used, but it can be hosted locally.

I'm making this publicly available now that NovaRO closed.
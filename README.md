## Wordpress Telegram Bot
Listens for */post http://www.link.com* sent in a Telegram chat and publishes a Wordpress post of the link

### Setup
  1. Get a bot key for Telegram from the [@botfather](https://core.telegram.org/bots)
  2. Have a valid login for a WordPress blog
  3. Get the author data from WordPress for mapping Telegram users to WordPress users (look at the url when managing an individual user in WordPress, user_id parameter)

In the code there are some obvious places to put your Telegram api code and WordPress login info.  Also make sure to put at least one user in the `usersDict` for mapping the Telegram user to post author.

### Commands
The bot supports two commands:
* `/cats` - lists the categories
* `/post http://www.link.com` - will publish a link to a wordpress site
    * `-c category1, category2, category3` - associates categories to a post
    * `-a what an amazing article!` - adds an annotation with the user's words at the top of the article 

### Dependencies
- [telegram-node-bot](https://github.com/Naltox/telegram-node-bot) - skeleton for a Telegram bot
- [node-wordpress](https://github.com/scottgonzalez/node-wordpress) - calls WordPress's XML-RPC API
- [request-promise](https://github.com/request/request-promise) - request a url with a promise wrapper
- [cheerio](https://github.com/cheeriojs/cheerio) - pull metadata and other webpage tags
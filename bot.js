"use strict";

const Telegram = require('telegram-node-bot');
const wordpress = require('wordpress');
const request = require('request-promise');
const cheerio = require('cheerio');
const templates = require('./templates');

const TelegramBaseController = Telegram.TelegramBaseController;
const TextCommand = Telegram.TextCommand;
const tg = new Telegram.Telegram('');
const site = 'mysite.com';
const taxonomy = 'category';

// wordpress api client
const wpClient = wordpress.createClient({
    url: site,
    username: 'wordpressUser',
    password: 'password'
});

// telegram user to wordpress author id/name map
const userDict = {
    'TelegramUserName': {
        id: 1,  // wordpress user id
        name: 'WordPressUserName'
    }
};

// grab all the wordpress categories
var categories = [];
wpClient.getTerms(taxonomy, (err, terms) => {
    categories = terms;
});

// struct for our wordpress post
var wpPost = class {
    constructor(author, site, title, content, annotation, image, link, terms) {
        this.author = author || null;
        this.site = site || null;
        this.title = title || null;
        this.content = content || null;
        this.annotation = annotation || null;
        this.image = image || null;
        this.link = link || null;
        this.terms = terms || {};
    }
};

// telegram-node-bot controller
class WpPostController extends TelegramBaseController {
    postHandler($) {
        let msg = $._message;
        let author = msg._from;
        let post = new wpPost();
        let content = this.buildEntitiesContent(msg.text, msg.entities);

        // check for a url and author
        if (content && author._username in userDict) {
            post.author = userDict[author._username];

            // make sure there is a link
            if (msg.entities.find(e => e._type === 'url')) {
                // pull arguments from text and update post
                this.populatePostFromArguments(msg.text, post);

                // grab the page and look for our tags to fill in the post
                this.fillPostFromLink(content, post).then(request => {
                    // create the post
                    this.createWpPost(post, (err, postId) => {
                        if (err) {
                            this.sendError($, err);
                            return console.error(err);
                        }

                        // grab post we just created, with all the metadata
                        wpClient.getPost(postId, (getErr, createdPost) => {
                            if (getErr) {
                                this.sendError($, getErr);
                                return console.error(getErr);
                            }

                            $.sendMessage(createdPost.link);
                            console.log('Posted ' + createdPost.title + ' (' + createdPost.link + ')');
                        });
                    });
                }).catch(err => {
                    console.error(err);
                    this.sendError($, err);
                });
            }
        }
    }

    // send error to telegram
    sendError($, error) {
        $.sendMessage(error, {
            disable_web_page_preview: true
        });
    }

    // grabs an argument value from the chat string
    grabArgument(command, argument) {
        let arg = '-' + argument + ' ';
        let argumentValue = null;

        if (text.indexOf(arg) > -1) {
            let pos = text.indexOf(arg);
            let slice = text.indexOf('-', pos + 2);
            let argumentValue = text.slice(pos + 3, (slice > -1 ? slice : text.length));
        }

        return argumentValue;
    }

    // build content string from telegram entities
    buildEntitiesContent(text, entities) {
        let returnText = null;

        if (entities && entities.length > 0) {
            entities.forEach((entity) => {
                switch (entity._type) {
                    case 'bot_command':
                        returnText = text.slice(entity._length + 1);

                        break;

                    case 'url':
                        returnText = text.slice(entity._offset, entity._offset + entity._length);

                        break;
                }
            });
        }

        return returnText;
    }

    // build content string from telegram entities
    populatePostFromArguments(text, post) {
        // looking for categories
        let postCats = this.grabArgument(text, 'c');

        if (postCats != null) {
            postCats = postCats.trim().replace(/, /g, ',');
            postCats = postCats.split(',');

            postCats.forEach(c => {
                let foundCat = categories.find(cat => cat.name.toLowerCase() === c.toLowerCase());

                if (foundCat) {
                    if (post.terms.hasOwnProperty(taxonomy)) {
                        post.terms[taxonomy].push(Number(foundCat.termId));
                    } else {
                        post.terms[taxonomy] = [Number(foundCat.termId)];
                    }
                }
            });
        }

        // looking for annotation
        let postAnno = this.grabArgument(text, 'a');

        if (postAnno !== null) {
            post.annotation = annotation;
        }
    }

    // creates a wordpress post from a post object
    createWpPost(post, callback) {
        if (post && post.title && post.content) {
            return wpClient.newPost({
                author: post.author.id,
                title: post.title,
                content: post.content,
                terms: post.terms,
                status: 'publish'
            }, (createErr, postId) => {
                if (callback) return callback(createErr, postId);
            });
        } else {
            console.error('Post doesn\'t exist or doesn\'t have a title or content');
        }
    }

    // pulls html meta tags to fill in post
    fillPostFromLink(url, post) {
        return request({
            method: 'GET',
            url: url
        }).then(response => {
            let htmlBody = cheerio.load(response);

            post.title = htmlBody('meta[property="og:title"]').attr('content') || htmlBody("title").text();
            post.content = htmlBody('meta[property="og:description"]').attr('content') || htmlBody('meta[name="description"]').attr('content');
            post.image = htmlBody('meta[property="og:image"]').attr('content') || htmlBody('meta[itemprop="image"]').attr('content');
            post.site = htmlBody('meta[property="og:site_name"]').attr('content') || url;
            post.link = url;

            if (!post.title || !post.content) {
                console.error('Error getting content from ' + url);
            } else {
                // check content type to apply correct template
                if (url.toLowerCase().indexOf('youtube.com') > -1 || url.toLowerCase().indexOf('youtu.be') > -1) {
                    post.link = url.replace('watch?v=', 'v/');
                    post.content = templates.youtube(post);
                } else {
                    post.content = templates.url(post);
                }
            }
        });
    }

    get routes() {
        return {
            'postCommand': 'postHandler',
        }
    }
}

class WpCategoryController extends TelegramBaseController {
    getHandler($) {
        $.sendMessage(site + ' categories\n' + categories.map(c => c.name).join(', '), {
            disable_web_page_preview: true
        });
    }

    get routes() {
        return {
            'getCommand': 'getHandler'
        }
    }
}

tg.router
    .when(new TextCommand('post', 'postCommand'),
        new WpPostController())
    .when(new TextCommand('cats', 'getCommand'),
        new WpCategoryController());
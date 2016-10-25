'use strict'

module.exports = {
    url: post => {
        let template = ``;

        if (post.annotation) {
            if (post.author.name) {
                template += `<i>${post.annotation}</i> - ${post.author.name}<br /><br />`;
            } else {
                template += `<i>${post.annotation}</i><br /><br />`;
            }
        }
        
        template += `<b>${post.site}
            <a href="${post.link}" target="_blank">${post.title}</a></b>
            <br />`;

        if (post.image) {
            template += `<div>
                    <div style="float: left; width: 75%;">${post.content}</div>
                    <div style="float: right; width: 25%; padding-bottom: 10px;"><img src="${post.image}" style="width: 100%;"></div>
                </div>`;
        } else {
            template += `<p>${post.content}</p>`;
        }

        return template;
    },
    
    youtube: post => {
        let template = ``;

        if (post.annotation) {
            if (post.author.name) {
                template += `<i>${post.annotation}</i> - ${post.author.name}<br /><br />`;
            } else {
                template += `<i>${post.annotation}</i><br /><br />`;
            }
        }
                            
        template += `<b>${post.site}
            <a href="${post.link}" target="_blank">${post.title}</a></b>
            <br />
            <div>${post.content}</div>
            <iframe width="495" height="315" src="${post.link}" frameborder="0" allowfullscreen></iframe>`;

        return template;
    }
}
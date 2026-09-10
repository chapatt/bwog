import { Eta } from 'eta';
import fs from 'fs';
import path from 'path';
import beautify from 'js-beautify';
import minify from '@minify-html/node';
import {fileURLToPath} from 'url';
import {createTranslator} from 'short-uuid';

class Generator {
    generate(siteUrl, outputDir, posts) {
        const sitemap = [];
        posts.sort((a, b) => a.createdAt > b.createdAt ? -1 : (a.createdAt < b.createdAt ? 1 : 0));

        const postsByMonth = posts.reduce((acc, post) => {
            let currentMonth = null;
            if (acc.length > 0) {
                const lastDate = new Date(Date.parse(acc[acc.length - 1][0].createdAt));
                const currentDate = new Date(Date.parse(post.createdAt));
                if (lastDate.getFullYear() === currentDate.getFullYear() && lastDate.getMonth() === currentDate.getMonth()) {
                    currentMonth = acc[acc.length - 1];
                }
            }

            if (currentMonth === null) {
                currentMonth = [];
                acc.push(currentMonth);
            }

            currentMonth.push(post);

            return acc;
        }, []);

        try {
            this.generateIndex(siteUrl, outputDir, posts, sitemap);
            this.writeAtom(siteUrl, posts, path.resolve(outputDir, 'feed.atom'));
        } catch (error) {
            console.error(error);
            return;
        }

        let previousMonth = postsByMonth[0][0].createdAt;
        let currentMonth = null;
        let nextMonth = null;
        for (let i = 0; i < postsByMonth.length; ++i) {
            nextMonth = currentMonth;
            currentMonth = previousMonth;

            if (postsByMonth.length > i + 1) {
                previousMonth = postsByMonth[i + 1][0].createdAt;
            } else {
                previousMonth = null;
            }

            try {
                this.writePage(postsByMonth[i],
                    this.displayMonthFromIsoTimestamp(currentMonth),
                    `${siteUrl}/${this.filenameFromIsoTimestamp(currentMonth)}`,
                    path.resolve(outputDir, `${this.filenameFromIsoTimestamp(currentMonth)}.html`),
                    previousMonth === null ? null : this.filenameFromIsoTimestamp(previousMonth),
                    nextMonth === null ? null : this.filenameFromIsoTimestamp(nextMonth));

                sitemap.push({
                    url: `${siteUrl}/${this.filenameFromIsoTimestamp(currentMonth)}`,
                    updatedAt: currentMonth,
                });

                this.writeAPOutboxPage(postsByMonth[i],
                    siteUrl,
                    outputDir,
                    this.filenameFromIsoTimestamp(currentMonth),
                    nextMonth === null ? null : this.filenameFromIsoTimestamp(nextMonth),
                    previousMonth === null ? null : this.filenameFromIsoTimestamp(previousMonth));
            } catch (error) {
                console.error(error);
                return;
            }
        }

        this.writeSitemap(sitemap, path.resolve(outputDir, 'sitemap.xml'));

        this.writeAPOutbox(posts, siteUrl, path.resolve(outputDir, './ap/outbox.json'));
    }

    generatePartial(siteUrl, outputDir, posts, newPost) {
        const sitemap = [];
        posts.sort((a, b) => a.createdAt > b.createdAt ? -1 : (a.createdAt < b.createdAt ? 1 : 0));

        this.generateIndex(siteUrl, outputDir, posts, sitemap);

        const newPostDate = new Date(Date.parse(newPost.createdAt));
        const thisMonthPosts = posts.filter(post => {
            const postDate = new Date(Date.parse(post.createdAt));
            return postDate.getFullYear() === newPostDate.getFullYear()
                && postDate.getMonth() === newPostDate.getMonth()
        });
        const isNewMonth = thisMonthPosts.length === 1;

        try {
            this.writePage(thisMonthPosts,
                this.displayMonthFromIsoTimestamp(newPost.createdAt),
                `${siteUrl}/${this.filenameFromIsoTimestamp(newPost.createdAt)}`,
                path.resolve(outputDir, `${this.filenameFromIsoTimestamp(newPost.createdAt)}.html`),
                posts.length > thisMonthPosts.length ? this.filenameFromIsoTimestamp(posts[thisMonthPosts.length].createdAt) : null,
                null);

            this.writeAPOutboxPage(thisMonthPosts,
                siteUrl,
                outputDir,
                this.filenameFromIsoTimestamp(newPost.createdAt),
                null,
                posts.length > thisMonthPosts.length ? this.filenameFromIsoTimestamp(posts[thisMonthPosts.length].createdAt) : null);
        } catch (error) {
            console.error(error);
        }

        if (isNewMonth) {
            if (posts.length > 1) {
                const prevPostDate = new Date(Date.parse(posts[1].createdAt));
                const lastMonthPosts = posts.filter(post => {
                    const postDate = new Date(Date.parse(post.createdAt));
                    return postDate.getFullYear() === prevPostDate.getFullYear()
                        && postDate.getMonth() === prevPostDate.getMonth()
                });

                try {
                    this.writePage(lastMonthPosts,
                        this.displayMonthFromIsoTimestamp(posts[1].createdAt),
                        `${siteUrl}/${this.filenameFromIsoTimestamp(posts[1].createdAt)}`,
                        path.resolve(outputDir, `${this.filenameFromIsoTimestamp(posts[1].createdAt)}.html`),
                        posts.length > lastMonthPosts.length + 1 ? this.filenameFromIsoTimestamp(posts[lastMonthPosts.length + 1].createdAt) : null,
                        this.filenameFromIsoTimestamp(newPost.createdAt));

                    this.writeAPOutboxPage(lastMonthPosts,
                        siteUrl,
                        outputDir,
                        this.filenameFromIsoTimestamp(posts[1].createdAt),
                        this.filenameFromIsoTimestamp(newPost.createdAt),
                        posts.length > lastMonthPosts.length + 1 ? this.filenameFromIsoTimestamp(posts[lastMonthPosts.length + 1].createdAt) : null);
                } catch (error) {
                    console.error(error);
                }
            }

            const months = posts.reduce((acc, post) => {
                if (acc.length === 0) {
                    return [post.createdAt];
                }

                const postDate = new Date(Date.parse(post.createdAt));
                const lastDate = new Date(Date.parse(acc[acc.length - 1]));

                if (postDate.getFullYear() === lastDate.getFullYear() && postDate.getMonth() === lastDate.getMonth()) {
                    return acc;
                }

                return [...acc, post.createdAt];
            }, []);

            months.forEach(month => sitemap.push({
                url: `${siteUrl}/${this.filenameFromIsoTimestamp(month)}`,
                updatedAt: month,
            }));

            this.writeSitemap(sitemap, path.resolve(outputDir, 'sitemap.xml'));

            this.writeAPOutbox([...posts, newPost], path.resolve(outputDir, '/ap/outbox.json'));
        }
    }

    generateIndex(siteUrl, outputDir, posts, sitemap) {
        const mainPage = posts.slice(0, 10);

        try {
            this.writePage(mainPage,
                null,
                `${siteUrl}/`,
                path.resolve(outputDir, 'index.html'),
                this.filenameFromIsoTimestamp(posts[10].createdAt),
                null);
            sitemap.push({
                url: `${siteUrl}/`,
                updatedAt: mainPage[0].createdAt,
            });
        } catch (error) {
            throw(error);
        }
    }

    writeSitemap(sitemap, file) {
        const eta = new Eta({views: fileURLToPath(new URL('./views', import.meta.url))});
        const xml = beautify.html(
            eta.render('./sitemap', {pages: sitemap}),
            {end_with_newline: true},
        );

        try {
            fs.writeFileSync(file, xml)
        } catch (err) {
            throw (`Failed to write file: ${file}`);
        }
    }

    writePage(posts, title, canonical, file, prevPage, nextPage) {
        const eta = new Eta({views: fileURLToPath(new URL('./views', import.meta.url))});
        const html = beautify.html(
            eta.render('./default', {posts, title, canonical, prevPage, nextPage}), {tab_size: 4, ignore: ['style', 'script']},
            {
                end_with_newline: true,
                space_after_anon_function: true,
                operator_position: 'after-newline',
                extra_liners: [],
            },
        );

        try {
            fs.writeFileSync(file, html)
        } catch (err) {
            throw (`Failed to write file: ${file}`);
        }
    }

    writeAtom(siteUrl, posts, file) {
        const eta = new Eta({views: fileURLToPath(new URL('./views', import.meta.url))});
        const translator = createTranslator();

        const latestPosts = posts.slice(0, 20);

        const postsWithDerivedData = latestPosts.map(post => ({
            ...post,
            title: post.text.replace(/(https:\/\/\S*)/g, '').replaceAll('\n', ' ').replace(/\s\s+/g, ' ').trimEnd() || 'link',
            uuid: translator.toUUID(post.id),
            archivePage: `${siteUrl}/${this.filenameFromIsoTimestamp(post.createdAt)}`,
            html: minify.minify(Buffer.from(eta.render('./basic_html', {post})), {keep_closing_tags: true}).toString(),
        }));

        const xml = beautify.html(
            eta.render('./atom_feed', {
                siteUrl,
                posts: postsWithDerivedData
            }),
            {end_with_newline: true},
        );

        try {
            fs.writeFileSync(file, xml)
        } catch (err) {
            throw (`Failed to write file: ${file}`);
        }
    }

    writeAPOutbox(posts, siteUrl, file) {
        const url = `${siteUrl}/ap/outbox`;
        const first = this.filenameFromIsoTimestamp(new Date(Date.parse(posts[0].createdAt)));
        const last = this.filenameFromIsoTimestamp(new Date(Date.parse(posts[posts.length - 1].createdAt)));

        const outbox = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "OrderedCollection",
            "totalItems": posts.length,
            "first": `${url}?page=${first}`,
            "last": `${url}?page=${last}`
        }

        const json = beautify.js(
            JSON.stringify(outbox),
            {end_with_newline: true},
        );
        try {
            fs.writeFileSync(file, json);
        } catch (err) {
            throw (`Failed to write file: ${file}`);
        }
    }

    writeAPOutboxPage(posts, siteUrl, outputDir, currentMonth, prevPage, nextPage) {
        const eta = new Eta({views: fileURLToPath(new URL('./views', import.meta.url))});
        const page = {
            "@context": "https://www.w3.org/ns/activitystreams",
            "type": "OrderedCollectionPage",
            "id": `${siteUrl}/ap/outbox?page=${currentMonth}`,
            "partOf": `${siteUrl}/ap/outbox`,
            "prev": `${siteUrl}/ap/outbox?page=${prevPage}`,
            "next": `${siteUrl}/ap/outbox?page=${nextPage}`,
            "orderedItems": []
        };

        if (!prevPage) {
            delete page.prev;
        }

        if (!nextPage) {
            delete page.next;
        }

        posts.forEach(post => {
            const url = `${siteUrl}/ap/notes/${post.id}`;

            const noteHtml = minify.minify(Buffer.from(eta.render('./basic_html', {post})), {keep_closing_tags: true}).toString();

            const note = {
                "id": url,
                "type": "Note",
                "published": post.createdAt,
                "url": `${siteUrl}/${currentMonth}`,
                "attributedTo": `${siteUrl}/ap/actor`,
                "to": [
                    `${siteUrl}/ap/followers`
                ],
                "cc": [
                    "https://www.w3.org/ns/activitystreams#Public"
                ],
                "sensitive": false,
                "content": noteHtml
            };

            const create = {
                "id": `${url}?activity=true`,
                "type": "Create",
                "actor": `${siteUrl}/ap/actor`,
                "published": post.createdAt,
                "to": [
                    `${siteUrl}/ap/followers`
                ],
                "cc": [
                    "https://www.w3.org/ns/activitystreams#Public"
                ],
                "object": note
            };

            page.orderedItems.push(create);

            const notePath = path.resolve(`${outputDir}/ap/notes/`, `${post.id}.json`);
            const noteJson = beautify.js(
                JSON.stringify(note),
                {end_with_newline: true},
            );
            try {
                fs.writeFileSync(notePath, noteJson);
            } catch (err) {
                throw (`Failed to write file: ${notePath}`);
            }

            const createPath = path.resolve(`${outputDir}/ap/creates/`, `${post.id}.json`);
            const createJson = beautify.js(
                JSON.stringify(create),
                {end_with_newline: true},
            );
            try {
                fs.writeFileSync(createPath, createJson);
            } catch (err) {
                throw (`Failed to write file: ${createPath}`);
            }
        });

        const pagePath = path.resolve(`${outputDir}/ap/outbox_pages/`, `${currentMonth}.json`);
        const pageJson = beautify.js(
            JSON.stringify(page),
            {end_with_newline: true},
        );
        try {
            fs.writeFileSync(pagePath, pageJson);
        } catch (err) {
            throw (`Failed to write file: ${pagePath}`);
        }
    }

    filenameFromIsoTimestamp(timestamp) {
        const date = new Date(Date.parse(timestamp));
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
    }

    displayMonthFromIsoTimestamp(timestamp) {
        const date = new Date(Date.parse(timestamp));
        return date.toLocaleDateString(undefined, {year: 'numeric', month: 'long'});
    }
}

export default Generator;

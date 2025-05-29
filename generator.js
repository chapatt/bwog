const { Eta } = require('eta');
const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').html;

module.exports = class Generator {
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
            } catch (error) {
                console.error(error);
                return;
            }
        }

        this.writeSitemap(sitemap, path.resolve(outputDir, 'sitemap.xml'));
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
        const eta = new Eta({views: path.resolve(__dirname, './views')});
        const xml = beautify(
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
        const eta = new Eta({views: path.resolve(__dirname, './views')});
        const html = beautify(
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

    filenameFromIsoTimestamp(timestamp) {
        const date = new Date(Date.parse(timestamp));
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
    }

    displayMonthFromIsoTimestamp(timestamp) {
        const date = new Date(Date.parse(timestamp));
        return date.toLocaleDateString(undefined, {year: 'numeric', month: 'long'});
    }
};
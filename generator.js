const { Eta } = require('eta');
const fs = require('fs');
const path = require('path');
const beautify = require('js-beautify').html;

module.exports = class Generator {
    generate(siteUrl, posts, outputDir) {
        const sitemap = [];
        posts.sort((a, b) => a.createdAt < b.createdAt ? -1 : (a.createdAt > b.createdAt ? 1 : 0));

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
        postsByMonth.forEach(month => month.reverse());
        posts.reverse();
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
            console.error(error);
            return;
        }

        let previousMonth = null;
        let currentMonth = null;
        let nextMonth = postsByMonth[0][0].createdAt;
        for (let i = 0; i < postsByMonth.length; ++i) {
            previousMonth = currentMonth;
            currentMonth = nextMonth;

            if (postsByMonth.length > i + 1) {
                nextMonth = postsByMonth[i + 1][0].createdAt;
            } else {
                nextMonth = null;
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
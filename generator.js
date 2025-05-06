const { Eta } = require('eta');
const fs = require('fs');
const path = require('path');
const prettify = require('html-prettify');

module.exports = class Generator {
    generate(posts, outputDir) {
        posts.sort((a, b) => a < b ? -1 : (a > b ? 1 : 0));

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
            this.writePage(mainPage, path.resolve(outputDir, 'index.html'), this.filenameFromIsoTimestamp(posts[10].createdAt), null);
        } catch (error) {
            console.error(error);
            return;
        }

        let previousMonth = null;
        let currentMonth = null;
        let nextMonth = this.filenameFromIsoTimestamp(postsByMonth[0][0].createdAt);
        for (let i = 0; i < postsByMonth.length; ++i) {
            previousMonth = currentMonth;
            currentMonth = nextMonth;

            if (postsByMonth.length > i + 1) {
                nextMonth = this.filenameFromIsoTimestamp(postsByMonth[i + 1][0].createdAt);
            } else {
                nextMonth = null;
            }

            try {
                this.writePage(postsByMonth[i], path.resolve(outputDir, currentMonth), previousMonth, nextMonth);
            } catch (error) {
                console.error(error);
                return;
            }
        }
    }

    writePage(posts, file, prevPage, nextPage) {
        const eta = new Eta({views: __dirname});
        const html = prettify(eta.render('./template', {posts, prevPage, nextPage}), {count: 4});

        try {
            fs.writeFileSync(file, html)
        } catch (err) {
            throw (`Failed to write file: ${file}`);
        }
    }

    filenameFromIsoTimestamp(timestamp) {
        const date = new Date(Date.parse(timestamp));
        return `${date.getFullYear()}-${date.getMonth() + 1}.html`;
    }
}
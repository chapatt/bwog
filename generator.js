const { Eta } = require('eta');
const fs = require('fs');
const path = require('path');
const {program} = require('commander');
const prettify = require('html-prettify');

program.description('Generate blog');
program.requiredOption('-i, --input <string>', 'content JSON');
program.requiredOption('-o, --output <string>', 'output directory');
program.parse();
const options = program.opts();
const input = path.resolve(options.input);
const outputDir = path.resolve(options.output);

const eta = new Eta({views: __dirname});

const posts = require(input);
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
    writePage(mainPage, 'index.html', filenameFromIsoTimestamp(posts[10].createdAt), null);
    let previousMonth = null;
    let currentMonth = null;
    let nextMonth = filenameFromIsoTimestamp(postsByMonth[0][0].createdAt);
    for (let i = 0; i < postsByMonth.length; ++i) {
        previousMonth = currentMonth;
        currentMonth = nextMonth;
        if (postsByMonth.length > i + 1) {
            nextMonth = filenameFromIsoTimestamp(postsByMonth[i + 1][0].createdAt);
        } else {
            nextMonth = null;
        }
        writePage(postsByMonth[i], currentMonth, previousMonth, nextMonth);
    }
} catch (error) {
    console.error(error);
    process.exit();
}

function writePage(posts, filename, prevPage, nextPage) {
    const html = prettify(eta.render("./template", {posts, prevPage, nextPage}), {count: 4});
    const file = path.resolve(outputDir, filename);
    try {
        fs.writeFileSync(file, html)
    } catch (err) {
        throw(`Failed to write file: ${file}`);
    }
}

function filenameFromIsoTimestamp(timestamp) {
    const date = new Date(Date.parse(timestamp));
    return `${date.getFullYear()}-${date.getMonth() + 1}.html`;
}
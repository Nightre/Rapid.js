document.addEventListener('DOMContentLoaded', () => {
    // 定义导航项数组
    const navItems = [
        { text: 'Home', href: './index.html' },
        { text: 'Document', href: './docs.html' },
        { text: 'Examples', href: './examples.html' },
        { text: 'API', href: './api/index.html' },
        { text: 'Github', href: 'https://github.com/Nightre/Rapid.js', isGithub: true },
        { text: 'NPM', href: 'https://www.npmjs.com/package/rapid-render', isNpm: true },
        { text: 'Blog', href: './blog.html' }
    ];

    const dom = document.createElement('div');

    // 并行获取 GitHub star 和 NPM 下载量
    Promise.all([
        fetch('https://api.github.com/repos/Nightre/Rapid.js').then(res => res.json()),
        fetch('https://api.npmjs.org/downloads/point/last-month/rapid-render').then(res => res.json())
    ])
        .then(([githubData, npmData]) => {
            const starCount = githubData.stargazers_count || 0;
            const downloadCount = npmData.downloads || 0;
            renderNav(dom, navItems, starCount, downloadCount);
            document.body.insertBefore(dom, document.body.firstChild);
        })
        .catch(error => {
            console.error('Failed to fetch data:', error);
            renderNav(dom, navItems, null, null); // 无数据时渲染
            document.body.insertBefore(dom, document.body.firstChild);
        });
});

// 渲染导航栏
function renderNav(dom, navItems, starCount, downloadCount) {
    const navLinks = navItems.map(item => {
        let text = item.text;
        if (item.isGithub && starCount !== null) {
            text += ` <span class="star-count">[${starCount} 
                <svg class="star-icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .587l3.668 7.431 8.332 1.209-6.001 5.853 1.416 8.25L12 18.897l-7.415 3.897 1.416-8.25-6.001-5.853 8.332-1.209L12 .587z"/>
                </svg>]</span>`;
        }
        if (item.isNpm && downloadCount !== null) {
            text += ` <span class="download-count">[${downloadCount} ↓]</span>`;
        }
        return `<a href="${item.href}">${text}</a>`;
    }).join('');

    dom.innerHTML = `
        <div class="nav">
            <h3 class="logo-title">
                <img src="./assets/logo.png" style="image-rendering: pixelated;" width="40">
                Rapid
            </h3>
            ${navLinks}
        </div>
    `;
}
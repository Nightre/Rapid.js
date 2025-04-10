window.onload = () => {
    const dom = document.createElement('div')
    dom.innerHTML = `
    <div class="nav">
        <h3 class="logo-title">
            <img src="./assets/logo.png" style="image-rendering: pixelated;" width="40">
            Rapid
        </h3>
        <a href="./index.html">Home</a>
        <a href="./docs.html">Document</a>
        <a href="./examples.html">Examples</a>
        <a href="./api/index.html">API</a>
        <a href="https://github.com/Nightre/Rapid.js">Github</a>
        <a href="https://www.npmjs.com/package/rapid-render">NPM</a>
    </div>
    `

    document.body.insertBefore(dom, document.body.firstChild)
}
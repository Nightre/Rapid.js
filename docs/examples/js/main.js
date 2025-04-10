const style = document.createElement('style')
style.textContent = `
    body {
        margin: 1rem;
        width: 500px;
    }
    #game {
        outline: 2px solid black;
        border-radius: 0.2rem;
    }
    img {
        border: 2px solid black;
    }
    p {
        margin: 0;
    }
`
document.head.appendChild(style)
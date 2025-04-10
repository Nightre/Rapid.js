
const warned = new Set<string>()
const warn = (text: string) => {
    if (warned.has(text)) return
    warned.add(text)
    console.warn(text)
}

export default warn



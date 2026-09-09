/** Minimal usage: component stores remain ordinary ECS maps. */
export function demo(rapid, texture) {
    const transforms = new Map([
        [1, { position: { x: 100, y: 50 } }],
        [2, { parent: 1, position: { x: 20, y: 0 } }],
    ])
    const renderables = new Map([[
        2, { texture, visible: true, zIndex: 0 },
    ]])
    new EcsRenderSystem().render(rapid, transforms, renderables)
}

export class EcsRenderSystem {
    render(rapid, transforms, renderables) {
        rapid.clear()
        const children = new Map()
        const roots = []
        const drawList = []
        let order = 0

        for (const [entity, transform] of transforms) {
            const parent = transform.parent
            if (parent == null || !transforms.has(parent)) roots.push(entity)
            else {
                if (!children.has(parent)) children.set(parent, [])
                children.get(parent).push(entity)
            }
        }

        const collect = entity => {
            const transform = transforms.get(entity)
            if (transform.visible === false) return
            const stack = rapid.matrixStack
            transform.matrix = stack.save()
            try {
                stack.applyTransform(transform, transform.width || 0, transform.height || 0)
                const sprite = renderables.get(entity)
                if (sprite && sprite.visible !== false)
                    drawList.push({
                        sprite, matrix: transform.matrix.world,
                        z: (transform.zIndex || 0) + (sprite.zIndex || 0), order: order++,
                    })
                for (const child of children.get(entity) || []) collect(child)
            } finally { stack.restore() }
        }

        for (const root of roots) collect(root)
        drawList.sort((a, b) => a.z - b.z || a.order - b.order)
        for (const item of drawList)
            rapid.drawSprite({ ...item.sprite, customMatrix: item.matrix })
        rapid.flush()
    }
}

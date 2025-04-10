/**
 * 通用侧边栏组件
 * @param {Object} options - 侧边栏配置
 * @param {string} options.containerId - 侧边栏容器ID
 * @param {Object} options.items - 侧边栏项目，格式为 {label: value}
 * @param {Function} options.onSelect - 选中项目时的回调函数
 * @param {string} options.urlParam - URL参数名称
 * @param {string} options.defaultItem - 默认选中的项目
 */
function createSidebar(options) {
    const { containerId, items, onSelect, urlParam, defaultItem } = options;
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error(`Sidebar container #${containerId} not found`);
        return;
    }

    // 获取URL参数中的选中项
    const urlParams = new URLSearchParams(window.location.search);
    const selectedFromUrl = urlParams.get(urlParam);
    let currentSelected = selectedFromUrl || defaultItem;
    
    // 创建侧边栏按钮
    const buttons = {};
    
    Object.entries(items).forEach(([label, value]) => {
        const button = document.createElement('button');
        button.innerText = label;
        button.classList.add('list-btn');
        button.dataset.value = value;
        
        button.addEventListener('click', () => {
            // 更新URL参数
            const url = new URL(window.location);
            url.searchParams.set(urlParam, value);
            window.history.pushState({}, '', url);
            
            // 更新选中状态
            Object.values(buttons).forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 调用回调函数
            if (typeof onSelect === 'function') {
                onSelect(value, label);
            }
        });
        
        // 设置初始选中状态
        if (value === currentSelected) {
            button.classList.add('active');
        }
        
        buttons[value] = button;
        container.appendChild(button);
    });
    
    // 如果存在当前选中项，则触发对应的回调
    if (currentSelected && buttons[currentSelected]) {
        if (typeof onSelect === 'function') {
            onSelect(currentSelected, Object.keys(items).find(key => items[key] === currentSelected));
        }
    }
    
    return {
        buttons,
        select: (value) => {
            if (buttons[value]) {
                buttons[value].click();
            }
        }
    };
} 
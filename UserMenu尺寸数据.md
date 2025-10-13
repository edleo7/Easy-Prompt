# UserMenu 容器完整尺寸数据

## 📐 Modal 外层容器尺寸

### 默认尺寸（桌面端 >1024px）
```javascript
{
  width: '60vw',          // 宽度：视口宽度的60%
  height: '60vh',         // 高度：视口高度的60%
  maxWidth: 1200,         // 最大宽度：1200px
  maxHeight: '90vh'       // 最大高度：视口高度的90%
  // ✨ 无最小值限制，完全跟随视口缩放
}
```

### 实际尺寸计算示例（1920x1080屏幕）
- 宽度：1920 * 0.6 = **1152px** (未超过maxWidth 1200px)
- 高度：1080 * 0.6 = **648px** (未超过maxHeight 972px)
- 实际显示：**1152px × 648px**

### 小屏幕示例（800x600屏幕）
- 宽度：800 * 0.6 = **480px** (无最小值限制，灵活缩放)
- 高度：600 * 0.6 = **360px**
- 实际显示：**480px × 360px**

---

## 📱 响应式断点尺寸

### 平板端（768px - 1024px）
```javascript
{
  width: '70vw',          // 宽度：视口宽度的70%
  height: '60vh',         // 高度：视口高度的60%
  // 无最小值限制，灵活适配
}
```
**示例（iPad 768x1024）：**
- 宽度：768 * 0.7 = **537.6px**
- 高度：1024 * 0.6 = **614.4px**

### 移动端（480px - 768px）
```javascript
{
  width: '90vw',          // 宽度：视口宽度的90%
  height: '80vh',         // 高度：视口高度的80%
  // 无最小值限制，灵活适配
}
```
**示例（iPhone 375x667）：**
- 宽度：375 * 0.9 = **337.5px**
- 高度：667 * 0.8 = **533.6px**

### 小屏幕（<480px）
```javascript
{
  width: '95vw',          // 宽度：视口宽度的95%
  height: '90vh',         // 高度：视口高度的90%
  // 无最小值限制，完全跟随视口
}
```
**示例（iPhone SE 320x568）：**
- 宽度：320 * 0.95 = **304px**
- 高度：568 * 0.9 = **511.2px**

---

## 🎨 内部布局尺寸

### 左侧导航栏（Sidebar）
```javascript
{
  width: 240,                      // 固定宽度：240px
  height: '100%',                  // 高度：100%（继承父容器）
  flexShrink: 0,                   // 不收缩
  borderRight: '1px solid',        // 右边框：1px
  borderRadius: '12px 0 0 12px'    // 左侧圆角：12px
}
```

**响应式调整：**
- 平板端（768px-1024px）：**240px**
- 移动端（480px-768px）：**200px**
- 小屏幕（<480px）：**160px**

#### 左侧导航栏内部结构
```
┌─────────────────────┐
│ Logo区域            │  padding: 24px 20px
│                     │  height: ~72px
├─────────────────────┤
│ 菜单项区域          │  flex: 1
│ (可滚动)            │  overflow-y: auto
│                     │
├─────────────────────┤
│ 底部操作区          │  padding: 12px 8px
│ - 获取帮助          │  height: ~100px
│ - 退出登录          │  flexShrink: 0
└─────────────────────┘
```

### 右侧内容区（Content）
```javascript
{
  flex: 1,                         // 占据剩余空间
  height: '100%',                  // 高度：100%
  padding: '40px 48px',            // 内边距：上下40px，左右48px
  overflowY: 'auto',               // 垂直滚动
  borderRadius: '0 12px 12px 0'    // 右侧圆角：12px
}
```

**计算公式：**
```
右侧内容区宽度 = Modal总宽度 - 左侧导航栏宽度 - 边框宽度
              = 1152px - 240px - 1px
              = 911px
```

**响应式padding调整：**
- 桌面端：**40px 48px**
- 移动端：**24px 20px**
- 小屏幕：**20px 16px**

---

## 📏 详细尺寸分解

### Modal容器层级结构
```
Modal (60vw × 60vh)
└── Modal Content (100% × 100%)
    └── Body Container (display: flex, flex-direction: row)
        ├── Sidebar (240px × 100%)
        │   ├── Logo Area (240px × 72px)
        │   ├── Menu Area (240px × flex:1)
        │   └── Bottom Actions (240px × 100px)
        └── Content Area (flex:1 × 100%)
            ├── Close Button (32px × 32px, absolute)
            └── Scrollable Content (padding: 40px 48px)
```

---

## 🎯 关键尺寸数据表

| 元素 | 宽度 | 高度 | 其他 |
|------|------|------|------|
| **Modal容器** | 60vw (最大1200px) | 60vh (最大90vh) | 圆角12px, 无最小值 |
| **左侧导航栏** | 240px | 100% | 固定宽度 |
| **Logo区域** | 240px | ~72px | padding: 24px 20px |
| **菜单区域** | 240px | flex: 1 | 可滚动 |
| **底部操作区** | 240px | ~100px | padding: 12px 8px |
| **右侧内容区** | flex: 1 (~911px) | 100% | padding: 40px 48px |
| **关闭按钮** | 32px | 32px | position: absolute |
| **滚动条** | 8px | auto | 自定义样式 |

---

## 💡 空间利用率计算

### 桌面端（1920×1080）示例
```
Modal总宽度：1152px
- 左侧导航栏：240px (20.8%)
- 边框：1px (0.1%)
- 右侧内容：911px (79.1%)

Modal总高度：648px
- Logo区域：72px (11.1%)
- 菜单区域：~476px (73.5%)
- 底部操作：100px (15.4%)
```

### 可用内容区域
```
右侧实际内容区域 = 右侧总宽度 - padding
                 = 911px - (48px × 2)
                 = 815px

实际内容高度 = Modal高度 - padding
            = 648px - (40px × 2)
            = 568px
```

---

## 🔄 响应式尺寸对比表

| 屏幕尺寸 | Modal宽度 | Modal高度 | 侧边栏宽度 | 内容区padding |
|----------|-----------|-----------|------------|---------------|
| 桌面 (>1024px) | 60vw | 60vh | 240px | 40px 48px |
| 平板 (768-1024px) | 70vw | 60vh | 240px | 40px 48px |
| 移动 (480-768px) | 90vw | 80vh | 200px | 24px 20px |
| 小屏 (<480px) | 95vw | 90vh | 160px | 20px 16px |

---

## 📐 CSS完整尺寸代码

```css
/* Modal主容器 */
.user-menu-modal {
  width: 60vw;
  height: 60vh;
  max-width: 1200px;
  max-height: 90vh;
  border-radius: 12px;
  /* 无最小值限制，灵活适配 */
}

/* 左侧导航栏 */
.user-menu-sidebar {
  width: 240px;
  height: 100%;
  border-right: 1px solid;
  border-radius: 12px 0 0 12px;
}

/* 右侧内容区 */
.user-menu-content {
  flex: 1;
  height: 100%;
  padding: 40px 48px;
  border-radius: 0 12px 12px 0;
}

/* 滚动条 */
.user-menu-scrollable::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
```

---

生成时间：2024年
文件版本：v1.0


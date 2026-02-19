# PWA 桌面图标

要让网站在桌面/手机以「应用」形式安装，需要 PNG 图标。

## 方式一：自动生成（推荐）

```bash
npm install -D sharp
npm run generate-icons
```

会在 `public/` 下生成 `icon-192.png` 和 `icon-512.png`。

## 方式二：手动制作

1. 打开 [Favicon Generator](https://favicongenerator.io/)
2. 用文字/图片生成图标，下载 ZIP
3. 将 `icon-192.png`、`icon-512.png` 放到 `public/` 目录

## 安装到桌面

- **Chrome / Edge**：地址栏右侧会出现安装图标，点击「安装」
- **Safari (iOS)**：分享 → 添加到主屏幕
- **手机浏览器**：菜单 → 添加到主屏幕 / 安装应用

需在 **HTTPS** 或 **localhost** 下访问才能安装。

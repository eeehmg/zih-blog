# ZIH · 博客小栈

个人博客，支持文章/新闻发布、相册、留言、联系方式、音乐播放、主题切换、数据导入导出。

## 部署到 GitHub Pages

1. 新建仓库，例如 `zih-blog`
2. 将本文件夹内容上传到仓库根目录（或 `docs/` 目录）
3. 在仓库 Settings → Pages → Source 选择 `main` 分支 / root（或 docs）
4. 等待几分钟即可访问 `https://<username>.github.io/zih-blog/`

## 文件结构

```
zih-blog/
├── index.html          # 主页面
├── css/
│   └── style.css       # 全部样式（含主题变量）
├── js/
│   └── app.js          # 全部逻辑（localStorage 数据）
├── assets/             # 可选静态资源（头像/音乐示例）
│   ├── avatar.png      # 可替换为你的头像
│   └── music.mp3       # 可替换为你的背景音乐
└── README.md
```

## 头像与音乐说明（已分离）

- **头像**：侧边栏头像支持点击上传（保存到浏览器 localStorage）。  
  如需默认头像，可把图片放到 `assets/avatar.png`，并在 `js/app.js` 的 `getProfile()` 默认值中设置 `avatar: 'assets/avatar.png'`。
- **音乐**：侧边栏音乐框支持上传本地音频（同样存 localStorage）。  
  如需默认音乐，可把音频放到 `assets/music.mp3`，并在初始化时加载。

数据全部存储在浏览器 localStorage，导出 JSON 可备份迁移。

## 响应式检查结果

- **电脑端（≥860px）**：双栏布局，侧边栏固定宽度 272px，主内容自适应，卡片网格 2 列，无偏移/错位。
- **手机端（≤860px）**：侧边栏变为抽屉式（左滑出），顶部导航隐藏，内容单列，相册/联系方式 2 列，按钮与卡片自适应，整体对齐良好。  
  小屏（≤480px）进一步压缩字体与间距，无横向溢出。

已知小细节：
- 发布按钮在极窄屏上文字可能被截断（可改短文案或缩小 padding）。
- 双汉堡图标（分类菜单 + 侧边栏）在手机端并排，功能正常。

## 主题

支持 7 种主题：白天 / 黑夜 / 暖阳 / 森林 / 海洋 / 樱花 / 紫罗兰，自动保存到 localStorage。

© 2026 ZIH

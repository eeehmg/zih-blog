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
├── index.html
├── css/style.css
├── js/app.js
├── assets/
│   ├── avatar/
│   │   └── avatar.png      ← 默认头像（放这里）
│   ├── contacts/
│   │   ├── wechat.png      ← 微信二维码/照片
│   │   └── douyin.png      ← 抖音二维码/照片
│   ├── music/
│   │   └── bgm.mp3         ← 默认背景音乐
│   └── gallery/            ← 相册示例图（可选）
└── README.md
```

## 头像 / 联系方式照片 / 音乐（已放到 assets）

把文件按上面路径放入即可，刷新页面自动加载：

| 类型 | 路径 | 说明 |
|------|------|------|
| 头像 | `assets/avatar/avatar.png` | 侧边栏默认头像 |
| 微信 | `assets/contacts/wechat.png` | 联系方式卡片图片 |
| 抖音 | `assets/contacts/douyin.png` | 联系方式卡片图片 |
| 音乐 | `assets/music/bgm.mp3` | 侧边栏默认背景音乐 |

- 页面上「点击上传」仍会保存到浏览器 localStorage（仅本机有效）。
- GitHub Pages 是静态站，无法把浏览器上传的文件真正写进仓库。
- **正式发布请把图片/音乐预先放到 assets 再提交**，这样所有访客都能看到。

其他数据（文章、评论等）仍在 localStorage，支持导出 JSON 备份。

## 预览（图片 + 视频）

- 支持上传图片与视频（预览页「上传图片 / 上传视频」）
- 视频可在线播放（`<video controls>`）
- 单文件建议 ≤ 4MB（受浏览器 localStorage 限制）
- 大视频请放到 `assets/gallery/` 再引用

## 搜索功能

- 点击顶部 **搜索图标** 打开搜索栏
- 支持按 **标题 / 分类 / 摘要 / 正文** 实时过滤
- 与当前分类筛选叠加（例如：先选「英语体系」，再搜关键词）
- `Esc` 清空或关闭搜索栏，点 ✕ 清除关键词

## 响应式检查结果

- **电脑端（≥860px）**：双栏布局，侧边栏固定宽度 272px，主内容自适应，卡片网格 2 列，无偏移/错位。
- **手机端（≤860px）**：侧边栏变为抽屉式（左滑出），顶部导航隐藏，内容单列，相册/联系方式 2 列，按钮与卡片自适应，整体对齐良好。  
  小屏（≤480px）进一步压缩字体与间距，无横向溢出。

已知小细节：
- 「发布新内容」按钮已改为可调节大小：通过 CSS 变量 `--btn-publish-font` / `--btn-publish-pad-x` 等控制，小屏会自动缩小，避免文字被截断。
- 双汉堡图标（分类菜单 + 侧边栏）在手机端并排，功能正常。

## 主题

支持 7 种主题：白天 / 黑夜 / 暖阳 / 森林 / 海洋 / 樱花 / 紫罗兰，自动保存到 localStorage。

© 2026 ZIH

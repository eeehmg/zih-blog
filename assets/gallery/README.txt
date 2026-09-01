【长期、多设备可见 — 预览集】

1. 把图片/小视频放进本文件夹，例如：
   photo1.jpg
   clip.mp4

2. 打开 js/app.js，找到 defaultImages，取消注释或新增，例如：

   { id: 101, url: 'assets/gallery/photo1.jpg', title: '我的照片', desc: '', type: 'image' },
   { id: 102, url: 'assets/gallery/clip.mp4', title: '小视频', desc: '', type: 'video' },

3. git add / commit / push 到 GitHub，等待 Pages 更新。

4. 打开网站 → 预览 → 点「🔄 同步仓库图集」
   （或在控制台执行：localStorage.removeItem('ZIH_gallery'); location.reload();）

注意：
- 单文件建议 < 50MB；大视频请用「嵌入 B 站」
- 路径区分大小写
- 网页里「上传图片」只存在当前浏览器，不会进 GitHub

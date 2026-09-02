ZIH 本地云盘视频助手 v2
========================

一、启动
1. Windows 双击：启动系统播放器助手.bat
2. 第一次启动选择你的本地云盘根文件夹。
3. 保持这个黑色窗口运行。

二、外接播放器
支持：
- VLC
- PotPlayer
- MPC-HC
- mpv
- 自定义任意 .exe 播放器

网站：☁️ 云盘 → 🎬 外接播放器 → 选择播放器 → 保存。
助手会自动检测常见安装位置；自定义播放器直接填写 exe 完整路径。

三、Chrome 播放失败 → 自动转码
在本地视频预览窗口点击「🔄 自动转码」。
助手使用 FFmpeg 将视频转换为：MP4 + H.264 + AAC。
转码后的文件会缓存到：
%LOCALAPPDATA%\ZIHBlogMediaHelper\transcode-cache
之后同一个源文件会直接复用缓存，不必重复转码。

FFmpeg 推荐：
- 将 ffmpeg.exe 加入 Windows PATH；或
- 放到 C:\Program Files\ffmpeg\bin\ffmpeg.exe

四、关于“不是可运行的程序/内部或外部命令”
旧版依赖 Windows 文件关联，某些情况下会失败。
v2 默认播放器通过 Windows shell 启动；外接播放器则直接调用播放器 .exe，
因此 VLC / PotPlayer / MPC-HC / mpv 不依赖视频文件本身是“可执行程序”。

五、安全
助手只监听 127.0.0.1（本机），并限制只能访问启动时选择的云盘根目录。
不要把 47823 端口映射到公网。

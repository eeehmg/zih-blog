# ZIH Local Cloud Media Helper v2
# Windows PowerShell 5+ / localhost only
# 功能：默认播放器、VLC/PotPlayer/MPC-HC/mpv 外接播放器、FFmpeg 自动转码、MP4 HTTP Range 播放
Add-Type -AssemblyName System.Windows.Forms

$baseDir = Join-Path $env:LOCALAPPDATA 'ZIHBlogMediaHelper'
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
$configFile = Join-Path $baseDir 'config.json'
$cacheDir = Join-Path $baseDir 'transcode-cache'
$logDir = Join-Path $baseDir 'logs'
New-Item -ItemType Directory -Force -Path $cacheDir,$logDir | Out-Null

$config = @{ player='default'; customPath='' }
if (Test-Path $configFile) {
  try { $old = Get-Content $configFile -Raw | ConvertFrom-Json; if ($old.player) {$config.player=[string]$old.player}; if ($old.customPath) {$config.customPath=[string]$old.customPath} } catch {}
}

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = '请选择你的本地云盘文件夹（OneDrive / Google Drive / Dropbox / 普通视频文件夹均可）'
$dialog.ShowNewFolderButton = $false
if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
$root = [System.IO.Path]::GetFullPath($dialog.SelectedPath).TrimEnd('\')

function Find-Exe([string[]]$paths) {
  foreach ($p in $paths) { if ($p -and (Test-Path $p)) { return (Resolve-Path $p).Path } }
  return $null
}
function Find-CommandExe([string]$name) {
  try { $c = Get-Command $name -ErrorAction Stop; if ($c.Source) { return $c.Source } } catch {}
  return $null
}

$players = @{}
$players['vlc'] = Find-Exe @(
  "$env:ProgramFiles\VideoLAN\VLC\vlc.exe",
  "${env:ProgramFiles(x86)}\VideoLAN\VLC\vlc.exe",
  "$env:LOCALAPPDATA\Programs\VideoLAN\VLC\vlc.exe"
)
$players['potplayer'] = Find-Exe @(
  "$env:ProgramFiles\DAUM\PotPlayer\PotPlayerMini64.exe",
  "$env:ProgramFiles\DAUM\PotPlayer\PotPlayerMini.exe",
  "${env:ProgramFiles(x86)}\DAUM\PotPlayer\PotPlayerMini.exe"
)
$players['mpchc'] = Find-Exe @(
  "$env:ProgramFiles\MPC-HC\mpc-hc64.exe",
  "$env:ProgramFiles\MPC-HC\mpc-hc.exe",
  "${env:ProgramFiles(x86)}\MPC-HC\mpc-hc.exe",
  "$env:ProgramFiles\K-Lite Codec Pack\MPC-HC64\mpc-hc64.exe"
)
$players['mpv'] = Find-Exe @(
  "$env:ProgramFiles\mpv\mpv.exe",
  "${env:ProgramFiles(x86)}\mpv\mpv.exe",
  "$env:LOCALAPPDATA\mpv\mpv.exe",
  "$env:USERPROFILE\scoop\apps\mpv\current\mpv.exe",
  (Find-CommandExe 'mpv.exe')
)

$ffmpeg = Find-Exe @(
  "$env:ProgramFiles\ffmpeg\bin\ffmpeg.exe",
  "${env:ProgramFiles(x86)}\ffmpeg\bin\ffmpeg.exe",
  "$env:LOCALAPPDATA\Programs\ffmpeg\bin\ffmpeg.exe",
  "$env:USERPROFILE\scoop\apps\ffmpeg\current\bin\ffmpeg.exe",
  (Find-CommandExe 'ffmpeg.exe')
)

$listener = New-Object System.Net.HttpListener
$prefix = 'http://127.0.0.1:47823/'
$listener.Prefixes.Add($prefix)
try { $listener.Start() } catch {
  [System.Windows.Forms.MessageBox]::Show("无法启动本地助手：$($_.Exception.Message)`n`n如果端口 47823 被占用，请关闭旧助手后重试。", 'ZIH 本地视频助手')
  exit 1
}

$jobs = @{}
Write-Host "ZIH 本地视频助手 v2 已启动"
Write-Host "本地云盘：$root"
Write-Host "FFmpeg：$(if($ffmpeg){$ffmpeg}else{'未找到'})"
Write-Host "地址：$prefix"
Write-Host "可直接使用 VLC / PotPlayer / MPC-HC / mpv，或自动转码为 MP4。"
Write-Host "关闭此窗口即可停止助手。"

function Send-Json($ctx, $obj, $status=200) {
  $json = $obj | ConvertTo-Json -Compress -Depth 6
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $ctx.Response.StatusCode = $status
  $ctx.Response.ContentType = 'application/json; charset=utf-8'
  $ctx.Response.Headers['Access-Control-Allow-Origin'] = '*'
  $ctx.Response.Headers['Cache-Control'] = 'no-store'
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
  $ctx.Response.Close()
}
function Safe-Resolve([string]$relative) {
  if ([string]::IsNullOrWhiteSpace($relative)) { throw '缺少文件路径' }
  $relative = [Uri]::UnescapeDataString($relative).Replace('/','\')
  if ($relative -match '^(?:[a-zA-Z]:|\\)' -or $relative -match '(^|\)\.\.(\|$)') { throw '非法路径' }
  $candidate = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
  $rootWithSlash = $root + '\'
  if (-not ($candidate.Equals($root,[StringComparison]::OrdinalIgnoreCase) -or $candidate.StartsWith($rootWithSlash,[StringComparison]::OrdinalIgnoreCase))) { throw '路径超出云盘目录' }
  return $candidate
}
function Save-Config {
  $config | ConvertTo-Json | Set-Content -Encoding UTF8 $configFile
}
function Get-Players {
  $out=@{}
  foreach($k in $players.Keys){$out[$k]=$players[$k]}
  if($config.customPath -and (Test-Path $config.customPath)){ $out['custom']=$config.customPath } else { $out['custom']=$null }
  return $out
}
function Hash-Text([string]$text) {
  $sha=[Security.Cryptography.SHA256]::Create(); $b=[Text.Encoding]::UTF8.GetBytes($text); $h=$sha.ComputeHash($b); $sha.Dispose(); return ([BitConverter]::ToString($h)).Replace('-','').ToLower()
}
function Mime-For([string]$file) {
  $ext=[IO.Path]::GetExtension($file).ToLowerInvariant()
  switch($ext){ '.mp4' {'video/mp4'} '.m4v' {'video/mp4'} '.webm' {'video/webm'} '.ogv' {'video/ogg'} '.ogg' {'video/ogg'} '.mov' {'video/quicktime'} '.mkv' {'video/x-matroska'} '.avi' {'video/x-msvideo'} '.mpg' {'video/mpeg'} '.mpeg' {'video/mpeg'} '.ts' {'video/mp2t'} '.mts' {'video/mp2t'} '.m2ts' {'video/mp2t'} '.3gp' {'video/3gpp'} '.flv' {'video/x-flv'} '.f4v' {'video/x-f4v'} '.wmv' {'video/x-ms-wmv'} default {'application/octet-stream'} }
}
function Start-Player([string]$file,[string]$name) {
  if($name -eq 'default') {
    # 不直接把视频当成可执行文件；通过 Windows shell 的 start 交给文件关联。
    $psi=New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName='cmd.exe'; $psi.Arguments='/c start "" "' + $file.Replace('"','""') + '"'; $psi.CreateNoWindow=$true; $psi.UseShellExecute=$false
    [Diagnostics.Process]::Start($psi) | Out-Null
    return 'Windows 默认播放器'
  }
  $exe=$null
  if($name -eq 'custom') {$exe=$config.customPath} elseif($players.ContainsKey($name)) {$exe=$players[$name]}
  if(-not $exe -or -not (Test-Path $exe)) { throw "未找到播放器：$name" }
  Start-Process -FilePath $exe -ArgumentList @('"'+$file.Replace('"','\"')+'"') | Out-Null
  return $exe
}

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  try {
    $path = $ctx.Request.Url.AbsolutePath
    if ($ctx.Request.HttpMethod -eq 'OPTIONS') { $ctx.Response.Headers['Access-Control-Allow-Origin']='*'; $ctx.Response.Headers['Access-Control-Allow-Methods']='GET, OPTIONS'; $ctx.Response.Headers['Access-Control-Allow-Headers']='Content-Type'; $ctx.Response.StatusCode=204; $ctx.Response.Close(); continue }

    if ($path -eq '/status') {
      Send-Json $ctx @{ ok=$true; root=$root; ffmpeg=$ffmpeg; players=(Get-Players); selected=$config.player }
      continue
    }
    if ($path -eq '/set-player') {
      $name=$ctx.Request.QueryString['name']; $custom=[Uri]::UnescapeDataString($ctx.Request.QueryString['path'] -as [string])
      if(-not $name){$name='default'}
      if($name -eq 'custom') {
        if(-not $custom -or -not (Test-Path $custom)){ throw '自定义播放器路径不存在' }
        $config.customPath=[IO.Path]::GetFullPath($custom)
      }
      $config.player=$name; Save-Config
      Send-Json $ctx @{ok=$true; player=$name; status=@{players=(Get-Players);ffmpeg=$ffmpeg;selected=$config.player}}
      continue
    }
    if ($path -eq '/open') {
      $rel=$ctx.Request.QueryString['path']; $file=Safe-Resolve $rel; if(-not [IO.File]::Exists($file)){throw '文件不存在：'+$rel}
      $name=$ctx.Request.QueryString['player']; if(-not $name){$name=$config.player}; if(-not $name){$name='default'}
      $used=Start-Player $file $name
      Send-Json $ctx @{ok=$true;file=$rel;player=$used}
      continue
    }
    if ($path -eq '/transcode') {
      if(-not $ffmpeg){throw '未找到 FFmpeg。请安装 FFmpeg 并加入 PATH，或放到 Program Files\\ffmpeg\\bin\\ffmpeg.exe。'}
      $rel=$ctx.Request.QueryString['path']; $file=Safe-Resolve $rel; if(-not [IO.File]::Exists($file)){throw '文件不存在：'+$rel}
      $fi=Get-Item $file; $key=Hash-Text ($file+'|'+$fi.Length+'|'+$fi.LastWriteTimeUtc.Ticks); $out=Join-Path $cacheDir ($key+'.mp4'); $log=Join-Path $logDir ($key+'.log')
      if(Test-Path $out -and (Get-Item $out).Length -gt 0){ Send-Json $ctx @{ok=$true;jobId=$key;cached=$true;state='done';url=($prefix+'media?file='+$key+'.mp4');message='已使用本地转码缓存'}; continue }
      if($jobs.ContainsKey($key)){ Send-Json $ctx @{ok=$true;jobId=$key;state=$jobs[$key].state;message=$jobs[$key].message}; continue }
      $args='-hide_banner -y -i "'+$file.Replace('"','\"')+'" -map 0:v:0 -map 0:a? -c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 160k -movflags +faststart "'+$out.Replace('"','\"')+'"'
      $psi=New-Object System.Diagnostics.ProcessStartInfo; $psi.FileName=$ffmpeg; $psi.Arguments=$args; $psi.UseShellExecute=$false; $psi.CreateNoWindow=$true; $psi.RedirectStandardError=$true; $psi.RedirectStandardOutput=$true
      $proc=New-Object System.Diagnostics.Process; $proc.StartInfo=$psi; [void]$proc.Start()
      $jobs[$key]=[ordered]@{state='running';message='FFmpeg 正在转码；完成后会自动进入 Chrome 播放';process=$proc;out=$out;log=$log}
      # 后台线程读取输出并写日志，避免 FFmpeg 缓冲区阻塞。
      $keyCopy=$key; $procCopy=$proc; $logCopy=$log; $outCopy=$out
      [Threading.Tasks.Task]::Run([Action]{
        try { $err=$procCopy.StandardError.ReadToEnd(); $procCopy.WaitForExit(); Set-Content -Path $logCopy -Value $err -Encoding UTF8; if($procCopy.ExitCode -eq 0 -and (Test-Path $outCopy)){ $jobs[$keyCopy].state='done'; $jobs[$keyCopy].message='转码完成'; } else { $jobs[$keyCopy].state='error'; $jobs[$keyCopy].message='FFmpeg 转码失败，请查看日志：'+$logCopy } } catch { if($jobs.ContainsKey($keyCopy)){$jobs[$keyCopy].state='error';$jobs[$keyCopy].message=$_.Exception.Message} }
      }) | Out-Null
      Send-Json $ctx @{ok=$true;jobId=$key;state='running';message='FFmpeg 已启动'}
      continue
    }
    if ($path -eq '/job') {
      $id=$ctx.Request.QueryString['id']; if(-not $id -or -not $jobs.ContainsKey($id)){ throw '转码任务不存在' }
      $j=$jobs[$id]; $url=$null; if($j.state -eq 'done'){$url=$prefix+'media?file='+$id+'.mp4'}
      Send-Json $ctx @{ok=$true;jobId=$id;state=$j.state;message=$j.message;url=$url}
      continue
    }
    if ($path -eq '/media') {
      $name=$ctx.Request.QueryString['file']; if(-not $name -or $name -notmatch '^[a-f0-9]{64}\.mp4$'){throw '非法缓存文件'}
      $file=Join-Path $cacheDir $name; if(-not [IO.File]::Exists($file)){throw '缓存文件不存在'}
      $length=(Get-Item $file).Length; $start=0L; $end=$length-1L
      $range=$ctx.Request.Headers['Range']
      if($range -and $range -match 'bytes=(\d+)-(\d*)') { $start=[int64]$Matches[1]; if($Matches[2]){$end=[int64]$Matches[2]}; if($end -ge $length){$end=$length-1}; if($start -gt $end){$ctx.Response.StatusCode=416;$ctx.Response.Close();continue}; $ctx.Response.StatusCode=206; $ctx.Response.Headers['Content-Range']="bytes $start-$end/$length" } else { $ctx.Response.StatusCode=200 }
      $ctx.Response.Headers['Access-Control-Allow-Origin']='*'; $ctx.Response.ContentType='video/mp4'; $ctx.Response.Headers['Accept-Ranges']='bytes'; $ctx.Response.ContentLength64=($end-$start+1)
      $fs=[IO.File]::OpenRead($file); $fs.Seek($start,[IO.SeekOrigin]::Begin)|Out-Null; $buf=New-Object byte[] 1048576; $remain=$end-$start+1
      try { while($remain -gt 0){$read=$fs.Read($buf,0,[Math]::Min($buf.Length,$remain)); if($read -le 0){break}; $ctx.Response.OutputStream.Write($buf,0,$read); $remain-=$read} } finally {$fs.Dispose();$ctx.Response.OutputStream.Close()}
      continue
    }
    Send-Json $ctx @{ok=$false;message='Not Found'} 404
  } catch {
    try { Send-Json $ctx @{ok=$false;message=$_.Exception.Message} 400 } catch {}
  }
}
$listener.Stop(); $listener.Close()

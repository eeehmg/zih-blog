# ZIH Local Cloud System Player Helper
# Windows built-in PowerShell. Only listens on localhost and only opens files under the selected root folder.
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Web

$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = '请选择你的本地云盘文件夹（例如 OneDrive / Google Drive / 电脑上的视频文件夹）'
$dialog.ShowNewFolderButton = $false
if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) { exit }
$root = [System.IO.Path]::GetFullPath($dialog.SelectedPath).TrimEnd('\')

$listener = New-Object System.Net.HttpListener
$prefix = 'http://127.0.0.1:47823/'
$listener.Prefixes.Add($prefix)
try { $listener.Start() } catch {
  [System.Windows.Forms.MessageBox]::Show("无法启动本地助手：$($_.Exception.Message)`n`n如果端口 47823 被占用，请关闭旧助手后重试。", 'ZIH 系统播放器助手')
  exit 1
}

Write-Host "ZIH 系统播放器助手已启动"
Write-Host "本地云盘：$root"
Write-Host "地址：$prefix"
Write-Host "关闭此窗口即可停止助手。"

function Send-Json($ctx, $obj, $status=200) {
  $json = $obj | ConvertTo-Json -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $ctx.Response.StatusCode = $status
  $ctx.Response.ContentType = 'application/json; charset=utf-8'
  $ctx.Response.Headers['Access-Control-Allow-Origin'] = '*'
  $ctx.Response.ContentLength64 = $bytes.Length
  $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
  $ctx.Response.Close()
}

function Safe-Resolve($relative) {
  if ([string]::IsNullOrWhiteSpace($relative)) { throw '缺少文件路径' }
  $relative = [Uri]::UnescapeDataString($relative).Replace('/','\')
  if ($relative -match '^(?:[a-zA-Z]:|\\\\)' -or $relative -match '(^|\\)\.\.(\\|$)') { throw '非法路径' }
  $candidate = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
  $rootWithSlash = $root + '\'
  if (-not ($candidate.Equals($root,[StringComparison]::OrdinalIgnoreCase) -or $candidate.StartsWith($rootWithSlash,[StringComparison]::OrdinalIgnoreCase))) { throw '路径超出云盘目录' }
  return $candidate
}

while ($listener.IsListening) {
  try { $ctx = $listener.GetContext() } catch { break }
  try {
    $path = $ctx.Request.Url.AbsolutePath
    if ($ctx.Request.HttpMethod -eq 'OPTIONS') { $ctx.Response.Headers['Access-Control-Allow-Origin']='*'; $ctx.Response.Headers['Access-Control-Allow-Methods']='GET, OPTIONS'; $ctx.Response.Headers['Access-Control-Allow-Headers']='Content-Type'; $ctx.Response.StatusCode=204; $ctx.Response.Close(); continue }
    if ($path -eq '/status') {
      Send-Json $ctx @{ ok=$true; root=$root; message='系统播放器助手已连接' }
      continue
    }
    if ($path -eq '/open') {
      $rel = $ctx.Request.QueryString['path']
      $file = Safe-Resolve $rel
      if (-not [System.IO.File]::Exists($file)) { throw '文件不存在：' + $rel }
      Start-Process -FilePath $file
      Send-Json $ctx @{ ok=$true; file=$rel; message='已交给 Windows 默认播放器' }
      continue
    }
    Send-Json $ctx @{ ok=$false; message='Not Found' } 404
  } catch {
    Send-Json $ctx @{ ok=$false; message=$_.Exception.Message } 400
  }
}
$listener.Stop()
$listener.Close()

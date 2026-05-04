#!/usr/bin/env pwsh
# 检查情节发展的一致性和连贯性（PowerShell）

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

. "$PSScriptRoot/common.ps1"

$root = Get-ProjectRoot
$storyDir = Get-CurrentStoryDir
if (-not $storyDir) { throw "未找到故事项目（stories/*）" }

$plotPath = Join-Path $storyDir "spec/tracking/plot-tracker.json"
if (-not (Test-Path $plotPath)) { $plotPath = Join-Path $root "spec/tracking/plot-tracker.json" }
$outlinePath = Join-Path $storyDir "outline.md"
$progressPath = Join-Path $storyDir "progress.json"

function Ensure-PlotTracker {
  if (-not (Test-Path $plotPath)) {
    Write-Host "⚠️  未找到情节追踪文件，正在创建..."
    $tpl = Join-Path $root "templates/tracking/plot-tracker.json"
    if (-not (Test-Path $tpl)) { throw "无法找到模板文件" }
    New-Item -ItemType Directory -Path (Split-Path $plotPath -Parent) -Force | Out-Null
    Copy-Item $tpl $plotPath -Force
  }
  if (-not (Test-Path $outlinePath)) { throw "未找到章节大纲 outline.md，请先使用 /outline" }
}

function Get-CurrentProgress {
  if (Test-Path $progressPath) {
    $p = Get-Content -LiteralPath $progressPath -Raw -Encoding UTF8 | ConvertFrom-Json
    return @{ chapter = ($p.statistics.currentChapter ?? 1); volume = ($p.statistics.currentVolume ?? 1) }
  }
  if (Test-Path $plotPath) {
    $j = Get-Content -LiteralPath $plotPath -Raw -Encoding UTF8 | ConvertFrom-Json
    return @{ chapter = ($j.currentState.chapter ?? 1); volume = ($j.currentState.volume ?? 1) }
  }
  return @{ chapter = 1; volume = 1 }
}

function Analyze-PlotAlignment {
  Write-Host "📊 情节发展检查报告"
  Write-Host "━━━━━━━━━━━━━━━━━━━━"
  $cur = Get-CurrentProgress
  Write-Host "📍 当前进度：第$($cur.chapter)章（第$($cur.volume)卷）"

  if (Test-Path $plotPath) {
    $j = Get-Content -LiteralPath $plotPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $main = $j.plotlines.main
    $mainPlot = $main.currentNode
    $status = $main.status
    Write-Host "📖 主线进度：$mainPlot [$status]"

    $completed = @($main.completedNodes)
    Write-Host ""
    Write-Host "✅ 已完成节点：$($completed.Count)个"
    $completed | ForEach-Object { Write-Host "  • $_" }

    if ($main.PSObject.Properties.Name -contains 'completedNodeEvidence' -and $main.completedNodeEvidence -is [pscustomobject] -and $main.completedNodeEvidence.PSObject.Properties.Count -gt 0) {
      Write-Host ""
      Write-Host "📎 节点证据"
      $main.completedNodeEvidence.PSObject.Properties | ForEach-Object {
        Write-Host ("  • " + $_.Name + " -> " + $_.Value)
      }
    }

    $upcoming = @($main.upcomingNodes)
    if ($upcoming.Count -gt 0) {
      Write-Host ""
      Write-Host "→ 接下来的节点："
      $upcoming | Select-Object -First 3 | ForEach-Object { Write-Host "  • $_" }
    }
    return @{ cur = $cur; json = $j }
  }
}

function Check-Foreshadowing($state) {
  Write-Host ""
  Write-Host "🎯 伏笔追踪"
  Write-Host "───────────"
  $j = $state.json
  $curCh = [int]$state.cur.chapter
  $fs = @($j.foreshadowing)
  $total = $fs.Count
  $active = @($fs | Where-Object { $_.status -eq 'active' }).Count
  $resolved = @($fs | Where-Object { $_.status -eq 'resolved' }).Count
  Write-Host "统计：总计${total}个，活跃${active}个，已回收${resolved}个"

  if ($active -gt 0) {
    Write-Host ""
    Write-Host "⚠️ 待处理伏笔："
    $fs | Where-Object { $_.status -eq 'active' } | ForEach-Object {
      $ch = $_.planted.chapter
      Write-Host "  • $($_.content)（第$ch章埋设）"
    }
  }

  $overdue = @($fs | Where-Object { $_.status -eq 'active' -and $_.planted.chapter -and ($curCh - [int]$_.planted.chapter) -gt 30 }).Count
  if ($overdue -gt 0) { Write-Host ""; Write-Host "⚠️ 警告：有${overdue}个伏笔超过30章未处理" }
}

function Check-Conflicts($state) {
  Write-Host ""
  Write-Host "⚔️ 冲突追踪"
  Write-Host "───────────"
  $active = @($state.json.conflicts.active)
  $count = $active.Count
  if ($count -gt 0) {
    Write-Host "当前活跃冲突：${count}个"
    $active | ForEach-Object { Write-Host ("  • " + $_.name + " [" + $_.intensity + "]") }
  } else { Write-Host "暂无活跃冲突" }
}

function Generate-Suggestions($state) {
  Write-Host ""
  Write-Host "💡 建议"
  Write-Host "───────"
  $ch = [int]$state.cur.chapter
  if ($ch -lt 10) { Write-Host "• 前10章是关键，确保有足够的钩子吸引读者" }
  elseif ($ch -lt 30) { Write-Host "• 接近第一个小高潮，检查冲突是否足够激烈" }
  elseif (($ch % 60) -gt 50) { Write-Host "• 接近卷尾，准备高潮和悬念设置" }

  $activeFo = @($state.json.foreshadowing | Where-Object { $_.status -eq 'active' }).Count
  if ($activeFo -gt 5) { Write-Host "• 活跃伏笔较多，考虑在接下来几章回收部分" }
  $activeConf = @($state.json.conflicts.active).Count
  if ($activeConf -eq 0 -and $ch -gt 5) { Write-Host "• 当前无活跃冲突，考虑引入新的矛盾点" }
}

Write-Host "🔍 开始检查情节一致性..."
Write-Host ""
Ensure-PlotTracker
$st = Analyze-PlotAlignment
Check-Foreshadowing $st
Check-Conflicts $st
Generate-Suggestions $st

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━"
Write-Host "✅ 检查完成"

# 更新时间戳
if (Test-Path $plotPath) {
  $json = Get-Content -LiteralPath $plotPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $json.lastUpdated = (Get-Date).ToString('yyyy-MM-ddTHH:mm:ss')
  $json | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $plotPath -Encoding UTF8
}


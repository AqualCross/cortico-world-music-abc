# 更新日志（src/index.js、src/world.js、web/panels.js）

## 0.1.1

- 新增大肥鱼弹吉他的扩展图标。

## 0.1.0

- 独立的「ABC 音乐」World，支持与旧琴房并存。
- AI 用标准 ABC 写谱；乐谱面板显示五线谱，可编辑 ABC谱、检查、保存与试听。
- 保留多声部、独立止音、节拍、反复和力度，通过 MIDI 交给采样引擎。
- 音源保存在 World 数据目录，乐器页按文件折叠显示全部预设；支持按需获取 GeneralUser GS 和导入 SF2 / SF3。SpessaSynth 在 Node Worker 中离线生成立体声 WAV。
- 作品保留生成时的 ABC 快照，可试听及导出 WAV、MIDI、ABC。
- 三个工具：abc_music_score、abc_music_play、abc_music_control。
- 音频可作为工具附件或 music-abc.played 事件交付。

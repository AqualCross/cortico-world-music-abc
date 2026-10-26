# ABC 音乐 · cortico-world-music-abc（src/index.js、src/world.js、web/panels.js）

让Coo用ABC谱创作音乐。

音频由 **SoundFont + SpessaSynth** 在 Node Worker 中生成，无需打开浏览器或安装系统合成器。扩展不附带音源文件；在乐器页获取 GeneralUser GS 或导入自己的 SF2 / SF3 后，即可离线生成音频。五线谱由 abcjs 渲染，面板试听使用与工具相同的后台音频链路。

## 安装与启用

本地源码使用前，先在包目录安装依赖：

```powershell
npm ci
```

然后在 Coopanion「设置 → 扩展 → 安装本地扩展」选择本目录，重启 Coopanion，在 World 中启用 **ABC 音乐**。发布包自带 `dist/webui.js`，普通使用不需要构建。

对应配置：

```json
{
  "worlds": {
    "music-abc": {
      "enabled": true,
      "instrument": "",
      "delivery": "event",
      "eventDelivery": "archive"
    }
  }
}
```

与 `cortico-world-music` 使用不同 World ID、工具名、存储目录和事件类型，可同时安装。旧曲谱不会自动迁入。

## 面板

- **乐谱**：编辑 ABC谱，实时查看下方五线谱；乐器选择、新建、检查、保存、试听和生成作品均在 ABC谱编辑区操作。没有已保存乐谱或草稿时，从只有休止符的空白谱开始。试听不保存作品，生成作品会先保存当前曲谱。未保存的草稿保留在当前浏览器，切换内容时会提醒。
- **作品**：试听已生成的演奏，下载 WAV / MIDI / ABC，复制音频路径；展开查看的是演奏时的谱子快照，之后改谱或删谱不会改变它。
- **乐器**：每个 SF2 / SF3 文件一个分组，默认收起，点击文件标题展开或收起；当前浏览器记住展开状态。展开后显示全部预设，包括 bank 变体和鼓组。搜索时自动展开匹配分组，清空搜索后恢复原状态。支持试听、设为默认、导入音源和打开数据目录。没有可用音源时显示“获取GeneralUser GS”，点击后从上游固定版本下载约 32 MB 文件，检查大小和 SHA-256，并保存原始许可；失败可重试。不会在启动时自动下载。
- **配置 / 提示词**：由宿主标准页面提供。配置可热改；默认乐器在乐器页选择，instrument 留空时使用第一个可用预设。没有音源时仍可编辑、检查和保存乐谱，试听和生成作品暂不可用。

## AI 工具

| 工具 | 用途 |
|---|---|
| `abc_music_score` | `check` 检查 ABC；`save` 保存；`get` 读取；`list` 列出曲谱 |
| `abc_music_play` | `score` 指定曲谱 id，或直接给完整 `abc`；生成 WAV 并保存作品 |
| `abc_music_control` | `status` 查看状态；`instruments` 列出音源文件及全部预设；`set` 修改 `instrument`、`delivery`、`eventDelivery` |

推荐先检查并保存，再按 id 演奏。更新曲谱时用 `get` 读出当前 `revision`，将它作为 `expectedRevision` 随 `id` 和 `abc` 一起保存；版本冲突时会明确报错。直接 `abc_music_play abc=...` 成功后也会自动保存乐谱，因此能在面板查看。

`abc_music_play` 可临时指定 `instrument`、作品 `title` 和 `delivery`。instrument 使用 instruments 操作返回的预设 ID，包含文件名、bank MSB/LSB、program 和鼓组标记。默认乐器只用于没有显式分配音色的声部；ABC 中的 `%%MIDI program` 使用从 0 开始的 GM 编号，分别指定所选文件中的声部音色。一段作品使用一个音源文件。

使用 `V:` 写独立声部，`[CEG]` 写同时发声的和弦；支持休止、延音线、连奏、附点节奏、三连音、反复和力度。引号中的 `"Am"` 等和弦符号**仅显示标签**，不自动生成伴奏，请显式写和弦音或伴奏声部。

每份 ABC 须有 X/M/L/K，建议写 T/Q。每次只接受一首曲子，最多 48000 字符、展开反复后 12000 音符和 6 分钟。abcjs 的解析警告会作为需要修正的问题返回；它不等同于完整的乐理或小节拍数校验器。

## 音频交付

- `delivery=return`：WAV 作为工具回执附件返回。
- `delivery=event`：发出 `music-abc.played`，附带 WAV、作品 id、曲谱版本和音频路径。
- `eventDelivery=archive`：只存档；`model`：投递到对话。

音源文件保存在 `<World dataDir>/music-abc/`，Coopanion 的对应目录为 `Coopanion/data/home/companion/data/music-abc/`。导入会复制文件，保留原文件；也可以把多个 SF2 / SF3 放到此目录后点击刷新。同名且内容不同的文件需要先重命名。文件名参与预设 ID，改名后须重新选择乐器。作品保存在该目录的 `works/`，索引为 `index.json`。

旧版自定义 soundfont 路径会在启动时复制到该目录。旧版八种乐器 ID 仍兼容，映射到原自定义文件或 GeneralUser-GS.sf2 的对应 GM 预设；原先使用内置 GeneralUser GS 的用户需在乐器页获取一次。已保存曲谱与作品保留，既有 WAV 无需音源即可播放。音频生成与实际外放分开，需要外放或发送时将附件 / 路径交给 audio-play 或渠道工具。audio-play 的事件监听列表可加入 `music-abc.played`。

面板的试听与生成按钮只操作本地音频，不发事件；只有 AI 演奏工具按交付配置交出音频。事件交付失败时会明确返回失败，并保留可取回的作品路径。

## 开发与验证

```powershell
npm ci
npm run selfcheck
npm run preview
```

预览地址为 `http://127.0.0.1:18796`，使用真实 World 和后台渲染器，数据放在独立的 `.preview-data/`，不改正在运行的 Coopanion。预览壳只模拟面板宿主。

使用 Cortico 自带的 manifest 和 dry-mount 检查：

```powershell
$env:CORTICO_SOURCE_ROOT = "D:\path\to\cortico\src"
npm run drymount
```

改工具或提示词后运行 `npm run build`，会同时更新自描述和浏览器 bundle。开发源码在 `web/`，发布产物在 `dist/`。

## 当前边界

- 第一版是标准记谱与采样音源演奏，吉他滑弦、击勾弦、真实扫弦建模等专属技法尚未实现；谱面上能显示的所有标记不保证都有声音效果。
- 暂不导入 MIDI / MusicXML，不提供鼠标拖音符的谱面编辑器；通过 ABC谱编辑。
- 每个 World 同时生成一段音频，超时 120 秒终止；保存上限为 100 份曲谱、200 段作品，需要时手动整理。
- WAV 为 44.1 kHz、16-bit 立体声，保留 3 秒释放尾音；固定输出增益保持不同作品的力度关系，过载时只降低增益。

试听时，乐谱和作品快照以黄色区域标出当前音符；暂停保留位置，跳转同步更新，播放结束后清除。作品面板的“打开文件夹”打开 WAV、MIDI 和 ABC 文件所在目录。

标题框与 ABC 的第一行 `T:` 双向同步，其他 `T:` 副标题保留。编辑停止 500 毫秒后更新谱面，中文输入法组词时暂缓重绘。

## 许可与音源来源

代码使用 MIT 许可。第三方模块和按需获取的音源保留各自的许可，版本、作者和许可全文见 [THIRD_PARTY.md](THIRD_PARTY.md)。

可按需获取的 GeneralUser GS 2.0.3 由 S. Christian Collins 制作，其 License v2.0 允许私人及商业音乐创作，并允许用于软件项目。作者同时说明，部分采样来自其他免费音源，无法完全确认所有采样的原始来源。本扩展保留并转述这一来源限制，未逐一独立核验全部采样的权属与授权。完整原始声明随包保留在 [assets/GeneralUser-GS-LICENSE.txt](assets/GeneralUser-GS-LICENSE.txt)。

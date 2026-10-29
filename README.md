# SVG Editor CLI · Lab1 Phase 1

使用 TypeScript 和面向对象实现的 SVG 命令行编辑器。支持作业规定的六类图形、文档读写、分组与层级操作，以及 Command 模式的撤销重做。

## 安装与运行

需要 Node.js 22 或更新版本和 npm。在项目根目录执行：

```sh
npm ci
npm test
npm run cli
```

出现 `svg>` 后输入命令，不用输入提示符本身。Ctrl+D 结束输入，Ctrl+C 退出。

```text
init 400 200
create g flow
create rect start 30 70 120 60 #4a90d9 in flow
create line edge 150 100 250 100 black in flow
create rect end 250 70 120 60 #f5a623 in flow
tree
move end 0 20
undo
save demo.svg
```

将生成的 `demo.svg` 拖进浏览器即可看图。`help` 会列出完整命令语法。

## 作业示例

```sh
# 第 6.1 节版本 A：生成当前目录下的 flowchart.svg
npm run cli < examples/flowchart.cli

# 第 6 节基础会话，包含作业预期的两个错误，因此退出码为 1
npm run cli < examples/session.cli
```

脚本中的空行及 `#` 开头的整行注释会忽略。颜色 `#4a90d9` 是正常参数。包含空格的文字、路径使用双引号；引号内部可用 `\"` 和 `\\` 表示双引号及反斜杠。批处理遇到错误会继续执行后续命令，最后以退出码 1 报告存在错误。

## 功能范围

- 文档：`init`、`read`、`save`、`canvas`。
- 编辑：`create`、`delete`、`move`、`scale`、`set`、`group`、`ungroup`、`addto`、`front`、`back`。
- 查看：`tree`、`show`、`help`；历史：`undo`、`redo`。
- 内置类型：`rect`、`circle`、`ellipse`、`line`、`text`、`g`；`box` 和插件系统属于后续阶段。
- 文档操作成功后清空并锁定历史，下一次成功编辑重新允许 undo/redo；`canvas` 查询不改变历史。命令失败不改变文档、路径或历史。
- `read` 支持所列六类元素、嵌套容器和普通文本，缺 id 自动补全并警告；支持数值及 px 长度、translate 和正数等比 scale。导入时把受支持变换归一到几何值，保留额外 presentation attributes。
- 这是作业规定的 SVG 子集。path、tspan、defs、CSS 样式表、百分比几何长度、旋转和非等比变换等不在支持范围内；遇到不支持的元素或变换会报错。复杂 CSS 样式和缺省字体/描边在变换下的完整视觉等价不作保证。

## 文档

- [架构方案、过程记录、一致性自查、质量保证](doc/README.md)
- [逐项验收及原文歧义的实现口径](doc/REQUIREMENTS.md)
- [PlantUML 组件图源文件](doc/architecture.puml)

依赖版本通过 `package-lock.json` 固定；`npm test` 同时执行严格 TypeScript 编译、功能验收、真实 CLI 测试和静态架构检查。

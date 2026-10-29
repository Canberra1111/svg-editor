# Phase 1 验收检查表

依据用户提供的 Lab1 Phase 1 作业文本。这里的状态随实际实现与测试更新，不替代原作业。

| 原文位置 | 要求 | 验收状态 |
| --- | --- | --- |
| 1.1 | Git 分步提交、远程仓库、最终 final tag | 已按阶段提交到 Canberra1111/svg-editor；补充本地手动验收记录后同步更新 main 与 final，提交文档以该版本为准 |
| 1.2 | doc/README.md 四节 + PlantUML 架构图 | 已完成，含 puml 源码及本地 SVG 图片 |
| 2 | svg>、整行注释、唯一且大小写敏感 id、缺 id 自动补全并警告 | 已通过命令、SVG 及终端验收 |
| 2 | 浮点坐标、引号参数、error:、错误不改变状态、成功反馈 | 已通过；递归溢出及文件操作失败也保持状态 |
| 2.1 | TypeScript、封装/多态/一类一文件、Command、Composite | 已实现；AST 架构检查通过 |
| 2.1 | 两处名字分派并标注待重构 | CommandRegistry / ShapeFactory，均已标注 |
| 3 | init/read/save/canvas | 已通过，包括成功后历史锁定、失败保持历史和路径 |
| 3 | create/delete/move/scale/set/group/ungroup/addto/front/back | 已实现并验证 |
| 3、5 | tree/show/help | 已通过；tree 含内联几何，show 含父节点和属性 |
| 3、4.3 | undo/redo，分支清空 redo，文档操作锁定历史 | 已通过；显示类及 canvas 查询不进入历史 |
| 4.1 | 六类参数、in 父容器、fill/stroke 默认不写、set 白名单 | 已通过 |
| 4.2 | 约定错误文本、循环分组拒绝、顶层 ungroup 拒绝 | Phase 1 适用项已实现；复合 box 的 ungroup 属后续阶段 |
| 4.4 | box/插件不在 Phase 1；create box 报错 | 已通过 unknown shape type 验证 |
| 6、6.1 A | 基础会话、两节点流程图 | CLI 脚本及子进程测试已验证；版本 A 保存 8 个元素 |

原文中存在需要明确实现口径的地方：

- 第 3 节通常描述解散 g，第 4.2 节明确要求拒绝 svg 直接子级的 ungroup；遵从更具体的错误约定。
- 开篇示例用 g 的 transform 演示 SVG，但 CLI 的 scale 明确要求递归修改几何值；导入支持 translate 与正数等比 scale，并归一到几何值。其他 SVG 特性不属于所列六种类型的完整实现范围，须明确报错，不静默丢弃。
- `set` 白名单中的容器通用样式写到 g 上，子元素按 SVG 样式继承；只有 text 类型接受 text 内容。
- 原文没有给截止日期、提交入口和评分比例，不自行编造。

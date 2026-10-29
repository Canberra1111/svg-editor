# 运行与提交检查

## 本地运行

在项目根目录执行：

```sh
npm ci
npm test
npm run cli
```

`npm test` 应严格编译通过，并报告 25 项测试通过。示例脚本见根目录 README；作业要求的四部分文档在 `doc/README.md`。

## 课程平台上传

课程页面明确要求：上传一份 **README.md**，内容包含 Git 仓库地址。

上传工程中的 `doc/README.md`。该报告已包含仓库地址、final 标签链接、架构方案、过程记录、一致性自查和质量保证记录。平台上传的文件名保持为 `README.md`。

## 保留开发历史

本项目已经是 Git 仓库，包含真实的阶段提交和最终 `final` 标签。若从提供的压缩包解压，须保留其中隐藏的 `.git` 目录。直接在这个仓库里推送即可，不需要重新初始化或把完成品复制成一次大提交。

GitHub 仓库地址：`https://github.com/Canberra1111/svg-editor.git`，已配置为 origin。

在 GitHub 登录和网络可用后执行：

```sh
git log --oneline --reverse
git show --no-patch final
git push -u origin main
git push origin final
```

一次 push 可以上传多次 commit，远程会保留每次提交的开发历史。最终检查远程 main 的内容和 final 标签都存在，并在课程页面上传上述 README.md。

不要通过 GitHub 网页“上传文件”来替代现有仓库的推送，那样无法携带本地的阶段提交历史。

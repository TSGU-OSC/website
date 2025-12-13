# Git

## 介绍

Git是一种分布式版本控制系统，它可以记录文件的变更历史并协调多人在同一个代码库上的开发。使用Git，开发人员可以轻松地跟踪代码的修改、回退到以前的版本、合并不同的代码分支和解决代码冲突等任务。Git最初由Linus Torvalds创建，现在是开源社区中最流行的版本控制系统之一。

### 在Git中，有四个重要的概念：工作区、缓冲区、本地仓库和远程仓库。

* 工作区：工作区（Working Directory）是指开发者正在进行开发工作的目录。它包含了项目的源码文件、资源文件等内容。在这个目录下，开发者可以自由修改、添加、删除文件等操作。

* 缓冲区：缓冲区（Staging Area）也称为索引（Index），它是一个临时存储区域，用于存放即将提交到本地仓库的文件变更。开发者对工作区所做的修改，需要先通过git add命令将修改加入到缓冲区，才能提交到本地仓库。

* 本地仓库：本地仓库（Local Repository）是指保存在本地计算机上的Git仓库。它包含了代码库的完整历史记录、分支、标签等信息。在开发过程中，每次提交到缓冲区的变更，都可以通过git commit命令保存到本地仓库中。

* 远程仓库：远程仓库（Remote Repository）是指保存在远程服务器上的Git仓库。它包含了与本地仓库相同的内容，但它是由多个开发者共享的中央代码库。开发者可以通过git push命令将本地仓库中的变更推送到远程仓库，也可以通过git pull命令将远程仓库的变更更新至本地仓库。

## 信息配置

### 初始配置

```
git config --global user.name "你的用户名"
git config --global user.email "你的邮箱"
```


### 代理配置

```
git config --global http.proxy http://127.0.0.1:7890
```


### 清除代理

```
git config --global --unset http.proxy 
git config --global --unset https.proxy
```


## 查看配置信息

```
git config --list
```


## 查看Git版本

```
git -v
```


## 操作仓库

### 拉取远程仓库

```
git clone https://github.com/JackLau1222/OpenConverter
```


### 切换分支

`git switch` 和 `git checkout` 都可以用于切换分支，但它们的用途和行为有一些区别。以下是它们的详细对比：

#### git checkout

`git checkout` 是 Git 中一个非常通用的命令，用途广泛，但正是因为它的多功能性，容易让人混淆。

##### 主要操作

**1. 切换分支**

```
git checkout develop
```

**2. 创建并切换到新分支**

```
git checkout -b new-branch
```

**3. 检出文件或提交**

- 检出某个提交的文件

  ```
  git checkout <commit-hash> -- <file>
  ```

- 检出某个提交（进入分离头指针状态）

  ```
  git checkout <commit-hash>
  ```


-----

#### git switch

`git switch` 是 Git 2.23 版本引入的新命令，专门用于切换分支，目的是简化分支操作，避免 `git checkout` 的多功能性问题。

##### 主要操作

**1. 切换分支**

   ```
   git switch develop
   ```

**2. 创建并切换到新分支**

   ```
   git switch -c new-branch
   ```

**3. 切换到已存在的分支**

   ```
   git switch existing-branch
   ```


-----

#### 主要区别

| 特性               | `git checkout`                           | `git switch`               |
| :----------------- | :--------------------------------------- | :------------------------- |
| **用途**           | 多功能：切换分支、检出文件、检出提交等。 | 单一功能：仅用于切换分支。 |
| **创建新分支**     | `git checkout -b new-branch`             | `git switch -c new-branch` |
| **切换分支**       | `git checkout develop`                   | `git switch develop`       |
| **检出文件或提交** | 支持（如 `git checkout <commit>`）       | 不支持                     |
| **语义清晰度**     | 容易混淆                                 | 更直观，语义更清晰         |
| **Git 版本要求**   | 所有版本                                 | Git 2.23 及以上版本        |


### 更新本地仓库(自动同步)

```
git pull 
```


### 更新本地仓库(手动同步)

```
git fetch 
git merge 
```


### 添加一个名为test的cpp文件（Unix/Linux）

```
touch test.cpp 
```


### 添加一个名为test的cpp文件（Windows）

```
type nul > test.cpp
```


### 将此更改提交到缓冲区

```
git add test.cpp 
```


### 将更改提交到本地仓库

```
git commit -a -m “add test.cpp” 
```
在commit中，我们可以使用-m参数，以便能够直接在命令行上提供日志消息。如果您希望通过交互式编辑器会话提供详细的日志消息，也可以这样做。你需要配置Git在Git提交期间启动你最喜欢的编辑器(去掉-m参数);如果尚未设置，则可以设置

$GIT_EDITOR环境变量如下:
```
# In bash or zsh
$ export GIT_EDITOR=vim

# In tcsh
$ setenv GIT_EDITOR emacs
```

更改commit message
```
git commit --amend
```

更改commit author email
```
git commit --amend --author="Jack Lau <xxxx@gmail.com>"
```

### 提交到目标仓库

```
git push
```


### 查看提交日志

#### 主要操作

```
git log
```

- 用于显示当前分支的提交历史，按时间倒序排列。

---

### 查看提交摘要（按作者分组）

#### 主要操作

```
git shortlog
```

- 用于按作者分组显示提交摘要，默认按作者名字母顺序排列。

---

#### 常用参数

**1. 统计提交数量**

- `-s` 或 `--summary`：仅显示每个作者的提交数量。

  ```
  git shortlog -s
  ```

- `-n` 或 `--numbered`：按提交数量排序（从多到少）。

  ```
  git shortlog -sn
  ```

**2. 显示邮箱**

- `-e` 或 `--email`：显示作者的邮箱地址。

  ```
  git shortlog -se
  ```

**3. 过滤提交**

- `--author=<pattern>`：按作者过滤。

  ```
  git shortlog --author="John"
  ```

- `--since=<date>` 和 `--until=<date>`：按时间范围过滤。

  ```
  git shortlog --since="2023-01-01" --until="2023-12-31"
  ```

- `-- <path>`：查看特定文件或目录的提交摘要。

  ```
  git shortlog -- README.md
  ```

**4. 其他常用参数**

- `--all`：显示所有分支的提交摘要。

  ```
  git shortlog --all
  ```

- `--no-merges`：排除合并提交。

  ```
  git shortlog --no-merges
  ```

---

#### 组合使用示例

- 显示所有作者的提交数量，按数量排序：

  ```
  git shortlog -sn
  ```

- 显示某个时间范围内的提交摘要：

  ```
  git shortlog --since="2023-01-01" --until="2023-12-31"
  ```

- 显示某个作者的提交摘要，包含邮箱：

  ```
  git shortlog -e --author="John"
  ```

---

#### 常用参数

**1. 格式化输出**

- `--oneline`：每个提交显示为一行，包含简短的提交哈希和提交信息。

  ```
  git log --oneline
  ```

- `--graph`：以 ASCII 图形显示分支和合并历史。

  ```
  git log --graph
  ```

- `--decorate`：显示分支、标签等引用信息。

  ```
  git log --decorate
  ```

- `--pretty=<format>`：自定义输出格式。常用的格式包括：

  - `short`：简短格式。
  - `full`：完整格式。
  - `fuller`：更详细的格式。
  - `format:"<自定义格式>"`：完全自定义格式。

  ```
  git log --pretty=format:"%h - %an, %ar : %s"
  ```

**2. 过滤提交**

- `-n <num>`：限制显示的提交数量。

  ```
  git log -n 5  # 显示最近 5 条提交
  ```

- `--author=<pattern>`：按作者过滤提交。

  ```
  git log --author="John"
  ```

- `--grep=<pattern>`：按提交信息过滤提交。

  ```
  git log --grep="bug fix"
  ```

- `--since=<date>` 和 `--until=<date>`：按时间范围过滤提交。

  ```
  git log --since="2023-01-01" --until="2023-12-31"
  ```

- `-- <path>`：查看特定文件或目录的提交历史。

  ```
  git log -- README.md
  ```

**3. 显示差异**

- `-p` 或 `--patch`：显示每个提交的详细差异。

  ```
  git log -p
  ```

- `--stat`：显示每个提交的简略统计信息（修改的文件和行数）。

  ```
  git log --stat
  ```

**4. 其他常用参数**

- `--all`：显示所有分支的提交历史。

  ```
  git log --all
  ```

- `--branches`：显示所有分支的提交历史。

  ```
  git log --branches
  ```

- `--tags`：显示所有标签的提交历史。

  ```
  git log --tags
  ```

- `--merges`：仅显示合并提交。

  ```
  git log --merges
  ```

- `--no-merges`：排除合并提交。

  ```
  git log --no-merges
  ```

------

#### 组合使用参数

你可以将多个参数组合使用，以满足特定的需求。例如：

- 显示最近 10 条提交，并以单行格式显示：

  ```
  git log -n 10 --oneline
  ```

- 显示带有分支图的提交历史，并显示引用信息：

  ```
  git log --graph --decorate
  ```

- 显示某个作者的提交，并显示详细差异：

  ```
  git log --author="John" -p
  ```

- 显示某个时间范围内的提交，并显示简略统计信息：

  ```
  git log --since="2023-01-01" --until="2023-12-31" --stat
  ```

------

#### 自定义格式

使用 `--pretty=format:"<格式>"` 可以完全自定义日志输出。常用的占位符包括：

- `%H`：提交的完整哈希值。
- `%h`：提交的简短哈希值。
- `%an`：作者名字。
- `%ae`：作者邮箱。
- `%ad`：作者日期（格式可用 `--date=` 指定）。
- `%ar`：作者日期（相对时间，如 "2 days ago"）。
- `%s`：提交信息。

例如：

```
git log --pretty=format:"%h - %an, %ar : %s"
```

------

#### 查看帮助

如果你想查看 `git log` 的所有参数，可以运行：

```
git log --help
```

这会打开 Git 的帮助文档，列出所有可用的参数及其说明。


### 查看提交状态

```
git status
```


### 代码回滚

```
git reset --hard <commit_id>
```


### 撤销提交（创建反向提交）

#### 作用

`git revert` 用于撤销一个或多个提交，通过创建一个新的提交来反向应用之前的更改。与 `git reset` 不同，`git revert` 不会修改提交历史，因此更适合在已推送的提交上使用。

#### 主要操作

##### 1. 撤销单个提交

- 撤销指定的提交：

  ```
  git revert <commit-hash>
  ```

  例如：

  ```
  git revert a1b2c3d
  ```

##### 2. 撤销多个提交

- 撤销一个范围内的提交：

  ```
  git revert <oldest-commit>..<newest-commit>
  ```

  例如：

  ```
  git revert a1b2c3d..e4f5g6h
  ```

##### 3. 撤销合并提交

- 撤销合并提交需要指定主线（mainline）：

  ```
  git revert -m 1 <merge-commit-hash>
  ```

  `-m 1` 表示保留第一个父提交的更改。

#### 常用参数

- `-n` 或 `--no-commit`：撤销更改但不自动创建提交，允许你手动修改后再提交。

  ```
  git revert -n <commit-hash>
  ```

- `-e` 或 `--edit`：在创建撤销提交前编辑提交信息（默认行为）。

  ```
  git revert -e <commit-hash>
  ```

- `--no-edit`：使用默认的提交信息，不进入编辑器。

  ```
  git revert --no-edit <commit-hash>
  ```

- `--continue`：在解决冲突后继续撤销操作。

  ```
  git revert --continue
  ```

- `--abort`：取消撤销操作，恢复到撤销前的状态。

  ```
  git revert --abort
  ```

#### 注意事项

- **不修改历史**：`git revert` 会创建新的提交，不会修改现有的提交历史，因此适合在团队协作中使用。
- **解决冲突**：如果撤销过程中发生冲突，需要手动解决冲突后使用 `git revert --continue` 继续。
- **revert vs reset**：
  - `git revert`：创建新提交来撤销更改，保留历史记录。
  - `git reset`：直接修改提交历史，适合本地未推送的提交。


### 使远程仓库回滚生效

```
git push orgin main --force
```


### 选择性应用提交（拣选提交）

#### 作用

`git cherry-pick` 用于将一个或多个提交从一个分支应用到当前分支。这在需要将特定的更改从一个分支移植到另一个分支时非常有用。

#### 主要操作

##### 1. 拣选单个提交

- 将指定的提交应用到当前分支：

  ```
  git cherry-pick <commit-hash>
  ```

  例如：

  ```
  git cherry-pick a1b2c3d
  ```

##### 2. 拣选多个提交

- 拣选多个连续的提交：

  ```
  git cherry-pick <commit1>..<commit2>
  ```

  例如：

  ```
  git cherry-pick a1b2c3d..e4f5g6h
  ```

- 拣选多个不连续的提交：

  ```
  git cherry-pick <commit1> <commit2> <commit3>
  ```

  例如：

  ```
  git cherry-pick a1b2c3d e4f5g6h i7j8k9l
  ```

##### 3. 拣选并记录来源

- 使用 `-x` 参数在提交信息中记录原始提交的哈希值：

  ```
  git cherry-pick -x <commit-hash>
  ```

  这会在提交信息末尾添加类似 `(cherry picked from commit a1b2c3d)` 的信息，便于追踪提交来源。

  **注意**：`-x` 参数通常用于在公共分支之间拣选提交，不建议在本地分支使用。

#### 常用参数

- `-x`：在提交信息中添加原始提交的哈希值，用于追踪来源。

  ```
  git cherry-pick -x <commit-hash>
  ```

- `-n` 或 `--no-commit`：应用更改但不自动创建提交，允许你手动修改后再提交。

  ```
  git cherry-pick -n <commit-hash>
  ```

- `-e` 或 `--edit`：在创建提交前编辑提交信息。

  ```
  git cherry-pick -e <commit-hash>
  ```

- `--continue`：在解决冲突后继续拣选操作。

  ```
  git cherry-pick --continue
  ```

- `--abort`：取消拣选操作，恢复到拣选前的状态。

  ```
  git cherry-pick --abort
  ```

- `--skip`：跳过当前提交，继续拣选下一个提交。

  ```
  git cherry-pick --skip
  ```

#### 使用场景

- **修复 bug**：将 bug 修复提交从开发分支拣选到生产分支。
- **功能移植**：将特定功能的提交从一个分支移植到另一个分支。
- **提交整理**：将分散在不同分支的相关提交整合到一个分支。

#### 注意事项

- **解决冲突**：如果拣选过程中发生冲突，需要手动解决冲突后使用 `git cherry-pick --continue` 继续。
- **避免重复提交**：拣选提交会创建新的提交哈希，因此要注意避免在同一分支上重复拣选相同的提交。
- **使用 -x 参数**：在公共分支之间拣选提交时，建议使用 `-x` 参数记录来源，便于后续追踪和维护。


### 查看可用分支

```
git branch
```


### 查看所有分支

```
git branch -a
```


### 切换到可用分支

```
git checkout <branch-name>
```


### 获取本地分支最新哈希值

```
git rev-parse HEAD
```


### 获取远程分支最新哈希值

```
git rev-parse origin/<commit_id>
```


### 显示特定提交的详细信息

```
git show <commit-hash>
```


### 重写提交历史（变基）

#### 作用

`git rebase` 用于将一个分支的提交“重新应用”到另一个分支上，从而整理提交历史，使其更加线性化。

#### 主要操作

##### 1. 合并分支

- 将当前分支的提交“移动”到目标分支的最新提交之后。

- 例如，将 `feature` 分支的提交“变基”到 `main` 分支上：

  ```
  git checkout feature
  git rebase main
  ```

##### 2. 整理提交历史

- 将多个提交合并为一个（交互式变基）。

- 例如，将最近 3 个提交合并为 1 个：

  ```
  git rebase -i HEAD~3
  ```

##### 3. 解决冲突

- 在变基过程中，如果发生冲突，Git 会暂停并提示你解决冲突。

- 解决冲突后，使用以下命令继续变基：

  ```
  git add <冲突文件>
  git rebase --continue

 #### 常用参数

- `-i` 或 `--interactive`：进入交互式模式，可以编辑、合并或删除提交。
- `--continue`：在解决冲突后继续变基。
- `--abort`：取消变基操作，恢复到变基前的状态。
- `--skip`：跳过当前提交（通常用于解决冲突后放弃某个提交）。

#### 注意事项

- **不要对已推送的提交进行变基**：变基会重写提交历史，如果这些提交已经被推送到远程仓库，可能会导致冲突和混乱。
- **变基 vs 合并**：
  - `git rebase`：生成线性的提交历史，适合整理本地分支。
  - `git merge`：保留分支的合并历史，适合团队协作。


### 管理远程仓库

#### 作用

`git remote` 用于管理远程仓库的链接。你可以通过它查看、添加、删除或重命名远程仓库。

#### 主要操作

##### 1. 查看远程仓库

- 查看当前配置的远程仓库：

  ```
  git remote -v
  ```

  输出示例：  

  ```
  origin  https://github.com/user/repo.git (fetch)
  origin  https://github.com/user/repo.git (push)
  ```


##### 2. 添加远程仓库

- 添加一个新的远程仓库：

  ```
  git remote add <name> <url>
  ```

  例如：

  ```
  git remote add upstream https://github.com/username/repo.git
  ```

##### 3. 重命名远程仓库

- 将远程仓库 `origin` 重命名为 `upstream`：

  ```
  git remote rename origin upstream
  ```

##### 4. 删除远程仓库

- 删除名为 `upstream` 的远程仓库：

  ```
  git remote remove upstream
  ```

##### 5. 更新远程仓库 URL

- 修改远程仓库的 URL：

  ```
  git remote set-url origin https://github.com/username/new-repo.git
  ```

##### 6. 查看远程仓库详细信息

- 查看远程仓库的详细信息：

  ```
  git remote show origin
  ```


## 修改历史记录

### 修改最新的提交内容
  ```
git commit --amend --allow-empty
  ```

### 使用filter-branch工具删除指定文件"*.ipch"

```
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch **/*.ipch' --prune-empty --tag-name-filter cat -- --all
```


### 使用bfg工具删除指定文件夹名

```
bfg --delete-folders ".vs"  
```


### 删除后执行以下命令实现垃圾回收，合并对象

```
git reflog expire --expire=now --all && git gc --prune=now --aggressive 
```

## git format-patch

### 作用

`git format-patch` 用于将提交转换为补丁文件（patch files），这些文件可以通过邮件发送或在不同的仓库之间共享。补丁文件包含了提交的所有信息，包括作者、日期、提交信息和代码更改。

### 主要操作

#### 1. 生成单个提交的补丁

- 为最近的一个提交生成补丁：

  ```
  git format-patch -1
  ```

- 为指定的提交生成补丁：

  ```
  git format-patch -1 <commit-hash>
  ```

  例如：

  ```
  git format-patch -1 a1b2c3d
  ```

#### 2. 生成多个提交的补丁

- 为最近的 N 个提交生成补丁：

  ```
  git format-patch -<N>
  ```

  例如，生成最近 3 个提交的补丁：

  ```
  git format-patch -3
  ```

- 为指定范围的提交生成补丁：

  ```
  git format-patch <commit1>..<commit2>
  ```

  例如：

  ```
  git format-patch a1b2c3d..e4f5g6h
  ```

#### 3. 生成从某个提交到当前的所有补丁

- 生成从指定提交到 HEAD 的所有补丁：

  ```
  git format-patch <commit-hash>
  ```

  例如：

  ```
  git format-patch a1b2c3d
  ```

#### 4. 指定输出目录

- 将补丁文件保存到指定目录：

  ```
  git format-patch -1 -o <output-directory>
  ```

  例如：

  ```
  git format-patch -3 -o patches/
  ```

### 常用参数

- `-1`, `-2`, `-N`：生成最近 N 个提交的补丁。

- `-o <dir>` 或 `--output-directory <dir>`：指定补丁文件的输出目录。

  ```
  git format-patch -1 -o patches/
  ```

- `--stdout`：将补丁输出到标准输出而不是文件。

  ```
  git format-patch -1 --stdout > my-patch.patch
  ```

- `--subject-prefix=<prefix>`：自定义补丁邮件的主题前缀（默认为 `[PATCH]`）。

  ```
  git format-patch -1 --subject-prefix="RFC PATCH"
  ```

- `--numbered`：为补丁文件添加序号（如 `[PATCH 1/3]`）。

  ```
  git format-patch -3 --numbered
  ```

- `--cover-letter`：生成一个封面信件（cover letter），用于描述整个补丁系列。

  ```
  git format-patch -3 --cover-letter
  ```

- `--signoff`：在补丁中添加 `Signed-off-by` 行。

  ```
  git format-patch -1 --signoff
  ```

### 应用补丁

生成的补丁文件可以使用 `git am` 命令应用到其他仓库：

```
git am <patch-file>
```

例如：

```
git am 0001-Fix-bug.patch
```

### 使用场景

- **邮件列表开发**：在使用邮件列表进行代码审查的项目（如 Linux 内核、FFmpeg）中，开发者使用 `git format-patch` 生成补丁并通过邮件发送。
- **跨仓库共享**：在不同的 Git 仓库之间共享提交。
- **备份提交**：将重要的提交导出为补丁文件进行备份。

### 示例

- 生成最近 3 个提交的补丁并保存到 `patches/` 目录：

  ```
  git format-patch -3 -o patches/
  ```

- 生成从 `a1b2c3d` 到 `HEAD` 的所有补丁，并添加封面信件：

  ```
  git format-patch a1b2c3d --cover-letter
  ```

- 生成单个提交的补丁并输出到标准输出：

  ```
  git format-patch -1 --stdout > my-fix.patch
  ```

---

## git send-email
配置SMTP基本信息（以qq为例）
```Shell
git config --global sendemail.smtpServer smtp.qq.com
git config --global sendemail.smtpPort 465
git config --global sendemail.smtpUser "your_email@qq.com"
git config --global sendemail.smtpPass "your_app_password"
git config --global sendemail.smtpssl true  # Ensure SSL is enabled
git config --global sendemail.smtpAuth LOGIN  # Use LOGIN method
```
发送邮件（以ffmpeg为例）
```
git send-email --smtp-ssl --to ffmpeg-devel@ffmpeg.org --subject "[PATCH] Fix time_base handling" -1 b438672b11645e1152375beba759a0d2c704e3b1
```

## git官网

<https://git-scm.com/downloads>
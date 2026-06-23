# zhangxixiang.com

个人站点 —— 极简、安静、双列布局。

## 起步

```bash
# 1. 安装依赖
npm install

# 2.（可选）配置 Notion，用于同步 moments 数据
echo "NOTION_API_KEY=secret_xxx" >> .env.local
echo "NOTION_DATABASE_ID=xxx" >> .env.local

# 3. 跑起来
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

> 没配 Notion 也能跑：`npm run dev` 不会触发同步，`moments` 区域会显示空状态。
> 但 `npm run build` 会先跑一次同步，如果没有 Notion 环境变量、本地也没有之前同步过的 `data/moments.json`，构建会直接失败（见下文「Moments 数据怎么来的」）。

## 项目结构

```
.
├── app/
│   ├── layout.tsx              # 字体、metadata
│   ├── page.tsx                # 首页（双列：about | moments）
│   ├── globals.css             # CSS 变量（设计 tokens）
│   ├── moments/
│   │   └── page.tsx            # /moments 归档页
│   └── p/
│       └── page.tsx            # /p 项目页（密码门 + preview.html 预览）
├── components/
│   ├── Hero.tsx                # 名字 + 单句双语 tagline
│   ├── Avatar.tsx               # 头像
│   ├── SectionHeader.tsx       # 左对齐 section 头
│   ├── AboutCards.tsx          # 4 张折叠卡（点击弹模态）
│   ├── MomentsGrid.tsx         # 首页 3×3 grid
│   ├── MomentsArchive.tsx      # /moments 完整归档
│   ├── Modal.tsx               # 通用对话框
│   └── Footer.tsx              # GitHub + email + 署名
├── content/                    # 静态 about 内容
│   ├── education.json
│   ├── places.json
│   ├── qa.json
│   └── likes.json
├── lib/
│   ├── getMoments.ts           # 运行时读 data/moments.json，零 Notion 调用
│   └── voice.ts                # 微文案集中管理
├── scripts/
│   └── syncMoments.ts          # 构建前跑：Notion → 转 WebP → data/moments.json
├── data/
│   └── moments.json            # 由 syncMoments 生成，已 gitignore
├── public/
│   ├── avatar.png
│   ├── preview.html            # /p 页面里 iframe 加载的内容
│   └── moments/                # 同步生成的图片，已 gitignore
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## 布局

- **桌面**：双列网格（about 占 5/12，moments 占 7/12，断点 `md:`）
- **手机**：单列堆叠（about → moments）
- 容器最宽 `max-w-5xl` (~1024px)

## 改内容

### About 卡片

四个 JSON 文件，对应首页 about 区域的四张卡：

- `content/education.json`
- `content/places.json`
- `content/qa.json`
- `content/likes.json`

存盘后开发服务器自动热更新。

### 设计 tokens

- 颜色变量：`app/globals.css` 顶部的 `:root`
- 字体配置：`app/layout.tsx`（用的 `next/font/google`）
- 其他 Tailwind 扩展：`tailwind.config.ts`

### 微文案

所有可调的小文案集中在 `lib/voice.ts`。改这一个文件就能调整全站的"声音"。

## Moments 数据怎么来的

`moments` 不是运行时查 Notion，而是构建前跑一次 `scripts/syncMoments.ts`：

1. 查 Notion database（只取 `published` 勾选的行）
2. 图片下载下来，HEIC/HEIF 先转 JPEG，再统一转成 WebP，存到 `public/moments/`
3. 结果写进 `data/moments.json`
4. `lib/getMoments.ts` 运行时只读这个静态文件，不调 Notion

单张图片下载/转码失败不会拖垮整个构建，会自动退化成占位图标。Notion 整体查询失败时，如果本地已有上一次成功的 `data/moments.json`，构建会用旧数据继续；连旧数据都没有才会真正失败。

需要的环境变量：

```bash
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID=xxx
```

手动触发同步：

```bash
npm run sync
```

## 部署到 Vercel

```bash
# 1. 推到 GitHub（仓库已存在的话跳过）
git init && git add . && git commit -m "init"

# 2. 在 vercel.com 上 import 这个仓库
#    自动检测为 Next.js，一路 Next。

# 3. 在 Vercel 项目 Settings → Domains 里加 zhangxixiang.com
#    Vercel 会告诉你 DNS 怎么配。

# 4. 在 Vercel 项目 Settings → Environment Variables 里加
#    NOTION_API_KEY 和 NOTION_DATABASE_ID
```

## 备注

- 字体使用 **Fraunces**（衬线）+ **Geist**（无衬线）+ **Noto Serif/Sans SC**（"他强任他强" 五个字）。
- About 卡片用 Modal 弹窗展示内容。
- 整站唯一中文：hero tagline 里的 `他强任他强`。其他全部小写英文。

## TODO

- [ ] favicon、Open Graph 图
- [ ] 跑一遍移动端 QA

— 祝你写得开心。

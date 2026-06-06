# zhangxixiang.com

个人站点 —— 极简、安静、双列布局。

> 完整设计与规格说明见之前的 spec 文档。
> 当前代码处在 **Phase 1**：完整布局可跑，Moments 用占位数据，未接 Notion。

## 起步

```bash
# 1. 安装依赖
npm install

# 2. 跑起来
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)。

## 项目结构

```
.
├── app/
│   ├── layout.tsx              # 字体、metadata
│   ├── page.tsx                # 首页（双列：about | moments）
│   ├── globals.css             # CSS 变量（设计 tokens）
│   └── moments/
│       └── page.tsx            # /moments 归档页
├── components/
│   ├── Hero.tsx                # 名字 + 单句双语 tagline
│   ├── SectionHeader.tsx       # 左对齐 section 头
│   ├── AboutCards.tsx          # 4 张折叠卡（点击弹模态）
│   ├── MomentsGrid.tsx         # 首页 3×3 grid
│   ├── MomentsArchive.tsx      # /moments 完整归档
│   ├── Modal.tsx               # 通用对话框
│   └── Footer.tsx              # GitHub + email + 署名
├── content/                    # 静态 about 内容（你来填）
│   ├── education.json
│   ├── places.json
│   ├── qa.json
│   └── likes.json
├── lib/
│   ├── getMoments.ts           # moments 数据源 + 类型
│   └── voice.ts                # 微文案集中管理
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

## 布局

- **桌面**：双列网格（about 占 5/12，moments 占 7/12，断点 `md:`）
- **手机**：单列堆叠（about → moments）
- 容器最宽 `max-w-5xl` (~1024px)

## 现在就可以做的事

### 填 About 内容

四个 JSON 文件，每个都有占位文字。直接编辑：

- `content/education.json`
- `content/places.json`
- `content/qa.json`
- `content/likes.json`

存盘后开发服务器自动热更新。

### 改设计 tokens

- 颜色变量：`app/globals.css` 顶部的 `:root`
- 字体配置：`app/layout.tsx`（用的 `next/font/google`）
- 其他 Tailwind 扩展：`tailwind.config.ts`

### 微文案

所有可调的小文案集中在 `lib/voice.ts`。改这一个文件就能调整全站的"声音"。

## 接下来 (Phase 2) —— 接入 Notion

当前 `lib/getMoments.ts` 返回硬编码的占位数据。Phase 2 就是把它换成 Notion 查询。

```bash
npm install @notionhq/client
```

```ts
// 在 lib/getMoments.ts 里替换实现
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

export async function getMoments(): Promise<Moment[]> {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    sorts: [{ property: 'date', direction: 'descending' }],
    filter: { property: 'published', checkbox: { equals: true } },
  });
  return res.results.map(mapNotionPageToMoment);
}
```

```bash
echo "NOTION_TOKEN=secret_xxx" >> .env.local
echo "NOTION_DATABASE_ID=xxx" >> .env.local
```

## 部署到 Vercel

```bash
# 1. 推到 GitHub
git init && git add . && git commit -m "init"
# 在 GitHub 上建仓库，然后 push

# 2. 在 vercel.com 上 import 这个仓库
#    自动检测为 Next.js，一路 Next。

# 3. 在 Vercel 项目 Settings → Domains 里加 zhangxixiang.com
#    Vercel 会告诉你 DNS 怎么配。

# 4. Phase 2 之后，在 Vercel 项目 Settings → Environment Variables
#    加 NOTION_TOKEN 和 NOTION_DATABASE_ID。
```

## 备注

- 字体使用 **Fraunces**（衬线）+ **Geist**（无衬线）+ **Noto Serif/Sans SC**（"他强任他强" 五个字）。
- About 卡片用 Modal 弹窗展示内容。
- 整站唯一中文：hero tagline 里的 `他强任他强`。其他全部小写英文。

## 已知占位 / TODO

- [ ] About 四个 JSON 里全部用真实内容替换 `[占位文字]`
- [ ] 拍/选第一批 moments
- [ ] 跑通 Notion 集成（Phase 2）
- [ ] 跑一遍移动端 QA
- [ ] favicon、Open Graph 图

— 祝你写得开心。

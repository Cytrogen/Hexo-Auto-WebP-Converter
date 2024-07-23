# Hexo-Auto-WebP-Converter

## 介绍 | Description

该脚本会在 `hexo g` 或者 `hexo generate` 运行之后、自动转换图片的格式成 `.webp`。

This script automatically converts the format of images to `.webp` after `hexo g` or `hexo generate` is executed.

- Hexo生成静态文件之前，修改页面数据中引用的图片的格式
- Hexo生成静态文件之后，转换实际图片文件的格式
- Before Hexo generates static files, changes the format of the images referenced in the page data
- After Hexo generates static files, converts the format of the actual image files

## 使用 | Usage

```
.
└── Hexo博客项目根目录 | Hexo project/
    ├── public/
    │   ├── 20xx
    │   └── post (如果你安装了Hexo-Abbrlink | if Hexo-Abbrlink is enabled)
    ├── source
    ├── scripts/
    │   └── webp.js (也就是这个项目 | this repo)
    └── 其他东东…… | more ...
```

1. 将该仓库的 `webp.js` 存放在 `scripts` 目录下 | place `webp.js` from this repo under `scripts` directory
2. 在博客项目根目录下安装该脚本所需的依赖：
   ```
   npm install --save fs colors path sharp
   ```
4. 使用 `hexo g` 或者 `hexo generate` | run `hexo g` or `hexo generate`

## TODO

- ~~[x] 转换格式时不重复写入已存在的文件，尤其是转换视频~~ **（视频因为video标签无法正常播放webp，而砍掉了转换视频功能）**
- ~~[ ] 修复视频转换时的百分比显示~~
- [ ] 解决 `EPERM unlink` 错误（大概率是锁文件了）
- [ ] 添加环境变量，用于定义日志打印等级
- [ ] 优化代码

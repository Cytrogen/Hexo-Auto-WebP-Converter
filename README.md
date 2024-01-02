# Hexo-Auto-WebP-Converter

中文 | [ENG](README_en.md)

## 介绍

该脚本会在 `hexo g` 或者 `hexo generate` 运行之后、自动转换图片和视频的格式成 `.webp` 和 `.webm`。

- Hexo生成静态文件之前，修改页面数据中引用的图片和视频的格式
- Hexo生成静态文件之后，转换实际图片和视频文件的格式

## 使用

```
.
└── Hexo博客项目根目录/
    ├── public/
    │   ├── 20xx
    │   └── post (如果你安装了Hexo-Abbrlink)
    ├── source
    ├── scripts/
    │   └── webp.js (也就是这个项目)
    └── 其他东东……
```

1. 将该仓库的 `webp.js` 存放在 `scripts` 目录下
2. 使用 `hexo g` 或者 `hexo generate`

## TODO

- [ ] 转换格式时不重复写入已存在的文件，尤其是转换视频
- [ ] 修复视频转换时的百分比显示
- [ ] 解决 `EPERM unlink` 错误（大概率是锁文件了）
- [ ] 添加环境变量，用于定义日志打印等级
- [ ] 优化代码

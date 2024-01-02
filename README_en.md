# Hexo-Auto-WebP-Converter

## Description

This script automatically converts the format of images and videos to `.webp` and `.webm` after `hexo g` or `hexo generate` is executed.

- Before Hexo generates static files, changes the format of the images and videos referenced in the page data
- After Hexo generates static files, converts the format of the actual image and video files

## Usage

```
.
└── Hexo project/
    ├── public/
    │   ├── 20xx
    │   └── post (if Hexo-Abbrlink is enabled)
    ├── source
    ├── scripts/
    │   └── webp.js (this repo)
    └── more ...
```

1. place `webp.js` from this repo under `scripts` directory
2. run `hexo g` or `hexo generate`

## TODO

- [ ] do not rewrite existing files when converting formats, especially for video conversion
- [ ] fix percentage display error when converting a video
- [ ] solve `EPERM unlink` error (probably locked file)
- [ ] add environment variables, to define the log printing level for example
- [ ] optimize code

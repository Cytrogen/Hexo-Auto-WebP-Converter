const fs = require('fs');
const color = require('colors');
const path = require('path');
const sharp = require('sharp');


/**
 * Hexo's filter hook that is triggered before generating a post
 */
hexo.extend.filter.register('before_post_render', function(data){
    // Replace img src with .webp
    if (data.path.split('/')[0] === 'about') {
        return data;
    }

    // Find all img tags
    const imgRegex = /(?<!https?:\/\/)\!\[[^\]]*]\((?!https?:\/\/)(.*?)\)|<img [^>]*src="((?!https?:\/\/)(.*?))"[^>]*>/g;
    if (data.content.indexOf('<img') !== -1 || data.content.indexOf('![') !== -1) {
        try {
            data.content.match(imgRegex).forEach(function(imgTag){
                console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Found: ' + color.magenta(imgTag))

                // Determine whether the imgTag is in Markdown format or HTML format
                const match = imgTag.match(/\((.*?)\)|<img [^>]*src="((?!https?:\/\/)(.*?)?)"/);
                let src;
                if (match[1]) {
                    src = match[1];
                } else if (match[2]) {
                    src = match[2];
                } else {
                    console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to match ') + color.magenta(match));
                }

                try {
                    if(!src.endsWith('.webp')) {
                        const newSrc = src.substring(0, src.lastIndexOf('.')) + '.webp';
                        data.content = data.content.replace(src, newSrc);
                        console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Replaced: ' + color.magenta(src) + ' => ' + color.magenta(newSrc));
                    } else {
                        console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.yellow('Skip ') + color.magenta(src) + ' the match is the following: ' + color.magenta(imgTag));
                    }
                } catch (err) {
                    console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to convert ') + color.magenta(src) + ' due to ' + color.yellow(err));
                }
            });
        } catch (TypeError) {
            console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to match ') + color.magenta(data.title) + ' due to ' + color.yellow('TypeError') + ', this is often caused by image tags in code blocks');
        }

    }

    return data;
});


/**
 * Hexo's filter hook that is triggered before Hexo exits
 */
hexo.extend.filter.register('before_exit', () => {
    // Check if the command is hexo g or hexo generate, if not, the script will not be executed
    const args = process.argv;
    if (args[1].includes('hexo') && (args[2] === 'g' || args[2] === 'generate')) {
        const publicDir = hexo.public_dir;

        const imgExtensions = ['.jpg', '.jpeg', '.png'];
        const images = []
        const videoExtensions = ['.mp4'];
        const videos = []

        /**
         * Traverse the directory recursively and find all images and videos
         * @param dir
         */
        function traverse(dir) {
            // Read all files in the directory
            const files = fs.readdirSync(dir);

            // Loop through all files
            files.forEach(file => {
                const filePath = path.join(dir, file);

                // Determine if the file is a directory or a file
                // If it is a directory, continue to traverse
                // If it is a file, determine whether it is an image or a video
                if (fs.statSync(filePath).isDirectory()) {
                    traverse(filePath);
                } else {
                    const ext = path.extname(filePath);
                    if (imgExtensions.includes(ext)) {
                        images.push(filePath);
                    } else if (videoExtensions.includes(ext)) {
                        videos.push(filePath);
                    }
                }
            });
        }

        traverse(publicDir);

        // Convert images to .webp
        images.forEach(async imgPath => {
            const imgDir = path.dirname(imgPath);
            const subDir = imgDir.slice(publicDir.length);

            // Only convert images in the post directory (e.g. public/2021/01/01)
            // If Hexo_Abbrlink is enabled, the post directory will be public/post
            const regex = /^(\d{4}\\)|^(posts\\)/;
            if (regex.test(subDir)) {
                const imgName = path.basename(imgPath);
                const name = imgName.split('.').slice(0, -1).join('.');
                const newPath = path.join(imgDir, name + '.webp');

                // Check if the converted image already exists
                // If it does not exist, convert it
                fs.access(newPath, fs.constants.F_OK, async (err) => {
                    if (err) {
                        try {
                            await sharp(imgPath).toFile(newPath);
                            console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Converted: ' + color.magenta(imgPath) + ' => ' + color.magenta(newPath));
                        } catch (err) {
                            console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to convert ') + color.magenta(imgPath) + ' due to ' + color.yellow(err));
                        }
                    } else {
                        console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.yellow('Skip ') + color.magenta(imgPath) + ' the file already exists');
                    }
                });
            } else {
                console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.yellow('Skip ') + color.magenta(subDir) + ' the directory is not a post directory');
            }
        });
    }
}, 9999);

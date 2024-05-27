const fs = require('fs');
const color = require('colors');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');


ffmpeg.setFfmpegPath(ffmpegPath);




/**
 * Hexo's filter hook that is triggered before generating a post
 */
hexo.extend.filter.register('before_post_render', function(data){
    // Replace img src with .webp
    if (data.path.split('/')[0] === 'about') {
        return data;
    }

    // Find all img tags
    const imgRegex = /!\[[^\]]*]\((.*?)\)|<img [^>]*src="(.*?)"[^>]*>/g;
    if (data.content.indexOf('<img') !== -1 || data.content.indexOf('![') !== -1) {
        try {
            data.content.match(imgRegex).forEach(function(imgTag){
                console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Found: ' + color.magenta(imgTag))

                // Determine whether the imgTag is in Markdown format or HTML format
                const match = imgTag.match(/\((.*?)\)|<img [^>]*src="(.*?)"/);
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

    // Replace video src with .webm
    const sourceRegex = /<source.*?src="(.+?)"\s+type="(.+?)".*?>/g;
    const matches = data.content.match(sourceRegex);
    if (matches) {
        matches.forEach(match => {
            const newSource = match.replace(/\.?mp4/g, '.webm');
            console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Replaced: ' + color.magenta(match) + ' => ' + color.magenta(newSource));
        });
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
                console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.yellow('Skip ') + color.magenta(subDir));
            }
        });

        // Convert videos to .webm
        videos.forEach(async videoPath => {
            const videoDir = path.dirname(videoPath);
            const subDir = videoDir.slice(publicDir.length);

            const regex = /^(\d{4}\\)|^(posts\\)/;
            if (regex.test(subDir)) {
                const videoName = path.basename(videoPath);
                const name = videoName.split('.').slice(0, -1).join('.');
                const newPath = path.join(videoDir, name + '.webm');

                // Check if the converted video already exists
                // If it does not exist, convert it
                fs.access(newPath, fs.constants.F_OK, async (err) => {
                    if (err) {
                        const numCPUs = require('os').cpus().length;

                        // Get the duration of the video for progress bar
                        let duration;
                        ffprobe(videoPath, {path: ffprobeStatic.path}, function (err, info) {
                            duration = info.streams[0].duration;
                        });

                        // Use ffmpeg to convert videos with maximum number of threads
                        ffmpeg(videoPath)
                            .output(newPath)
                            .outputOption('-threads ' + numCPUs)
                            .on('start', function () {
                                console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Converting: ' + color.magenta(videoPath) + ' => ' + color.magenta(newPath) + ' with ' + color.blue(numCPUs.toString()) + ' threads');
                            })
                            .on('progress', function (progress) {
                                // If progress doesn't have percent, then calculate it by timemark
                                if (progress.percent) {
                                    console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Processing: ' + color.magenta(videoPath) + ' => ' + color.magenta(newPath) + ' ' + color.blue(progress.percent + '%'));
                                } else {
                                    const parts = progress.timemark.split(':');
                                    console.log(color.red(parts.toString()))
                                    const totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                                    const percent = totalSeconds / duration;
                                    console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Processing: ' + color.magenta(videoPath) + ' => ' + color.magenta(newPath) + ' ' + color.blue(percent + '%'));
                                }
                            })
                            .on('end', function () {
                                console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Converted: ' + color.magenta(videoPath) + ' => ' + color.magenta(newPath));

                                // Delete the original video
                                // tryDeleteFile(videoPath);
                            })
                            .on('error', function (err) {
                                console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to convert ') + color.magenta(videoPath) + ' due to ' + color.yellow(err));
                            })
                            .run();
                    } else {
                        console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.yellow('Skip deleting ') + color.magenta(videoPath) + ' the file already exists');
                    }
                });
            }
        });
    }
}, 9999);

const fs = require('fs');
var color = require('colors');
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);

hexo.extend.filter.register('before_post_render', function(data){
    // Replace img src with .webp
    const imgRegex = /!\[[^\]]*\]\((.*?)\)|<img [^>]*src="(.*?)"[^>]*>/g;
    if (data.content.indexOf('<img') !== -1 || data.content.indexOf('![') !== -1) {
        data.content.match(imgRegex).forEach(function(imgTag){
            // console.log(imgTag);
            var src = imgTag.match(/\((.*?)\)|<img [^>]*src="(.*?)"/) ? RegExp.$1 : RegExp.$2;
            if(!src.endsWith('.webp')) {
                var newSrc = src.substring(0, src.lastIndexOf('.')) + '.webp';
                data.content = data.content.replace(src, newSrc);
            }
        });
    }

    // Replace video src with .webm
    const videoRegex = /<video[^>]*>(.*?)<\/video>/g;
    if (data.content.match(videoRegex)) {
        const videoContent = data.content.match(videoRegex);
        const srcRegex = /src="(.+?)"/;

        videoContent.match(srcRegex).forEach(function(srcTag){
            var src = srcTag.match(/src="(.*?)"/) ? RegExp.$1 : '';
            if(!src.endsWith('.webm')) {
                var newSrc = src.substring(0, src.lastIndexOf('.')) + '.webm';
                data.content = data.content.replace(src, newSrc);
            }
        });
    }
    
    return data;
});

hexo.extend.filter.register('before_exit', () => {
    const args = process.argv;
    if (args[1].includes('hexo') && (args[2] === 'g' || args[2] === 'generate')) {
        const publicDir = hexo.public_dir;

        const imgExtensions = ['.jpg', '.jpeg', '.png'];
        const images = []
        const videoExtensions = ['.mp4'];
        const videos = []

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
        
        images.forEach(async imgPath => {
            const imgDir = path.dirname(imgPath);
            const subDir = imgDir.slice(publicDir.length);

            // Only convert images in the post directory
            if (/^\d{4}\\.*/.test(subDir)) {
                const imgName = path.basename(imgPath);
                const name = imgName.split('.').slice(0, -1).join('.');
                const newPath = path.join(imgDir, name + '.webp');

                try {
                    await sharp(imgPath).toFile(newPath);
                    console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Converted: ' + color.magenta(imgPath) + ' => ' + color.magenta(newPath));
                } catch (err) {
                    console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to convert ') + color.magenta(imgPath) + ' due to ' + color.yellow(err));
                }

                try {
                    fs.unlinkSync(imgPath);
                } catch (err) {
                    console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to delete ') + color.magenta(imgPath) + ' due to ' + color.yellow(err));
                }
            }
        });

        videos.forEach(async videoPath => {
            const videoDir = path.dirname(videoPath);
            const subDir = videoDir.slice(publicDir.length);

            // Only convert videos in the post directory
            if (/^\d{4}\\.*/.test(subDir)) {
                const videoName = path.basename(videoPath);
                const name = videoName.split('.').slice(0, -1).join('.');
                const newPath = path.join(videoDir, name + '.webm');

                var numCPUs = require('os').cpus().length;

                ffmpeg(videoPath)
                    .output(newPath)
                    .outputOption('-threads ' + numCPUs)
                    .on('start', function() {
                        console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Converting: ' + color.magenta(videoPath) + ' => ' + color.magenta(newPath));
                    })
                    .on('progress', function(progress) {
                        console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Processing: ' + color.magenta(videoPath) + ' => ' + color.magenta(newPath) + ' ' + color.blue(progress.percent + '%'));
                    })
                    .on('end', function() {
                        console.log(color.green('Hexo-Auto-Webp-Converter  ') + 'Converted: ' + color.magenta(videoPath) + ' => ' + color.magenta(newPath));
                        try {
                            fs.unlinkSync(videoPath);
                            // console.log(color.red('THE VIDEO IS DELETED!'));
                        } catch (err) {
                            console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to delete ') + color.magenta(videoPath) + ' due to ' + color.yellow(err));
                        }
                    })
                    .on('error', function(err) {
                        console.log(color.green('Hexo-Auto-Webp-Converter  ') + color.red('Failed to convert ') + color.magenta(videoPath) + ' due to ' + color.yellow(err));
                    })
                    .run();
            }
        });
    }
}, 9999);

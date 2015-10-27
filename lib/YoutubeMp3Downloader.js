var os = require('os');
var util = require('util');
var EventEmitter = require("events").EventEmitter;
var ffmpeg = require('fluent-ffmpeg');
var ytdl = require('ytdl-core');
var async = require('async');
var progress = require('progress-stream');
var fs = require('fs-extra');

function YoutubeMp3Downloader(options) {

    var self = this;

    self.youtubeBaseUrl = 'http://www.youtube.com/watch?v=';
    self.youtubeVideoQuality = (options && options.youtubeVideoQuality ? options.youtubeVideoQuality : 'highest');

    self.video_outputPath = (options && options.video_outputPath ? options.video_outputPath : (os.platform() === 'win32' ? 'D:/temp' : '/tmp'));
    self.audio_outputPath = (options && options.audio_outputPath ? options.audio_outputPath : (os.platform() === 'win32' ? 'D:/temp' : '/tmp'));

    self.video_ext = (options && options.video_ext ? options.video_ext : 'mp4');
    self.audio_ext = (options && options.audio_ext ? options.audio_ext : 'mp3');

    self.queueParallelism = (options && options.queueParallelism ? options.queueParallelism : 1);
    self.progressTimeout = (options && options.progressTimeout ? options.progressTimeout : 1000);

    if (options && options.ffmpegPath) {
        ffmpeg.setFfmpegPath(options.ffmpegPath);
    }

    //Async download/transcode queue
    self.downloadQueue = async.queue(function(task, callback) {

        self.emit("queueSize", self.downloadQueue.running() + self.downloadQueue.length());
        var cbAlreadyCall = false;
        self.performDownload(task, function(err, result) {
            if (!cbAlreadyCall) {
                cbAlreadyCall = true;
                callback(err, result);
            }
        });

    }, self.queueParallelism);

}

util.inherits(YoutubeMp3Downloader, EventEmitter);

YoutubeMp3Downloader.prototype.download = function(video, fileName) {

    var self = this;
    var task = {
        video: video,
        videoId: video.youtube.id,
        fileName: fileName
    };

    self.downloadQueue.push(task, function(err, data) {
        if (err) {
            self.emit("error", err);
        } else {
            self.emit('finished', data);
            self.emit("queueSize", self.downloadQueue.running() + self.downloadQueue.length());
        }
    });

};

YoutubeMp3Downloader.prototype.performDownload = function(task, cb) {

    var self = this;
    var _newborn_ = task.video;
    var videoUrl = self.youtubeBaseUrl + task.videoId;
    
    ytdl.ssl = false;//I really if this will do anything lol

    ytdl.getInfo(videoUrl, function(err, info) {

        if (err) {

            return cb(err, null);
        }
        var videoTitle = info.title.replace(/"/g, '').replace(/'/g, '').replace(/\//g, '').replace(/\?/g, '');
        var artist = "Unknown";
        var title = "Unknown";

        if (videoTitle.indexOf("-") > -1) {
            var temp = videoTitle.split("-");
            if (temp.length >= 2) {
                artist = temp[0].trim();
                title = temp[1].trim();
            }
        } else {
            title = videoTitle;
        }
        title = _newborn_.song.name ? _newborn_.song.name : title;
        artist = _newborn_.song.artist ? _newborn_.song.artist : title;

        //Derive file name, if given, use it, if not, from video title
        var vidfileName = self.video_outputPath + (task.fileName ? task.fileName : videoTitle) + "." + self.video_ext;
        var audfileName = self.audio_outputPath + (task.fileName ? task.fileName : videoTitle) + "." + self.audio_ext;

        //Stream setup
        var stream = ytdl(videoUrl, {
            quality: self.youtubeVideoQuality,
            ssl : false, //also this too
            filter: function(format) {
                return format.container === self.video_ext;
            }
        });

        try {

            stream
                .on("error", function(err) {
                    console.log(err);
                    cb(err.message, null);
                })
                .on("info", function(info, format) {
                    var resultObj = {};

                    //Setup of progress module
                    var str = progress({
                        length: format.size,
                        time: self.progressTimeout
                    });

                    //Add progress event listener
                    str.on('progress', function(progress) {
                        if (progress.percentage === 100) {
                            resultObj.stats = {
                                transferredBytes: progress.transferred,
                                runtime: progress.runtime,
                                averageSpeed: parseFloat(progress.speed.toFixed(2))
                            };
                        }
                        self.emit("progress", {
                            videoName: (task.fileName ? task.fileName : videoTitle),
                            videoId: task.videoId,
                            progress: progress
                        });
                    });

                    //Start encoding
                    var proc = new ffmpeg({
                            source: stream.pipe(str)
                        })
                        .audioBitrate(info.formats[0].audioBitrate)
                        .withAudioCodec('libmp3lame')
                        .toFormat('mp3')
                        .outputOptions('-id3v2_version', '4')
                        .outputOptions('-metadata', 'title=' + title)
                        .outputOptions('-metadata', 'artist=' + artist)
                        .on('error', function(err) {
                            cb(err.message, null);
                        })
                        .on('end', function() {
                            resultObj.vidFile = vidfileName;
                            resultObj.audFile = audfileName;
                            resultObj.videoTitle = videoTitle;
                            resultObj.videoId = task.videoId;
                            resultObj.youtubeUrl = videoUrl;
                            resultObj.artist = artist;
                            resultObj.title = title;
                            cb(null, resultObj);
                        })
                        .saveToFile(audfileName);

                    stream.pipe(fs.createWriteStream(vidfileName));

                });
        } catch (e) {
            console.log(e);
        }
    });

};

module.exports = YoutubeMp3Downloader;
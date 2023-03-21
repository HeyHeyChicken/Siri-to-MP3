const LIBRARIES = {
    FS: require("fs"),
    NodeCMD: require("node-cmd"),
    Path: require("path"),
    Express: require('express')
};

// We check that the OS is MacOS.
if(process.platform !== "darwin"){
    console.log("This program is only compatible with MacOS.")
    return;
}

// We create the folder storing the temporary files if it does not exist.
const MP3_DIRECTORY = LIBRARIES.Path.resolve(__dirname + "/mp3/");
if (!LIBRARIES.FS.existsSync(MP3_DIRECTORY)){
    LIBRARIES.FS.mkdirSync(MP3_DIRECTORY);
}

// Empty the MP3 folder if there are files left
LIBRARIES.FS.readdir(MP3_DIRECTORY, (err, files) => {
    if (err) throw err;

    for (const file of files) {
        LIBRARIES.FS.unlink(LIBRARIES.Path.join(MP3_DIRECTORY, file), (err) => {
            if (err) throw err;
        });
    }
});

// Initialize the web server.
const app = LIBRARIES.Express()
app.get('/', function (req, res) {
    res.redirect('/api');
})
app.get('/api', function (req, res) {
    const ATTR = "sentence";
    const SENTENCE = req.query[ATTR];
    const MP3_ATTR = "mp3";
    let mp3 = req.query[MP3_ATTR];

    if(!mp3){
        mp3 = true;
    }
    
    if(SENTENCE){
        const FILE_NAME = "/MacTTS-" + new Date().getTime();
        const ABSOLUTE_PATH = LIBRARIES.Path.resolve(__dirname + "/mp3/") + FILE_NAME;
        const COMMAND = "say -o \"" + ABSOLUTE_PATH + ".aiff\" \"" + SENTENCE + "\"";

        LIBRARIES.NodeCMD.run(
            COMMAND,
            function(err, data, stderr){
                if(mp3 === 'true'){
                    // Convert AIFF file to MP3
                    const FFMPEG_ABSOLUTE_PATH = LIBRARIES.Path.resolve(__dirname + "/ffmpeg");
                    const CONVERT_COMMAND = FFMPEG_ABSOLUTE_PATH + " -i " + ABSOLUTE_PATH + ".aiff -f mp3 -acodec libmp3lame -ab 192000 -ar 44100 " + ABSOLUTE_PATH + ".mp3";
                    LIBRARIES.NodeCMD.run(
                        CONVERT_COMMAND,
                        function(err, data, stderr){
                            // Delete the old AIFF file
                            LIBRARIES.FS.unlink(ABSOLUTE_PATH + ".aiff", function(){
                                const MP3_FILE_PATH = ABSOLUTE_PATH + ".mp3";
                                res.sendFile(MP3_FILE_PATH);
                                res.on('finish', function() {
                                    LIBRARIES.FS.unlink(MP3_FILE_PATH, (err) => {
                                        if (err) throw err;
                                    });
                                });
                            });
                        }
                    );
                }
                else{
                    const AIFF_FILE_PATH = ABSOLUTE_PATH + ".aiff";
                    res.sendFile(AIFF_FILE_PATH);
                    res.on('finish', function() {
                        LIBRARIES.FS.unlink(AIFF_FILE_PATH, (err) => {
                            if (err) throw err;
                        });
                    });
                }
            }
        );
    }
    else{
        res.send('You must enter your sentence in the "' + ATTR + '" parameter (Example: http://localhost/api?' + ATTR + '=Hello).')
        res.send('You can also set the "' + MP3_ATTR + '" parameter to false to dl the .aiff file (Example: http://localhost/api?' + ATTR + '=Hello&' + MP3_ATTR + '=false).')
    }
})

app.listen(80)
console.log("Siri to MP3 is ready");
console.log("Please, ask an API request like http://localhost/api?sentence=Hello&mp3=true");
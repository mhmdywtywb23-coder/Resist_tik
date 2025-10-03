const { exec } = require('child_process');

function processVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `ffmpeg -i ${inputPath} -filter:v "minterpolate='mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:fps=30'" -c:v libx264 -preset fast -crf 23 ${outputPath}`;
    console.log('Running:', command);

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg error:', error);
        return reject(error);
      }
      console.log('FFmpeg finished:', stderr);
      resolve();
    });
  });
}

module.exports = { processVideo };

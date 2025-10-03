const { exec } = require('child_process');

function processVideo(inputPath, outputPath) {
  const command = `ffmpeg -i ${inputPath} -filter:v "minterpolate='mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:fps=30'" -c:v libx264 -preset fast -crf 23 ${outputPath}`;

  exec(command, (error, stdout, stderr) => {
    if(error) {
      console.error('Error processing video:', error);
      return;
    }
    console.log('Processing done!');
  });
}

module.exports = { processVideo };

const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/download', async (req, res) => {
  const { url, format } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

  const outputFile = `output.${format}`;
  const ytdlpCommand = `yt-dlp -f best -o ${outputFile} ${url}`;
  
  exec(ytdlpCommand, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Download failed' });

    if (format === 'mp4') {
      // Apply blur effect with FFmpeg
      const ffmpegCommand = `ffmpeg -i ${outputFile} -vf "gblur=sigma=10" -c:a copy blurred_${outputFile}`;
      exec(ffmpegCommand, (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Blur processing failed' });
        res.json({ success: true, videoUrl: `/downloads/blurred_${outputFile}` });
      });
    } else {
      res.json({ success: true, videoUrl: `/downloads/${outputFile}` });
    }
  });
});

app.listen(port, () => console.log(`Server running on port ${port}`));
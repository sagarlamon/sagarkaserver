const express = require('express');
const { exec } = require('child_process');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');

// Middleware
app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(path.join(__dirname, 'downloads')));

// Ensure downloads folder exists
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

app.post('/api/download', (req, res) => {
  const { url, format } = req.body;
  if (!url) return res.status(400).json({ success: false, message: 'URL is required' });

  const outputFile = `output.${format}`;
  const outputPath = path.join(downloadsDir, outputFile);
  const ytdlpCommand = `yt-dlp -f best -o "${outputPath}" "${url}"`;

  exec(ytdlpCommand, (err) => {
    if (err) return res.status(500).json({ success: false, message: 'Download failed' });

    if (format === 'mp4') {
      const blurredFile = path.join(downloadsDir, `blurred_${outputFile}`);
      const ffmpegCommand = `ffmpeg -i "${outputPath}" -vf "gblur=sigma=10" -c:a copy "${blurredFile}"`;

      exec(ffmpegCommand, (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Blur processing failed' });
        res.json({ success: true, videoUrl: `/downloads/blurred_${outputFile}` });
      });
    } else {
      res.json({ success: true, videoUrl: `/downloads/${outputFile}` });
    }
  });
});

app.listen(port, () => console.log(`✅ Server running on port ${port}`));

const fs = require('fs');
const path = require('path');
const https = require('https');

const modelsDir = path.join(__dirname, '../../frontend/public/models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const files = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model-shard1',
  'ssd_mobilenetv1_model-shard2',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1'
];

const baseUrl = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/';

const downloadFile = (fileName) => {
  return new Promise((resolve, reject) => {
    const dest = path.join(modelsDir, fileName);
    const file = fs.createWriteStream(dest);

    console.log(`Downloading ${fileName}...`);
    https.get(baseUrl + fileName, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${fileName}. Status: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Successfully saved ${fileName}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const run = async () => {
  try {
    for (const file of files) {
      await downloadFile(file);
    }
    console.log('All face-api.js models downloaded successfully!');
  } catch (error) {
    console.error('Error downloading models:', error);
  }
};

run();

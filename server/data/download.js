const fs = require("fs"); // For Node.js
const https = require("https");

// Convert downloadLargeFile to an async function
async function downloadLargeFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        response.pipe(file);

        file.on("finish", () => {
          file.close(() => {
            console.log("Download complete");
            resolve();
          });
        });

        file.on("error", (err) => {
          fs.unlink(outputPath, () => {}); // Cleanup on error
          reject(new Error(`Error: ${err.message}`));
        });
      })
      .on("error", (err) => {
        reject(new Error(`Request error: ${err.message}`));
      });
  });
}

module.exports = downloadLargeFile;

const fs = require("fs"); // For Node.js
const { chain } = require("stream-chain");
const { parser } = require("stream-json");
const { streamArray } = require("stream-json/streamers/StreamArray");

async function importData(collection, tempFilePath) {
  try {
    // Parse JSON and insert data
    console.log("Parsing and importing JSON...");
    const jsonStream = chain([
      fs.createReadStream(tempFilePath),
      parser(),
      streamArray(),
    ]);

    let buffer = [];
    const batchSize = 1000; // Number of documents to insert at once

    for await (const { value } of jsonStream) {
      // Convert _id to ObjectId if it's present
      if (value._id && value._id.$oid) {
        value._id = value._id.$oid;
      }

      buffer.push(value);

      if (buffer.length === batchSize) {
        await collection.insertMany(buffer);
        console.log(`Inserted ${buffer.length} documents...`);
        buffer = [];
      }
    }

    // Insert remaining documents
    if (buffer.length > 0) {
      await collection.insertMany(buffer);
      console.log(`Inserted remaining ${buffer.length} documents.`);
    }

    console.log("Data import completed!");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

module.exports = importData;

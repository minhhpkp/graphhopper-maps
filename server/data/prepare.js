async function prepareData(collection) {
  try {
    await collection.deleteMany({
      coordinate: null,
      $nor: [{ coordinate: { $type: "array" } }],
    });
    console.log("Documents with null coordinate field deleted.");

    await collection.updateMany({}, { $pull: { coordinate: null } });
    console.log("Null elements removed from coordinate arrays.");

    await collection.updateMany({}, [
      {
        $set: {
          location: {
            type: "Point",
            coordinates: [
              { $arrayElemAt: ["$coordinate", 1] }, // Second element of coordinate
              { $arrayElemAt: ["$coordinate", 0] }, // First element of coordinate
            ],
          },
        },
      },
    ]);
    console.log("Location field added for 2dsphere index.");

    await collection.createIndex({ location: "2dsphere" });
    console.log("2dsphere index created.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}
module.exports = prepareData;

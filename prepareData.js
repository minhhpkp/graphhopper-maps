// delete documents with null coordinate field
db.poi.deleteMany({
  coordinate: null,
  $nor: [{ coordinate: { $type: "array" } }],
});

// remove null element from coordinate array
db.poi.updateMany(
  {},
  {
    $pull: { coordinate: null },
  }
);

// add location field for the 2dshpere index
db.poi.updateMany({}, [
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

// create the index
db.poi.createIndex({ location: "2dsphere" });

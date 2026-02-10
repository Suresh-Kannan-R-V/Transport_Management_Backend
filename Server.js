const express = require("express");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const sequelize = require("./config");

const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Transport Management Backend Server is Running...");
});

//Api's Paths
app.use("/auth", require("./routes/auth.routes"));
app.use("/auth", require("./routes/user.routes"));
app.use("/api", require("./routes/route"));

const PORT = process.env.PORT || 8000;

app.listen(PORT, async () => {
  console.log(`Server Running on port ${PORT}`);

  try {
    await sequelize.sync();
    console.log("Database synced successfully.");
  } catch (error) {
    console.log(" Sync error:", error);
  }
});




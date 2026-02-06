const express = require("express");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes/route");
const sequelize = require("./config");

const app = express();

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Transport Management Backend Server is Running...");
});

app.use("/api", routes);

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

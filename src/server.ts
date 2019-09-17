import * as express from "express";
import * as path from "path";

const app = express();
app.use(express.static(path.resolve(__dirname, "../public")));
const port = process.env.PORT || "3030";
app.listen(port, () => {
  console.log("server is running on port: " + port);
});

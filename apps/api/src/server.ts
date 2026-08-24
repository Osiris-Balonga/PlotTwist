import { createServer } from "node:http";
import { handleRequest } from "./app.js";

const port = Number(process.env.PORT ?? 8787);

createServer(handleRequest).listen(port, () => {
  console.info(`PlotTwist API listening on http://localhost:${port}`);
});

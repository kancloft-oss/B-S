import express from "express";
import path from "path";
import http from "http";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT || 3000;

  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode...`);

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is successfully running!`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`Listening on 0.0.0.0:${PORT}`);
  });
}

startServer();

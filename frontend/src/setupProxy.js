const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function (app) {
  const target = process.env.DEV_API_TARGET || "http://localhost";
  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      onProxyReq(proxyReq, req) {
        if (req.headers.origin)
          proxyReq.setHeader("Origin", new URL(target).origin);
      },
      proxyTimeout: 300000,
      timeout: 300000,
    }),
  );
};

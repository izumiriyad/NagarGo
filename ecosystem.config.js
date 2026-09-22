module.exports = {
  apps: [
    {
      name: "nagargo-api",
      script: "./apps/api/dist/server.js",
      instances: "max", // Uses all available CPU cores
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "nagargo-web",
      script: "npm",
      args: "run start:web",
      instances: 1, // Next.js server typically runs on 1 port, can scale with load balancer
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    }
  ],
};

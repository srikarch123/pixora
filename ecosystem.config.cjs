// PM2 process config — run with: pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: "pixora",
      script: "./server/dist/index.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env_production: {
        NODE_ENV: "production"
      },
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      restart_delay: 5000,
      max_restarts: 10
    }
  ]
};

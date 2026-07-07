// 一次性部署脚本：连接到腾讯云服务器并自动配置环境
const { Client } = require('ssh2');

const conn = new Client();
const HOST = '124.221.216.145';

// 需要执行的命令列表
const commands = [
  // 1. 检查系统版本
  'cat /etc/os-release | head -2',
  // 2. 安装 Node.js（Ubuntu）
  'which node || (apt-get update -qq && apt-get install -y -qq nodejs npm 2>&1) || (yum install -y nodejs npm 2>&1) || true',
  'node --version 2>&1 || true',
  // 3. 装 git
  'which git || (apt-get install -y -qq git 2>&1) || (yum install -y git 2>&1) || true',
  // 4. 克隆项目
  'cd /opt && rm -rf xc-activityboard && git clone https://github.com/SierraGao/xc-activityboard.git',
  // 5. 安装依赖
  'cd /opt/xc-activityboard && npm install 2>&1',
  // 6. 创建 .env
  'cd /opt/xc-activityboard && echo "PORT=3000" > .env && echo "ADMIN_PASSWORD=admin123" >> .env && echo "SESSION_SECRET=xb-activity-board-2026-secret" >> .env && cat .env',
  // 7. 安装 pm2
  'npm install -g pm2 2>&1 | tail -3',
  // 8. 用 pm2 启动
  'cd /opt/xc-activityboard && pm2 delete xc-activityboard 2>/dev/null; pm2 start server.js --name xc-activityboard && pm2 save && pm2 startup 2>&1 | tail -2',
  // 9. 验证
  'sleep 2 && curl -s -o /dev/null -w "HTTP %{http_code}" http://localhost:3000/',
];

let currentIndex = 0;

conn.on('ready', () => {
  console.log('✅ SSH 已连接\n');
  runNext();
});

function runNext() {
  if (currentIndex >= commands.length) {
    console.log('\n🎉 部署完成！');
    conn.end();
    return;
  }
  const cmd = commands[currentIndex];
  console.log(`>>> [${currentIndex + 1}/${commands.length}] ${cmd.substring(0, 80)}...`);
  conn.exec(cmd, { timeout: 60000 }, (err, stream) => {
    if (err) { console.error('  ❌', err.message); currentIndex++; runNext(); return; }
    let output = '';
    stream.on('data', (data) => { output += data.toString(); });
    stream.stderr.on('data', (data) => { output += data.toString(); });
    stream.on('close', () => {
      console.log('  ' + output.trim().split('\n').slice(-3).join('\n  '));
      currentIndex++;
      runNext();
    });
  });
}

conn.on('error', (err) => { console.error('连接失败:', err.message); process.exit(1); });

conn.connect({ host: HOST, port: 22, username: 'root', password: 'mrn123456@', readyTimeout: 10000 });

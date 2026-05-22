# 宝塔面板部署指南

## 服务器要求
- CPU: 2核+
- 内存: 2G+
- 系统: CentOS 7+ / Ubuntu 18+
- 端口: 5001（或其他未占用端口）

## 第一步：安装 Node.js

1. 登录宝塔面板
2. 点击左侧菜单【软件商店】
3. 搜索【Node版本管理器】或【PM2管理器】
4. 点击【安装】
5. 安装完成后，点击【设置】
6. 安装 Node.js 20.x 版本

## 第二步：上传项目文件

1. 点击左侧菜单【文件】
2. 进入 `/www/wwwroot/` 目录
3. 创建新文件夹 `crm-system`
4. 将部署包中的所有文件上传到 `/www/wwwroot/crm-system/`

## 第三步：安装依赖并构建

通过 SSH 终端执行：

```bash
# 进入项目目录
cd /www/wwwroot/crm-system

# 设置使用 Node.js 20
nvm use 20

# 安装 pnpm
npm install -g pnpm

# 安装依赖
pnpm install

# 构建项目
pnpm run build
```

## 第四步：使用 PM2 启动服务

```bash
# 进入项目目录
cd /www/wwwroot/crm-system

# 使用 PM2 启动（端口 5001）
PORT=5001 pm2 start dist/server.js --name crm-system

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

## 第五步：配置 Nginx 反向代理

1. 点击左侧菜单【网站】
2. 点击【添加站点】
3. 输入你的域名（如 crm.yourdomain.com）
4. 创建后，点击【设置】
5. 点击【反向代理】选项卡
6. 点击【添加反向代理】
7. 配置如下：
   - 代理名称：crm
   - 目标URL：http://127.0.0.1:5001
   - 发送域名：$host

## 第六步：访问系统

打开浏览器访问：http://你的域名 或 http://服务器IP:5001

默认管理员账号：
- 用户名：admin
- 密码：admin123

## 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs crm-system

# 重启服务
pm2 restart crm-system

# 停止服务
pm2 stop crm-system
```

## 注意事项

1. 数据库文件位于 `/www/wwwroot/crm-system/data.db`，请定期备份
2. 首次部署后，请及时修改管理员密码
3. 如需修改端口，修改 PM2 启动命令中的 PORT 环境变量

## 防火墙设置

如果需要直接通过 IP:端口 访问，需要在宝塔面板开放对应端口：

1. 点击左侧菜单【安全】
2. 添加端口规则，放行 5001 端口

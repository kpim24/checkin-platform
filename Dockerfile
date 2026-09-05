# ===== 构建阶段 =====
FROM node:22-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package.json ./

# 安装依赖
RUN npm install

# 复制源码
COPY . .

# 构建前后端
RUN npm run build

# ===== 运行阶段 =====
FROM node:22-alpine AS runner

WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3000

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/hello || exit 1

# 启动服务
CMD ["sh", "-c", "cd dist && NODE_ENV=production node server/main.js"]

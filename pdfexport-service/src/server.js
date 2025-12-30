const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8889;

// 中间件
app.use(express.json({ limit: '10mb' }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 生成PDF
app.post('/generate', async (req, res) => {
  const { task_id, render_url } = req.body;

  if (!task_id || !render_url) {
    return res.status(400).json({ error: '缺少必需参数: task_id 和 render_url' });
  }

  console.log(`[${new Date().toISOString()}] 开始生成PDF: task_id=${task_id}, url=${render_url}`);

  let browser = null;

  try {
    // 1. 启动Puppeteer
    console.log(`[${new Date().toISOString()}] 启动 Puppeteer...`);
    
    const launchOptions = {
      headless: 'new', // 使用新的headless模式，避免废弃警告
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-blink-features=AutomationControlled',
      ],
      // 增加超时时间
      timeout: 60000,
      // 添加环境变量以避免某些 macOS 问题
      env: {
        ...process.env,
        PUPPETEER_DISABLE_HEADLESS_WARNING: 'true',
      },
    };
    
    // 在 macOS 上，优先使用系统安装的 Chrome（如果存在）
    const fs = require('fs');
    const systemChromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
    
    for (const chromePath of systemChromePaths) {
      if (fs.existsSync(chromePath)) {
        console.log(`[${new Date().toISOString()}] 使用系统 Chrome: ${chromePath}`);
        launchOptions.executablePath = chromePath;
        break;
      }
    }
    
    if (!launchOptions.executablePath) {
      console.log(`[${new Date().toISOString()}] 使用 Puppeteer 内置 Chrome`);
    }
    
    try {
      browser = await puppeteer.launch(launchOptions);
      console.log(`[${new Date().toISOString()}] Puppeteer 启动成功`);
    } catch (launchError) {
      console.error(`[${new Date().toISOString()}] Puppeteer 启动失败:`);
      console.error(`  错误类型: ${launchError.constructor.name}`);
      console.error(`  错误信息: ${launchError.message}`);
      console.error(`  错误代码: ${launchError.code || 'N/A'}`);
      if (launchError.stack) {
        console.error(`  错误堆栈:`, launchError.stack);
      }
      throw new Error(`无法启动 Puppeteer: ${launchError.message}`);
    }

    // 监听浏览器断开连接
    browser.on('disconnected', () => {
      console.error(`[${new Date().toISOString()}] ⚠️ 浏览器连接已断开`);
    });

    const page = await browser.newPage();
    console.log(`[${new Date().toISOString()}] 创建新页面成功`);

    // 设置更长的超时时间
    page.setDefaultTimeout(90000);
    
    // 设置视口大小
    await page.setViewport({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    });

    // 拦截不必要的资源请求（优化加载速度）
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();
      
      // 阻止 WebSocket 连接（Vite HMR、React DevTools 等）
      if (resourceType === 'websocket') {
        console.log(`[${new Date().toISOString()}] 阻止 WebSocket: ${url}`);
        request.abort();
        return;
      }
      
      // 阻止某些不必要的资源
      if (resourceType === 'media' || (resourceType === 'font' && url.includes('google'))) {
        request.abort();
        return;
      }
      
      request.continue();
    });

    // 监听页面错误（用于调试）
    page.on('error', err => {
      console.error(`[${new Date().toISOString()}] 页面错误:`, err);
    });

    page.on('pageerror', err => {
      console.error(`[${new Date().toISOString()}] 页面脚本错误:`, err.message);
    });

    // 监听控制台输出（用于调试）
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`[${new Date().toISOString()}] 浏览器 ${type}: ${msg.text()}`);
      }
    });

    // 2. 访问前端渲染页面
    // 使用 networkidle2：等待网络请求<=2个时才认为加载完成（更稳定）
    console.log(`[${new Date().toISOString()}] 开始访问页面: ${render_url}`);
    
    try {
      const response = await page.goto(render_url, {
        waitUntil: 'networkidle2', // 等待网络基本空闲（最多2个连接）
        timeout: 60000,
      });
      
      if (!response) {
        throw new Error('页面响应为空');
      }
      
      const status = response.status();
      console.log(`[${new Date().toISOString()}] 页面响应状态: ${status}`);
      
      if (status >= 400) {
        throw new Error(`页面返回错误状态码: ${status}`);
      }
      
      console.log(`[${new Date().toISOString()}] 页面网络已稳定`);
    } catch (gotoError) {
      console.error(`[${new Date().toISOString()}] 访问页面失败:`, gotoError.message);
      throw new Error(`无法访问渲染页面: ${gotoError.message}`);
    }

    // 3. 等待简历编辑器渲染完成
    // 首先等待主要内容容器出现
    console.log(`[${new Date().toISOString()}] 等待简历编辑器容器...`);
    
    try {
      await page.waitForSelector('[data-resume-editor]', { 
        timeout: 30000,
        visible: true 
      });
      console.log(`[${new Date().toISOString()}] 简历编辑器容器已出现`);
    } catch (selectorError) {
      // 如果等待失败，打印页面内容用于调试
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      console.error(`[${new Date().toISOString()}] 等待简历编辑器容器失败，页面内容:`, bodyHTML.substring(0, 500));
      throw new Error('简历编辑器容器未出现，可能页面渲染失败');
    }

    // 然后等待前端设置的渲染完成标记
    console.log(`[${new Date().toISOString()}] 等待渲染完成标记...`);
    
    try {
      await page.waitForFunction(
        () => document.body.getAttribute('data-pdf-ready') === 'true',
        { timeout: 30000 }
      );
      console.log(`[${new Date().toISOString()}] 页面渲染完成，开始生成PDF`);
    } catch (readyError) {
      console.warn(`[${new Date().toISOString()}] 等待渲染标记超时，继续生成PDF`);
      // 不抛出错误，继续尝试生成PDF
    }

    // 额外等待1秒，确保所有样式、图片、字体都已应用
    // await page.waitForTimeout(1000);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. 生成PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',    // 适合简历的上边距
        right: '12mm',  // 适合简历的右边距
        bottom: '12mm', // 适合简历的下边距
        left: '12mm',   // 适合简历的左边距
      },
    });

    await browser.close();
    browser = null;

    // 5. 返回PDF文件
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${task_id}.pdf"`);
    res.send(pdfBuffer);

    console.log(`[${new Date().toISOString()}] PDF生成成功: task_id=${task_id}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] PDF生成失败: task_id=${task_id}`);
    console.error(`错误类型: ${error.constructor.name}`);
    console.error(`错误信息: ${error.message}`);
    console.error(`错误堆栈:`, error.stack);

    // 清理资源
    if (browser) {
      try {
        const isConnected = browser.isConnected();
        console.log(`[${new Date().toISOString()}] 浏览器连接状态: ${isConnected}`);
        
        if (isConnected) {
          await browser.close();
          console.log(`[${new Date().toISOString()}] 浏览器已关闭`);
        }
      } catch (e) {
        console.error(`[${new Date().toISOString()}] 关闭浏览器失败:`, e.message);
      }
    }

    res.status(500).json({
      error: 'PDF生成失败',
      message: error.message,
      type: error.constructor.name,
    });
  }
});


// 启动服务
app.listen(PORT, () => {
  console.log(`PDF Export Service listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Generate PDF: POST http://localhost:${PORT}/generate`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});


/**
 * PDF导出工具模块
 * A4纸张规格：
 * - 宽度：210mm (8.27英寸)
 * - 高度：297mm (11.69英寸)
 * 
 * DPI设置：200
 * - 1英寸 = 25.4mm
 * - 200 DPI = 200像素/英寸
 * 
 * 计算结果：
 * - A4宽度：210mm ≈ 8.27英寸 ≈ 1654像素 (200 DPI)
 * - A4高度：297mm ≈ 11.69英寸 ≈ 2338像素 (200 DPI)
 * 
 * 内容区域（padding=2rem约32px）：
 * - 边距：上下左右各2rem
 * - 可用内容高度：297mm - 4rem
 * 
 * 导出方式：
 * 1. 浏览器打印：使用原生打印功能，支持所有CSS特性
 * 2. Canvas图片PDF：使用html-to-image渲染为图片后生成PDF，确保色彩一致性
 *    - html-to-image支持现代CSS特性（包括oklch等颜色函数）
 */

import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * 注入打印样式到页面
 */
function injectPrintStyles(): HTMLStyleElement {
  const style = document.createElement('style');
  style.id = 'pdf-export-print-styles';
  style.textContent = `
    @media print {
      /* 隐藏所有非打印内容 */
      body > *:not(.pdf-print-content) {
        display: none !important;
      }
      
      /* 打印容器样式 */
      .pdf-print-content {
        display: block !important;
        position: relative !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 210mm !important;
        margin: 0 auto !important;
        background: white !important;
        box-shadow: none !important;
      }
      
      /* A4纸张设置 */
      @page {
        size: A4 portrait;
        margin: 2rem;
      }
      
      /* 分页控制 */
      .pdf-print-content * {
        page-break-inside: always;
        break-inside: always;
      }

      .pdf-print-content .hide-when-print {
        display: none !important;
      }

      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  `;
  document.head.appendChild(style);
  return style;
}

/**
 * 移除打印样式
 */
function removePrintStyles(styleElement: HTMLStyleElement): void {
  styleElement.remove();
}

/**
 * 导出DOM元素为PDF（使用浏览器打印）
 * @param element 要导出的DOM元素
 * @param filename PDF文件名（浏览器打印对话框中使用）
 */
export async function exportElementToPDF(
  element: HTMLElement,
  filename: string = 'resume.pdf'
): Promise<void> {
  let styleElement: HTMLStyleElement | null = null;
  let printContainer: HTMLDivElement | null = null;
  
  try {
    // 0. 清理所有旧的打印容器和样式（防止重复导出时累积）
    const oldContainers = document.querySelectorAll('.pdf-print-content');
    oldContainers.forEach(container => container.remove());
    
    const oldStyles = document.querySelectorAll('#pdf-export-print-styles');
    oldStyles.forEach(style => style.remove());
    
    // 1. 克隆元素以避免影响原始DOM
    const clonedElement = element.cloneNode(true) as HTMLElement;
    
    // 2. 创建打印容器
    printContainer = document.createElement('div');
    printContainer.className = 'pdf-print-content';
    printContainer.style.display = 'none'; // 在屏幕上隐藏
    printContainer.appendChild(clonedElement);
    document.body.appendChild(printContainer);
    
    // 3. 注入打印样式
    styleElement = injectPrintStyles();
    
    // 4. 设置文档标题（影响默认文件名）
    const originalTitle = document.title;
    document.title = filename.replace('.pdf', '');
    
    // 5. 触发打印对话框
    window.print();
    
    // 6. 恢复原始标题
    document.title = originalTitle;
    
    // 注意：清理工作需要在打印对话框关闭后进行
    // 使用 matchMedia 监听打印状态
    const printMediaQuery = window.matchMedia('print');
    
    const cleanupAfterPrint = () => {
      // 延迟清理，确保打印完成
      setTimeout(() => {
        if (styleElement) {
          removePrintStyles(styleElement);
        }
        if (printContainer && printContainer.parentNode) {
          printContainer.parentNode.removeChild(printContainer);
        }
      }, 100);
    };
    
    // 监听打印完成事件
    if (printMediaQuery.addEventListener) {
      const handleChange = () => {
        if (!printMediaQuery.matches) {
          cleanupAfterPrint();
          console.log('打印完成, 清理元素');
          printMediaQuery.removeEventListener('change', handleChange);
        }
      };
      printMediaQuery.addEventListener('change', handleChange);
    } else {
      // 降级方案：延迟清理
      setTimeout(cleanupAfterPrint, 1000);
    }
    
  } catch (error) {
    // 清理资源
    if (styleElement) {
      removePrintStyles(styleElement);
    }
    if (printContainer && printContainer.parentNode) {
      printContainer.parentNode.removeChild(printContainer);
    }
    
    console.error('PDF导出失败:', error);
    throw new Error('PDF导出失败，请稍后重试');
  }
}

/**
 * 从简历数据导出PDF（便捷方法）
 * @param resumeName 简历名称
 */
export async function exportResumeToPDF(resumeName: string = '简历'): Promise<void> {
  // 查找简历编辑器元素
  const editorElement = document.querySelector('[data-resume-editor]') as HTMLElement;
  
  if (!editorElement) {
    throw new Error('未找到简历编辑器元素');
  }
  
  const filename = `${resumeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  await exportElementToPDF(editorElement, filename);
}

/**
 * 直接打印当前页面（无需查找特定元素）
 * @param filename 建议的文件名
 */
export function printCurrentPage(filename: string = 'document.pdf'): void {
  const originalTitle = document.title;
  document.title = filename.replace('.pdf', '');
  window.print();
  document.title = originalTitle;
}

/**
 * 使用Canvas将DOM元素导出为PDF（图片PDF方式）
 * 适用于需要确保色彩完全一致的场景
 * 
 * @param element 要导出的DOM元素
 * @param filename PDF文件名
 */
export async function exportElementToPDFViaCanvas(
  element: HTMLElement,
  filename: string = 'resume.pdf'
): Promise<void> {
  try {
    // A4纸张尺寸（单位：mm）
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;
    
    // 边距（单位：mm，2rem ≈ 32px ≈ 8.5mm）
    const MARGIN = 8.5;
    
    // 可用内容区域
    const CONTENT_WIDTH = A4_WIDTH - (MARGIN * 2);
    const CONTENT_HEIGHT = A4_HEIGHT - (MARGIN * 2);
    
    // DPI设置：用于canvas渲染
    const SCALE = 2; // 提高渲染质量
    
    // 1. 使用html-to-image渲染DOM为Canvas
    // html-to-image支持现代CSS特性，包括oklch颜色函数
    const dataUrl = await htmlToImage.toJpeg(element, {
      quality: 1.0,
      pixelRatio: SCALE,
      backgroundColor: '#ffffff',
      cacheBust: true,
    });
    
    // 创建临时图片以获取尺寸
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });
    
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    // 2. 创建PDF文档
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
    
    // 3. 计算缩放比例，确保内容适配页面宽度
    const pdfContentWidth = CONTENT_WIDTH;
    const scaleFactor = pdfContentWidth / (imgWidth / SCALE);
    const scaledImgHeight = (imgHeight / SCALE) * scaleFactor;
    
    // 4. 智能分页
    const pageContentHeight = CONTENT_HEIGHT;
    let remainingHeight = scaledImgHeight;
    let yPosition = 0;
    let pageNumber = 0;
    
    while (remainingHeight > 0) {
      if (pageNumber > 0) {
        pdf.addPage();
      }
      
      // 计算当前页要显示的内容高度
      const currentPageHeight = Math.min(pageContentHeight, remainingHeight);
      
      // 计算源图像中的裁剪位置
      const sourceY = (yPosition / scaleFactor) * SCALE;
      const sourceHeight = (currentPageHeight / scaleFactor) * SCALE;
      
      // 创建临时canvas用于裁剪当前页的内容
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = imgWidth;
      pageCanvas.height = Math.min(sourceHeight, imgHeight - sourceY);
      
      const pageCtx = pageCanvas.getContext('2d');
      if (pageCtx) {
        // 绘制当前页的内容
        pageCtx.drawImage(
          img,
          0, sourceY, // 源图像起始位置
          imgWidth, pageCanvas.height, // 源图像尺寸
          0, 0, // 目标canvas起始位置
          imgWidth, pageCanvas.height // 目标canvas尺寸
        );
        
        const pageImgData = pageCanvas.toDataURL('image/jpeg', 1.0);
        
        // 添加图片到PDF页面，保持边距
        pdf.addImage(
          pageImgData,
          'JPEG',
          MARGIN,
          MARGIN,
          pdfContentWidth,
          currentPageHeight
        );
      }
      
      // 更新位置和剩余高度
      yPosition += currentPageHeight;
      remainingHeight -= currentPageHeight;
      pageNumber++;
    }
    
    // 5. 保存PDF
    pdf.save(filename);
    
  } catch (error) {
    console.error('Canvas PDF导出失败:', error);
    throw new Error('PDF导出失败，请尝试使用文字PDF打印');
  }
}

/**
 * 从简历数据导出PDF（Canvas图片方式）
 * @param resumeName 简历名称
 */
export async function exportResumeToPDFViaCanvas(resumeName: string = '简历'): Promise<void> {
  // 查找简历编辑器元素
  const editorElement = document.querySelector('[data-resume-editor]') as HTMLElement;
  
  if (!editorElement) {
    throw new Error('未找到简历编辑器元素');
  }
  
  const filename = `${resumeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  await exportElementToPDFViaCanvas(editorElement, filename);
}


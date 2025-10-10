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
 * 内容区域（padding=200px）：
 * - 内容宽度：1654 - 400 = 1254像素
 * - 内容高度：2338 - 400 = 1938像素
 * 使用浏览器原生打印功能导出PDF，避免html2canvas的兼容性问题
 * 优势：
 * - 支持所有现代CSS特性（包括oklch等颜色函数）
 * - 更好的打印质量
 * - 更可靠的分页控制
 * - 无需额外的canvas转换
 */

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
        padding: 10mm !important;
        background: white !important;
        box-shadow: none !important;
      }
      
      /* A4纸张设置 */
      @page {
        size: A4 portrait;
        margin: 0;
      }
      
      /* 避免不必要的分页 */
      .pdf-print-content * {
        page-break-inside: avoid;
        break-inside: avoid;
      }
      
      /* 确保打印时颜色正常显示 */
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


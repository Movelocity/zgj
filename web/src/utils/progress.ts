/**
 * 进度条工具函数
 * 用于基于时间预期的进度更新
 */

export interface ProgressStep {
  name: string;
  expectedDuration: number; // 预期持续时间（秒）
  startProgress: number; // 起始进度百分比
  endProgress: number; // 结束进度百分比
}

export interface ProgressCallbacks {
  onProgressUpdate: (progress: number, text: string) => void;
  onStepComplete: (stepIndex: number, stepName: string) => void;
  onAllComplete: () => void;
}

/**
 * 基于时间的进度更新器
 */
export class TimeBasedProgressUpdater {
  private steps: ProgressStep[];
  private callbacks: ProgressCallbacks;
  private currentStepIndex: number = -1;
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private isRunning: boolean = false;

  constructor(steps: ProgressStep[], callbacks: ProgressCallbacks) {
    this.steps = steps;
    this.callbacks = callbacks;
  }

  /**
   * 开始指定步骤的进度更新
   */
  startStep(stepIndex: number): void {
    if (stepIndex >= this.steps.length || stepIndex < 0) {
      console.error('Invalid step index:', stepIndex);
      return;
    }

    this.currentStepIndex = stepIndex;
    const step = this.steps[stepIndex];
    this.startTime = Date.now();
    this.isRunning = true;

    // 立即更新到起始进度
    this.callbacks.onProgressUpdate(step.startProgress, step.name);

    // 清除之前的定时器
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // 每100ms更新一次进度
    this.intervalId = setInterval(() => {
      this.updateProgress();
    }, 100);
  }

  /**
   * 完成当前步骤
   */
  completeCurrentStep(): void {
    if (this.currentStepIndex === -1 || !this.isRunning) {
      return;
    }

    const step = this.steps[this.currentStepIndex];
    
    // 清除定时器
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // 设置到结束进度
    this.callbacks.onProgressUpdate(step.endProgress, `${step.name} - 完成`);
    this.callbacks.onStepComplete(this.currentStepIndex, step.name);
    
    this.isRunning = false;

    // 检查是否所有步骤都完成
    if (this.currentStepIndex === this.steps.length - 1) {
      setTimeout(() => {
        this.callbacks.onAllComplete();
      }, 500);
    }
  }

  /**
   * 停止进度更新
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * 更新进度
   */
  private updateProgress(): void {
    if (!this.isRunning || this.currentStepIndex === -1) {
      return;
    }

    const step = this.steps[this.currentStepIndex];
    const elapsedTime = (Date.now() - this.startTime) / 1000; // 转换为秒
    const progressRatio = Math.min(elapsedTime / step.expectedDuration, 1);
    
    // 计算当前进度
    const currentProgress = step.startProgress + (step.endProgress - step.startProgress) * progressRatio;
    
    // 添加一些随机性，让进度看起来更自然
    const randomOffset = (Math.random() - 0.5) * 2; // -1 到 1 的随机数
    const adjustedProgress = Math.min(Math.max(currentProgress + randomOffset, step.startProgress), step.endProgress - 1);
    
    this.callbacks.onProgressUpdate(Math.round(adjustedProgress), step.name);
  }

  /**
   * 获取当前步骤索引
   */
  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  /**
   * 获取是否正在运行
   */
  isProgressRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * 简历处理步骤配置
 */
export const RESUME_PROCESSING_STEPS: ProgressStep[] = [
  {
    name: '简历文件解析',
    expectedDuration: 10, // 10秒
    startProgress: 0,
    endProgress: 20
  },
  {
    name: '简历数据结构化',
    expectedDuration: 60, // 60秒
    startProgress: 20,
    endProgress: 85
  },
  {
    name: '简历分析优化',
    expectedDuration: 80, // 80秒
    startProgress: 85,
    endProgress: 100
  }
];

/**
 * AI优化步骤配置
 */
export const AI_OPTIMIZATION_STEPS: ProgressStep[] = [
  {
    name: '上传简历文件',
    expectedDuration: 3, // 3秒
    startProgress: 0,
    endProgress: 10
  },
  {
    name: '解析简历内容',
    expectedDuration: 10, // 10秒
    startProgress: 10,
    endProgress: 25
  },
  {
    name: '分析个人优势',
    expectedDuration: 20, // 20秒
    startProgress: 25,
    endProgress: 50
  },
  {
    name: '生成优化建议',
    expectedDuration: 30, // 30秒
    startProgress: 50,
    endProgress: 80
  },
  {
    name: '应用优化方案',
    expectedDuration: 15, // 15秒
    startProgress: 80,
    endProgress: 100
  }
];

/**
 * Interview Workflow Hook
 * Manages state and transitions for the creation workflow
 */

import { useState } from 'react';
import type { ASRResult } from '@/api/asr';

interface WorkflowState {
  currentStep: number; // 1-based: 1=upload, 2=asr, 3=analyze
  audioFile: File | null;
  audioUrl: string;
  audioKey: string;
  asrTaskId: string;
  asrResult: ASRResult | null;
  reviewId: number | null;
  completedSteps: string[];
}

export const useInterviewWorkflow = () => {
  const [state, setState] = useState<WorkflowState>({
    currentStep: 1,
    audioFile: null,
    audioUrl: '',
    audioKey: '',
    asrTaskId: '',
    asrResult: null,
    reviewId: null,
    completedSteps: [],
  });

  /**
   * Navigate to a specific step
   * @param step - Target step number (1-3)
   */
  const goToStep = (step: number) => {
    if (step < 1 || step > 3) {
      console.warn('Invalid step number:', step);
      return;
    }

    // Can't go back after review is created
    if (state.reviewId && step < state.currentStep) {
      console.warn('Cannot navigate backward after review created');
      return;
    }

    setState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  };

  /**
   * Check if user can navigate back to a specific step
   */
  const canGoBack = (step: number): boolean => {
    if (state.reviewId) return false; // Can't go back after review created
    if (step >= state.currentStep) return false; // Can't go forward or stay
    return true;
  };

  /**
   * Handle audio upload completion
   * @param url - Download URL for the uploaded audio
   * @param key - TOS key for the uploaded file
   * @param file - The uploaded file object
   */
  const handleUploadComplete = (url: string, key: string, file: File) => {
    setState((prev) => ({
      ...prev,
      audioUrl: url,
      audioKey: key,
      audioFile: file,
      completedSteps: [...new Set([...prev.completedSteps, 'upload'])],
    }));
  };

  /**
   * Handle ASR task completion
   * @param taskId - ASR task ID
   * @param result - Parsed ASR result
   */
  const handleAsrComplete = (taskId: string, result: ASRResult) => {
    setState((prev) => ({
      ...prev,
      asrTaskId: taskId,
      asrResult: result,
      completedSteps: [...new Set([...prev.completedSteps, 'asr'])],
    }));
  };

  /**
   * Handle review record creation
   * @param id - Created review ID
   */
  const handleReviewCreated = (id: number) => {
    setState((prev) => ({
      ...prev,
      reviewId: id,
      completedSteps: [...new Set([...prev.completedSteps, 'analyze'])],
    }));
  };

  /**
   * Reset workflow to initial state
   */
  const resetWorkflow = () => {
    setState({
      currentStep: 1,
      audioFile: null,
      audioUrl: '',
      audioKey: '',
      asrTaskId: '',
      asrResult: null,
      reviewId: null,
      completedSteps: [],
    });
  };

  return {
    // State
    currentStep: state.currentStep,
    audioFile: state.audioFile,
    audioUrl: state.audioUrl,
    audioKey: state.audioKey,
    asrTaskId: state.asrTaskId,
    asrResult: state.asrResult,
    reviewId: state.reviewId,
    completedSteps: state.completedSteps,

    // Actions
    goToStep,
    canGoBack,
    handleUploadComplete,
    handleAsrComplete,
    handleReviewCreated,
    resetWorkflow,
  };
};

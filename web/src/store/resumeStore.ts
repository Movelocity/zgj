import { create } from 'zustand';
import { Resume, ResumeUploadData } from '@/types/resume';
import { PaginationParams, LoadingState } from '@/types/global';
import { resumeAPI } from '@/api/resume';

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  isLoading: boolean;
  uploadLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  
  // Actions
  fetchResumes: (params?: PaginationParams) => Promise<void>;
  uploadResume: (data: ResumeUploadData) => Promise<Resume>;
  getResume: (id: string) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  setCurrentResume: (resume: Resume | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  resumes: [],
  currentResume: null,
  isLoading: false,
  uploadLoading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  },
};

export const useResumeStore = create<ResumeState>((set, get) => ({
  ...initialState,

  fetchResumes: async (params?: PaginationParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await resumeAPI.getResumes(params);
      const { list, total, page, pageSize, totalPages } = response.data;
      
      set({
        resumes: list,
        pagination: { page, pageSize, total, totalPages },
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '获取简历列表失败',
      });
    }
  },

  uploadResume: async (data: ResumeUploadData) => {
    set({ uploadLoading: true, error: null });
    try {
      const response = await resumeAPI.uploadResume(data);
      const newResume = response.data;
      
      set(state => ({
        resumes: [newResume, ...state.resumes],
        uploadLoading: false,
      }));
      
      return newResume;
    } catch (error) {
      set({
        uploadLoading: false,
        error: error instanceof Error ? error.message : '上传简历失败',
      });
      throw error;
    }
  },

  getResume: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await resumeAPI.getResume(id);
      set({
        currentResume: response.data,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '获取简历详情失败',
      });
    }
  },

  deleteResume: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await resumeAPI.deleteResume(id);
      set(state => ({
        resumes: state.resumes.filter(resume => resume.id !== id),
        currentResume: state.currentResume?.id === id ? null : state.currentResume,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : '删除简历失败',
      });
      throw error;
    }
  },

  setCurrentResume: (resume: Resume | null) => {
    set({ currentResume: resume });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

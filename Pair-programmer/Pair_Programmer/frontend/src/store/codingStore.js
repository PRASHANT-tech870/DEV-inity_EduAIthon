import { create } from 'zustand';

const useCodingStore = create((set) => ({
  taskDescription: '',
  difficultyLevel: 'beginner',
  language: 'python',
  currentCode: '',
  output: '',
  isLoading: false,
  isRunning: false,
  error: null,

  setTaskDescription: (description) => set({ taskDescription: description }),
  setDifficultyLevel: (level) => set({ difficultyLevel: level }),
  setLanguage: (language) => set({ language }),
  setCurrentCode: (code) => set({ currentCode: code }),
  setOutput: (output) => set({ output }),
  setLoading: (loading) => set({ isLoading: loading }),
  setRunning: (running) => set({ isRunning: running }),
  setError: (error) => set({ error }),

  resetState: () => set({
    taskDescription: '',
    difficultyLevel: 'beginner',
    language: 'python',
    currentCode: '',
    output: '',
    isLoading: false,
    isRunning: false,
    error: null,
  }),
}));

export default useCodingStore; 
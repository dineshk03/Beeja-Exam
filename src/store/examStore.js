import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useExamStore = create(
  persist(
    (set) => ({
      currentExam: null,
      sessionId: null,
      sessionStartTime: null,
      answers: {},
      flaggedQuestions: [],
      currentQuestionIndex: 0,
      timeRemaining: null,
      
      // Section-based exam state
      currentSection: 0,
      completedSections: [],
      sectionStartTimes: {},
      showInstructions: true,
      
      // Enhanced question status (5-category tracking)
      questionStatus: {}, // { questionId: 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked' }
      visitedQuestions: [],
      
      // Review screen
      showReviewScreen: false,
      
      // Photo captures
      photoCaptures: [],
      initialPhotoTaken: false,
      
      setCurrentExam: (exam) => set({ currentExam: exam }),
      setSessionId: (sessionId) => set((state) => {
        // If sessionId is changing (new exam session), clear all answers
        if (state.sessionId && state.sessionId !== sessionId) {
          console.log('🔄 New session detected, clearing old answers');
          return {
            sessionId,
            answers: {},
            questionStatus: {},
            flaggedQuestions: [],
            currentQuestionIndex: 0,
            showReviewScreen: false,
            visitedQuestions: [],
          };
        }
        return { sessionId };
      }),
      setSessionStartTime: (startTime) => set({ sessionStartTime: startTime }),
      
      setAnswer: (questionId, answer) => 
        set((state) => {
          const isFlagged = state.flaggedQuestions.includes(questionId);
          const newStatus = isFlagged ? 'answered-marked' : 'answered';
          
          return {
            answers: { ...state.answers, [questionId]: answer },
            questionStatus: { ...state.questionStatus, [questionId]: newStatus }
          };
        }),
      
      toggleFlag: (questionId) =>
        set((state) => {
          const isFlagged = state.flaggedQuestions.includes(questionId);
          const hasAnswer = state.answers[questionId] !== undefined;
          
          let newStatus = state.questionStatus[questionId] || 'not-visited';
          if (!isFlagged) {
            // Adding flag
            newStatus = hasAnswer ? 'answered-marked' : 'marked';
          } else {
            // Removing flag
            newStatus = hasAnswer ? 'answered' : (state.visitedQuestions.includes(questionId) ? 'not-answered' : 'not-visited');
          }
          
          return {
            flaggedQuestions: isFlagged
              ? state.flaggedQuestions.filter(id => id !== questionId)
              : [...state.flaggedQuestions, questionId],
            questionStatus: { ...state.questionStatus, [questionId]: newStatus }
          };
        }),
      
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      
      visitQuestion: (questionId) =>
        set((state) => {
          if (state.visitedQuestions.includes(questionId)) {
            return state;
          }
          
          const hasAnswer = state.answers[questionId] !== undefined;
          const isFlagged = state.flaggedQuestions.includes(questionId);
          
          let status = 'not-answered';
          if (hasAnswer && isFlagged) status = 'answered-marked';
          else if (hasAnswer) status = 'answered';
          else if (isFlagged) status = 'marked';
          
          return {
            visitedQuestions: [...state.visitedQuestions, questionId],
            questionStatus: { ...state.questionStatus, [questionId]: status }
          };
        }),
      
      setTimeRemaining: (time) => set({ timeRemaining: time }),
      
      // Section management
      setCurrentSection: (sectionIndex) => set({ currentSection: sectionIndex }),
      completeSection: (sectionIndex) =>
        set((state) => ({
          completedSections: [...state.completedSections, sectionIndex]
        })),
      setSectionStartTime: (sectionIndex, time) =>
        set((state) => ({
          sectionStartTimes: { ...state.sectionStartTimes, [sectionIndex]: time }
        })),
      
      // Instructions and review
      setShowInstructions: (show) => set({ showInstructions: show }),
      setShowReviewScreen: (show) => set({ showReviewScreen: show }),
      
      // Photo captures
      addPhotoCapture: (photoData) =>
        set((state) => ({
          photoCaptures: [...state.photoCaptures, {
            timestamp: new Date().toISOString(),
            data: photoData
          }]
        })),
      setInitialPhotoTaken: (taken) => set({ initialPhotoTaken: taken }),
      
      clearAnswers: () => set({
        answers: {},
        questionStatus: {},
        flaggedQuestions: [],
        currentQuestionIndex: 0,
        showReviewScreen: false,
      }),
      
      resetExam: () => set({
        currentExam: null,
        sessionId: null,
        sessionStartTime: null,
        answers: {},
        flaggedQuestions: [],
        currentQuestionIndex: 0,
        timeRemaining: null,
        currentSection: 0,
        completedSections: [],
        sectionStartTimes: {},
        showInstructions: true,
        questionStatus: {},
        visitedQuestions: [],
        showReviewScreen: false,
        photoCaptures: [],
        initialPhotoTaken: false,
      }),
    }),
    {
      name: 'exam-storage', // localStorage key
      partialize: (state) => ({
        // DON'T persist currentExam - always fetch fresh from server to avoid stale cache
        // DON'T persist showReviewScreen or showInstructions - always start fresh
        // currentExam: state.currentExam,
        sessionId: state.sessionId,
        sessionStartTime: state.sessionStartTime,
        answers: state.answers,
        flaggedQuestions: state.flaggedQuestions,
        currentQuestionIndex: state.currentQuestionIndex,
        currentSection: state.currentSection,
        completedSections: state.completedSections,
        sectionStartTimes: state.sectionStartTimes,
        questionStatus: state.questionStatus,
        visitedQuestions: state.visitedQuestions,
        // showReviewScreen: state.showReviewScreen, // REMOVED - don't persist
        photoCaptures: state.photoCaptures,
        initialPhotoTaken: state.initialPhotoTaken,
      }),
    }
  )
);

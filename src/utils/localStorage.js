// Local Storage utilities for persisting canvas state

const STORAGE_KEY = 'balkonrechner_state';

// Define the structure of data to be saved
export const getDefaultState = () => ({
    points: [],
    hauswandEdges: [],
    lockedEdges: [],
    lockedAngles: [],
    scale: 70, // DEFAULT_SCALE from constants/canvas.js
    snapEnabled: true,
    showLengths: true,
    showProfiles: true,
    lastSaved: new Date().toISOString()
});

// Save state to localStorage
export const saveToLocalStorage = (state) => {
    try {
        // Convert Sets to Arrays for JSON serialization
        const serializableState = {
            ...state,
            lockedEdges: Array.from(state.lockedEdges || []),
            lockedAngles: Array.from(state.lockedAngles || []),
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
        console.log('State saved to localStorage:', serializableState);
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
};

// Load state from localStorage
export const loadFromLocalStorage = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) {
            console.log('No saved state found, using defaults');
            return getDefaultState();
        }

        const parsedState = JSON.parse(saved);
        
        // Convert Arrays back to Sets and ensure all required fields exist
        const restoredState = {
            ...getDefaultState(),
            ...parsedState,
            lockedEdges: new Set(parsedState.lockedEdges || []),
            lockedAngles: new Set(parsedState.lockedAngles || [])
        };

        console.log('State loaded from localStorage:', restoredState);
        return restoredState;
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
        return getDefaultState();
    }
};

// Clear all saved data
export const clearLocalStorage = () => {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('LocalStorage cleared');
        return true;
    } catch (error) {
        console.error('Failed to clear localStorage:', error);
        return false;
    }
};

// Check if there's saved data available
export const hasSavedData = () => {
    try {
        return localStorage.getItem(STORAGE_KEY) !== null;
    } catch (error) {
        return false;
    }
};

// Auto-save functionality - debounced save
let saveTimeout = null;
export const autoSave = (state, delay = 1000) => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    saveTimeout = setTimeout(() => {
        saveToLocalStorage(state);
    }, delay);
};
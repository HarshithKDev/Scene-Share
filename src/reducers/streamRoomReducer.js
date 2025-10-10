// src/reducers/streamRoomReducer.js

export const initialStreamRoomState = {
    micOn: true,
    cameraOn: true,
    isMoviePlaying: false,
    selfViewTrack: null,
    screenVideoTrack: null,
    dataStreamReady: false,
    isStartingStream: false,
    hostScreenUser: null,
    hostCameraUser: null,
    connectionError: null,
    screenShareError: null,
    joinAttempts: 0,
};

export function streamRoomReducer(state, action) {
    switch (action.type) {
        case 'TOGGLE_MIC':
            return { ...state, micOn: action.payload };
        case 'TOGGLE_CAMERA':
            return { ...state, cameraOn: action.payload };
        case 'SET_SELF_VIEW_TRACK':
            return { ...state, selfViewTrack: action.payload };
        case 'STREAM_ACTION_START':
            return { ...state, isStartingStream: true, screenShareError: null };
        case 'STREAM_ACTION_SUCCESS':
            return {
                ...state,
                isStartingStream: false,
                isMoviePlaying: true,
                screenVideoTrack: action.payload,
            };
        case 'STREAM_ACTION_FAILURE':
            return {
                ...state,
                isStartingStream: false,
                screenShareError: action.payload,
            };
        case 'STOP_STREAM':
            return {
                ...state,
                isMoviePlaying: false,
                screenVideoTrack: null,
                hostScreenUser: null,
                screenShareError: null,
            };
        case 'SET_HOST_SCREEN_USER':
            return { ...state, hostScreenUser: action.payload, isMoviePlaying: !!action.payload };
        case 'SET_CONNECTION_ERROR':
            return { ...state, connectionError: action.payload };
        case 'INCREMENT_JOIN_ATTEMPTS':
            return { ...state, joinAttempts: state.joinAttempts + 1 };
        case 'SET_DATA_STREAM_READY':
            return { ...state, dataStreamReady: action.payload };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}
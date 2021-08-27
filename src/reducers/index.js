import { combineReducers } from 'redux';
// Reducers
import roomReducer from './room-reducer';
import audioReducer from './audio-reducer';
import videoReducer from './video-reducer';
import visitReducer from './visit-reducer';
// Combine Reducers
const reducers = combineReducers({
  rooms: roomReducer,
  video: videoReducer,
  audio: audioReducer,
  visit:visitReducer
});
export default reducers;

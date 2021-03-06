import { TICK, START_TIMER, STOP_TIMER } from '../core/actions';
import startState from './startState';
import performance from '../core/perfnow';
//var defaultValue = startState.gameLoop; // this breaks webpack
var defaultValue = {
	now: performance.now(),
	running: false
};

export default function gameLoop(state=defaultValue, action)
{
	switch(action.type)
	{
		case TICK:
			return Object.assign({}, state, {now: action.now});
		
		case START_TIMER:
			return Object.assign({}, state, {running: true});

		case STOP_TIMER:
			return Object.assign({}, state, {running: false});

		default:
			return state;
	}
}
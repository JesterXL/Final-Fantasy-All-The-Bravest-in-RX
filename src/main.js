import { createStore, applyMiddleware, combineReducers} from 'redux'
import { takeEvery, takeLatest, delay } from 'redux-saga'
import { take, put, call, fork, cancel, cancelled } from 'redux-saga/effects'
import createSagaMiddleware from 'redux-saga'
import createLogger from 'redux-logger';
import rootReducer from './com/jessewarden/ff6redux/reducers/';
import { timer } from './com/jessewarden/ff6redux/sagas/timer';
import { Warrior, Goblin, genericEntity } from './com/jessewarden/ff6redux/enums/entities';
import { 
	ADD_ENTITY, 
	START_TIMER, 
	STOP_TIMER, 
	ADD_COMPONENT,
	REMOVE_COMPONENT, 
	REMOVE_ENTITY} 
	from './com/jessewarden/ff6redux/core/actions';

import {Character, makePlayer, makeMonster} from './com/jessewarden/ff6redux/battle/Character';
import WarriorSprite from './com/jessewarden/ff6redux/sprites/warrior/WarriorSprite';
import GoblinSprite from './com/jessewarden/ff6redux/sprites/goblin/GoblinSprite';

import { StageComponent } from './com/jessewarden/ff6redux/components/StageComponent';

import { SpriteSystem } from './com/jessewarden/ff6redux/systems/SpriteSystem';

import {watchPlayerAttack} from './com/jessewarden/ff6redux/sagas/playerAttack';
import { watchPlayerTurn } from './com/jessewarden/ff6redux/sagas/playerWhoseTurnItIs';


var sagaMiddleware;
var store;
var unsubscribe;

export function delayed(mil)
{
	return new Promise((success)=>
	{
		setTimeout(()=>
		{
			success();
		}, mil);
	});
}

export function setupRedux()
{
	const logger = createLogger();
	sagaMiddleware = createSagaMiddleware();
	store = createStore(
			rootReducer,
			applyMiddleware(sagaMiddleware)
	);

	sagaMiddleware.run(rootSaga);

	unsubscribe = store.subscribe(()=>
	{
		var state = store.getState()
		
	});

	addStageComponent(genericEntity, store);

	addWarrior(Warrior, store);
	addWarrior(Warrior, store);
	addWarrior(Warrior, store);

	addGoblin(Goblin, store);
	addGoblin(Goblin, store);
	addGoblin(Goblin, store);

	var spriteSystem = SpriteSystem(store);

	startTimer(store);

	// delayed(2 * 1000)
	// .then(()=>
	// {
	// 	store.dispatch({type: REMOVE_ENTITY, entity: store.getState().entities[0]});
	// });

	// delayed(2 * 1000)
	// .then(()=>
	// {
	// 	removeComponent(_.find(store.getState().components, c => c.type === 'StageComponent'), 
	// 		store, 
	// 		REMOVE_COMPONENT);
	// });

	// delayed(4 * 1000)
	// .then(()=>
	// {
	// 	addStage(genericEntity, store);
	// });

	
}

export function addEntity(entityCreator, store, action)
{
	var entity = entityCreator();
	return store.dispatch({type: action, entity: entity});
}

export function addComponent(componentCreator, store, action)
{
	var component = componentCreator();
	return store.dispatch({type: action, component});
}

export function removeComponent(component, store, action)
{
	return store.dispatch({type: action, component});
}

export function startTimer(store)
{
	return store.dispatch( { type: START_TIMER } );
}

export function stopTimer(store)
{
	return store.dispatch( { type: STOP_TIMER } );
}

export function addCharacterComponent(character, store)
{
	return addComponent(
		()=>{return character;},
		store,
		ADD_COMPONENT
	);
}

export function addWarriorSprite(warriorSprite, store)
{
	return addComponent(
		()=>{return warriorSprite;},
		store,
		ADD_COMPONENT
	);
}

export function addWarrior(entityCreator, store)
{
	var addEntityAction = addEntity(entityCreator, store, ADD_ENTITY);
	var character = makePlayer(addEntityAction.entity);
	var warriorSprite = new WarriorSprite(addEntityAction.entity);
	addCharacterComponent(character, store);
	addWarriorSprite(warriorSprite, store);
}

export function addGoblin(entityCreator, store)
{
	var addEntityAction = addEntity(entityCreator, store, ADD_ENTITY)
	var character = makeMonster(addEntityAction.entity);
	var goblinSprite = new GoblinSprite(addEntityAction.entity);
	addCharacterComponent(character, store);
	addGoblinSprite(goblinSprite, store);
}

export function addGoblinSprite(goblinSprite, store)
{
	return addComponent(
		()=>{return goblinSprite;},
		store,
		ADD_COMPONENT
	);
}

export function addStageComponent(entityCreator, store)
{
	var addEntityAction = addEntity(entityCreator, store, ADD_ENTITY);
	var stageComponent = StageComponent(addEntityAction.entity);
	return addComponent(
		()=>{return stageComponent;},
		store,
		ADD_COMPONENT
	);
}

function *rootSaga()
{
	yield [
		timer(),
		watchPlayerTurn(),
		watchPlayerAttack()
	];
}

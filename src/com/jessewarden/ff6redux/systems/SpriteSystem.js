import _ from 'lodash';
import PIXI from 'pixi.js';
import {REMOVE_COMPONENT} from '../core/actions';

let _unsubscribe;
let renderer;
let battleTimerBars;
let monsterSprites;
let playerSprites;
let textDrops;
let battleMenus;
var startSpriteX = 400;
var startSpriteY = 20;
var startMonsterSpriteX = 20;
var startMonsterSpriteY = 20;
let _animating = false;

export function SpriteSystem(store)
{
	_unsubscribe = store.subscribe(()=>
	{
		mapStateToThis(store);
	});

	mapStateToThis(store);
}

export function unsubscribe()
{
	_unsubscribe();
}

function mapStateToThis(store)
{
	// NOTE: Treating the StageComponnt as a Singleton. Not sure the ramifications of this.
	var state = store.getState();
	const stageComponent = _.find(state.components, c => c.type === 'StageComponent');
	const haveAStage = _.isNil(stageComponent) === false;
	if(haveAStage && _animating === false)
	{
		setup(stageComponent.stage);
		addRemoveSprites(store,
			state.components, 
			state.entities, 
			monsterSprites, 
			playerSprites, 
			startSpriteX, 
			startSpriteY,
			startMonsterSpriteX,
			startMonsterSpriteY
		);
	}
	else if(haveAStage)
	{
		addRemoveSprites(store,
			state.components, 
			state.entities, 
			monsterSprites, 
			playerSprites, 
			startSpriteX, 
			startSpriteY,
			startMonsterSpriteX,
			startMonsterSpriteY
		);
	}
	else if(haveAStage === false && _animating)
	{
		tearDown();
	}
}

function setup(stage)
{
	renderer = PIXI.autoDetectRenderer(800, 600, { antialias: true });
	document.body.appendChild(renderer.view);
	battleTimerBars = new PIXI.Container();
	stage.addChild(battleTimerBars);
	monsterSprites = new PIXI.Container();
	stage.addChild(monsterSprites);
	playerSprites = new PIXI.Container();
	stage.addChild(playerSprites);
	textDrops = new PIXI.Container();
	stage.addChild(textDrops);
	battleMenus = new PIXI.Container();
	stage.addChild(battleMenus);

	startSpriteX = 400;
	startSpriteY = 20;
	startMonsterSpriteX = 20;
	startMonsterSpriteY = 20;

	_animating = true;

	animate(renderer, stage);
}

function tearDown()
{
	_animating = false;

	removeAllChildren(battleMenus);
	removeFromParent(battleMenus);

	removeAllChildren(textDrops);
	removeFromParent(textDrops);

	removeAllChildren(playerSprites);
	removeFromParent(playerSprites);

	removeAllChildren(monsterSprites);
	removeFromParent(monsterSprites);

	removeAllChildren(battleTimerBars);
	removeFromParent(battleTimerBars);

	battleMenus = undefined;
	textDrops = undefined;
	playerSprites = undefined;
	monsterSprites = undefined;
	battleTimerBars = undefined;

	document.body.removeChild(renderer.view);
	renderer = undefined;
}

function removeAllChildren(container)
{
	container.removeChildren();
}

function removeFromParent(container)
{
	container.parent.removeChild(container);	
}

function animate(renderer, stage)
{
	if(_animating === false)
	{
		return;
	}
	requestAnimationFrame(()=>
	{
		animate(renderer, stage);
	});
	renderer.render(stage);
}

export function addRemoveSprites(store,
	components, 
	entities, 
	monsterSprites,
	playerSprites,
	startSpriteX, 
	startSpriteY,
	startMonsterSpriteX,
	startMonsterSpriteY)
{
	var spriteComponentsToRemove = getSpriteComponentsFromComponents(
		componentsToRemove(
			components, 
			entities
		)
	);
	// spriteComponentsToRemove = _.filter(spriteComponentsToRemove, c => c.sprite && c.sprite.parent !== null);
	if(spriteComponentsToRemove.length > 0)
	{	
		removePlayerSprites(spriteComponentsToRemove);
		removeMonsterSprites(spriteComponentsToRemove);
		startSpriteY -= (startSpriteY * spriteComponentsToRemove.length);
		_.forEach(spriteComponentsToRemove, (component)=>
		{
			store.dispatch({type: REMOVE_COMPONENT, component});
		});
	}

	var spriteComponentsToAdd = _.filter(components, (comp)=>
	{
		return comp.sprite &&
		 comp.sprite.parent === null &&
		 _.includes(spriteComponentsToRemove, comp) === false;
	});
	if(spriteComponentsToAdd.length > 0)
	{
		console.log("spriteComponentsToAdd:", spriteComponentsToAdd);
		showAndPositionPlayerComponents(spriteComponentsToAdd,
			playerSprites,
			startSpriteX,
			startSpriteY,
			60);

		// TODO: monsters need different layout algo
		showAndPositionMonsterComponents(spriteComponentsToAdd,
			monsterSprites,
			startMonsterSpriteX,
			startMonsterSpriteY,
			100);
		startSpriteY += (startSpriteY * spriteComponentsToAdd.length);
	}
	
	updatePercentageComponents(components, entities);
}

export function componentsToRemove(components, entities)
{
	return _.differenceWith(
		components,
		entities,
		(comp, entity) => comp.entity === entity);
}

export function entitiesToCreateComponentsFor(components, entities)
{
	return _.differenceWith(
		entities,
		components,
		(entity, comp)=> entity === comp.entity);
}

export function getSpriteComponentsFromComponents(components)
{
	return _.filter(components, c => c.type && c.type === 'ComponentSprite');
}

export function removeComponentsSpritesFromParent(components)
{
	// console.log("components:", components);
	return _.forEach(components, (component)=>
	{
		component.sprite.parent.removeChild(component.sprite);
		// console.log("component.sprite.parent:", component.sprite.parent);
	});
}

export function filterPlayerComponents(components)
{
	return _.filter(components, comp => comp.player);
}

export function filterMonsterComponents(components)
{
	return _.filter(components, comp => !comp.player);
}

export function positionComponents(components, startSpriteX, startSpriteY, yIncrement)
{
	return _.forEach(components, (comp)=>
	{
		comp.sprite.x = startSpriteX;
		comp.sprite.y = startSpriteY;
		startSpriteY += yIncrement;
	});
}

export function addComponentSpritesToParent(components, parent)
{
	return _.forEach(components, (comp)=>
	{
		parent.addChild(comp.sprite);
	});
}

export function showAndPositionPlayerComponents(components, playerSprites, startSpriteX, startSpriteY, yIncrement)
{
	return addComponentSpritesToParent(
		positionComponents(
			filterPlayerComponents(components), startSpriteX, startSpriteY, yIncrement
		), playerSprites);
}

export function showAndPositionMonsterComponents(components, monsterSprites, startSpriteX, startSpriteY, yIncrement)
{
	return addComponentSpritesToParent(
		positionComponents(
			filterMonsterComponents(components), startSpriteX, startSpriteY, yIncrement
		), monsterSprites);
}

export function removePlayerSprites(components, playerSprites)
{
	return removeComponentsSpritesFromParent(filterPlayerComponents(components));
}

export function removeMonsterSprites(components, monsterSprites)
{
	return removeComponentsSpritesFromParent(filterMonsterComponents(components));
}

export function updatePercentageComponents(components, entities)
{
	var characters = _.filter(components, c => c.type === 'Character');
	_.forEach(characters, (chr)=>
	{
		var spriteComp = _.find(components, c => c.type === 'ComponentSprite' && c.entity === chr.entity);
		if(spriteComp)
		{
			spriteComp.setPercentage(chr.percentage);
		}
	});
}
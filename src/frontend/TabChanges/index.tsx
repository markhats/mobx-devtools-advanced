import React from "react";
import * as Aphrodite from "aphrodite";
import {Text, CheckBox, Spinner} from "react-vcomponents";
import {ModifyString, CE} from "js-vextensions";
import {observer} from "mobx-react";
import SecondaryPanel from "../SecondaryPanel";
import ButtonRecord from "../SecondaryPanel/ButtonRecord";
import ButtonClear from "../SecondaryPanel/ButtonClear";
import {Log} from "./Log";
import {InjectStores} from "../../utils/InjectStores";
import {InputSearch} from "../SecondaryPanel/InputSearch";
import {Change_types, Change, ChangeType} from "../../utils/changesProcessor";
import {ActionsStore} from "../stores/ActionsStore";
import {store} from "../Store";

const {css, StyleSheet} = Aphrodite;

@InjectStores({
	subscribe: {
		actionsLoggerStore: ["logEnabled", "log"],
	},
	injectProps: ({actionsLoggerStore}: {actionsLoggerStore: ActionsStore})=>({
		store: actionsLoggerStore,
		searchText: actionsLoggerStore.searchText,
		changeTypesToShow: actionsLoggerStore.changeTypesToShow,
		logEnabled: actionsLoggerStore.logEnabled,
		logItemsIds: actionsLoggerStore.logItemsIds,
		logItemsById: actionsLoggerStore.logItemsById,
		clearLog() {
			actionsLoggerStore.clearLog();
		},
		toggleLogging() {
			actionsLoggerStore.toggleLogging();
		},
		setSearchText(e) {
			actionsLoggerStore.setSearchText(e.target.value);
		},
		setChangeTypesToShow(types: ChangeType[]) {
			actionsLoggerStore.setChangeTypesToShow(types);
		},
	}),
})
@observer
export class TabChanges extends React.PureComponent<
	{} & Partial<{
		store: ActionsStore,
		searchText: string, changeTypesToShow: ChangeType[], logEnabled: boolean, clearLog: ()=>void, toggleLogging: ()=>void, setSearchText: (event)=>void, setChangeTypesToShow: (types: ChangeType[])=>void,
		logItemsIds: number[], logItemsById: {[key: number]: Change},
	}>
> {
	GetItemsOfType(type: ChangeType) {
		const {logItemsIds, logItemsById} = this.props.store;
		const logItems = logItemsIds.map(changeID=>logItemsById[changeID]);
		return logItems.filter(change=>change.type == type);
	}
	render() {
		const {logEnabled, toggleLogging, clearLog, searchText, changeTypesToShow, setSearchText, setChangeTypesToShow, logItemsIds} = this.props;
		return (
			<div className={css(styles.panel)}>
				<SecondaryPanel>
					<ButtonRecord active={logEnabled} onClick={toggleLogging} showTipStartRecoding={!logEnabled && logItemsIds.length === 0}/>
					<ButtonClear onClick={clearLog} />
					<InputSearch searchText={searchText} changeSearch={setSearchText}/>
					<Text ml={5} title="When a change occurs, record/serialize the first X layers of its data-tree. (for stable inspection; only applies after top-level changes)">Auto-serialize depth: </Text>
					<Spinner min={0} max={500} style={{width: 40}} value={store.autoSerializeDepth} onChange={val=>store.autoSerializeDepth = val}/>
					<CheckBox ml={5} text="Infer paths" title="Attempts to infer the paths to MobX objects/values. (shown in change details; only works in some cases)"
						checked={store.inferPaths} onChange={val=>store.inferPaths = val}/>
					<Text ml={5}>Types:</Text>
					{Change_types.map(type=>{
						const typeStr = ModifyString(type, {firstLower_to_upper: true, hyphenLower_to_hyphenUpper: true});
						const text = `${typeStr} (${this.GetItemsOfType(type).length})`;
						return (
							<CheckBox key={type} ml={3} text={text} checked={changeTypesToShow.includes(type)} onChange={checked=>{
								const newTypes = changeTypesToShow.slice();
								if (!checked) CE(newTypes).Remove(type);
								else newTypes.push(type);
								setChangeTypesToShow(newTypes);
							}}/>
						);
					})}
				</SecondaryPanel>
				<Log />
			</div>
		);
	}
}

const styles = StyleSheet.create({
	panel: {
		flex: "1 1 auto",
		minHeight: 0, // prevents {flex: 1} from setting {[minWidth/minHeight]: "auto"}
		display: "flex",
		flexDirection: "column",
	},
	panelBody: {
		display: "flex",
		flex: "1 1 auto",
	},
	leftPane: {
		width: "100%",
		flex: "1 1 auto",
	},
	rightPane: {
		width: "100%",
		flex: "1 1 auto",
		padding: 10,
	},
});
import { debuglog } from 'util';
import { IExecuteFunctions } from 'n8n-core';
import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import deepDiff from 'deep-diff-pizza';
import set from 'lodash.set';

const OPERATIONS = ['ADDED', 'REMOVED', 'UPDATED', 'UNCHANGED'];

function groupChange(changeset: any, change: any) {
	if (!changeset[change.operation]) {
		changeset[change.operation] = {};
	}
	const changeValue = change.operation === 'REMOVED' ? change.was : change.is;
	set(changeset[change.operation], change.path, changeValue);
	return changeset;
}

export class Changes implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Changes',
		name: 'changes',
		group: ['changes', 'diff'],
		version: 1,
		description: 'Detect differences between two inputs',
		defaults: {
			name: 'Changes',
			color: '#ed230d',
		},
		icon: 'file:changes.svg',
		inputs: ['main', 'main'],
		inputNames: ['Input 1', 'Input 2'],
		outputs: OPERATIONS.map(() => 'main'),
		outputNames: OPERATIONS.map(o => o.charAt(0).toUpperCase() + o.slice(1).toLowerCase()),
		properties: [],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const input1 = this.getInputData(0) || [];
		const input2 = this.getInputData(1) || [];
		const returnData: INodeExecutionData[][] = [
			[],
			[],
			[],
			[],
		];
		
		for (let itemIndex = 0; itemIndex < input1.length; itemIndex++) {
			const item1 = input1[itemIndex];
			const item2 = itemIndex < input2.length ? input2[itemIndex] : {};
			const diff =  deepDiff(item1, item2).reduce(groupChange, {});
			const changeSet: Array<[string, any]> = Object.entries(diff);

			for (const [operation, changes] of changeSet) {
				const outputIndex = OPERATIONS.indexOf(operation);
				if (outputIndex >= 0) {
					returnData[outputIndex].push(changes);
				}
			}
		}
		return returnData;
	}
}

var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * Broadcast Model
 * ==========
 */

var Channel = new keystone.List('Channel', {
	map: { name: 'name' },
	autokey: { path: 'slug', from: 'name', unique: true },
	track: true,
	hidden: true
});

Channel.add({
	name: { type: Types.Text, required: true, initial: true, unique: true },
	source: { type: Types.Relationship, ref: 'Source', many: true},
	sourceOrder: { type: Types.TextArray, collapse: true },
	stream: { type: Types.Relationship, ref: 'Stream', many: true },
	streaming: { type: Types.Boolean, default: false, initial: true },
	loop: { type: Types.Boolean, default: false, initial: true },
	filler: { type: Types.Relationship, ref: 'Source', many: true },
	programs: { type: Types.Relationship, ref: 'Program', many: true },
	expose: { type: Types.Boolean, default: false, initial: true },
	autoStart: { type: Types.Boolean, default: false, initial: false },
	hls: {
		input: Types.TextArray ,
		output: Types.TextArray ,
		format: Types.Text,
		only: { type: Boolean, default: false },
		onlyOptions: Types.TextArray,
		passthrough: { type: Boolean, default: false },
	},
});


Channel.defaultColumns = 'name, stream|20%, streaming|20%, source|20%';
Channel.register();

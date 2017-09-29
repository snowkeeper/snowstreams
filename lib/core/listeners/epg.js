var	_ = require('lodash');
var	debug = require('debug')('woobi:lib:core:listeners:serverwmc');
var async = require("async");
var _ = require('lodash');

module.exports = function(Broadcast) {
	
	return {
		
		getTVChannels( callback ) {
							
			debug('getTVChannels');
						
			return Broadcast.libs.livetv.getTVChannels()
			.then( ( tv ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function() {};
				}
				debug( 'got getTVChannels' );
				callback( null, tv );
				return {
					success: true,
					channels: tv,
				};
			});
			
		}, // end getChannels
		
		getChannelGroups( callback ) {
							
			debug('getChannelGroups');
						
			return Broadcast.libs.livetv.getChannelGroups()
			.then( ( groups ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function() {};
				}
				debug('got getChannelGroups');
				callback(null, groups);
				return {
					success: true,
					groups: groups,
				};
			});
			
		}, // end getChannelGroups
		
		getGuideData( id, start, end, callback ) {
							
			debug('getGuideData');
				
			return Broadcast.libs.livetv.getGuideData( id, start, end )
			.then( ( epg ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from getGuideData' );
				callback( null, epg );
				return {
					success: true,
					entries: epg,
				};
			});
			
		}, // end getChannels
		
		getSeriesTimers( callback ) {
							
			debug('getSeriesTimers');
				
			return Broadcast.libs.livetv.getSeriesTimers( callback )
			.then( ( series ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from getSeriesTimers' );
				callback( null, series );
				return {
					success: true,
					series: series,
				};
			});
			
		}, // end getChannels
		
		getTimers( callback ) {
							
			debug('getTimers');
				
			return Broadcast.libs.livetv.getTimers( callback )
			.then( ( timers ) => {
				
				if ( !_.isFunction( callback ) ) {
					callback = function( ) {};
				}
				debug( 'got data from getTimers' );
				callback( null, timers );
				return {
					success: true,
					timers: timers,
				};
			});
			
		}, // end getChannels
		
		
	}
}
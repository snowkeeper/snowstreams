import React from 'react';
import Debug from 'debug';
import Gab from '../../common/gab';
import { Card, CardActions, CardHeader , FontIcon, IconButton, RaisedButton} from 'material-ui';
import { Styles } from '../../common/styles';
import { ColorMe } from '../../common/utils';
import { find as Find } from 'lodash';
import VideoController from '../../common/components/videoController';
import Video from '../../common/components/video5';
import { StickyContainer, Sticky } from 'react-sticky';

let debug = Debug('woobi:app:pages:tvshows:recent');

export default class RecentEpisodes extends React.Component {
	constructor(props) {
		super(props)
		
		let shows = [];
		let channels = [];
		if(props.initialData) {
			debug('got props initialData');
			shows = props.initialData.recentshows.recentshows || [];
			channels = props.initialData.recentshows.channels || [];
			this._skipMount = true;
		}
		let channel = false;
		let chanel = channels.find((c, i) => { 
			if (c.channel ==  'recentEpisodes' ) {
				return true;	
			}
			return false
		});
		let play = false;
		if (chanel) {
			play = chanel.link;
		}
		this.displayName = 'RecentEpisodes';
		this.state = {
			loading: true,
			shows,
			channels,
			channel: chanel,
			play,
			creating: false,
			tvImages: props.tvImages,
			hideVideo: false
		};
		
		this.buttonStyle = { margin: '0 auto', width: false, height: false, padding: 0};
		
		this._update = true;
		
		this.gotShows = this.gotShows.bind(this);
		this.gotChannel = this.gotChannel.bind(this);
	}
	
	componentDidMount() {
		debug('######### componentDidMount  ##  RecentEpisodes',  this.props, this.state);
		if(this.state.shows.length === 0) {
			this.getShows();
		}
		this.props.Sockets.io.on('recentshows', this.gotShows);
	}
	
	componentWillUnmount() {
		this.props.Sockets.io.removeListener('recentshows', this.gotShows);
		if(this.state.channel) {
			this.props.Sockets.io.on(this.state.channel.channel, this.gotChannel);
		}
	}
	
	componentWillReceiveProps(props) {
		debug('## componentWillReceiveProps  ## RecentEpisodes got props', props);
		if (props.tvImages !== this.state.tvImages) {
			this._update = true;
			this.setState({
				tvImages: props.tvImages
			});
		} else {
			this.getShows();
		}
	}	
	
	shouldComponentUpdate() {
		if(this._update) {
			this._update = false;
			return true;
		}
		return false;
	}
	
	getShows() {
		this.props.Request({
			action: 'recentshows'
		})
		.then(this.gotShows)
		.catch(error => {
			debug('ERROR from RecentEpisodes', error)
		});
	}
	
	gotShows(data) {
		this._update = true;
		let channel = false;
		let chanel = data.channels.find((c, i) => { 
			if (c.channel ==  'recentEpisodes') {
				return true;	
			}
			return false
		});
		debug('got channels', data.channels, chanel);
		let play = false;
		
		if (chanel) {
			play = chanel.link;
			this.props.Sockets.io.removeListener(chanel.channel, this.gotChannel);
			this.props.Sockets.io.on(chanel.channel, this.gotChannel);
		}
		this.setState({
			shows: data.recentshows,
			channels: data.channels,
			play,
			channel: chanel,
			creating: false
		});
	}
	
	gotChannel(data) {
		debug('Got Channel update', data);
		if (typeof data === 'object') {
			this._update = true;
			this.setState({
				channel: data.channel,
			});
		}
	}
	
	createChannel() {
		debug('Create channel');
		let autostart = 'no';
		let keep = 'no';
		let start = 'yes';
		let files = this.state.shows.map(s => {
			return { name: s.name, file: s.file, progress: true, metadata: s }
		});
		let name = ('recentEpisodes');
		let config = {
			name,
			files,
			loop: true,
			noTransition: true,
			hls: {
				hls: true,
				name,
				passthrough: false,
			}
		}
		Gab.rawRequest(snowUI.api.uri + '/new/channel/?config=' + encodeURIComponent(JSON.stringify(config)) + '&keep=' + keep + '&autostart=' + autostart + '&start=' + start, false)
		.then(data => {			
			if(data.success) {
				Gab.emit('snackbar', {
					style: 'success',
					html: "Channel will start playing in about 20 seconds",
					open: true,
					autoHideDuration: 20000,
					onRequestClose: () => {}
				});
				debug('New Channel', data);
				if (data.link) {
					debug('Play Video', data.link);
					this._update = true;
					this.setState({ creating: true });
					this.props.Sockets.io.once(name + ':hls', (state) => {
						debug('hls ready', state);
						this.getShows();
					});
				}
			} else {
				Gab.emit('snackbar', {
					style: 'danger',
					html: data.error,
					open: true,
					onRequestClose: () => {}
				});
			}
			
		})
		.catch(e => {
			Gab.emit('snackbar', {
				style: 'danger',
				html: e,
				open: true,
				onRequestClose: () => {}
			});
			Gab.emit('dialog2 open', { open: false });
		});
	}
	
	createChannelButton() {
		return (<RaisedButton 
			style={{ margin: '5 10 0 0',	borderRadius: 0 }} 
			key="create"  
			secondary={false} 
			buttonStyle={{ borderRadius: 0, color: 'white' }}  
			overlayStyle={{ borderRadius: 0 }}  
			label="Create Channel" 
			onClick={(e) => {
				e.preventDefault();
				Gab.emit('dialog2', {
					title: "Recent Episodes",
					answer:(yesno) => { 
						Gab.emit('dialog2', { open: false });
					},
					open: true,
					noText: 'Cancel',
					component: (<div>
						<p>This will create a HLS stream with encoding enabled, so Ffmpeg may use some CPU.</p>
						
						<RaisedButton style={{ margin: '10 10 0 0',	borderRadius: 0 }} key="play"  secondary={false} buttonStyle={{ borderRadius: 0, color: 'white' }}  overlayStyle={{ borderRadius: 0 }}  label="Create Channel"  onClick={() => {
							Gab.emit('dialog2', { open: false });
							Gab.emit('snackbar', {
								style: 'warning',
								html: "Creating channel.",
								open: true,
								onRequestClose: () => {}
							});
							this.createChannel();
							
						}} />
						
						<RaisedButton style={{ margin: '10 10 0 0',	borderRadius: 0 }} key="clodes"  primary={true}  label="Cancel" onClick={(e) => {
							e.preventDefault();						
							Gab.emit('dialog2', { open: false });
						}} />
						<div className="clearfix" />
						
					</div>)
				})
			}} 
		/>);
	}
	
	killChannelButton() {
		return (
			<VideoController 
				channel={this.state.channel} 
				style={{
					display: 'inline-block',
				}}
				kill={true}
				onKill={() => {
					this._update = true;
					this.setState({
						play: false,
						channel: false
					});
				}}
				destroy={true}
				onPlay={() => {
					debug('onPlay');
					this._update = true;
					this.setState({ hideVideo: false });
				}}
				//onPause={() => { document.body.style.background = bg; }}
				onStop={() => {
					debug('onStop');
					this._update = true;
					this.setState({ hideVideo: true });
				}}
			/>
		);
	}
	
	onStickyStateChange(isSticky) {
      debug(`Am I sticky?: ${ isSticky ? 'Yep!' : 'Nope!'}`);
    }
	
	video() {
		if(this.state.play) {
			let art = "url('" + '/images/fanart.gif' + "')no-repeat center 15%";
			if(this.state.channel.playing.metadata.art) {
				var asset = Find(this.state.channel.playing.metadata.art, { type: 'fanart' });
				if(asset) {
					art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')no-repeat center 15%";
				} 
			}
			let source = this.state.play;
			let bg;
			if (!snowUI.serverRendered) {
				bg = document.body.style.background;
			}
			return (<Sticky onStickyStateChange={this.onStickyStateChange.bind(this)} style={{  zIndex: 1005, background: art, backgroundSize: 'cover',  width: '100%', position: 'relative' }} >
				{this.nowPlaying()} 
				<div style={{ display: this.state.hideVideo ? 'none' : 'block' }} >
					<Video  
						style={{ margin: 'auto'  }} 
						chromeless={false} 
						source={source} 
						mimeType="video/mp4"  
						width={384} 
						height={216} 
						mute={false} 
						controls={false} 
						autoPlay={false}
						//onPlay={() => { document.body.style.background = '#000'; }}
						//onPause={() => { document.body.style.background = bg; }}
						//onStop={() => { document.body.style.background = bg; }}
					 />
				</div>
			</Sticky>);
		}
		return <span />;
	}
	
	fanartButton() {
		return (<IconButton title="Fanart View" style={{ zIndex: 1101, margin: '0 auto', width: false, height: false, padding: 0, position: 'fixed', top: 15, right: 10 }} key="fanart"  secondary={false} onClick={(e) => { this.props.appState({ tvImages: true }) }} >
			<FontIcon style={{ }} className="material-icons" color={this.state.tvImages ? Styles.Colors.lightGreenA700 : Styles.Colors.blue600}  >view_stream</FontIcon>
		</IconButton>);
	}
	
	posterButton() {
		return (<IconButton title="Poster View" style={{ zIndex: 1101, margin: '0 auto', width: false, height: false, padding: 0, position: 'fixed', top: 15, right: 40 }} key="view"  secondary={false} onClick={(e) => { this.props.appState({ tvImages: false }) }} >
			<FontIcon style={{ }} className="material-icons" color={!this.state.tvImages ? Styles.Colors.lightGreenA700 : Styles.Colors.blue600}  >view_column</FontIcon>
		</IconButton>);
	}
	
	nowPlaying() {
		if (!this.state.channel) {
			return <span />
		}
		return (<div style={{ width: '100%', height: 50, paddingTop: 7, fontWeight: 700, textAlign: 'center', color: ColorMe(10,this.props.theme.palette.accent1Color).color, background: ColorMe(30,this.props.theme.palette.accent1Color).bgcolor, opacity: '.95' }} >
			{this.killChannelButton()}
		</div>);
	}
	
	render() { 
		debug('## render  ##  RecentEpisodes Home render', this.props, this.state);
		let ret = <span >Loading Recent Episodes</span>;
		if (this.state.shows.length > -1) {
			ret =  this.state.shows.map((c, i) => {
				let art = 'transparent';
				let banner = 'initial';
				let bgSize = 'cover';
				if(c.art) {
					var asset = Find(c.art, { type: 'fanart' });
					if(asset && this.state.tvImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset.url)) + "')center top / 100% no-repeat fixed";
					var asset2 = Find(c.art, { type: 'poster' });
					if(asset2 && !this.state.tvImages) art = "url('" + encodeURI(snowUI.artStringReplace(asset2.url)) + "')  no-repeat right top / 100% auto";
				}

				let descBug = { height: 80, overflow: 'hidden', position: 'absolute', bottom: '0%', left: '0%', width: '100%', background: '#fff', opacity: '.80', color: '#121212', paddingTop: 10, paddingLeft: 10, paddingRight: 10, fontWeight: 'bold', fontSize: 14 }

				let epBug = { height: 24, padding: 0, overflow: 'hidden', position: 'absolute', bottom: 85, right: 10, width: '100', fontWeight: 'bold'}

				let title = { height: 65, padding: '5 0 0 12' }

				if (this.state.tvImages) { //posters
					descBug = { height: 45, overflow: 'hidden', position: 'absolute', bottom: '0%', left: '0%', width: '100%', background: '#fff', opacity: '.80', color: '#121212', paddingTop: 5, paddingLeft: 15, paddingRight: 5, fontWeight: 'bold', fontSize: 14 }
					
					epBug = { height: 24, padding: 0, overflow: 'hidden', position: 'absolute', top: 60, left: 10, width: '100', fontWeight: 'bold'}

					title = { height: 50, padding: '5 0 0 12' }

				}

				return (<div  className={this.state.tvImages ? "col-xs-12" : "col-xs-6 col-sm-3 col-md-2"} style={{ padding: 0 }} >
					<div style={{ margin: 0, cursor: 'pointer', height: !this.state.tvImages ? 350 : 275, background: art, position: 'relative'}}  onClick={(e) => {
						e.preventDefault();
						this.props.goTo({
							page: c.name,
							path: '/library/tv/episode/' + c.idShow + '/' + c.episodeID
						});
					}} > 
						<Card zDepth={1}  style={{ background: '#a5bf48', opacity: this.state.tvImages ? '.97' : '.97' }}>
							<CardHeader
								title={<div style={{ color: '#2b2b2b', fontSize: 14 }}> { c.show } </div>}
								style={title}
								subtitle={<div style={{ color: '#2b2b2b', fontSize: 14 }}> { c.title }</div>}
							/>
							
						</Card>
					
						<div className={"descBug"} style={descBug}>{ c.description }</div>
						<div className={"epBug"} style={epBug}>
							<div className={"s"} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, background: '#2b2b2b', color: '#c6ff00', float: 'left', width: '20px'}}>s</div>
							<div className={"sn"} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, background: '#c6ff00', color: '#2b2b2b', float: 'left', width: '30px'}}>{ c.season }</div>
							<div className={"e"} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, background: '#2b2b2b', color: '#c6ff00', float: 'left', width: '20px'}}>e</div>
							<div className={"en"} style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 16, background: '#c6ff00', color: '#2b2b2b', float: 'left', width: '30px'}}>{ c.episode }</div>
						</div>
					</div>
				</div>)
				
			});
		}
		//return <div>{ret}</div>;
		let sub = (<div>
			{this.state.channel ? (<span>On Air: {this.state.channel.playing.name}</span>)  : !this.state.creating ? this.createChannelButton() : <span />}
		</div>);
		let tit = (<div>
			{this.state.channel ? (<span>Up Next: {this.state.channel.sources[1].name}</span>)  : <span />}
		</div>);
		return (<StickyContainer>
			<div style={{ padding: '0px 0px' }}>
				<Card   zDepth={1}>
					<CardHeader
						style={{  overflow: 'hidden', position: 'relative' }}
						title={sub}
						subtitle={tit}
						avatar={<FontIcon style={{fontSize:'42px'}} className="material-icons" color={ColorMe(5, this.props.theme.baseTheme.palette.accent1Color).color}  >live_tv</FontIcon>}
					/>
				</Card>
				{this.fanartButton()}
				{this.posterButton()}
				
				{this.video()}
			</div>
			{ret}
			<div className="clearfix" />
		</StickyContainer>);
	}
	
}

RecentEpisodes.getInitialData = function(params) {
	
	let ret = {
		recentshows: {
			action: 'recentshows'
		}
	}
	console.log('### RUN getInitialData RecentShows ###',  params);
	return ret
}

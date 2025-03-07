/**
 * @license LGPLv3, http://opensource.org/licenses/LGPL-3.0
 * @copyright Aimeos (aimeos.org), 2017-2018
 */



$(function() {
	Aimeos.Media.init();
});



Aimeos.Media = {

	init() {
		const node = document.querySelector('#item-media-group');

		if(node) {
			Aimeos.apps['media'] = Aimeos.app({
				props: {
					data: {type: String, default: '[]'},
					domain: {type: String, default: ''},
					siteid: {type: String, default: ''},
				},
				data() {
					return {
						items: [],
					}
				},
				beforeMount() {
					this.Aimeos = Aimeos;
					this.items = JSON.parse(this.data);

					if(this.items[0]) {
						this.items[0]['_show'] = true;
					}
				},
				mixins: [this.mixins]
			}, {...node.dataset || {}}).mount(node);
		}
	},

	mixins: {
		methods: {
			active(idx) {
				return this.items[idx] && this.items[idx]['media.status'] > 0;
			},


			add(data = {}) {
				const entry = {};

				entry[this.domain + '.lists.id'] = null;
				entry[this.domain + '.lists.type'] = 'default';
				entry[this.domain + '.lists.siteid'] = this.siteid;
				entry[this.domain + '.lists.datestart'] = null;
				entry[this.domain + '.lists.dateend'] = null;

				entry['media.id'] = null;
				entry['media.label'] = null;
				entry['media.type'] = 'default';
				entry['media.siteid'] = this.siteid;
				entry['media.languageid'] = null;
				entry['media.mimetype'] = null;
				entry['media.preview'] = null;
				entry['media.url'] = null;
				entry['media.status'] = 1;

				entry['property'] = [];
				entry['config'] = [];
				entry['_show'] = true;
				entry['_nosort'] = true;

				this.items.push(Object.assign(entry, data));
			},


			can(action, idx) {
				if(action === 'move' && this.items[idx]['_nosort']) return false
				return Aimeos.can(action, this.items[idx][this.domain + '.lists.siteid'] || null, this.siteid)
			},


			create(ev) {
				const self = this;
				const len = ev.target.files.length;

				for(let i = 0; i < len; i++) {
					this.add();
				}

				this.$nextTick(function() {
					for(let i = 0; i < len; i++) {
						const dt = new DataTransfer();
						const idx = self.items.length - len + i;
						const item = self.items[idx];

						dt.items.add(ev.target.files[i]);
						item.file = dt.files;
						self.files(item, dt.files);
					}
				});
			},


			files(item, files) {

				if(!files.length) {
					return;
				}

				let cnt = sum = 0;

				for(let i=0; i<files.length; i++) {
					item['media.mimetype'] = files[i].type;

					if(files[i].type.startsWith('image/')) {
						item['media.preview'] = URL.createObjectURL(files[i]);
					} else if(files[i].type.startsWith('video/')) {
						const video = document.createElement('video');

						video.addEventListener('canplay', function(e) {
							video.currentTime = video.duration / 2;
							e.target.removeEventListener(e.type, arguments.callee);
						});

						video.addEventListener('seeked', function() {
							const canvas = document.createElement('canvas');
							const context = canvas.getContext('2d');

							canvas.width = video.videoWidth;
							canvas.height = video.videoHeight;

							context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
							item['media.preview'] = canvas.toDataURL();

							canvas.toBlob(function(blob) {
								const container = new DataTransfer();

								container.items.add(new File([blob], files[i].name, {
									type: 'image/png', lastModified: new Date().getTime()
								}));
								item.preview = container.files;
							});
						});

						video.src = URL.createObjectURL(files[i]);
						video.load();
					}

					sum += files[i].size;
					cnt++;
				}

				if($("#problem .file_uploads").data("value") != 1) {
					$("#problem .file_uploads").show();
					$("#problem").modal("show");
				}

				if(sum > $("#problem .post_max_size").data("value")) {
					$("#problem .upload_max_filesize").show();
					$("#problem").modal("show");
				}

				if(cnt > $("#problem .max_file_uploads").data("value")) {
					$("#problem .max_file_uploads").show();
					$("#problem").modal("show");
				}

				for(let i=0; i<files.length; i++) {
					if(files[i].size > $("#problem .upload_max_filesize").data("value")) {
						$("#problem .upload_max_filesize").show();
						$("#problem").modal("show");
					}
				}

				item['media.label'] = files[0].name;
			},


			label(idx) {
				let label = '';

				if(this.items[idx]) {
					label += (this.items[idx]['media.languageid'] ? this.items[idx]['media.languageid'] + ': ' : '');
					label += (this.items[idx]['media.label'] ? this.items[idx]['media.label'] : '');
					label += (this.items[idx]['media.type'] ? ' (' + this.items[idx]['media.type'] + ')' : '');
				}

				return label;
			},


			remove(idx) {
				if(this.items[idx]) {
					this.items.splice(idx, 1);
				}
			},


			toggle(what, idx) {
				if(this.items[idx]) {
					this.items[idx][what] = (!this.items[idx][what] ? true : false);
				}
			}
		}
	}
};

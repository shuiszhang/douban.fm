/**
 * Created by shuis on 2017/5/11.
 */
let Menu = require('./menu');
let Api = require('./api').api;
let channels = require('./api').channels;
let Lrc = require('./lrc').Lrc;
let MPlayer = require('mplayer');
let sa = require('superagent');
let chalk = require('chalk');
let term_img = require('term-img');
let opn = require('opn');
let readlineSync = require('readline-sync');
let fs = require('fs');
let os = require('os');
let Log = require('log');
let log = new Log('debug', fs.createWriteStream('./my.log'));

let config_path = os.homedir() + '/.doubanfm.config';

function formatSeconds(time) {
  if (time <= 0) {
    return '00:00:00'
  }
  let hh = parseInt(time / 3600);
  if (hh < 10)
    hh = "0" + hh;
  let mm = parseInt((time - hh * 3600) / 60);
  if (mm < 10)
    mm = "0" + mm;
  let ss = parseInt((time - hh * 3600) % 60);
  if (ss < 10)
    ss = "0" + ss;
  return hh + ":" + mm + ":" + ss;
}

class Fm {
  constructor() {
    this.channel_id = 1;
    this.seconds = 0;
    this.item_index = 0;
    this.params = {
      'type': 'n',
      'channel': 1,
      'kbps': '128',
      'app_name': 'radio_website',
      'client': 's:mainsite|y:3.0',
      'version': '100',
      'sid': '1927081',
    };
    this.song = {
      'sid': '',
      'ssid': '',
      'title': '',
      'artist': '',
      'url': '',
      'length': 0,
      'like': 0,
    };
    this.lrc = null;
    this.sa = null;
    this.config = {
      cookie: {
        dbcl2: '',
        bid: '',
        ck: '',
      },
      channel_id: 1,
    };
    this.cookie = {
      dbcl2: '',
      bid: '',
      ck: '',
    };
    this.cookie_str = '';
  }

  async run() {
    //初始化 sa
    this.agent = sa.agent();

    //读取配置
    let config = this.load_config();
    if (!config || !this.check_login()) {
      //提示用户是否要登录
      while (true) {
        let res = await this.login();
        if (res === false) {
          break;
        }
        if (res.body && res.body.user_info && res.body.user_info.ck) {
          let user = res.body;
          let cookie = this.parse_cookie(res.header['set-cookie']);
          this.config.cookie = Object.assign({}, cookie, {ck: user['user_info']['ck']});
          //将cookie写入config
          fs.writeFile(config_path, JSON.stringify(this.config), () => {});
          break;
        }

        console.log(chalk.red('账号，密码或验证码错误，请重试'));
      }
    }

    //设置播放器
    this.player = new MPlayer();
    this.player.on('time', (time) => {
      if (parseInt(time) != this.seconds) {
        this.seconds = parseInt(time);
        this.update_header();
      }
    });
    this.player.on('stop', (code) => {
      this.seconds && this.seconds >= 10 && this.get_song('p');
    });

    //设置menu
    this.menu = new Menu({
      viewportSize: 20
    });
    this.menu.header('welcome');
    this.menu.adds(channels);
    this.menu.footer(chalk.red('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'));
    this.menu.on('keypress', (key, index) => {
      this.key(key, index)
    });
    this.item_index = this.mark_menu_item(this.channel_id);
    this.menu.start(this.item_index);

    //播放第一首歌
    this.get_song('n');
  }

  /**
   * 读取配置
   * @returns {boolean}
   */
  load_config(){
    if (fs.existsSync(config_path)) {
      let config = fs.readFileSync(config_path, 'utf8');
      if (config) {
        this.config = JSON.parse(config);
        this.channel_id = this.config.channel_id;
        this.cookie_str = `bid=${this.config.cookie.bid}; flag="ok"; dbcl2="${this.config.cookie.dbcl2}"; ck=${this.config.cookie.ck}`;
        return true;
      }
    }
    return false;
  }

  //处理cookie
  parse_cookie(cookie){
    let dbcl2 = '';
    let bid = '';
    let reg = /.*dbcl2="(.*?)";.*/ig;
    let arr = reg.exec(cookie);
    if (arr) {
      dbcl2 = arr[1];
    }

    reg = /.*bid=(.*?);.*/ig;
    arr = reg.exec(cookie);
    if (arr) {
      bid = arr[1];
    }

    return {dbcl2, bid};
  }

  /**
   * 检查用户是否已经登录(cookie是否有效)
   */
  async check_login(){
    this.params.channel = -3;//红心兆赫
    this.sa = this.agent.get(Api.song).set('Cookie', this.cookie_str);
    try {
      let res = await this.sa.query(this.params);
      //log.error('check_login:', res.body);
      if (res.body.song) {
        return true;
      } else {
        return false;
      }
    } catch (error) {

    }
  }

  async login(){
    let login_flag = readlineSync.question('您需要登录 douban.fm 吗? Y/N: ');
    if (['Y', 'y', 'yes', 'Yes'].includes(login_flag)) {
      let email = readlineSync.question('请输入email：');
      let password = readlineSync.question('请输入密码：', {hideEchoBack: true});
      let cap = await this.get_captcha();
      term_img(cap.path, {fallback:() => {
        //终端不支持显示图片,调用默认程序打开
        opn(cap.path);
      }});
      let code = readlineSync.question('请输入验证码：');
      let options = {
        source: 'radio',
        alias: email,
        form_password: password,
        captcha_solution: code,
        captcha_id: cap.id,
      };
      this.sa = this.agent.post(Api.login);
      return this.sa.type('form').send(options);
    }
    return false;
  }

  /**
   * 退出fm
   */
  exit() {
    this.player.stop();
    this.menu.exit();
  }

  /**
   * 第一次打开选择正在播放的频道
   * @param channel_id
   */
  mark_menu_item(channel_id) {
    let items = this.menu.items;
    for (let index = 0; index < items.length; ++index) {
      if (items[index].channel_id == channel_id) {
        this.menu.update(index, chalk.red(items[index].name));
        return index;
      }
    }
    return 0;
  }

  /**
   * 响应用户按键
   * @param key
   * @param index
   */
  key(key, index) {
    if (key.name === 'return') {
      let item = this.menu.item(index);
      //切换频道
      if (this.channel_id !== item.channel_id) {
        this.menu.update(this.item_index, this.menu.item(this.item_index).name);

        this.item_index = index;
        this.channel_id = item.channel_id;
        this.config.channel_id = item.channel_id;
        this.get_song('p', this.play_song);
        this.menu.update(index, chalk.red(item.name));

        //将channel_id写入config
        fs.writeFile(config_path, JSON.stringify(this.config));
      }
    }

    //下一首
    if (key.name === 'n') {
      this.get_song('s');
    }

    //标红心
    if (key.name === 'r') {
      this.get_song('r');
    }

    //取消红心
    if (key.name === 'u') {
      if (this.song['like'] == 1) {
        this.get_song('u');
      }
    }

    //不喜欢
    if (key.name === 'b') {
      this.get_song('b');
    }

    //退出
    if (key.name === 'q') {
      this.exit();
    }
  }

  /**
   * 更新header
   */
  update_header() {
    let header = chalk.red(this.song.like == '1' ? '♥ ' : '') + chalk.green(this.song.title) + ' - ' + chalk.cyan(this.song.artist) + ' ' + chalk.blue(formatSeconds(this.song.length - this.seconds));
    this.menu.update('header', header);
  }

  /**
   * 歌曲请求
   * @param type
   * @returns {Promise.<void>}
   */
  async get_song(type) {
    this.params.channel = this.channel_id;
    this.params.type = type;
    if (type !== 'n') {
      this.params.sid = this.song.sid;
    }

    let data = null;
    do {
      let params = this.params;
      if (type == 'n') {
        delete params.sid;
      }
      this.sa && this.sa.abort();
      this.sa = this.agent.get(Api.song).set('Cookie', this.cookie_str);
      try {
        let res = await this.sa.query(params);

        if (['n', 'p', 's', 'b'].includes(type)) {
          //需要切换新歌曲
          data = res.body.song ? (res.body.song)[0] : null;
          if (data) {
            Object.keys(this.song).forEach(item => {
              this.song[item] = data[item];
            });
            //log.error(this.song);
            if (this.lrc) {
              this.lrc.stop();
              this.lrc = null;
              this.menu.update('footer', chalk.red('... ♪ ♫ ♫ ♪ ♫ ♫ ♪ ♪ ...'));
            }
            this.play_song();
            this.seconds = 0;
            this.update_header();
          }
        } else if (['r', 'u'].includes(type)) {
          //标红心/取消红心不需要切换歌曲
          if (type == 'r') {
            this.song['like'] = 1;
            this.update_header();
          } else if (type == 'u') {
            this.song['like'] = 0;
            this.update_header();
          }
          data = true;
        }
      } catch (error) {
      }
    } while (!data);
  }

  /**
   * 播放歌曲
   */
  play_song() {
    if (this.player) {
      this.player.openFile(this.song.url);
      this.player.play();
      this.get_lrc();
    }
  }

  /**
   * 获取歌词
   */
  async get_lrc() {
    let params = {
      'sid': this.song.sid,
      'ssid': this.song.ssid,
    };

    this.sa && this.sa.abort();
    this.sa = this.agent.get(Api.lrc);
    try {
      let res = await this.sa.query(params);
      res && res.body && this.show_lrc(res.body.lyric);
    } catch (error) {
    }

  }

  /**
   * 显示歌词
   * @param lrc
   */
  show_lrc(lrc) {
    this.lrc = new Lrc(lrc, (line) => {
      line.trim() && this.menu.update('footer', chalk.red(line))
    });
    this.lrc.play();
  }

  /**
   * 获取验证码图片
   */
  async get_captcha(){
    let id = await sa.get(Api.captchaId);
    id = id.body;
    let image = await sa.get(Api.captcha).query({size:'m', id:id});
    let path = os.tmpdir() + '/douban_captcha.jpg';
    fs.writeFileSync(path, image.body);
    return {path, id};
  }
}

module.exports = Fm;
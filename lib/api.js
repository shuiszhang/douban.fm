/**
 * Created by shuis on 2017/5/10.
 */
let channels = [
  {'name': '红心兆赫', 'channel_id': -3},
  {'name': '我的私人兆赫', 'channel_id': 0},
  {'name': '每日私人歌单', 'channel_id': -2},
  {'name': '豆瓣精选兆赫', 'channel_id': -10},
  // 心情 / 场景
  {'name': '工作学习', 'channel_id': 153},
  {'name': '户外', 'channel_id': 151},
  {'name': '休息', 'channel_id': 152},
  {'name': '亢奋', 'channel_id': 154},
  {'name': '舒缓', 'channel_id': 155},
  {'name': 'Easy', 'channel_id': 77},
  {'name': '咖啡', 'channel_id': 32},
  // 语言 / 年代
  {'name': '华语', 'channel_id': 1},
  {'name': '欧美', 'channel_id': 2},
  {'name': '七零', 'channel_id': 3},
  {'name': '八零', 'channel_id': 4},
  {'name': '九零', 'channel_id': 5},
  {'name': '粤语', 'channel_id': 6},
  {'name': '日语', 'channel_id': 17},
  {'name': '韩语', 'channel_id': 18},
  {'name': '法语', 'channel_id': 22},
  {'name': '新歌', 'channel_id': 61},
  // 风格 / 流派
  {'name': '流行', 'channel_id': 194},
  {'name': '摇滚', 'channel_id': 7},
  {'name': '民谣', 'channel_id': 8},
  {'name': '轻音乐', 'channel_id': 9},
  {'name': '电影原声', 'channel_id': 10},
  {'name': '爵士', 'channel_id': 13},
  {'name': '电子', 'channel_id': 14},
  {'name': '说唱', 'channel_id': 15},
  {'name': 'R&B', 'channel_id': 16},
  {'name': '古典', 'channel_id': 27},
  {'name': '动漫', 'channel_id': 28},
  {'name': '世界音乐', 'channel_id': 187},
  {'name': '布鲁斯', 'channel_id': 188},
  {'name': '拉丁', 'channel_id': 189},
  {'name': '雷鬼', 'channel_id': 190},
  {'name': '小清新', 'channel_id': 76}
];

let api = {
  // 验证码id
  captchaId: 'https://douban.fm/j/new_captcha',
  //验证码图片
  captcha: 'https://douban.fm/misc/captcha?size=m',
  // 登录
  login: 'https://douban.fm/j/login',
  // 歌词
  lrc: 'https://douban.fm/j/v2/lyric',
  //歌曲控制
  song: 'https://douban.fm/j/v2/playlist'
};

module.exports = {channels, api};
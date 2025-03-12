const express = require("express"); // 引入express模块
const app = express(); // 创建express实例
const { Lose, Collection, User, Admin } = require("./db"); // 引入数据模型
const multer = require("multer"); // 引入multer模块
const { v4 } = require("uuid"); // 引入uuid模块
const { default: axios } = require("axios");
const e = require("express");

app.use(express.urlencoded({ extended: true })); // 解析post请求参数
app.use(express.json()); // 解析json数据
app.use(express.static(__dirname)); // 设置静态资源目录
app.all("*", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // 允许所有跨域请求
  res.setHeader("Access-Control-Allow-Headers", "*"); // 允许所有请求头
  next(); // 继续执行后续代码
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

// 配置文件存储路径和文件名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 指定文件存储路径
    cb(null, "./file"); // 保存在当前目录下的file文件夹中
  },
  filename(req, file, cb) {
    // 指定文件名
    let type = file.originalname.replace(/.+\./, "."); // 获取文件后缀名
    cb(null, `${v4()}${type}`); // 生成文件名
  },
});

// 实现物品的发布功能
app.post("/publish", async (req, res) => {
  try {
    const {
      type,
      classify1,
      classify2,
      name,
      date,
      region,
      phone,
      desc,
      time,
      imgList,
      openid,
    } = req.body;
    await Lose.create({
      type,
      classify1,
      classify2,
      name,
      date,
      region,
      phone,
      desc,
      time,
      imgList,
      openid,
    });
    res.send("success");
  } catch (error) {
    res.send("fail");
    console.log(error);
  }
});

// 上传图片
const upload = multer({ storage: storage }); // 创建multer对象
app.post("/uploadImg", upload.array("file", 6), (req, res) => {
  res.send(req.files); // 返回文件名
});

// 获取首页的数据
app.get("/getLose", async (req, res) => {
  const { type } = req.query;
  const result = await Lose.find({ type }).sort({ time: -1 });// 按时间倒序排序
  res.send(result);
});

// 收藏物品
app.post("/toCollection", async (req, res) => {
  try {
    const {
      id,
      type,
      classify1,
      classify2,
      name,
      date,
      region,
      phone,
      desc,
      time,
      imgList,
      openid,
    } = req.body;
    await Collection.create({
      id,
      type,
      classify1,
      classify2,
      name,
      date,
      region,
      phone,
      desc,
      time,
      imgList,
      openid,
    });
    res.send("success");
  } catch (error) {
    res.send("error");
    console.log(error);
  }
});

// 实现登录操作，获取openid
app.get("/login", async (req, res) => {
  const { code } = req.query;
  try {
    const {
      data: { openid },
    } = await axios.get(
      `https://api.weixin.qq.com/sns/jscode2session?appid=wxdf8879f706020150&secret=f1dd8833bbce2df2170efdfef57f4f2c&js_code=${code}&grant_type=authorization_code`
    );
    res.send(openid);
  } catch (error) {
    console.log(error);
    res.send("error");
  }
});

// 查询当前物品是否被收藏
app.post("/isCollection", async (req, res) => {
  const { id, openid } = req.body;
  const result = await Collection.find({ id, openid });
  res.send(result);
});

// 取消收藏
app.post("/cancelCollection", async (req, res) => {
  try {
    const { id, openid } = req.body;
    await Collection.findOneAndDelete({ id, openid });
    res.send("success");
  } catch (error) {
    res.send("error");
    console.log(error);
  }
});

// 获取收藏的数据
app.get("/getCollection", async (req, res) => {
  const { openid, type } = req.query;
  const result = await Collection.find({ openid, type });
  res.send(result);
});

// 获取我的发布
app.get("/getMyPublish", async (req, res) => {
  const { openid, type } = req.query;
  const result = await Lose.find({ openid, type });
  res.send(result);
});

// 通过二级分类查数据
app.post("/getClassify2", async (req, res) => {
  const { type, classify2 } = req.body;
  const result = await Lose.find({ type, classify2 });
  res.send(result);
});

// 模糊查询物品名字
app.get("/searchLose", async (req, res) => {
  const { name } = req.query;
  const _name = new RegExp(name, "i"); // 不区分大小写，模糊查询
  const result = await Lose.find({ name: _name });
  res.send(result);
});

// 通过搜索历史查询物品
app.post("/searchHistory", async (req, res) => {
  const { name, type } = req.body;
  const _name = new RegExp(name, "i"); // 不区分大小写，模糊查询
  const result = await Lose.find({ name: _name, type });
  res.send(result);
});

// 注册
app.post("/register", async (req, res) => {
  const { username, password, openid, create_time } = req.body;
  const result = await User.find({ username });
  if (result.length !== 0) {
    res.send("registered");
  } else {
    await User.create({ username, password, openid, create_time });
    res.send("success");
  }
});

// 独立的登录系统
app.post("/tologin", async (req, res) => {
  const { username, password } = req.body;
  const result = await User.findOne({ username, password });
  if (result.length !== 0) {
    if (result.password === password) {
      res.send("success");
    } else {
      res.send("pwdError");
    }
  } else {
    res.send("error");
  }
});

// 小程序端删除寻主/寻物数据
app.post("/delLose", async (req, res) => {
  const { _id } = req.body;
  try {
    await Lose.findOneAndDelete({ _id });
    await Collection.deleteMany({ id: _id });
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});
//获取物品详情信息
app.post("/getLoseDetail", async (req, res) => {
  const { _id } = req.body;
  try {
    const result = await Lose.findById({ _id });
    res.send(result);
  } catch (error) {
    res.send("error");
  }
});

//小程序修改发布的寻主/寻物信息
app.post("/editLose", async (req, res) => {
  const {
    _id,
    type,
    classify1,
    classify2,
    name,
    date,
    region,
    phone,
    desc,
    time,
    imgList,
  } = req.body;
  try {
    await Lose.findOneAndUpdate(
      { _id },
      {
        type,
        classify1,
        classify2,
        name,
        date,
        region,
        phone,
        desc,
        time,
        imgList,
      }
    );
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

//// 后台管理系统

// 管理员登录
app.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await Admin.findOne({ username, password });
  if (result && result.password === password) {
    res.send(result);
  } else {
    res.send("error");
  }
});

// 寻主/寻物数据
app.post("/admin/getLose", async (req, res) => {
  const { type, page, size, searchVal } = req.body;
  try {
    if (searchVal) {
      const name = new RegExp(searchVal, "i");
      const result = await Lose.find({ type, name })
        .skip((page - 1) * size)
        .limit(size);
      const total = await Lose.find({ type, name }).countDocuments();
      res.send({ result, total });
    } else {
      const result = await Lose.find({ type })
        .skip((page - 1) * size)
        .limit(size);
      const total = await Lose.find({ type }).countDocuments();
      res.send({ result, total });
    }
  } catch (error) {
    res.send("error");
  }
});

// 删除寻主/寻物数据
app.post("/admin/delLose", async (req, res) => {
  const { _id } = req.body;
  try {
    await Lose.findOneAndDelete({ _id });
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

// 后台管理系统用户数据
app.post("/admin/getUser", async (req, res) => {
  const { page, size, searchVal } = req.body;
  try {
    if (searchVal) {
      const username = new RegExp(searchVal, "i");
      const result = await User.find({ username })
        .skip((page - 1) * size)
        .limit(size);
      const total = await User.find({
        username: new RegExp(searchVal, "i"),
      }).countDocuments();
      res.send({ result, total });
    } else {
      const result = await User.find()
        .skip((page - 1) * size)
        .limit(size);
      const total = await User.find().countDocuments();
      res.send({ result, total });
    }
  } catch (error) {
    res.send("error");
  }
});

// 后台管理系统删除用户
app.post("/admin/delUser", async (req, res) => {
  const { _id } = req.body;
  try {
    await User.findOneAndDelete({ _id });
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

//获取后台管理系统管理员信息
app.post("/admin/getAdmin", async (req, res) => {
  const { page, size, searchVal } = req.body;
  try {
    if (searchVal) {
      const username = new RegExp(searchVal, "i");
      const result = await Admin.find({ username })
        .skip((page - 1) * size)
        .limit(size);
      const total = await Admin.find({
        username: new RegExp(searchVal, "i"),
      }).countDocuments();
      res.send({ result, total });
    } else {
      const result = await Admin.find()
        .skip((page - 1) * size)
        .limit(size);
      const total = await Admin.find().countDocuments();
      res.send({ result, total });
    }
  } catch (error) {
    res.send("error");
  }
});

//后台管理系统超级管理员删除管理员
app.post("/admin/delAdmin", async (req, res) => {
  const { _id, username } = req.body;
  try {
    // 先查询当前管理员的信息
    const currentAdmin = await Admin.findOne({ username });
    // 检查当前管理员权限
    if (currentAdmin.role !== 0) {
      return res.send("noPower"); // 无权限操作
    }
    // 获取当前管理员的_id
    const currentAdminId = currentAdmin._id.toString();
    // 检查是否删除自己（比较两个_id是否一致）
    if (currentAdminId === _id) {
      return res.send("cannotDeleteSelf"); // 阻止自我删除
    }
    // 执行删除目标管理员
    await Admin.findByIdAndDelete(_id);
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

//新增管理员/修改管理员
app.post("/admin/AddEditAdmin", async (req, res) => {
  const { username, password, role, nickname, _id } = req.body;
  try {
    if (_id) {
      // 执行修改管理员
      await Admin.findByIdAndUpdate(_id, {
        username,
        password,
        role,
        nickname,
      });
    } else {
      // 执行新增管理员
      // 先查询当前用户名是否已存在
      const existingAdmin = await Admin.findOne({ username });
      if (existingAdmin) {
        return res.send("exist"); // 用户名已存在
      }
      // 执行新增管理员
      await Admin.create({
        username,
        password,
        role,
        nickname,
        create_time: Date.now(),
      });
    }
    res.send("success");
  } catch (error) {
    res.send("error");
  }
});

//查询当前管理员权限
app.post("/admin/getAdminRole", async (req, res) => {
  const { username } = req.body;
  try {
    const { role } = await Admin.findOne({ username });
    if (role == 0) {
      res.send(true);
    } else {
      res.send(false);
    }
  } catch (error) {
    res.send("error");
  }
});

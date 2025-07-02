console.info("开启启动抖音福袋脚本");
// 配置
let config = {
    configFile: "/sdcard/脚本/config.properties",
    globalTimeout: null,
    globalTimeoutMin: 3000,
    globalTimeoutMax: 7000,
    fudaiButtonTimeout: null, // 进入房间后，福袋按钮出现超时时间
    fudaiButtonTimeoutMin: 5000,
    fudaiButtonTimeoutMax: 8000,
    forceLaunch: true, // 到了福袋进入时间强制打开抖音APP
    joinAndWaitFudaiNotExitRoom: true, // true：不退出房间，直接参与并等福袋。false：循环一圈房间记录福袋时间后退出房间，时间临近再返回参与并等福袋
    reduceBrightness: true, // 调低亮度
    runningHours: 0,// 运行时长
    filterRoomListDir: "/sdcard/脚本/",
    whiteRoomList: [], // 白名单
    blackRoomList: [],// 黑名单
}
// 全局变量
let rooms = []; // 所有的房间
let mertics = new Mertics();
let brightness = new Brightness(); // 亮度设置
let startTime = new Date();
let stoped = false;
let threadList = [];


// **********************************************************************************************


// 抖音包名
const douYinPackageName = "com.ss.android.ugc.aweme";
// 结束APP运行
const killAppSelector = () => visibleToUser().desc("结束运行").className("LinearLayout").packageName("com.miui.securitycenter");
// 结束APP运行确认
const killAppConfirmSelector = () => visibleToUser().text("确定").className("Button").packageName("com.miui.securitycenter");
// 包选择器
const packageSelector = () => packageName(douYinPackageName);
// 可见选择器
const visibleSelector = () => packageSelector().visibleToUser();
// 抖音APP-个人中心TAB入口（“我”）
const enterPersonalCenterSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().text("我").desc("我，按钮").className("TextView") };
// 个人中心-关注列表入口
const enterFollowListSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("TextView").text("关注") };
// 个人中心-观看历史列表入口
const enterWatchHistoryListSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("TextView").text("观看历史") };
// 关注列表-退出关注列表
const exitFollowListSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().id(douYinPackageName + ":id/back_btn").desc("返回").clickable() };
// 关注列表-是否进入关注列表标志
const followListEnterSuccessSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().id("android:id/text1").text("关注").className("TextView").selected() };
// 关注列表-设置按钮
const followListSettingSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().desc("设置").className("ImageView") };
// 关注列表-房间列表
const roomListSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("androidx.recyclerview.widget.RecyclerView").scrollable() };
// 关注列表-一个房间
const oneRoomSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().id(douYinPackageName + ":id/root_layout").className("Button") };
// 关注列表-房间是否直播中
const livingRoomButtonSelector = () => { visibleSelector().untilFindOne(); return packageSelector().id(douYinPackageName + ":id/avatar_live_tag") };
// 关注列表-房间名称
const roomNameInListSelector = () => { visibleSelector().untilFindOne(); return packageSelector().className("TextView") };
// 关注列表-是否到末尾
const isEndInListSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().id(douYinPackageName + ":id/title").className("TextView").text("发现朋友") };
// 房间-当前房间名称
const currentRoomNameInLivingSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().id(douYinPackageName + ":id/user_name") };
// 房间-福袋按钮
const fudaiButtonSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.LynxFlattenUI").textStartsWith("超级福袋").clickable() };
// 房间-福袋弹窗
const fudaiWindowSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().desc("参与任务").text("参与任务") };
// 房间-中奖弹窗
const wonWindowSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.text.FlattenUIText").desc("恭喜抽中福袋").text("恭喜抽中福袋") };
// 房间-未中奖弹窗
const notWonWindowSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.view.UIView").desc("我知道了").text("我知道了").enabled().clickable() };
// 房间-一键发评
const publishCommentSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.view.UIView").desc("一键发表评论").text("一键发表评论").enabled().clickable() };
// 房间-观看直播任务
const watchTaskSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.view.UIView").desc("开始观看直播任务").text("开始观看直播任务").enabled().clickable() };
// 房间-即将开奖无法参与
const canNotJoinSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.view.UIView").desc("即将开奖 无法参与").text("即将开奖 无法参与").enabled().clickable() };
// 房间-参与福袋成功
const joinedSuccessSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.view.UIView").desc("参与成功 等待开奖").text("参与成功 等待开奖").enabled() };
// 房间-退出房间
const exitRoomSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().id(douYinPackageName + ":id/root").desc("关闭") };
// 房间-退出直播结束的房间
const exitEndedRoomSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("android.view.View").desc("关闭") };
// 房间-不满足参与条件
const notSatisfyConditionSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.text.FlattenUIText").desc("不满足参与条件") };
// 房间-还需看播
const needWatchSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.text.FlattenUIText").desc("还需看播") };
// 房间-需要观看x分钟
const needWatchTotalMinuteSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().descMatches("观看直播\\d+分钟未达成").textMatches("观看直播\\d+分钟未达成") };
// 房间-完成任务时长不足，任务失败
const watchTaskTimeNotEnoughSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().className("com.lynx.tasm.behavior.ui.text.FlattenUIText").desc("完成任务时长不足，任务失败").text("完成任务时长不足，任务失败").enabled() };
// 房间-加入直播粉丝团未达成
const notSatisfyJoinedFansGroupSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().descEndsWith("粉丝团未达成").textEndsWith("粉丝团未达成").className("com.lynx.tasm.behavior.ui.LynxFlattenUI") };
// 房间-福袋参与人数
const joinedNumberSelector = () => { visibleSelector().untilFindOne(); return visibleSelector().descMatches("共\\d+份\\d+人已参与").textMatches("共\\d+份\\d+人已参与").className("com.lynx.tasm.behavior.ui.LynxFlattenUI") };


// **********************************************************************************************

function Mertics() {
    this.round = 0;
    this.joinedTimes = 0;
    this.waitedTimes = 0;
    this.wonTimes = 0;
    this.notWonTimes = 0;
}

Mertics.prototype.log = function () {
    console.log("{")
    console.log(`   循环${this.round}轮`);
    console.log(`   已经参与福袋${this.joinedTimes}次`);
    console.log(`   已经等待福袋${this.waitedTimes}次`);
    console.log(`   已经中奖${this.wonTimes}次`);
    console.log(`   未中奖${this.notWonTimes}次`)
    toast(`参与${this.joinedTimes}次，等待${this.waitedTimes}次，中奖${this.wonTimes}次，未中奖${this.notWonTimes}次`)
    console.log("}")
}


/**
 * 亮度设置
 */
function Brightness() {

}

/**
 * 设置亮度
 */
Brightness.prototype.setBrightness = function () {
    console.log("降低亮度")
    this.brightnessMode = device.getBrightnessMode();
    this.brightness = device.getBrightness();

    if (device.getBrightnessMode() == 1) {
        device.setBrightnessMode(0)
    }
    device.setBrightness(parseInt(this.brightness / 4))
}

/**
 * 恢复亮度
 */
Brightness.prototype.restoreBrightness = function () {
    if (!config.reduceBrightness) {
        return;
    }
    if (this.brightnessMode != null) {
        console.log("恢复亮度")
        device.setBrightnessMode(this.brightnessMode);
    }
    if (this.brightnessMode == 0 && this.brightness != null) {
        device.setBrightness(this.brightness)
    }
    this.brightnessMode = null;
    this.brightness = null;
}


/**
 * 是否设置亮度
 */
Brightness.prototype.isSetted = function () {
    return this.brightnessMode != null;
}


/**
 * 自动设置亮度
 */
Brightness.prototype.autoBrightness = function () {
    if (!config.reduceBrightness) {
        return;
    }
    let t = threads.start(() => {
        while (true) {
            if (findOne(visibleSelector().enabled(), 0)) {
                if (!this.isSetted()) {
                    // 设置亮度
                    this.setBrightness();
                }
            } else {
                this.restoreBrightness();
            }
            sleep(1000);
        }
    });
    threadList.push(t);
    t.waitFor();
}


/**
 * 构造Room 
 */
function Room(roomName) {
    this.roomName = roomName;
}


/**
 * 初始化Room类原型
 */

Room.prototype.setRemainTime = function (remainTime) {
    this.triggerTime = remainTime + getNowSeconds();
    this.triggerTimeStr = timestampFormat(this.triggerTime);
    console.log(`福袋剩余时间：${this.getRemainTimeStr()}`);
}
Room.prototype.getRemainTime = function () {
    if (!this.triggerTime) {
        return null;
    }
    return this.triggerTime - getNowSeconds();
}
Room.prototype.getRemainTimeStr = function () {
    if (!this.triggerTime) {
        return null;
    }
    let remainTimeSecond = this.getRemainTime();
    return secondsToDisplay(remainTimeSecond);
}
Room.prototype.setNeedWatchSeconds = function (needWatchSeconds) {
    if (!this.triggerTime) {
        return;
    }
    this.needWatchSeconds = needWatchSeconds;
    this.needWatchSecondsStr = secondsToDisplay(needWatchSeconds);
    this.needWatchBeforeTime = this.triggerTime - needWatchSeconds;
    this.needWatchBeforeTimeStr = timestampFormat(this.needWatchBeforeTime);
    console.info(`还需看播：${this.needWatchSecondsStr}`)
}
Room.prototype.getNeedWatchSeconds = function () {
    return this.needWatchSeconds;
}
Room.prototype.getNeedWatchBeforeTimeRemain = function () {
    if (!this.needWatchBeforeTime) {
        return;
    }
    return this.needWatchBeforeTime - getNowSeconds();
}
Room.prototype.getNeedWatchBeforeTimeRemainStr = function () {
    if (!this.needWatchBeforeTime) {
        return;
    }
    let seconds = this.getNeedWatchBeforeTimeRemain();
    return secondsToDisplay(seconds);
}
Room.prototype.isCanJoin = function () {
    let result = false;
    if (this.getRemainTime() > 0 && !this.isCanNotJoinReason) {
        if (this.needWatchSeconds) {
            result = this.getNeedWatchBeforeTimeRemain() > 0;
        } else {
            result = true;
        }
    }
    return result;;
}
Room.prototype.log = function () {
    if (!this || !this.roomName) {
        return
    }
    console.log("{")
    console.log(`   房间名称：${this.roomName}`)
    console.log(`   能否参与：${this.isCanJoin() ? "是" : "否"}`)
    if (this.triggerTime) {
        console.log(`   剩余时间：${this.getRemainTimeStr()}`)
        console.log(`   开奖时间：${this.triggerTimeStr}`)
    }
    if (this.needWatchSeconds) {
        console.log(`   观看任务还剩：${this.getNeedWatchBeforeTimeRemainStr()}`)
        console.log(`   观看任务时间：${this.needWatchBeforeTimeStr}`)
        console.log(`   还需观看时长：${this.needWatchSecondsStr}`)
    }
    console.log("}")
}

Room.prototype.isTimeApproaching = function () { this.isCanJoin() && this.getRemainTime() < 80 };

Room.prototype.isNeedWatchTimeApproaching = function () { this.isCanJoin() && this.getNeedWatchBeforeTimeRemain() < 80 };


// **********************************************************************************************


/**
 * 是否在抖音APP
 */
function isInDouYin(timeout) {
    // console.log(currentPackage()) // 判断当前包名的方法有缓存，不准确
    let found = findOne(visibleSelector().enabled(), timeout);
    if (found) {
        return true;
    } else {
        log("当前不在抖音APP")
        return false;
    }
}


/**
 * 是否在抖音外层窗口
 */
function isInDouYinIndex(timeout) {
    let found = findOne(enterPersonalCenterSelector(), timeout);
    if (found) {
        return true;
    } else {
        log("当前不在抖音外层窗口")
        return false;
    }
}

/**
 * 是否在个人中心
 */
function isInPersonalCenter(timeout) {
    let followListEntrance = findOne(enterWatchHistoryListSelector(), timeout);
    if (followListEntrance) {
        log("当前在个人中心")
        return true;
    }
    return false;
}


/**
 * 是否在我的关注列表
 */
function isInFollowList(timeout) {
    let result = true;
    // 是否进入关注列表
    if (!findOne(followListEnterSuccessSelector(), timeout)) {
        result = false;
    }
    // 退出按钮
    if (!findOne(exitFollowListSelector(), timeout)) {
        result = false;
    }
    if (result) {
        log("当前在关注列表")
    }
    return result;
}


/**
 * 是否在房间
 */
function isInRoom(timeout) {
    let found = findOne(exitRoomSelector(), timeout)
    if (found) {
        log("当前在房间")
        return true;
    } else {
        return false;
    }
}


/**
 * 是否在已结束的房间
 */
function isInEndedRoom(timeout) {
    let found = findOne(exitEndedRoomSelector(), timeout)
    if (found) {
        toastLog("当前在已经结束的房间")
        return true;
    } else {
        return false;
    }
}


/**
 * 是否在福袋弹窗
 */
function isInFudaiWindow(timeout) {
    let fudaiWindow = findOne(fudaiWindowSelector(), timeout);
    if (fudaiWindow) {
        log("当前在福袋弹窗")
        return true;
    } else {
        return false;
    }
}


/**
 * 关注列表是否加载完成
 */
function isFollowListLoaded(timeout) {
    let result = true;
    // 设置按钮（网络请求未加载列表完成前，没有设置按钮）
    if (!findOne(followListSettingSelector(), timeout)) {
        result = false;
    }
    // 房间列表（可滚动）
    if (!findOne(roomListSelector(), timeout)) {
        result = false;
    }
    // 一个房间
    if (!findOne(oneRoomSelector(), timeout)) {
        result = false;
    }
    if (result) {
        console.log("关注列表加载完成")
    }
    return result;
}


/**
 * 当前在关注列表并且加载完成
 */
function isInFollowListAndLoaded(timeout) {
    return isInFollowList(timeout) && isFollowListLoaded(timeout);
}


/**
 * 房间是否加载完成
 */
function isRoomLoaded(timeout) {
    let result = true;
    if (!getCurrentRoomName(timeout)) {
        result = false;
    }
    if (result) {
        console.log("房间加载完成")
    }
    return result;
}


/**
 * 当前在房间并且加载完成
 */
function isInRoomAndLoaded(timeout) {
    return isInRoom(timeout) && isRoomLoaded(timeout);
}


// **********************************************************************************************

/**
 * 进入个人中心
 */
function enterPersonalCenter(timeout) {
    console.log("进入个人中心：>>>");
    let error = "";
    try {
        if (!isInDouYinIndex(timeout)) {
            throw "当前不在抖音外层窗口"
        }
        let clickResult = clickByXY(enterPersonalCenterSelector().findOne(config.globalTimeout));
        if (!clickResult) {
            throw "点击失败❌";
        }
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error("进入个人中心：", e)
        error = e;
    }
    if (isInPersonalCenter(config.globalTimeout)) {
        console.info("进入个人中心：✨")
        return;
    }
    throw `进入个人中心：❌ ${error}`;
}


/**
 * 进入我关注的房间
 */
function enterFollowList(timeout) {
    console.log("进入关注列表：>>>")
    let error = "";
    try {
        if (!isInPersonalCenter(timeout)) {
            throw "当前不在个人中心";
        }
        let clickResult = clickByXY(enterFollowListSelector().findOne(config.globalTimeout));
        if (!clickResult) {
            throw "点击失败❌";
        }
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error("进入关注列表：", e)
        error = e;
    }
    if (isInFollowListAndLoaded(config.globalTimeout)) {
        console.info("进入关注列表：✨")
        return;
    }
    throw `进入关注列表：❌ ${error}`;
}


/**
 * 进入房间
 */
function enterRoom(room, timeout) {
    console.info(`进入房间：${room.roomName} >>>`)
    let error = "";
    try {
        let inFollowList = isInFollowListAndLoaded(timeout);
        if (!inFollowList) {
            console.log("当前不在关注列表");
        }

        // 不在当前关注页，退出重新进去
        let existInCurrentPage;
        if (inFollowList) {
            existInCurrentPage = oneRoomSelector().find().findOne(roomNameInListSelector().text(room.roomName));
            if (!existInCurrentPage) {
                console.log("房间不在当前页面");
            }
        }
        let refreshed = false;
        if (!inFollowList || !existInCurrentPage) {
            // 退出个人中心，重新进入关注列表，防止房间在前面页，而不是在后面
            refreshEnterFollowList();
            refreshed = true;
        }
        if (refreshed && !isInFollowListAndLoaded(timeout)) {
            throw "当前不在关注列表";
        }

        // 两种种情况：1、该房间在当前列表存在，循环一次即可找到。2、当前列表不存在，需要退出个人中心重新进入关注列表首部。循环一次不一定找到，需要往下翻页循环找
        loopRoomListInAllPage((oneRoomUiObject) => {
            let oneRoomInfo = parseRoomInfoInList(oneRoomUiObject);
            if (oneRoomInfo.roomName != room.roomName) {
                return 0; // 名称不同找下个
            }
            if (!oneRoomInfo.visibleToUser) {
                return 1; // 当前页不可见，翻下一页
            }
            if (!oneRoomInfo.living) {
                console.warn(`当前房间不在直播中：${room.roomName}`)
                return 2; // 不在直播中，退出所有循环
            }

            console.log("房间信息：", JSON.stringify(oneRoomInfo))
            // 进入房间
            let livingRoomButton = oneRoomUiObject.findOne(livingRoomButtonSelector());
            let icon = nextSibling(livingRoomButton.parent());
            let clickResult = clickByXY(icon);
            if (!clickResult) {
                console.error("点击失败❌");
            }
            return 2;
        })
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error("进入房间：", e)
        error = e;
    }
    // 有时进入房间，会先弹出中奖或者未中奖弹窗
    tryDo(closeAllWindow, 2, random(300, 800));
    // 判断是否进入房间且加载完成
    if (isInRoomAndLoaded(config.globalTimeout) && getCurrentRoomName(config.globalTimeout) === room.roomName) {
        console.info(`进入房间：${room.roomName} ✨`)
        return;
    }
    throw `进入房间：${room.roomName} ❌ ${error}`;
}


/**
 * 进入福袋弹窗
 */
function enterFudaiWindow(timeout) {
    console.log("进入福袋弹窗：>>>");
    let error = "";
    try {
        if (!isInRoomAndLoaded(timeout)) {
            throw "当前不在房间";
        }
        let clickResult = clickByXY(fudaiButtonSelector().findOne(config.fudaiButtonTimeout));
        if (!clickResult) {
            throw "点击失败❌";
        }
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error("进入福袋弹窗：", e)
        error = e;
    }
    if (isInFudaiWindow(config.globalTimeout)) {
        console.info("进入福袋弹窗：✨")
        return;
    }
    throw `进入福袋弹窗：❌ ${error}`;
}


/**
 * 刷新重新进入我的关注列表
 */
function refreshEnterFollowList() {
    while (true) {
        try {
            let clicked = false;
            if (!isInDouYinIndex(0)) {
                // 关闭所有弹窗
                clicked = closeAllWindow();
                // 退出房间
                clicked = exitRoom(false, clicked ? random(2000, 3500) : 0);
                // 退出关注列表
                clicked = exitFollowList(false, clicked ? random(2000, 3500) : 0);
            }
            // 点击“我”
            if (!isInPersonalCenter(clicked ? config.globalTimeout : 0)) {
                tryDo(() => enterPersonalCenter(random(2000, 3500)), 3, random(300, 800));
            }
            sleep(random(1300, 1800));
            // 进入关注列表
            tryDo(() => enterFollowList(random(2000, 3500)), 3, random(300, 800));
            sleep(random(1800, 2500));
            break;
        } catch (e) {
            // 中断
            exitIfInterrupted(e);
            console.error("刷新进入关注列表：❌", e)
            sleep(random(2500, 3800));
            continue;
        }
    }
}


// **********************************************************************************************


/**
 * 退出关注列表
 */
function exitFollowList(force, timeout) {
    let clicked = false;
    let inFollowList = true;
    let error = true;
    try {
        inFollowList = isInFollowList(timeout);
        if (!force && !inFollowList) {
            return clicked;
        }
        if (force && !inFollowList) {
            throw "当前不在关注列表"
        }
        let exitFollowList = exitFollowListSelector().findOnce();
        if (exitFollowList) {
            console.log("退出关注列表：>>>");
            if (!exitFollowList.click()) {
                throw "点击失败❌";
            }
            clicked = true;
        }
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error("退出关注列表：", e)
        error = e;
    }
    if (!force && !inFollowList) {
        return clicked;
    }
    if (isInPersonalCenter(clicked ? config.globalTimeout : 0)) {
        console.info("退出关注列表：✨")
        return clicked;
    }
    throw `退出关注列表：❌ ${error}`;
}


/**
 * 退出房间
 */
function exitRoom(force, timeout) {
    let clicked = false;
    let inRoom = false;
    let inLivingRoom = false;
    let inEndedRoom = false;
    let error = "";
    try {
        // 是否直播中房间
        inLivingRoom = isInRoom(timeout);
        if (!inLivingRoom) {
            // 有可能是有弹窗，关闭弹窗
            closeAllWindow();
            inLivingRoom = isInRoom(timeout);
            if (!inLivingRoom) {
                // 是否已结束房间，该判断目前有些问题，有未中奖弹框时也会返回true
                inEndedRoom = isInEndedRoom(timeout);
            }
        }

        inRoom = inLivingRoom || inEndedRoom;

        if (!force && !inRoom) {
            return clicked;
        }
        if (force && !inRoom) {
            throw "当前不在房间"
        }
        if (inLivingRoom) {
            let exitRoom = exitRoomSelector().findOnce();
            if (exitRoom) {
                console.log("退出房间：>>>")
                if (!clickByXY(exitRoom)) {
                    throw "点击失败❌";
                }
                clicked = true;
            }
        }
        if (inEndedRoom) {
            let exitRoom = exitEndedRoomSelector().findOnce();
            if (exitRoom) {
                console.log("退出已结束房间：>>>")
                if (!clickByXY(exitRoom)) {
                    throw "点击失败❌";
                }
                clicked = true;
            }
        }
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error("退出房间：", e)
        error = e;
    }
    if (!force && !inRoom) {
        return clicked;
    }
    if (isInFollowListAndLoaded(clicked ? config.globalTimeout : 0)) {
        console.info("退出房间：✨")
        return clicked;
    }
    throw `退出房间：❌ ${error}`;
}


/**
 * 关闭福袋弹窗
 */
function exitFudaiWindow(force, timeout) {
    let clicked = false;
    let inFuDaiWindow = true;
    let error = true;
    try {
        inFuDaiWindow = isInFudaiWindow(timeout);
        if (!force && !inFuDaiWindow) {
            return clicked;
        }
        if (force && !inFuDaiWindow) {
            throw "当前不在福袋弹窗"
        }
        let fudaiWindow = fudaiWindowSelector().findOnce();
        if (fudaiWindow) {
            console.log("关闭福袋弹窗：>>>")
            if (!click(device.width / 2, device.height / 3)) {
                throw "点击失败❌";
            }
            clicked = true;
        }
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error("退出福袋弹窗：", e)
        error = e;
    }
    if (!force && !inFuDaiWindow) {
        return clicked;
    }
    if (isInRoomAndLoaded(clicked ? config.globalTimeout : 0)) {
        console.info("关闭福袋弹窗：✨")
        return clicked;
    }
    throw `关闭福袋弹窗：❌ ${error}`;
}


/**
 * 关闭没有中奖弹窗
 */
function closeNotWonWindow(timeout, displayTime) {
    let notWonWindow = findOne(notWonWindowSelector(), timeout);
    if (notWonWindow) {
        toastLog("没有中奖，关闭未中奖弹窗：>>>")
        sleep(displayTime ? displayTime : random(1800, 3500));
        clickByXY(notWonWindow)
        console.warn("没有中奖，关闭未中奖弹窗：😈😈😈");
        mertics.notWonTimes++;
        sleep(random(300, 800));
        return true;
    }
    return false;

}

/**
 * 关闭中奖弹窗
 */
function closeWonWindow(timeout, displayTime) {
    let wonWindow = findOne(wonWindowSelector(), timeout);
    if (wonWindow) {
        toastLog("中奖了，关闭中奖弹窗：>>>")
        sleep(displayTime ? displayTime : random(1800, 3500));
        let closeButton = lastSibling(wonWindow);
        clickByXY(closeButton)
        console.warn("中奖了，关闭中奖弹窗：🐲🐲🐲");
        mertics.wonTimes++;
        sleep(random(300, 800));
        return true;
    }
    return false;
}


/**
 * 关闭所有弹窗
 */
function closeAllWindow() {
    let clicked = false;
    // 关闭未中奖弹窗
    clicked = closeNotWonWindow(0);
    if (!clicked) {
        // 关闭中奖弹窗
        clicked = closeWonWindow(0);
    }
    // 关闭福袋弹窗
    clicked = exitFudaiWindow(false, random(500, 1500));
    return clicked;
}


/**
 * 关闭抖音APP
 */
function killDouYin() {
    console.log("关闭抖音APP");
    app.openAppSetting(douYinPackageName);
    let killApp = findOne(killAppSelector(), 3000);
    if (killApp && killApp.enabled()) {
        sleep(100)
        killApp.click();
        let killAppConfirm = findOne(killAppConfirmSelector(), 2000);
        sleep(100)
        killAppConfirm.click();
    }
    sleep(100)
    // 返回桌面
    home();
    sleep(100);
    // 锁屏
    // lockScreen();
}


// **********************************************************************************************


/**
 * 悬浮窗权限
 */
function setFloatyPermission() {
    if (!floaty.hasPermission()) {
        // 没有悬浮窗权限，提示用户并跳转请求
        toast("本脚本需要悬浮窗权限来显示悬浮窗，请在随后的界面中允许并重新运行本脚本");
        floaty.requestPermission();
        exit();
    } else {
        console.log('已有悬浮窗权限');
    }
}


// **********************************************************************************************


/**
 * 查询单个节点
 * timeout=0，不阻塞；timeout=-1，阻塞直到有结果，timeout=null，使用全局延迟参数config.globalTimeout。timeout其他值，则设置查询查询时间为timeout
 */
function findOne(selector, timeout) {
    if (timeout == 0) {
        return selector.findOnce();
    } else if (timeout == -1) {
        return selector.untilFindOne();
    } else {
        return selector.findOne(timeout ? timeout : config.globalTimeout);
    }
}

/**
 * 前一个兄弟
 */
function previousSibling(uiObject) {
    if (!uiObject) {
        return null;
    }
    let parent = uiObject.parent();
    if (!parent) {
        return null;
    }
    let index = uiObject.indexInParent() - 1;
    if (index < 0 || index > parent.childCount() - 1) {
        return null;
    }
    return parent.child(index);
}

/**
 * 后一个兄弟
 */
function nextSibling(uiObject) {
    if (!uiObject) {
        return null;
    }
    let parent = uiObject.parent();
    if (!parent) {
        return null;
    }
    let index = uiObject.indexInParent() + 1;
    if (index < 0 || index > parent.childCount() - 1) {
        return null;
    }
    return parent.child(index);
}


/**
 * 第一个兄弟
 */
function firstSibling(uiObject) {
    if (!uiObject) {
        return null;
    }
    let parent = uiObject.parent();
    if (!parent) {
        return null;
    }
    let index = 0;
    if (index < 0 || index > parent.childCount() - 1) {
        return null;
    }
    return parent.child(index);
}


/**
 * 最后一个兄弟
 */
function lastSibling(uiObject) {
    if (!uiObject) {
        return null;
    }
    let parent = uiObject.parent();
    if (!parent) {
        return null;
    }
    let index = parent.childCount() - 1;
    if (index < 0 || index > parent.childCount() - 1) {
        return null;
    }
    return parent.child(index);
}



/**
 * 获取当前房间名称
 */
function getCurrentRoomName(timeout) {
    let currentRoom = findOne(currentRoomNameInLivingSelector(), timeout);
    return currentRoom == null ? null : currentRoom.text()
}


/**
 * 往后翻一页
 */
function pageDown() {
    let roomList = roomListSelector().findOne(config.globalTimeout);
    if (!roomList) {
        throw "翻页失败❌";
    }
    let list = roomListSelector().find();
    if (list.size() == 1) {
        roomList.scrollForward();
        sleep(random(800, 1600));
        return;
    }
    // 存在“你可能感兴趣”弹框时
    for (let one of list) {
        let existRoom = one.findOne(oneRoomSelector());
        if (!existRoom) {
            continue;
        }
        one.scrollForward();
        sleep(random(800, 1600));
        return;
    };
    throw "翻页失败❌";
}

/**
 * 是否是最后一页
 */
function isPageEnd() {
    return isEndInListSelector().exists();
}


/**
 * 房间排序
 * 根据开奖时间
 */
function roomCompartor(a, b) {
    if (!a.isCanJoin()) {
        return 1;
    }
    if (!b.isCanJoin()) {
        return -1;
    }
    if (a.triggerTime == b.triggerTime) {
        return 0;
    }
    return a.triggerTime - b.triggerTime;
}


/**
 * 获取当前时间戳（秒）
 */
function getNowSeconds() {
    return parseInt(new Date().getTime() / 1000)
}

/**
 * 悬浮窗显示剩余时间
 */
function waitAndfloatyTime(time) {
    let w;
    try {
        w = floaty.rawWindow(
            <frame gravity="center" bg="#000000">
                <text id="text" textColor="#EA164B" textSize="30sp" typeface="monospace">00:00</text>
            </frame>
        );
        ui.run(function () {
            w.setPosition(device.width - w.getWidth(), device.height / 4);
            w.setTouchable(false);
        })
        while (true) {
            let now = getNowSeconds();
            if (getNowSeconds() > time) {
                ui.run(function () {
                    w.text.setText("00:00");
                })
                break;
            }
            let remin = time - now;
            let minute = parseInt(remin / 60);
            let second = remin % 60;
            let text = `${minute < 10 ? "0" + minute : minute}:${second < 10 ? "0" + second : second}`;
            ui.run(function () {
                w.text.setText(text);
            })
            sleep(1000);
        }
        // 强制打开抖音
        if (!isInDouYin(0) && config.forceLaunch) {
            console.log("强制打开抖音APP")
            app.launch(douYinPackageName);
        }
    } finally {
        if (w) {
            w.close()
        }
    }
}


/**
 * 通过名称获取Room对象
 */
function getRoomByName(roomName) {
    return rooms.find(it => it.roomName == roomName);
}

/**
 * 解析关注列表中的房间信息
 */
function parseRoomInfoInList(roomInList) {
    let result = { living: false };
    // 房间名
    let roomName = roomInList.findOne(roomNameInListSelector());
    if (roomName) {
        result.roomName = roomName.text();
    }

    // 是否直播中
    let living = roomInList.findOne(livingRoomButtonSelector());
    if (living) {
        result.living = true;
    }

    // 是否可见
    result.visibleToUser = roomName && roomName.visibleToUser() && (!living || (living && living.visibleToUser()))

    return result;
}

/**
 * 循环关注列表（当前页）
 * @returns 0：正常结束，循环下一个；1当前页循环终止
 */
function loopRoomListInCurrentPage(func) {
    // 当页房间
    for (let oneRoom of oneRoomSelector().find()) {
        let result = func(oneRoom);
        if (!result || result == 0) {
            continue;
        }
        if (result == 1) {
            break;
        }
        if (result == 2) {
            return 2;
        }
    }
    return 1;
}


/**
 * 循环当前列表（一直翻页到最底）
 * @returns 0：正常结束，循环下一个；1：当前页循环终止，翻页后继续循环；2：所有页循环终止
 */
function loopRoomListInAllPage(func) {
    while (true) {
        let result = loopRoomListInCurrentPage(func)
        if (result == 2) {
            break;
        }

        // 是否是末尾页
        if (isPageEnd()) {
            break;
        }

        // 翻下一页
        tryDo(pageDown, 3);

        sleep(random(800, 1600));
    }
}


/**
 * 循环每个房间参与福袋
 */
function loopRoomsForFudai() {
    // 刷新进入关注列表
    refreshEnterFollowList();

    // 循环列表
    loopRoomListInAllPage((oneRoomUiObject) => {
        // 解析房间
        let oneRoomInfo = parseRoomInfoInList(oneRoomUiObject);
        // 当前不可见，翻下页
        if (!oneRoomInfo.visibleToUser) {
            return 1;
        }
        // 当前不在直播中，下个房间
        if (!oneRoomInfo.living) {
            return 0;
        }

        // 白名单
        if (config.whiteRoomList && config.whiteRoomList.length > 0 && !config.whiteRoomList.includes(oneRoomInfo.roomName)) {
            return 0;
        }

        // 黑名单名单
        if (config.blackRoomList && config.blackRoomList.length > 0 && config.blackRoomList.includes(oneRoomInfo.roomName)) {
            return 0;
        }

        // 房间已经处理过，偶发于两页交界处的房间，翻页后会重复处理
        let exist = getRoomByName(oneRoomInfo.roomName);
        if (exist) {
            console.warn("该房间已经处理")
            return 0;
        }
        // 保存名称
        let room = new Room(oneRoomInfo.roomName);
        rooms.push(room);

        // 进入房间
        enterRoomForFudai(room, config.joinAndWaitFudaiNotExitRoom);

        sleep(random(1400, 2000));
        return 0
    })
}


/**
 * 在关注列表等待进入房间
 * 翻页到当前房间所在页
 */
function waitEnterRoomInFollowList(room, timeout) {
    console.info(`进入房间所在页：${room.roomName} >>>`)
    let error = "";
    try {
        let inFollowList = isInFollowListAndLoaded(timeout);
        if (!inFollowList) {
            console.log("当前不在关注列表");
        }

        // 不在当前关注页，退出重新进去
        let existInCurrentPage;
        if (inFollowList) {
            existInCurrentPage = oneRoomSelector().find().findOne(roomNameInListSelector().text(room.roomName));
            if (!existInCurrentPage) {
                console.log("房间不在当前页面");
            }
        }
        let refreshed = false;
        if (!inFollowList || !existInCurrentPage) {
            // 退出个人中心，重新进入关注列表，防止房间在前面页，而不是在后面
            refreshEnterFollowList();
            refreshed = true;
        }
        if (refreshed && !isInFollowListAndLoaded(timeout)) {
            throw "当前不在关注列表";
        }

        // 两种种情况：1、该房间在当前列表存在，循环一次即可找到。2、当前列表不存在，需要退出个人中心重新进入关注列表首部。循环一次不一定找到，需要往下翻页循环找
        loopRoomListInAllPage((oneRoomUiObject) => {
            let oneRoomInfo = parseRoomInfoInList(oneRoomUiObject);
            if (oneRoomInfo.roomName != room.roomName) {
                return 0; // 名称不同找下个
            }
            if (!oneRoomInfo.visibleToUser) {
                return 1; // 当前页不可见，翻下一页
            }
            if (!oneRoomInfo.living) {
                console.warn(`当前房间不在直播中：${room.roomName}`)
                return 2; // 不在直播中，退出所有循环
            }

            return 2;
        })
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error("进入房间所在页：", e)
        error = e;
    }
    let existInCurrentPage = oneRoomSelector().find().findOne(roomNameInListSelector().text(room.roomName));
    if (existInCurrentPage) {
        console.info(`进入房间所在页：${room.roomName} ✨`)
        return;
    }
    throw `进入房间所在页：${room.roomName} ❌ ${error}`;
}


/**
 * 时间戳格式化
 */
function timestampFormat(seconds) {
    const date = new Date(seconds * 1000);
    const year = date.getFullYear().toString().padStart(4, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hour = date.getHours().toString().padStart(2, "0");
    const minute = date.getMinutes().toString().padStart(2, "0");
    const second = date.getSeconds().toString().padStart(2, "0");
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}


/**
 * 秒格式化为分秒
 */
function secondsToDisplay(second) {
    return `${parseInt(second / 60)}分${second % 60}秒`
}


/**
 * 解析还需看播时间
 */
function parseNeedWatchTime(timeText) {
    let timeArray = timeText.split(":");
    let minute = timeArray[0];
    let second = timeArray[1];
    return parseInt(minute) * 60 + parseInt(second);
}


/**
 * 输出房间数组信息
 */
function logRooms(rooms) {
    for (let room of rooms) {
        room.log();
    }
}


/**
 * 杀死子进程
 */
function shutDownSubThread() {
    console.log("回收子线程");
    threads.shutDownAll();
    let r = wait(() => {
        let success = threadList.filter(it => it.isAlive()).length === 0;
        if (success) {
            return true;
        }
        threadList.forEach(it => it.interrupt());
        threads.shutDownAll();
        return threadList.filter(it => it.isAlive()).length === 0;
    }, 20, 500)

    if (!r) {
        console.log(`回收子线程失败：${threadList.filter(it => it.isAlive())}`)
    }
}


/**
 * 等待条件成立
 */
function wait(condition, limit, interval) {
    for (let i = 0; i < limit; i++) {
        if (condition()) {
            return true;
        }
        sleep(interval);
    }
    return false;
}


/**
 * 监听退出事件
 */
function listenExitEvent() {
    events.on("exit", function () {
        console.warn("脚本运行结束：>>>>>>>>>>")
        // 打印统计数据
        mertics.log();
        // 取消屏幕常亮
        device.cancelKeepingAwake();
        // 恢复屏幕亮度
        brightness.restoreBrightness();
        // 关闭子线程
        shutDownSubThread();
        // 关闭抖音
        killDouYin();
        console.warn("脚本运行结束：>>>>>>>>>>")
    });
}


/**
 * 自动结束脚本
 */
function autoExit() {
    if (!config.runningHours > 0) {
        return;
    }
    let t = threads.start(() => {
        while (true) {
            if ((getNowSeconds() - startTime.getTime() / 1000) / 60 / 60 >= config.runningHours) {
                console.warn("运行时间已结束，退出脚本")
                stoped = true;
                exit();
            }
            if (!device.isCharging() && device.getBattery() < 45) {
                console.warn("电量过低，退出脚本")
                stoped = true;
                exit();
            }
            sleep(1000)
        }
    });
    threadList.push(t);
}


/**
 * 设置悬浮窗
 */
function setFloatyWindow() {
    let w = floaty.rawWindow(
        <frame gravity="center" bg="#00000000" />
    );
    // w.setSize(-1, -1);
    w.setTouchable(false);
    return w;
}


function loadFileConfig() {
    let arr = readFileLines(config.configFile);
    for (let one of arr) {
        if (one.endsWith(";")) {
            one = one.substring(0, one.length - 1).trim();
        }
        let temp = one.split("=");
        let key = temp[0].trim();
        if (temp.length > 1) {
            let value = temp[1].trim();
            if (!value) {
                continue;
            }
            let isStr = false;
            if (value.startsWith("\"") && value.endsWith("\"")) {
                value = value.substring(1, value.length - 1).trim();
                isStr = true;
            }
            if (value.startsWith("'") && value.endsWith("'")) {
                value = value.substring(1, value.length - 1).trim();
                isStr = true;
            }
            if (!isNaN(Number(value, 10))) {
                value = isStr ? value : Number(value, 10);
            }
            if (value === "true") {
                value = isStr ? value : true;
            }
            if (value === "false") {
                value = isStr ? value : false;
            }

            for (let k in config) {
                if (key === k) {
                    config[k] = value;
                    break;
                }
            }
        }
    }
}


function loadUiConfig() {
    let f = floaty.rawWindow(
        <frame bg="#fffff0">
            <vertical gravity="center">
                <horizontal width="-1" layout_gravity="left" margin="10">
                    <text text="黑白名单目录:" textSize="16sp" />
                    <input id="filterRoomListDir" inputType="text" textSize="16sp" text="/sdcard/脚本/" />
                </horizontal>
                <horizontal width="-1" layout_gravity="left" margin="10">
                    <text text="运行时长:" textSize="16sp" />
                    <input id="runningHours" inputType="number" textSize="16sp" text="0" />
                </horizontal>
                <horizontal width="-1" layout_gravity="left" margin="10">
                    <text text="全局超时时长:" textSize="16sp" />
                    <input id="globalTimeoutMin" inputType="number" textSize="16sp" text="3000" />
                    <text text=" - " textSize="16sp" />
                    <input id="globalTimeoutMax" inputType="number" textSize="16sp" text="7000" />
                </horizontal>
                <horizontal width="-1" layout_gravity="left" margin="10">
                    <text text="福袋超时时长:" textSize="16sp" />
                    <input id="fudaiButtonTimeoutMin" inputType="number" textSize="16sp" text="5000" />
                    <text text=" - " textSize="16sp" />
                    <input id="fudaiButtonTimeoutMax" inputType="number" textSize="16sp" text="8000" />
                </horizontal>
                <horizontal width="-1" layout_gravity="left" margin="10">
                    <text text="强制打开APP" size="16" />
                    <Switch id="forceLaunch" checked="true" thumbTint="gray/orange-800" trackTint="light-gray/orange-200" marginEnd="16" />
                </horizontal>
                <horizontal width="-1" layout_gravity="left" margin="10">
                    <text text="直接参与福袋" size="16" />
                    <Switch id="joinAndWaitFudaiNotExitRoom" checked="true" thumbTint="gray/orange-800" trackTint="light-gray/orange-200" marginEnd="16" />
                </horizontal>
                <horizontal width="-1" layout_gravity="left" margin="10">
                    <text text="调低亮度" size="16" />
                    <Switch id="reduceBrightness" checked="true" thumbTint="gray/orange-800" trackTint="light-gray/orange-200" marginEnd="16" />
                </horizontal>
                <button id="ok" text="确定" />
            </vertical>
        </frame>
    );

    let lock = threads.lock();
    let condition = lock.newCondition();

    ui.run(function () {
        f.filterRoomListDir.attr("text", config.filterRoomListDir);
        f.runningHours.attr("text", config.runningHours);
        f.globalTimeoutMin.attr("text", config.globalTimeoutMin);
        f.globalTimeoutMax.attr("text", config.globalTimeoutMax);
        f.fudaiButtonTimeoutMin.attr("text", config.fudaiButtonTimeoutMin);
        f.fudaiButtonTimeoutMax.attr("text", config.fudaiButtonTimeoutMax);
        f.forceLaunch.attr("checked", config.forceLaunch);
        f.joinAndWaitFudaiNotExitRoom.attr("checked", config.joinAndWaitFudaiNotExitRoom);
        f.reduceBrightness.attr("checked", config.reduceBrightness);

        f.setSize(-1, -1);
        f.setTouchable(true);

        f.ok.click(() => {
            let filterRoomListDir = f.filterRoomListDir.text();
            let runningHours = f.runningHours.text();
            let globalTimeoutMin = f.globalTimeoutMin.text();
            let globalTimeoutMax = f.globalTimeoutMax.text();
            let fudaiButtonTimeoutMin = f.fudaiButtonTimeoutMin.text();
            let fudaiButtonTimeoutMax = f.fudaiButtonTimeoutMax.text();
            let forceLaunch = f.forceLaunch.checked;
            let joinAndWaitFudaiNotExitRoom = f.joinAndWaitFudaiNotExitRoom.checked;
            let reduceBrightness = f.reduceBrightness.checked;

            // 赋值
            config.filterRoomListDir = filterRoomListDir;
            config.runningHours = runningHours;
            config.globalTimeoutMin = globalTimeoutMin;
            config.globalTimeoutMax = globalTimeoutMax;
            config.fudaiButtonTimeoutMin = fudaiButtonTimeoutMin;
            config.fudaiButtonTimeoutMax = fudaiButtonTimeoutMax;
            config.forceLaunch = forceLaunch;
            config.joinAndWaitFudaiNotExitRoom = joinAndWaitFudaiNotExitRoom;
            config.reduceBrightness = reduceBrightness;
            lock.lock();
            condition.signal();
            lock.unlock();
        });
    })


    lock.lock();
    condition.await();
    lock.unlock();
    f.close();
}


function loadConfig() {
    loadFileConfig();
    loadUiConfig();

    config.globalTimeout = config.globalTimeout != null ? config.globalTimeout : random(config.globalTimeoutMin, config.globalTimeoutMax);
    config.fudaiButtonTimeout = config.fudaiButtonTimeout != null ? config.fudaiButtonTimeout : random(config.fudaiButtonTimeoutMin, config.fudaiButtonTimeoutMax);
    config.runningHours = parseInt(config.runningHours);
    for (let k in config) {
        console.log(`${k}`.padEnd(29, " ") + `=  ${config[k]}`)
    }
}


function loadFilterRoomListFromFile() {
    loadBlackRoomListFromFile();
    loadWhiteRoomListFromFile();
}


/**
 * 读取黑名单文件
 */
function loadBlackRoomListFromFile() {
    let fileName = "blackRoom.text";
    let arr = readFileLines(files.join(config.filterRoomListDir, fileName));
    config.blackRoomList = config.blackRoomList.concat(arr);
}


/**
 * 读取白名单文件
 */
function loadWhiteRoomListFromFile() {
    let fileName = "whiteRoom.text";
    let arr = readFileLines(files.join(config.filterRoomListDir, fileName));
    config.whiteRoomList = config.whiteRoomList.concat(arr);
}


/**
 * 读取文件行到数组中
 */
function readFileLines(path) {
    if (!files.isFile(path)) {
        return [];
    }
    let file = null;
    try {
        file = files.open(path, "r");
        let arr = file.readlines();
        arr = arr.map(it => {
            let tmp = it.trim();
            if (tmp.indexOf("//") >= 0) {
                tmp = tmp.substring(0, tmp.indexOf("//")).trim()
            }
            if (tmp.indexOf("#") >= 0) {
                tmp = tmp.substring(0, tmp.indexOf("#")).trim()
            }
            return tmp.trim();
        }).filter(it => !!it)
        console.log(`读取文件：${path}`, arr);
        return arr;
    } finally {
        if (file) {
            file.close();
        }
    }
}


/**
 * 尝试执行方法
 */
function tryDo(func, times, interval) {
    if (!times) {
        times = 3;
    }
    if (times <= 0) {
        console.error("参数错误");
    }
    let error = "";
    for (let i = 0; i < times; i++) {
        try {
            return func();
        } catch (e) {
            // 中断
            exitIfInterrupted(e);
            console.error(e)
            error = e;
            if (interval) {
                sleep(interval);
            }
            continue;
        }
    }
    throw error;
}

function randomRange(x, y) {
    let reduce = parseInt((y - x) / 6)
    return random(x + reduce, y - reduce);
}


/**
 * 点击UiObject的坐标
 * 点击控件有时会失败
 */
function clickByXY(uiObject) {
    let bounds = uiObject.bounds();
    let result = false;
    // 点击随机点
    try {
        let x = randomRange(bounds.left, bounds.right);
        let y = randomRange(bounds.top, bounds.bottom);
        if (x <= 0 || y < 0) {
            sleep(random(300, 600));
        }
        result = click(x, y);
    } catch (e) {
        exitIfInterrupted(e);
    }
    // 点击中心点
    try {
        if (!result) {
            console.error("点击随机点失败❌，尝试点击中心")
            if (bounds.centerX() <= 0 || bounds.centerY() < 0) {
                sleep(random(300, 600));
            }
            result = click(bounds.centerX(), bounds.centerY());
        }
    } catch (e) {
        exitIfInterrupted(e);
    }
    // 点击上部
    try {
        if (!result) {
            console.error("点击中心点失败❌，尝试点击上部");
            sleep(random(300, 600));
            let x = randomRange(bounds.left, bounds.right);
            result = click(x, bounds.top);
        }
    } catch (e) {
        exitIfInterrupted(e);
    }
    // 点击下部
    try {
        if (!result) {
            console.error("点击上部失败❌，尝试点击下部")
            sleep(random(300, 600));
            let x = randomRange(bounds.left, bounds.right);
            result = click(x, bounds.bottom);
        }
    } catch (e) {
        exitIfInterrupted(e);
    }
    sleep(random(200, 600));
    return result;
}


/**
 * 是否被中断
 */
function isInterrupted(e) {
    if (stoped || isStopped()) {
        return true;
    }
    if (!e) {
        return false;
    }
    if (e.javaException instanceof com.stardust.autojs.runtime.exception.ScriptInterruptedException) {
        stoped = true;
        return true;
    }
    if (e.javaException instanceof java.lang.InterruptedException) {
        stoped = true;
        return true;
    }
}


/**
 * 如果被中断则退出
 */
function exitIfInterrupted(e) {
    if (!isInterrupted(e)) {
        return
    }
    if (e) {
        throw e;
    }
    throw new Error("中断结束>>>>>>>>>>>")
}

// **********************************************************************************************

/**
 *  需要一键发评
 */
function needPublishComment() {
    if (publishCommentSelector().exists()) {
        console.info("需要一键发评：🤖🤖🤖")
        return true;
    }
    return false;
}


/**
 * 一键发表评论
 */
function publishComment() {
    let publishCommentButton = publishCommentSelector().findOnce();
    if (publishCommentButton) {
        console.log("点击一键发评按钮：>>>")
        let result = clickByXY(publishCommentButton);
        if (result) {
            console.info("点击一键发评按钮：🤖🤖🤖")
        }
        return result;
    }
    return false;
}


/**
 *  即将开奖无法参与
 */
function canNotJoin() {
    if (canNotJoinSelector().exists()) {
        console.info("即将开奖，无法参与：👽👽👽")
        return true;
    }
    return false;
}


/**
 *  完成任务时长不足，任务失败
 */
function watchTaskTimeNotEnougn() {
    if (watchTaskTimeNotEnoughSelector().exists()) {
        console.info("完成任务时长不足，任务失败：👽👽👽")
        return true;
    }
    return false;
}


/**
 * 加入直播粉丝团-未达成，任务失败
 */
function notSatisfyJoinedFansGroup() {
    if (notSatisfyJoinedFansGroupSelector().exists()) {
        console.info("加入直播粉丝团-未达成：👽👽👽")
        return true;
    }
    return false;
}


/**
 *  不满足参与条件
 */
function notSatisfyCondition() {
    if (notSatisfyConditionSelector().exists()) {
        console.info("不满足参与条件：👽👽👽")
        return true;
    }
    return false;
}


/**
 *  需要观看任务
 */
function needStartWatchTask() {
    if (watchTaskSelector().exists()) {
        console.info("需要开始观看直播任务：🤖🤖🤖")
        return true;
    }
    return false;
}


/**
 *  观看任务
 */
function startWatchTask() {
    let watchTask = watchTaskSelector().findOnce();
    if (watchTask) {
        console.log("点击开始观看直播任务按钮：>>>")
        let result = clickByXY(watchTask);
        if (result) {
            console.info("点击开始观看直播任务按钮：🤖🤖🤖")
        }
        return result;
    }
    return false;
}


/**
 * 还需看播
 */
function needWatchTime(room) {
    let needWatch = needWatchSelector().findOnce();
    if (needWatch) {
        let timeText = nextSibling(needWatch);
        console.info(`还需看播：${timeText ? timeText.desc() : "查询失败"} 🤖🤖🤖`)
        let needWatchSeconds = parseNeedWatchTime(timeText.desc());
        room.setNeedWatchSeconds(needWatchSeconds);
        return true;
    }
    return false;
}


/**
 * 解析需要看播总时长
 */
function parseNeedWatchTotalMinute(room) {
    let needWatch = needWatchTotalMinuteSelector().findOnce();
    if (needWatch) {
        let timeText = needWatch.desc();
        timeText = timeText.replace("观看直播", "");
        timeText = timeText.replace("分钟未达成", "");
        console.info(`需要看播总时长：${timeText}分钟 🤖🤖🤖`)
        let needWatchSeconds = parseInt(timeText) * 60;
        if (!room.needWatchSeconds) {
            room.setNeedWatchSeconds(needWatchSeconds);
        }
        return true;
    }
    return false;
}

/**
 * 解析参与人数
 */
function parseJoinedNumber() {
    let joinedNumber = joinedNumberSelector().findOnce();
    if (joinedNumber) {
        console.log(`${joinedNumber.text()}✨`)
    }
}



/**
 * 解析福袋剩余时间
 */
function parseRemainSeconds(room) {
    let fudaiButton = fudaiButtonSelector().findOne(config.globalTimeout)
    let timeText = fudaiButton.text();
    console.log(timeText);
    let timeArray = timeText.split(" ");
    timeText = timeArray[1];
    timeText = timeText.replace("分", ",");
    timeText = timeText.replace("秒", ",");
    timeArray = timeText.split(",");
    let minute = timeArray[0];
    let second = timeArray[1];
    let remainTime = parseInt(minute) * 60 + parseInt(second);
    room.setRemainTime(remainTime);
}


/**
 * 参与福袋成功
 */
function joinedSuccess(room) {
    if (joinedSuccessSelector().exists()) {
        console.info("参与福袋成功，等待开奖：🍭🍭🍭")
        console.info(`剩余时间：${room.getRemainTimeStr()} 开奖时间：${room.triggerTimeStr} `)
        if (!room.joined) {
            // 重复进入的问题
            mertics.joinedTimes++;
        }
        room.joined = true;
        return true;
    }
    return false;
}


// **********************************************************************************************


/**
 * 运行一轮
 */
function runRound() {
    mertics.round++;
    mertics.log();

    // 每轮房间清空
    rooms = [];

    // 循环每个房间查看福袋
    loopRoomsForFudai();

    if (config.joinAndWaitFudaiNotExitRoom) {
        return;
    }

    rooms.sort(roomCompartor);
    console.log("直播中的房间：", rooms.map(it => it.roomName))
    // 过滤出已参与成功和还来得及完成需要观看时长的房间
    rooms = rooms.filter(it => it.isCanJoin());
    console.info();
    console.info("可参与福袋的房间：>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    logRooms(rooms);
    console.info("可参与福袋的房间：>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
    console.info();

    if (rooms.length == 0) {
        toastLog("当前房间都无福袋或已过期")
        sleep(random(120000, 180000))
        return;
    }

    // 等待福袋
    waitForFudai();
}


/**
 * 参与福袋
 */
function enterRoomForFudai(room, joinAndWaitFudaiRightNow) {
    try {
        // 进入房间
        tryDo(() => enterRoom(room, random(2000, 3500)), 3, random(300, 800));

        // 解析福袋但是先不参与
        processFudai(room, false);

        // 1、时间临近，2、上游方法要求参与福袋
        if (room.isTimeApproaching() || joinAndWaitFudaiRightNow) {
            // 等待时间临近
            waitTimeApproaching(room)

            // 参与福袋
            processFudai(room, true);

            // 成功参与，等待福袋结果
            if ((room.joined && room.isTimeApproaching()) || joinAndWaitFudaiRightNow) {
                waitForFudaiResult(room.triggerTime);
            }
        }
    } catch (e) {
        // 中断
        exitIfInterrupted(e);
        console.error(e);
    }
    // 关闭所有弹窗
    tryDo(closeAllWindow, 2, random(300, 800));
    // 退出房间
    tryDo(() => exitRoom(true, random(2000, 3500)), 3, random(300, 800));
}


/**
 * 处理福袋
 */
function processFudai(room, join) {
    room.joined = null;
    room.isCanNotJoinReason = null;
    if (join) {
        console.info("参与福袋任务：>>>>")
    } else {
        console.info("解析福袋任务：>>>>")
    }
    while (true) {
        // 关闭所有弹窗
        closeAllWindow()

        let fudaiButton = fudaiButtonSelector().findOne(config.fudaiButtonTimeout);
        if (fudaiButton == null) {
            throw "当前不存在福袋：🤡🤡🤡";
        }

        let oldTriggerTime = room.triggerTime;
        // 解析福袋触发时间
        parseRemainSeconds(room);

        // 进入福袋弹窗
        tryDo(() => enterFudaiWindow(random(2000, 3500)), 3, random(300, 800));

        sleep(random(400, 1200));

        // 解析需要看播总时长
        parseNeedWatchTotalMinute(room);

        // 解析参与人数
        parseJoinedNumber();

        // 开奖时间比之前记录的开奖时间大太多，很可能是重新开了一轮福袋
        if (Math.abs(oldTriggerTime - room.triggerTime) > 10) {
            console.log("已开新一轮福袋：🎄🎄🎄");
            rooms = rooms.filter(it => it.roomName !== room.roomName)
            rooms.push(room);
            rooms.sort(roomCompartor);
            rooms = rooms.filter(it => it.isCanJoin());
            throw "已开新一轮福袋：🎄🎄🎄"
        }

        // 参与福袋
        if (join) {
            // 一键发评论
            if (publishComment()) {
                continue;
            }

            // 开始观看直播任务
            if (startWatchTask()) {
                continue;
            }
        }

        // 即将开奖，无法参与
        if (canNotJoin()) {
            room.isCanNotJoinReason = "即将开奖，无法参与";
            throw "即将开奖，无法参与"
        }

        if (watchTaskTimeNotEnougn()) {
            room.isCanNotJoinReason = "完成任务时长不足，任务失败";
            throw "完成任务时长不足，任务失败";
        }

        // 不满足参与条件
        if (notSatisfyCondition()) {
            room.isCanNotJoinReason = "不满足参与条件";
            throw "不满足参与条件"
        }

        // 未加入直播粉丝团
        if (notSatisfyJoinedFansGroup()) {
            room.isCanNotJoinReason = "未加入直播粉丝团";
            throw "未加入直播粉丝团"
        }

        // 需要开始观看直播任务
        if (!join && needStartWatchTask()) {
            break;
        }

        // 需要一键发评
        if (!join && needPublishComment()) {
            break;
        }

        // 还需看播
        if (needWatchTime(room)) {
            break;
        }

        // 参与成功
        if (joinedSuccess(room)) {
            break;
        }

        room.isCanNotJoinReason = "其他原因未成功参与福袋";
        throw "其他原因未成功参与福袋：👽👽👽";
    }
}


/**
 * 等待时间临近
 */
function waitTimeApproaching(room) {
    // 观看任务能完成的前1分钟
    let time = random(45, 120);
    if (room.needWatchBeforeTime && (room.getNeedWatchBeforeTimeRemain() > time)) {
        let waitSeconds = room.getNeedWatchBeforeTimeRemain() - time;
        toastLog(`等待观看福袋任务：${secondsToDisplay(waitSeconds)} ${timestampFormat(getNowSeconds() + waitSeconds)} `);
        // 悬浮窗显示时间
        waitAndfloatyTime(getNowSeconds() + waitSeconds);
    }
    time = random(80, 210)
    // 开福袋前2分钟
    if (!room.needWatchBeforeTime && room.getRemainTime() > time) {
        let waitSeconds = room.getRemainTime() - time;
        toastLog(`等待福袋开奖：${secondsToDisplay(waitSeconds)} ${timestampFormat(getNowSeconds() + waitSeconds)} `);
        // 悬浮窗显示时间
        waitAndfloatyTime(getNowSeconds() + waitSeconds);
    }
}


function waitForFudai() {
    while (true) {
        try {
            let room = rooms.shift();
            if (!room) {
                break;
            }
            // 不能参与福袋了
            if (!room.isCanJoin()) {
                continue;
            }
            console.info("等待福袋开奖：")
            room.log();
            toast(`${room.roomName} 距离开奖：${room.getRemainTimeStr()}${room.needWatchBeforeTime ? `，观看任务：${room.getNeedWatchBeforeTimeRemain()} 后错过` : ""} `)

            // 进入房间所在列表页
            tryDo(() => waitEnterRoomInFollowList(room, random(2000, 3500)), 3, random(300, 800));

            // 等待时间临近
            waitTimeApproaching(room);

            console.info("快开奖啦：");
            room.log();

            enterRoomForFudai(room, true);
        } catch (e) {
            // 中断
            exitIfInterrupted(e);
            console.error(e);
        }
    }

}


function waitForFudaiResult(triggerTime) {
    mertics.waitedTimes++;
    console.info("等待福袋开奖");

    // 悬浮窗等待时间
    waitAndfloatyTime(triggerTime)

    let timeout = random(10, 15) * 1000;
    let displayTime = random(1800, 3500);

    let lock = threads.lock();
    let condition = lock.newCondition();
    let t1 = threads.start(() => {
        closeWonWindow(timeout, displayTime);
        lock.lock();
        condition.signal();
        lock.unlock();
    });
    threadList.push(t1);
    let t2 = threads.start(() => {
        closeNotWonWindow(timeout, displayTime);
        lock.lock();
        condition.signal();
        lock.unlock();
    })
    threadList.push(t2);
    let t3 = threads.start(() => {
        sleep(timeout);
        sleep(displayTime);
        lock.lock();
        condition.signal();
        lock.unlock();
    })
    threadList.push(t3);

    lock.lock();
    condition.await();
    lock.unlock();
    t1.interrupt();
    t2.interrupt();
    t3.interrupt();
    console.info("开奖啦")
    sleep(random(600, 1600))
}


function run() {
    while (true) {
        // 强制打开抖音
        if (!isInDouYin(0) && config.forceLaunch) {
            console.log("当前不在抖音APP，强制打开抖音APP")
            app.launch(douYinPackageName);
        }
        if (!isInDouYin(30000)) {
            toastLog("当前不在抖音APP");
            continue;
        }

        let t;
        try {
            t = threads.start(() => runRound());
            threadList.push(t);
            t.waitFor();
            t.join();
        } catch (e) {
            let r = wait(() => {
                if (t && t.isAlive()) {
                    t.interrupt();
                    return !(t && t.isAlive());
                }
                return true;
            }, 10, 500);
            if (!r) {
                console.warn("中断任务子线程失败");
            }
            if (isInterrupted(e)) {
                throw e;
            }
            console.error(e);
        }

        sleep(random(10000, 30000))
        threadList = threadList.filter(it => it.isAlive());
    }
}


function start() {
    try {
        // 开启无障碍
        auto.waitFor();
        // 保持屏幕常亮（允许变暗）
        device.keepScreenDim();
        // 设置悬浮窗权限
        setFloatyPermission();
        // 设置悬浮窗，防止睡眠锁屏
        setFloatyWindow();
        // 设置屏幕分辨率，分辨率不一致时会自动缩放
        setScreenMetrics(1080, 2400)
        // 加载配置文件
        loadConfig();
        // 监听退出事件
        listenExitEvent();
        // 设置低亮度
        brightness.autoBrightness();
        // 设置达到运行时长自动退出
        autoExit();
        // 读取黑白名单文件
        loadFilterRoomListFromFile();
        run();
    } catch (e) {
        console.error("脚本结束", e);
    }
}

start();
